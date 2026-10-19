// Pipeline V4 runtime — a LIVE SESSION that executes every lane at the same time.
//
// A run is no longer a single instant pass. It is a session:
//
//   tick 1 ─┬─ lane A pass ─┐
//           ├─ lane B pass ─┤→ consensus lanes rule on the tick → manage exits
//           └─ lane C pass ─┘
//   wait tickSec … tick 2 … until the session duration elapses or the operator stops.
//
// Between ticks the positions the run opened stay open and mark to market on
// REAL prices, so the strategy has actual time to make or lose money. Every
// entry carries a take-profit, a stop and a time limit which the engine checks
// on every tick against the live feed.
//
// Consensus lanes RULE: their verdict on one tick gates whether any lane may
// open new positions on the next tick, and they can veto (flatten) positions
// opened by lanes that disagree.
//
// All prices come from the live feed. Nothing here fabricates data.

import { PROGRAM_BY_ID } from './analysisPrograms';
import { rankByClass, type ClassId, type ClassifiedAsset } from './assetClassifiers';
import { runBlockCode, type CustomBlock } from './customBlocks';
import { plannedInvestment, type PipeGraph, type PipeLane, type PipeStep } from './pipelineGraph';

/* ─────────────────────────── event & result model ─────────────────────────── */

export interface RunEvent {
  ts: number;
  /** 1-based session tick this event belongs to (0 = session-level). */
  tick: number;
  laneId: string;
  laneName: string;
  stepId: string | null;
  stepLabel: string;
  status: 'ok' | 'skip' | 'error' | 'info';
  /** One-line plain-English message. */
  message: string;
  /** Low-level detail so the report can explain WHY, not just what. */
  detail?: {
    /** What the step looked at (price, indicator values, thresholds…). */
    inputs?: Record<string, any>;
    /** What it decided. */
    decision?: string;
    /** Why it decided that. */
    reason?: string;
  };
  data?: any;
}

export interface TradeRecord {
  id: string;
  laneId: string;
  laneName: string;
  stepId: string | null;
  ticker: string;
  label: string;
  side: 'buy' | 'sell';
  qty: number;
  entryPrice: number;
  entryAt: number;
  exitPrice: number | null;
  exitAt: number | null;
  /** Why the position was closed: target, stop, time limit, consensus veto, session end. */
  exitReason: string | null;
  fees: number;
  amountUsd: number;
  /** Realised P&L once closed, live mark-to-market while open. */
  pnl: number;
  open: boolean;
  /** Take-profit / stop levels in absolute price terms. */
  takeProfit: number | null;
  stopLoss: number | null;
  /** Precision exit plan captured from the buy step at entry. */
  exitPlan?: { tpPct: number; scaleOutPct: number; tp2Pct: number; trailPct: number };
  /** True once the scale-out (partial harvest) leg has executed. */
  scaledOut?: boolean;
  /** Highest price seen since entry — drives the trailing stop. */
  peak?: number;
  /** P&L already banked by partial closes. */
  realisedPnl?: number;
  maxHoldMs: number | null;
}

export interface LaneOutcome {
  laneId: string;
  laneName: string;
  signal: string | null;
  confidence: number;
  ticker: string | null;
  label: string | null;
  invested: number;
  errors: number;
  halted: boolean;
  /** Latest plain-English reason from the lane's decisive step. */
  reason: string | null;
  /** Anything an agent in this lane said, so a consensus agent can read it. */
  agentNotes: string[];
}

export interface ConsensusVerdict {
  tick: number;
  laneId: string;
  laneName: string;
  passed: boolean;
  agreeing: number;
  total: number;
  needed: number;
  expects: string;
  reason: string;
}

export interface RunResult {
  events: RunEvent[];
  lanes: LaneOutcome[];
  trades: TradeRecord[];
  consensus: ConsensusVerdict[];
  ticks: number;
  invested: number;
  /** Capital actually at risk in open positions when the session ended. */
  deployed: number;
  /** Highest capital-at-risk reached during the session. */
  peakDeployed: number;
  fees: number;
  realised: number;
  errors: number;
  stoppedByRisk: boolean;
  startedAt: number;
  finishedAt: number;
}

/* ─────────────────────────── hooks the app supplies ─────────────────────────── */

export interface AgentRequest {
  systemPrompt: string;
  taskPrompt: string;
  model: string;
  temperature: number;
  context: Record<string, any>;
}

export interface AgentReply {
  verdict: 'bullish' | 'bearish' | 'neutral' | 'hold';
  confidence: number;
  reason: string;
}

export interface RunHooks {
  getPrice: (ticker: string) => number;
  /** Real observed prints recorded during the session. */
  getSeries: (ticker: string) => number[];
  /** Real historical closes pulled from the market-history service. */
  getHistory?: (ticker: string) => number[];
  classified: ClassifiedAsset[];
  blocks: CustomBlock[];
  /** Read fresh every time — the account changes during the session. */
  getAccount: () => { equity: number; totalPnl: number; startingBalance: number; cash: number };
  submitOrder: (p: {
    symbol: string; side: 'buy' | 'sell'; qty: number;
    type: 'market' | 'limit' | 'stop'; price: number; limitPrice?: number; botSource?: boolean;
  }) => { id: string; price: number; fees: number };
  /** Close exposure this run opened — implemented as a market sell on the paper account. */
  closePosition?: (p: { ticker: string; qty: number; price: number }) => void;
  runAgent?: (req: AgentRequest) => Promise<AgentReply>;
  shouldStop?: () => boolean;
  /** Called once at the start of every pass — replay harnesses drive
      their bar cursor from here; live UIs can use it for heartbeats. */
  onTickStart?: (tick: number) => void;
}

