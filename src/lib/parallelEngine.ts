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
}

interface SharedState {
  stoppedByRisk: boolean;
  invested: number;
  fees: number;
  budget: number;
  startEquity: number;
  trades: TradeRecord[];
  /** Gate produced by the consensus lanes on the previous tick. */
  gate: { open: boolean; reason: string };
  /** Per-step entry bookkeeping so a step does not re-enter every tick. */
  entries: Map<string, { count: number; lastAt: number }>;
}

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
          closeTrade(t, px, 'consensus veto');
          push(null, 'ok', `Consensus veto closed ${t.label} from ${t.laneName} at ${px.toFixed(4)} (${t.pnl >= 0 ? '+' : ''}$${t.pnl.toFixed(2)}).`,
            { decision: 'flatten position', reason });
        }
      }
    }

    if (!passed) { outcome.halted = true; return outcome; }
    const lead = ctx.upstream.find((u) => u.signal === expects && u.ticker);
    if (lead) { outcome.ticker = lead.ticker; outcome.label = lead.label; }
  }

  let screen: { ticker: string; label: string; score: number }[] = [];
  let lastAnalysis: { id: string; value: number; verdict: string; detail: string } | null = null;

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
          }
          push(step, 'ok',
            `Matched ${screen.map((s) => s.label).join(', ')}${step.config?.bindTop !== false ? ` — using ${outcome.label}.` : '.'}`,
            { inputs: Object.fromEntries(screen.map((s) => [s.label, Number(s.score?.toFixed?.(2) ?? s.score)])), decision: `picked ${outcome.label}` },
            screen);
          break;
        }

        case 'analysis': {
          if (!outcome.ticker) throw new Error('no asset chosen earlier in this lane');
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
          if (wants.lanes !== false && ctx.upstream.length) {
            context.laneResults = ctx.upstream.map((u) => ({
              lane: u.laneName, signal: u.signal, confidence: u.confidence,
              asset: u.label, reason: u.reason, agentNotes: u.agentNotes,
            }));
          }

          const reply = await hooks.runAgent({
            systemPrompt: String(cfg.systemPrompt ?? ''),
            taskPrompt: String(cfg.taskPrompt ?? ''),
            model: String(cfg.model ?? 'llama-3.3-70b-versatile'),
            temperature: Number(cfg.temperature ?? 0.3),
            context,
          });

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
          if (!outcome.ticker) throw new Error('no asset chosen earlier in this lane');
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
          if (!outcome.ticker) throw new Error('no asset chosen earlier in this lane');
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

          let spend = amount;
          if (step.kind === 'buy') {
            const remaining = shared.budget - shared.invested;
            if (remaining <= 0) {
              push(step, 'skip', `Strategy budget of $${shared.budget.toLocaleString()} is fully deployed — no new order.`,
                { decision: 'no order', reason: 'budget exhausted' });
              break;
            }
            spend = Math.min(amount, remaining);
          }

          const qty = spend / price;
          const order = hooks.submitOrder({
            symbol: outcome.ticker, side: step.kind, qty, type: 'market', price, botSource: true,
          });

          shared.entries.set(step.id, { count: book.count + 1, lastAt: now() });
          shared.fees += order.fees ?? 0;

          if (step.kind === 'buy') {
            shared.invested += spend;
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
            if (openTrade) closeTrade(openTrade, order.price, 'sell step');
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

  return outcome;
}

/* ─────────────────────────── position management ─────────────────────────── */

function closeTrade(t: TradeRecord, price: number, reason: string) {
  t.open = false;
  t.exitPrice = price;
  t.exitAt = now();
  t.exitReason = reason;
  t.pnl = (price - t.entryPrice) * t.qty - t.fees;
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
    t.pnl = (px - t.entryPrice) * t.qty - t.fees;

    let reason: string | null = force ?? null;
    if (!reason && t.takeProfit && px >= t.takeProfit) reason = 'target reached';
    if (!reason && t.stopLoss && px <= t.stopLoss) reason = 'stop hit';
    if (!reason && t.maxHoldMs && now() - t.entryAt >= t.maxHoldMs) reason = 'time limit reached';
    if (!reason) continue;

    try { hooks.closePosition?.({ ticker: t.ticker, qty: t.qty, price: px }); } catch { /* position already gone */ }
    closeTrade(t, px, reason);
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
  const tickMs = Math.max(2, Number(session.tickSec) || 10) * 1000;
  const endAt = startedAt + durationMs;

  const shared: SharedState = {
    stoppedByRisk: false,
    invested: 0,
    fees: 0,
    budget: Math.max(0, Number(graph.risk?.maxTotalInvestmentUsd ?? plannedInvestment(graph))),
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
    if (now() >= endAt) break;

    await sleep(Math.min(tickMs, Math.max(0, endAt - now())), hooks.shouldStop);
  } while (!hooks.shouldStop?.() && now() < endAt);

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
      `$${Math.round(shared.invested).toLocaleString()} deployed, $${shared.fees.toFixed(2)} in fees, ` +
      `${realised >= 0 ? '+' : ''}$${realised.toFixed(2)} realised.`,
  });

  return {
    events,
    lanes: outcomes,
    trades: shared.trades,
    consensus,
    ticks: tick,
    invested: shared.invested,
    fees: shared.fees,
    realised,
    errors,
    stoppedByRisk: shared.stoppedByRisk,
    startedAt,
    finishedAt,
  };
}