interface SharedState {
  stoppedByRisk: boolean;
  invested: number;
  /** Capital at risk RIGHT NOW (open positions at entry cost). The budget
      gate uses this — closed positions release their capital for reuse. */
  deployed: number;
  peakDeployed: number;
  /** Last AI verdict per agent step — agents re-check on an interval
      instead of calling the AI every tick. */
  agentCache: Map<string, { tick: number; reply: AgentReply }>;
  /** The agents' shared blackboard: every fresh verdict is posted here and
      fed into the next agent's context, so the desk reasons as a committee
      instead of as isolated judges. */
  peerVerdicts: { agent: string; ticker: string | null; verdict: string; confidence: number; tick: number }[];
  /** Optional ET trading window for stock entries, e.g. "09:30-16:00". */
  tradeWindowEt?: string;
  /** Replay mode: ticks run instantly and wall-clock gates (session
      window, cooldowns) are treated as already satisfied by the bars. */
  fastForward?: boolean;
  fees: number;
  budget: number;
  /** Diversification cap: most dollars allowed in ONE asset at a time (0 = off). */
  maxPerAssetUsd: number;
  startEquity: number;
  trades: TradeRecord[];
  /** Gate produced by the consensus lanes on the previous tick. */
  gate: { open: boolean; reason: string };
  /** Per-step entry bookkeeping so a step does not re-enter every tick. */
  entries: Map<string, { count: number; lastAt: number }>;
}

/** Bare tickers that trade around the clock (metals) — never session-gated. */
const ALWAYS_OPEN = new Set(['XAU', 'XAG', 'XPT', 'XPD', 'GOLD', 'SILVER', 'COPPER', 'BTC', 'ETH']);

const now = () => Date.now();
const clampPct = (n: unknown, fallback: number) => {
  const v = Number(n);
  return Number.isFinite(v) && v > 0 ? v : fallback;
};
const sleep = (ms: number, shouldStop?: () => boolean) =>
  new Promise<void>((resolve) => {
    const end = Date.now() + ms;
    const id = setInterval(() => {
      if (Date.now() >= end || shouldStop?.()) { clearInterval(id); resolve(); }
    }, Math.min(250, Math.max(50, ms)));
  });

/** Merge the real historical closes with the prints observed during the run. */
const fullSeries = (hooks: RunHooks, ticker: string): number[] => {
  const hist = hooks.getHistory?.(ticker) ?? [];
  const live = hooks.getSeries(ticker) ?? [];
  return hist.length ? [...hist, ...live] : live;
};

/* ─────────────────────────── one lane pass (one tick) ─────────────────────────── */

interface PassCtx {
  tick: number;
  hooks: RunHooks;
  shared: SharedState;
  emit: (e: RunEvent) => void;
  upstream: LaneOutcome[];
  consensusOut?: ConsensusVerdict[];
}

async function runLanePass(lane: PipeLane, ctx: PassCtx): Promise<LaneOutcome> {
  const { hooks, shared, emit, tick } = ctx;
  const outcome: LaneOutcome = {
    laneId: lane.id, laneName: lane.name, signal: null, confidence: 0,
    ticker: null, label: null, invested: 0, errors: 0, halted: false,
    reason: null, agentNotes: [],
  };

  const push = (
    step: PipeStep | null,
    status: RunEvent['status'],
    message: string,
    detail?: RunEvent['detail'],
    data?: any,
  ) => emit({
    ts: now(), tick, laneId: lane.id, laneName: lane.name,
    stepId: step?.id ?? null, stepLabel: step?.label ?? lane.name,
    status, message, detail, data,
  });

  if (!lane.steps.length) {
    push(null, 'skip', 'Lane is empty, so there was nothing to run.');
    return outcome;
  }

  /* Consensus lanes rule over the parallel lanes before running their own steps. */
  if (lane.consensus) {
    const rule = lane.agree ?? { mode: 'majority' as const };
    const expects = rule.expects ?? 'bullish';
    const minConf = Number(rule.minConfidence ?? 0);
    const counted = ctx.upstream.filter((u) => u.signal !== null);
    const agreeing = counted.filter((u) => u.signal === expects && u.confidence >= minConf);
    const countedTotal = counted.length || ctx.upstream.length || 1;
    const total = ctx.upstream.length || countedTotal;
    const silent = total - counted.length;
    const need =
      rule.mode === 'all' ? countedTotal
      : rule.mode === 'any' ? 1
      : rule.mode === 'count' ? Math.max(1, Number(rule.count ?? 2))
      : Math.ceil(countedTotal / 2);
    const passed = agreeing.length >= need;

    const reason = `${agreeing.length} of ${total} lanes are ${expects}` +
      (minConf > 0 ? ` with at least ${Math.round(minConf * 100)}% confidence` : '') +
      (silent > 0 ? ` (${silent} lane${silent === 1 ? ' has' : 's have'} not signalled yet)` : '') +
      `; ${need} required.`;

    ctx.consensusOut?.push({
      tick, laneId: lane.id, laneName: lane.name, passed,
      agreeing: agreeing.length, total, needed: need, expects, reason,
    });

    push(null, passed ? 'ok' : 'skip',
      `${lane.name}: ${reason} ${passed ? 'Trading is allowed.' : 'Trading is blocked for the next tick.'}`,
      {
        inputs: Object.fromEntries(ctx.upstream.map((u) => [u.laneName, `${u.signal ?? 'no signal'} (${Math.round(u.confidence * 100)}%)${u.reason ? ` — ${u.reason}` : ''}`])),
        decision: passed ? 'allow trading' : 'block trading',
        reason,
      });

    shared.gate = { open: passed, reason };

    // Veto: flatten anything opened by lanes that did not agree.
    if (!passed && rule.veto !== false && hooks.closePosition) {
      const dissenting = new Set(ctx.upstream.filter((u) => u.signal !== expects).map((u) => u.laneId));
      for (const t of shared.trades.filter((tr) => tr.open && dissenting.has(tr.laneId))) {
        const px = hooks.getPrice(t.ticker);
        if (px > 0) {
          hooks.closePosition({ ticker: t.ticker, qty: t.qty, price: px });
          closeTrade(t, px, 'consensus veto', shared);
          push(null, 'ok', `Consensus veto closed ${t.label} from ${t.laneName} at ${px.toFixed(4)} (${t.pnl >= 0 ? '+' : ''}$${t.pnl.toFixed(2)}).`,
            { decision: 'flatten position', reason });
        }
      }
    }

    const isCommittee = lane.steps.some((st) => st.kind === 'agent');
    if (!passed && !isCommittee) { outcome.halted = true; return outcome; }
    const lead = ctx.upstream.find((u) => u.signal === expects && u.ticker);
    if (lead) { outcome.ticker = lead.ticker; outcome.label = lead.label; }
  }

  let screen: { ticker: string; label: string; score: number }[] = [];
  let lastAnalysis: { id: string; value: number; verdict: string; detail: string } | null = null;

  const agentVotes: { verdict: string; veto: boolean }[] = [];
  for (const step of lane.steps) {
    if (hooks.shouldStop?.()) { outcome.halted = true; break; }
    if (shared.stoppedByRisk) { push(step, 'skip', 'Strategy loss limit hit — lane halted.'); outcome.halted = true; break; }
    if (outcome.halted) continue;
    if (step.enabled === false) { push(step, 'skip', `${step.label} is muted, so it was skipped.`); continue; }
    if (step.note && tick === 1) push(step, 'info', `Note — ${step.note}`);

    try {
      switch (step.kind) {
        case 'note':
          if (tick === 1) push(step, 'info', String(step.config?.text ?? 'Note'));
          break;

        case 'asset': {
          outcome.ticker = step.config?.ticker ?? null;
          outcome.label = step.config?.label ?? outcome.ticker;
          const px = outcome.ticker ? hooks.getPrice(outcome.ticker) : 0;
          const hist = outcome.ticker ? fullSeries(hooks, outcome.ticker).length : 0;
          push(step, px > 0 ? 'ok' : 'info',
            px > 0
              ? `Trading ${outcome.label} at ${px.toFixed(4)}.`
              : `${outcome.label} has no live price yet — waiting on the feed.`,
            { inputs: { price: px, realPricePoints: hist }, decision: px > 0 ? 'asset locked in' : 'waiting for a price' });
          break;
        }

        case 'screen': {
          const classId = step.config?.classId as ClassId;
          const limit = Math.max(1, Math.min(25, Number(step.config?.limit ?? 5)));
          const ranked = rankByClass(hooks.classified, classId, limit);
          screen = ranked.map((a) => ({ ticker: a.ticker, label: a.label, score: a.scores[classId] }));
          if (!screen.length) {
            push(step, 'skip', `No live instrument currently matches "${classId}".`, { decision: 'no matches' });
            outcome.halted = !!step.config?.haltIfEmpty;
            break;
          }
          if (step.config?.bindTop !== false) {
            outcome.ticker = screen[0].ticker;
            outcome.label = screen[0].label;
            // Diversification rotation: cycle the binding across the top
            // matches instead of marrying the lane to a single name.
            const rotate = Math.max(1, Number(step.config?.rotate ?? 1));
            if (rotate > 1 && screen.length > 1) {
              const pick = screen[tick % Math.min(rotate, screen.length)];
              outcome.ticker = pick.ticker;
              outcome.label = pick.label;
            }
          }
          push(step, 'ok',
            `Matched ${screen.map((s) => s.label).join(', ')}${step.config?.bindTop !== false ? ` — using ${outcome.label}.` : '.'}`,
            { inputs: Object.fromEntries(screen.map((s) => [s.label, Number(s.score?.toFixed?.(2) ?? s.score)])), decision: `picked ${outcome.label}` },
            screen);
          break;
        }

        case 'analysis': {
          if (!outcome.ticker) {
            // No asset bound (the screen matched nothing this tick): a
            // normal, quiet wait — never an error.
            push(step, 'skip', 'No asset bound yet — waiting for the screen to match.', { decision: 'no asset bound' });
            outcome.halted = true;
            break;
          }
          const prog = PROGRAM_BY_ID.get(step.config?.programId);
          if (!prog) throw new Error('unknown analysis program');
          const series = fullSeries(hooks, outcome.ticker);
          const res = prog.run(series, step.config?.params ?? {});
          lastAnalysis = { id: prog.id, ...res };
          if (res.verdict !== 'insufficient') {
            outcome.signal = res.verdict;
            outcome.confidence = Math.max(outcome.confidence, 0.6);
            outcome.reason = `${prog.label}: ${res.detail}`;
          }
          push(step, res.verdict === 'insufficient' ? 'skip' : 'ok',
            res.verdict === 'insufficient'
              ? `${prog.label} still needs more real prints on ${outcome.label} (${series.length} so far) — no signal yet.`
              : `${prog.label} on ${outcome.label}: ${res.detail} → ${res.verdict}.`,
            {
              inputs: { program: prog.label, realPricePoints: series.length, value: res.value, price: hooks.getPrice(outcome.ticker) },
              decision: res.verdict,
              reason: res.detail,
            },
            lastAnalysis);
          break;
        }

        case 'agent': {
          if (!hooks.runAgent) throw new Error('agent runtime unavailable');
          const cfg = step.config ?? {};
          // AI calls are expensive and rate-limited: an agent re-checks on an
          // interval (default every 6 ticks) and its last verdict is held in
          // between. A failed call degrades to "no verdict this tick" — it
          // must never spam errors or halt the lane.
          const everyTicks = Math.max(1, Number(cfg.everyTicks ?? 6));
          const cachedAgent = shared.agentCache.get(step.id);
          if (cachedAgent && tick - cachedAgent.tick < everyTicks) {
            const held = cachedAgent.reply;
            outcome.agentNotes.push(`${cfg.agentName ?? 'Agent'}: ${held.verdict} (${Math.round(held.confidence * 100)}%) — held verdict, re-checks every ${everyTicks} ticks`);
            if (lane.consensus) agentVotes.push({ verdict: held.verdict, veto: cfg.committeeVeto === true });
            // A held verdict is still the agent's CURRENT stance: it must
            // keep ruling the lane signal, or agent-driven lanes go silent
            // on every held tick and the consensus gate flaps shut.
            const heldMinConf = Number(cfg.minConfidence ?? 0);
            if (held.confidence >= heldMinConf && held.verdict !== 'hold') {
              outcome.signal = held.verdict;
              outcome.confidence = held.confidence;
              outcome.reason = held.reason;
            }
            push(step, 'info', `${cfg.agentName ?? 'Agent'} verdict held from ${tick - cachedAgent.tick} tick(s) ago: ${held.verdict} — ${held.reason}`);
            break;
          }
          const wants = cfg.context ?? {};
          const series = outcome.ticker ? fullSeries(hooks, outcome.ticker) : [];
          const price = outcome.ticker ? hooks.getPrice(outcome.ticker) : 0;
          const context: Record<string, any> = {
            tick,
            asset: outcome.ticker ? { ticker: outcome.ticker, label: outcome.label } : null,
          };
          if (wants.price !== false) context.price = price;
          if (wants.series !== false) {
            context.recentRealCloses = series.slice(-40).map((n) => Number(n.toFixed(6)));
            context.pointsAvailable = series.length;
          }
          if (wants.indicators !== false && lastAnalysis) context.lastAnalysis = lastAnalysis;
          if (wants.screen !== false && screen.length) context.screen = screen;
          if (wants.positions !== false) {
            context.openPositions = shared.trades.filter((t) => t.open)
              .map((t) => ({ label: t.label, side: t.side, entry: t.entryPrice, pnl: Number(t.pnl.toFixed(2)) }));
            context.account = hooks.getAccount();
          }
          if (shared.peerVerdicts.length) {
            context.peerVerdicts = shared.peerVerdicts.slice(-12);
          }
          if (wants.lanes !== false && ctx.upstream.length) {
            context.laneResults = ctx.upstream.map((u) => ({
              lane: u.laneName, signal: u.signal, confidence: u.confidence,
              asset: u.label, reason: u.reason, agentNotes: u.agentNotes,
            }));
          }

          let reply: AgentReply;
          try {
            reply = await hooks.runAgent({
              systemPrompt: String(cfg.systemPrompt ?? ''),
              taskPrompt: String(cfg.taskPrompt ?? ''),
              model: String(cfg.model ?? 'llama-3.3-70b-versatile'),
              temperature: Number(cfg.temperature ?? 0.3),
              context,
            });
          } catch (agentErr: any) {
            // Cache the failure as a HOLD so a struggling AI service is not
            // retried every tick — it is re-tried on the normal interval.
            shared.agentCache.set(step.id, { tick, reply: { verdict: 'hold', confidence: 0, reason: 'agent unavailable — holding' } });
            push(step, 'skip',
              `${cfg.agentName ?? 'Agent'} unavailable this tick (${String(agentErr?.message ?? agentErr).slice(0, 120)}) — lane continues without a verdict.`,
              { decision: 'no verdict', reason: 'agent call failed; treated as hold' });
            break;
          }
          shared.agentCache.set(step.id, { tick, reply });
          shared.peerVerdicts.push({
            agent: String(cfg.agentName ?? 'Agent'), ticker: outcome.ticker,
            verdict: reply.verdict, confidence: reply.confidence, tick,
          });
          if (shared.peerVerdicts.length > 24) shared.peerVerdicts.splice(0, shared.peerVerdicts.length - 24);
          if (lane.consensus) agentVotes.push({ verdict: reply.verdict, veto: cfg.committeeVeto === true });

          const minConf = Number(cfg.minConfidence ?? 0);
          const strong = reply.confidence >= minConf;
          if (strong && reply.verdict !== 'hold') {
            outcome.signal = reply.verdict;
            outcome.confidence = reply.confidence;
            outcome.reason = reply.reason;
          }
          outcome.agentNotes.push(`${cfg.agentName ?? 'Agent'}: ${reply.verdict} (${Math.round(reply.confidence * 100)}%) — ${reply.reason}`);
          push(step, 'ok',
            `${cfg.agentName ?? 'Agent'} says ${reply.verdict} at ${Math.round(reply.confidence * 100)}% confidence — ${reply.reason}` +
              (strong ? '' : ` (below the ${Math.round(minConf * 100)}% threshold, so the lane signal is unchanged)`),
            {
              inputs: { model: cfg.model, price, pointsAvailable: series.length, prompt: String(cfg.taskPrompt ?? '').slice(0, 200) },
              decision: reply.verdict,
              reason: reply.reason,
            },
            reply);
          break;
        }

        case 'code': {
          const block = hooks.blocks.find((b) => b.id === step.config?.blockId);
          if (!block) throw new Error('custom logic not found');
          const res = await runBlockCode(block.code, {
            ticker: outcome.ticker, label: outcome.label,
            price: outcome.ticker ? hooks.getPrice(outcome.ticker) : 0,
            series: outcome.ticker ? fullSeries(hooks, outcome.ticker) : [],
            change: null, account: hooks.getAccount(), screen, analysis: lastAnalysis,
            params: step.config?.params ?? {},
          }, Number(step.config?.timeoutMs ?? 4000));
          if (!res.ok) throw new Error(res.error ?? 'custom logic failed');
          const out: any = res.output;
          if (out && typeof out === 'object' && typeof out.signal === 'string') {
            outcome.signal = out.signal;
            outcome.confidence = Math.max(outcome.confidence, Number(out.confidence) || 0.6);
            if (out.reason) outcome.reason = String(out.reason);
          }
          push(step, 'ok', `${block.name} returned ${JSON.stringify(out)} in ${res.ms}ms.`,
            { decision: String(out?.signal ?? 'no signal'), reason: String(out?.reason ?? '') }, out);
          break;
        }

        case 'branch': {
          const expects = String(step.config?.expects ?? '');
          if (!expects) { push(step, 'info', 'Condition passes through — nothing to check.'); break; }
          const ok = outcome.signal === expects;
          if (!ok) outcome.halted = true;
          push(step, ok ? 'ok' : 'skip',
            `Needs a ${expects} signal, current signal is ${outcome.signal ?? 'none'} — ${ok ? 'continuing' : 'stopping this lane for this tick'}.`,
            { inputs: { required: expects, actual: outcome.signal, confidence: outcome.confidence }, decision: ok ? 'continue' : 'stop lane', reason: outcome.reason ?? undefined });
          break;
        }

        case 'risk': {
          const dd = Number(step.config?.maxDrawdownPct ?? 10);
          const equity = hooks.getAccount().equity;
          const pnlPct = shared.startEquity > 0 ? ((equity - shared.startEquity) / shared.startEquity) * 100 : 0;
          if (pnlPct <= -dd) {
            if (step.config?.blockOnBreach !== false) { outcome.halted = true; shared.stoppedByRisk = true; }
            push(step, 'error', `Loss limit reached: ${pnlPct.toFixed(2)}% against a ${dd}% limit.`,
              { inputs: { equity, startEquity: shared.startEquity, limitPct: dd }, decision: 'halt the strategy' });
          } else {
            push(step, 'ok', `Risk fine: ${pnlPct.toFixed(2)}% against a ${dd}% limit.`,
              { inputs: { equity, startEquity: shared.startEquity, limitPct: dd }, decision: 'continue' });
          }
          break;
        }

        case 'alert': {
          if (!outcome.ticker) {
            // No asset bound (the screen matched nothing this tick): a
            // normal, quiet wait — never an error.
            push(step, 'skip', 'No asset bound yet — waiting for the screen to match.', { decision: 'no asset bound' });
            outcome.halted = true;
            break;
          }
          const price = hooks.getPrice(outcome.ticker);
          const trigger = Number(step.config?.price);
          const dir = step.config?.direction === 'below' ? 'below' : 'above';
          if (!(price > 0)) { push(step, 'info', `No live price for ${outcome.label} yet — alert not evaluated.`); break; }
          const fired = dir === 'above' ? price >= trigger : price <= trigger;
          push(step, fired ? 'ok' : 'info',
            fired
              ? `Alert fired: ${outcome.label} is ${dir} ${trigger} at ${price.toFixed(4)}.`
              : `Alert armed: watching ${outcome.label} for ${dir} ${trigger} (now ${price.toFixed(4)}).`,
            { inputs: { price, trigger, direction: dir }, decision: fired ? 'alert fired' : 'still watching' });
          break;
        }

        case 'buy':
        case 'sell': {
          if (!outcome.ticker) {
            // No asset bound (the screen matched nothing this tick): a
            // normal, quiet wait — never an error.
            push(step, 'skip', 'No asset bound yet — waiting for the screen to match.', { decision: 'no asset bound' });
            outcome.halted = true;
            break;
          }
          const price = hooks.getPrice(outcome.ticker);
          if (!(price > 0)) throw new Error(`no live price for ${outcome.label}`);
          const amount = Number(step.config?.amountUsd ?? 0);
          if (!(amount > 0)) throw new Error('investment amount must be greater than zero');

          // Consensus gate from the previous tick rules over new entries.
          if (step.kind === 'buy' && !shared.gate.open) {
            push(step, 'skip', `Consensus blocked new positions this tick — ${shared.gate.reason}`,
              { decision: 'no entry', reason: shared.gate.reason });
            break;
          }

          // Entry throttling so a lane does not re-buy on every single tick.
          const book = shared.entries.get(step.id) ?? { count: 0, lastAt: 0 };
          const maxEntries = Math.max(1, Number(step.config?.maxEntries ?? (step.kind === 'buy' ? 1 : 3)));
          const cooldownMs = Math.max(0, Number(step.config?.cooldownMin ?? 0)) * 60_000;
          if (book.count >= maxEntries) {
            push(step, 'skip', `Already placed ${book.count} of ${maxEntries} allowed orders for this step.`,
              { decision: 'no order', reason: 'entry limit reached' });
            break;
          }
          if (cooldownMs && book.lastAt && now() - book.lastAt < cooldownMs) {
            const wait = Math.ceil((cooldownMs - (now() - book.lastAt)) / 1000);
            push(step, 'skip', `Cooling down — ${wait}s before this step may trade again.`,
              { decision: 'no order', reason: 'cooldown' });
            break;
          }

          if (step.kind === 'buy' && !shared.fastForward && shared.tradeWindowEt && outcome.ticker && /^[A-Z]{1,5}$/.test(outcome.ticker) && !ALWAYS_OPEN.has(outcome.ticker)) {
            const [sh, sm] = shared.tradeWindowEt.split('-')[0].split(':').map(Number);
            const [eh, em] = (shared.tradeWindowEt.split('-')[1] ?? '16:00').split(':').map(Number);
            const etNow = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date());
            const [nh, nm] = etNow.split(':').map(Number);
            const cur = nh * 60 + nm, from = sh * 60 + sm, to = eh * 60 + em;
            if (cur < from || cur >= to) {
              push(step, 'skip', `Outside the ${shared.tradeWindowEt} ET stock window — ${outcome.ticker} entries wait for the session.`,
                { decision: 'no order', reason: 'session window' });
              break;
            }
          }

          let spend = amount;
          if (step.kind === 'buy') {
            const remaining = shared.budget - shared.deployed;
            if (remaining <= 0) {
              push(step, 'skip', `Strategy budget of $${shared.budget.toLocaleString()} is fully deployed in open positions — no new order.`,
                { decision: 'no order', reason: 'budget exhausted' });
              break;
            }
            spend = Math.min(amount, remaining);
            if (shared.maxPerAssetUsd > 0) {
              const inName = shared.trades
                .filter((t) => t.open && t.ticker === outcome.ticker)
                .reduce((a, t) => a + t.entryPrice * t.qty, 0);
              if (inName + spend > shared.maxPerAssetUsd) {
                push(step, 'skip',
                  `Diversification cap: $${inName.toFixed(0)} already in ${outcome.label} — one name may hold at most $${shared.maxPerAssetUsd.toLocaleString()} of this strategy.`,
                  { decision: 'no order', reason: 'per-asset diversification cap' });
                break;
              }
            }
          }

          const qty = spend / price;
          const order = hooks.submitOrder({
            symbol: outcome.ticker, side: step.kind, qty, type: 'market', price, botSource: true,
          });

          shared.entries.set(step.id, { count: book.count + 1, lastAt: now() });
          shared.fees += order.fees ?? 0;

          if (step.kind === 'buy') {
            shared.invested += spend;
            shared.deployed += spend;
            shared.peakDeployed = Math.max(shared.peakDeployed, shared.deployed);
            outcome.invested += spend;
            const tpPct = clampPct(step.config?.takeProfitPct, 0);
            const slPct = clampPct(step.config?.stopLossPct, 0);
            const holdMin = clampPct(step.config?.maxHoldMin, 0);
            shared.trades.push({
              id: order.id,
              laneId: lane.id, laneName: lane.name, stepId: step.id,
              ticker: outcome.ticker, label: outcome.label ?? outcome.ticker,
              side: 'buy', qty, entryPrice: order.price, entryAt: now(),
              exitPrice: null, exitAt: null, exitReason: null,
              fees: order.fees ?? 0, amountUsd: spend, pnl: 0, open: true,
              takeProfit: tpPct ? order.price * (1 + tpPct / 100) : null,
              stopLoss: slPct ? order.price * (1 - slPct / 100) : null,
              maxHoldMs: holdMin ? holdMin * 60_000 : null,
              exitPlan: {
                tpPct,
                scaleOutPct: Math.max(0, Math.min(90, Number(step.config?.scaleOutPct ?? 0))),
                tp2Pct: Math.max(0, Number(step.config?.takeProfit2Pct ?? 0)),
                trailPct: Math.max(0, Number(step.config?.trailPct ?? 0)),
              },
              peak: order.price,
            });
            push(step, 'ok',
              `Bought $${Math.round(spend).toLocaleString()} of ${outcome.label} at ${order.price.toFixed(4)} (fee $${(order.fees ?? 0).toFixed(2)}).` +
              (tpPct || slPct ? ` Target +${tpPct}% / stop −${slPct}%.` : ''),
              {
                inputs: { price: order.price, qty: Number(qty.toFixed(6)), amountUsd: spend, takeProfitPct: tpPct, stopLossPct: slPct, maxHoldMin: holdMin },
                decision: 'entered a long position',
                reason: outcome.reason ?? 'the lane conditions were met',
              });
          } else {
            // A sell reduces an open long from this run when one exists.
            const openTrade = shared.trades.find((t) => t.open && t.ticker === outcome.ticker);
            if (openTrade) closeTrade(openTrade, order.price, 'sell step', shared);
            push(step, 'ok',
              `Sold $${Math.round(spend).toLocaleString()} of ${outcome.label} at ${order.price.toFixed(4)} (fee $${(order.fees ?? 0).toFixed(2)}).`,
              { inputs: { price: order.price, qty: Number(qty.toFixed(6)) }, decision: 'closed exposure', reason: outcome.reason ?? undefined });
          }
          break;
        }

        default:
          push(step, 'info', `${step.label} has no runtime behaviour.`);
      }
    } catch (err: any) {
      outcome.errors += 1;
      push(step, 'error', `${step.label} failed: ${err?.message ?? err}`, { reason: String(err?.message ?? err) });
      if (step.continueOnError !== true) {
        outcome.halted = true;
        push(step, 'skip', 'Lane stopped for this tick after the failure above.');
      }
    }
  }

  // ── Committee resolution ──────────────────────────────────────────────
  // In a consensus lane with several agents, the lane speaks with ONE
  // voice: the majority. A veto member (a referee-grade specialist) can
  // block the lane outright with a bearish or hold verdict.
  if (lane.consensus && agentVotes.length > 1) {
    const bull = agentVotes.filter((v) => v.verdict === 'bullish').length;
    const bear = agentVotes.filter((v) => v.verdict === 'bearish').length;
    const vetoBlock = agentVotes.some((v) => v.veto && (v.verdict === 'bearish' || v.verdict === 'hold'));
    const verdict = vetoBlock ? 'bearish' : bull * 2 > agentVotes.length ? 'bullish' : bear > 0 ? 'bearish' : 'neutral';
    outcome.signal = verdict as LaneOutcome['signal'];
    if (lane.consensus) {
      const expects = (lane.agree?.expects ?? 'bullish') as string;
      shared.gate = {
        open: verdict === expects,
        reason: `committee vote in ${lane.name}: ${bull} bullish of ${agentVotes.length}${vetoBlock ? ' (veto member blocking)' : ''} → ${verdict}`,
      };
    }
    const lastStep = lane.steps[lane.steps.length - 1];
    if (lastStep) {
      push(lastStep, 'info',
        `Committee vote in ${lane.name}: ${bull} bullish · ${agentVotes.length - bull - bear} neutral/hold · ${bear} bearish${vetoBlock ? ' · VETO member blocking' : ''} → lane signal ${verdict}.`,
        { inputs: { votes: agentVotes.map((v) => v.verdict) }, decision: `committee ${verdict}` });
    }
  }

  return outcome;
}

/* ─────────────────────────── position management ─────────────────────────── */

function closeTrade(t: TradeRecord, price: number, reason: string, shared?: SharedState) {
  t.open = false;
  t.exitPrice = price;
  t.exitAt = now();
  t.exitReason = reason;
  t.pnl = (t.realisedPnl ?? 0) + (price - t.entryPrice) * t.qty - t.fees;
  if (shared) shared.deployed = Math.max(0, shared.deployed - t.qty * t.entryPrice);
}

/** Close part of a position (the scale-out harvest leg) and bank its P&L. */
function closePartial(t: TradeRecord, price: number, qtyClose: number, shared: SharedState) {
  const leg = (price - t.entryPrice) * qtyClose;
  t.realisedPnl = (t.realisedPnl ?? 0) + leg;
  t.qty = Math.max(0, t.qty - qtyClose);
  t.amountUsd = t.qty * t.entryPrice;
  shared.deployed = Math.max(0, shared.deployed - qtyClose * t.entryPrice);
  return leg;
}

/** Mark open trades to market and close the ones that hit a rule. */
function manageExits(
  hooks: RunHooks,
  shared: SharedState,
  tick: number,
  emit: (e: RunEvent) => void,
  force?: string,
) {
  for (const t of shared.trades.filter((x) => x.open)) {
    const px = hooks.getPrice(t.ticker);
    if (!(px > 0)) continue;
    t.peak = Math.max(t.peak ?? t.entryPrice, px);
    t.pnl = (t.realisedPnl ?? 0) + (px - t.entryPrice) * t.qty - t.fees;
    const plan = t.exitPlan;

    // Scale-out: at the first target, bank the harvest on part of the
    // position and let the runner ride to a second target / trailing stop
    // with its stop moved to breakeven.
    if (!force && plan && plan.scaleOutPct > 0 && !t.scaledOut && t.takeProfit && px >= t.takeProfit) {
      const qtyClose = t.qty * (plan.scaleOutPct / 100);
      try { hooks.closePosition?.({ ticker: t.ticker, qty: qtyClose, price: px }); } catch { /* already gone */ }
      const leg = closePartial(t, px, qtyClose, shared);
      t.scaledOut = true;
      if (plan.tp2Pct > 0) t.takeProfit = t.entryPrice * (1 + plan.tp2Pct / 100);
      if (plan.tp2Pct > 0 || plan.trailPct > 0) t.stopLoss = Math.max(t.stopLoss ?? 0, t.entryPrice);
      t.pnl = (t.realisedPnl ?? 0) + (px - t.entryPrice) * t.qty - t.fees;
      emit({
        ts: now(), tick, laneId: t.laneId, laneName: t.laneName, stepId: t.stepId,
        stepLabel: `${t.label} position`,
        status: 'ok',
        message: `Banked the +${plan.tpPct}% harvest on ${plan.scaleOutPct}% of ${t.label} at ${px.toFixed(4)} (${leg >= 0 ? '+' : ''}$${leg.toFixed(2)}) — the rest rides${plan.tp2Pct > 0 ? ` to +${plan.tp2Pct}%` : ''}${plan.trailPct > 0 ? ` behind a ${plan.trailPct}% trailing stop` : ''}, stop moved to breakeven.`,
        detail: {
          inputs: { entry: t.entryPrice, exit: px, qtyClosed: Number(qtyClose.toFixed(6)), qtyRemaining: Number(t.qty.toFixed(6)) },
          decision: 'partial take-profit (scale out)',
          reason: 'first target reached',
        },
      });
    }

    let reason: string | null = force ?? null;
    if (!reason && t.takeProfit && px >= t.takeProfit) reason = t.scaledOut ? 'second target reached' : 'target reached';
    if (!reason && plan && plan.trailPct > 0 && t.peak && t.peak > t.entryPrice) {
      const trailStop = t.peak * (1 - plan.trailPct / 100);
      if (trailStop > (t.stopLoss ?? 0) && px <= trailStop) reason = 'trailing stop';
    }
    if (!reason && t.stopLoss && px <= t.stopLoss) reason = 'stop hit';
    if (!reason && t.maxHoldMs && now() - t.entryAt >= t.maxHoldMs) reason = 'time limit reached';
    if (!reason) continue;

    try { hooks.closePosition?.({ ticker: t.ticker, qty: t.qty, price: px }); } catch { /* position already gone */ }
    closeTrade(t, px, reason, shared);
    const held = Math.round((t.exitAt! - t.entryAt) / 1000);
    emit({
      ts: now(), tick, laneId: t.laneId, laneName: t.laneName, stepId: t.stepId,
      stepLabel: `${t.label} position`,
      status: t.pnl >= 0 ? 'ok' : 'skip',
      message: `Closed ${t.label} at ${px.toFixed(4)} — ${reason}. Held ${held}s for ${t.pnl >= 0 ? '+' : ''}$${t.pnl.toFixed(2)}.`,
      detail: {
        inputs: { entry: t.entryPrice, exit: px, qty: Number(t.qty.toFixed(6)), fees: t.fees, heldSeconds: held },
        decision: 'closed the position',
        reason,
      },
    });
  }
}

/* ─────────────────────────── session runner ─────────────────────────── */

export async function runGraph(
  graph: PipeGraph,
  hooks: RunHooks,
  onEvent: (e: RunEvent) => void,
): Promise<RunResult> {
  const events: RunEvent[] = [];
  const emit = (e: RunEvent) => { events.push(e); onEvent(e); };
  const startedAt = now();

  const session = graph.session ?? { durationMin: 15, tickSec: 10, flattenOnStop: true };
  const durationMs = Math.max(0, Number(session.durationMin) || 0) * 60_000;
  const ffReplay = (hooks as any)?.fastForward === true;
  const tickMs = ffReplay ? 0 : Math.max(2, Number(session.tickSec) || 10) * 1000;
  const endAt = startedAt + durationMs;
  const tickBudget = ffReplay
    ? Math.max(1, Math.round(((Number(session.durationMin) || 0) * 60) / Math.max(1, Number(session.tickSec) || 10)))
    : Number.POSITIVE_INFINITY;

  const shared: SharedState = {
    stoppedByRisk: false,
    invested: 0,
    deployed: 0,
    peakDeployed: 0,
    agentCache: new Map(),
    peerVerdicts: [],
    tradeWindowEt: (graph.session as any)?.tradeWindowEt,
    fastForward: (hooks as any)?.fastForward === true,
    fees: 0,
    budget: Math.max(0, Number(graph.risk?.maxTotalInvestmentUsd ?? plannedInvestment(graph))),
    maxPerAssetUsd: Math.max(0, Number(graph.risk?.maxPerAssetUsd ?? 0)),
    startEquity: hooks.getAccount().equity,
    trades: [],
    gate: { open: true, reason: 'no consensus lane has ruled yet' },
    entries: new Map(),
  };

  const parallel = graph.lanes.filter((l) => !l.consensus);
  const consensusLanes = graph.lanes.filter((l) => l.consensus);
  const consensus: ConsensusVerdict[] = [];
  let outcomes: LaneOutcome[] = [];
  let tick = 0;

  emit({
    ts: startedAt, tick: 0, laneId: '', laneName: 'Session', stepId: null, stepLabel: 'Start',
    status: 'info',
    message:
      `Session started: ${parallel.length} lane${parallel.length === 1 ? '' : 's'} running side by side for ` +
      `${session.durationMin} minute${session.durationMin === 1 ? '' : 's'}, re-checked every ${session.tickSec}s, ` +
      `with a $${shared.budget.toLocaleString()} budget and a ${graph.risk.maxDrawdownPct}% loss limit.`,
    detail: { inputs: { durationMin: session.durationMin, tickSec: session.tickSec, budget: shared.budget }, decision: 'session opened' },
  });

  do {
    tick += 1;
    hooks.onTickStart?.(tick);
    emit({
      ts: now(), tick, laneId: '', laneName: 'Session', stepId: null, stepLabel: `Tick ${tick}`,
      status: 'info',
      message: `Tick ${tick} — re-reading live prices and re-evaluating every lane.`,
    });

    outcomes = await Promise.all(
      parallel.map((lane) => runLanePass(lane, { tick, hooks, shared, emit, upstream: [] })),
    );

    for (const lane of consensusLanes) {
      const res = await runLanePass(lane, { tick, hooks, shared, emit, upstream: outcomes, consensusOut: consensus });
      outcomes.push(res);
    }
    if (!consensusLanes.length) shared.gate = { open: true, reason: 'no consensus lane configured' };

    manageExits(hooks, shared, tick, emit);

    if (shared.stoppedByRisk) {
      emit({
        ts: now(), tick, laneId: '', laneName: 'Session', stepId: null, stepLabel: 'Risk',
        status: 'error', message: 'The strategy loss limit was breached, so the session was ended early.',
      });
      break;
    }
    if (hooks.shouldStop?.()) break;
    if (ffReplay ? tick >= tickBudget : now() >= endAt) break;

    if (!ffReplay) await sleep(Math.min(tickMs, Math.max(0, endAt - now())), hooks.shouldStop);
  } while (!hooks.shouldStop?.() && (ffReplay ? tick < tickBudget : now() < endAt));

  const stopped = !!hooks.shouldStop?.();
  if (session.flattenOnStop !== false) {
    manageExits(hooks, shared, tick, emit, stopped ? 'session stopped' : 'session ended');
  } else {
    manageExits(hooks, shared, tick, emit);
  }

  const errors = outcomes.reduce((n, o) => n + o.errors, 0) + events.filter((e) => e.status === 'error').length * 0;
  const realised = shared.trades.filter((t) => !t.open).reduce((s, t) => s + t.pnl, 0);
  const finishedAt = now();

  emit({
    ts: finishedAt, tick, laneId: '', laneName: 'Session', stepId: null, stepLabel: 'Finish',
    status: errors ? 'error' : 'ok',
    message:
      `Session finished after ${tick} tick${tick === 1 ? '' : 's'} and ${((finishedAt - startedAt) / 1000).toFixed(0)}s — ` +
      `${shared.trades.length} position${shared.trades.length === 1 ? '' : 's'} opened, ` +
      `$${Math.round(shared.invested).toLocaleString()} bought in total, $${Math.round(shared.deployed).toLocaleString()} still deployed at the end (peak $${Math.round(shared.peakDeployed).toLocaleString()}), $${shared.fees.toFixed(2)} in fees, ` +
      `${realised >= 0 ? '+' : ''}$${realised.toFixed(2)} realised.`,
  });

  return {
    events,
    lanes: outcomes,
    trades: shared.trades,
    consensus,
    ticks: tick,
    invested: shared.invested,
    deployed: shared.deployed,
    peakDeployed: shared.peakDeployed,
    fees: shared.fees,
    realised,
    errors,
    stoppedByRisk: shared.stoppedByRisk,
    startedAt,
    finishedAt,
  };
}
