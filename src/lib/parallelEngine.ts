// Pipeline V4 runtime — executes every lane at the same time.
//
// Each lane keeps its own asset context, signal state and budget, and reports
// its own trace. A single shared risk gate can halt every lane at once, and a
// consensus lane runs afterwards on the combined lane signals.
//
// All prices come from the live feed. Nothing here fabricates data.

import { PROGRAM_BY_ID } from './analysisPrograms';
import { rankByClass, type ClassId, type ClassifiedAsset } from './assetClassifiers';
import { runBlockCode, type CustomBlock } from './customBlocks';
import { plannedInvestment, type PipeGraph, type PipeLane, type PipeStep } from './pipelineGraph';

export interface RunEvent {
  ts: number;
  laneId: string;
  laneName: string;
  stepId: string | null;
  stepLabel: string;
  status: 'ok' | 'skip' | 'error' | 'info';
  message: string;
  data?: any;
}

export interface LaneOutcome {
  laneId: string;
  laneName: string;
  signal: string | null;
  ticker: string | null;
  label: string | null;
  invested: number;
  errors: number;
  halted: boolean;
}

export interface RunResult {
  events: RunEvent[];
  lanes: LaneOutcome[];
  invested: number;
  errors: number;
  stoppedByRisk: boolean;
  startedAt: number;
  finishedAt: number;
}

export interface RunHooks {
  getPrice: (ticker: string) => number;
  getSeries: (ticker: string) => number[];
  classified: ClassifiedAsset[];
  blocks: CustomBlock[];
  account: { equity: number; totalPnl: number; startingBalance: number };
  submitOrder: (p: {
    symbol: string; side: 'buy' | 'sell'; qty: number;
    type: 'market' | 'limit' | 'stop'; price: number; limitPrice?: number; botSource?: boolean;
  }) => { id: string; price: number; fees: number };
  shouldStop?: () => boolean;
}

interface SharedState {
  stoppedByRisk: boolean;
  invested: number;
  budget: number;
  startEquity: number;
}

const now = () => Date.now();

async function runLane(
  lane: PipeLane,
  hooks: RunHooks,
  shared: SharedState,
  emit: (e: RunEvent) => void,
  upstream: LaneOutcome[],
): Promise<LaneOutcome> {
  const outcome: LaneOutcome = {
    laneId: lane.id, laneName: lane.name, signal: null,
    ticker: null, label: null, invested: 0, errors: 0, halted: false,
  };

  const push = (step: PipeStep | null, status: RunEvent['status'], message: string, data?: any) =>
    emit({
      ts: now(), laneId: lane.id, laneName: lane.name,
      stepId: step?.id ?? null, stepLabel: step?.label ?? lane.name,
      status, message, data,
    });

  if (!lane.steps.length) {
    push(null, 'skip', 'Lane is empty.');
    return outcome;
  }

  // Consensus gate: evaluate the upstream lane signals before doing anything.
  if (lane.consensus) {
    const rule = lane.agree ?? { mode: 'majority' as const };
    const expects = rule.expects ?? 'bullish';
    const agreeing = upstream.filter((u) => u.signal === expects).length;
    const total = upstream.length || 1;
    const need =
      rule.mode === 'all' ? total
      : rule.mode === 'any' ? 1
      : rule.mode === 'count' ? Math.max(1, Number(rule.count ?? 2))
      : Math.ceil(total / 2);
    const passed = agreeing >= need;
    push(null, passed ? 'ok' : 'skip',
      `Consensus: ${agreeing} of ${total} lanes are ${expects}; ${need} required — ${passed ? 'continuing' : 'stopping here'}.`);
    if (!passed) { outcome.halted = true; return outcome; }
    const lead = upstream.find((u) => u.signal === expects && u.ticker);
    if (lead) { outcome.ticker = lead.ticker; outcome.label = lead.label; }
  }

  let screen: { ticker: string; label: string; score: number }[] = [];
  let lastAnalysis: { id: string; value: number; verdict: string; detail: string } | null = null;

  for (const step of lane.steps) {
    if (hooks.shouldStop?.()) { push(step, 'skip', 'Stopped by the operator.'); outcome.halted = true; break; }
    if (shared.stoppedByRisk) { push(step, 'skip', 'Strategy risk limit hit — lane halted.'); outcome.halted = true; break; }
    if (outcome.halted) { push(step, 'skip', 'Skipped because this lane already stopped.'); continue; }

    try {
      switch (step.kind) {
        case 'note':
          push(step, 'info', String(step.config?.text ?? 'Note'));
          break;

        case 'asset': {
          outcome.ticker = step.config?.ticker ?? null;
          outcome.label = step.config?.label ?? outcome.ticker;
          const px = outcome.ticker ? hooks.getPrice(outcome.ticker) : 0;
          push(step, px > 0 ? 'ok' : 'info',
            px > 0
              ? `Trading ${outcome.label} at ${px.toFixed(4)}.`
              : `${outcome.label} has no live price yet — waiting on the feed.`);
          break;
        }

        case 'screen': {
          const classId = step.config?.classId as ClassId;
          const limit = Math.max(1, Math.min(25, Number(step.config?.limit ?? 5)));
          const ranked = rankByClass(hooks.classified, classId, limit);
          screen = ranked.map((a) => ({ ticker: a.ticker, label: a.label, score: a.scores[classId] }));
          if (!screen.length) {
            push(step, 'skip', `No live instrument currently matches "${classId}".`);
            outcome.halted = !!step.config?.haltIfEmpty;
            break;
          }
          if (step.config?.bindTop !== false) {
            outcome.ticker = screen[0].ticker;
            outcome.label = screen[0].label;
          }
          push(step, 'ok', `Matched ${screen.map((s) => s.label).join(', ')}${step.config?.bindTop !== false ? ` — using ${outcome.label}.` : '.'}`, screen);
          break;
        }

        case 'analysis': {
          if (!outcome.ticker) throw new Error('no asset chosen earlier in this lane');
          const prog = PROGRAM_BY_ID.get(step.config?.programId);
          if (!prog) throw new Error('unknown analysis program');
          const res = prog.run(hooks.getSeries(outcome.ticker), step.config?.params ?? {});
          lastAnalysis = { id: prog.id, ...res };
          if (res.verdict !== 'insufficient') outcome.signal = res.verdict;
          push(step, res.verdict === 'insufficient' ? 'skip' : 'ok',
            res.verdict === 'insufficient'
              ? `${prog.label} needs more live prints on ${outcome.label} — no signal yet.`
              : `${prog.label} on ${outcome.label}: ${res.detail} → ${res.verdict}.`,
            lastAnalysis);
          break;
        }

        case 'code': {
          const block = hooks.blocks.find((b) => b.id === step.config?.blockId);
          if (!block) throw new Error('custom logic not found');
          const res = await runBlockCode(block.code, {
            ticker: outcome.ticker, label: outcome.label,
            price: outcome.ticker ? hooks.getPrice(outcome.ticker) : 0,
            series: outcome.ticker ? hooks.getSeries(outcome.ticker) : [],
            change: null, account: hooks.account, screen, analysis: lastAnalysis,
            params: step.config?.params ?? {},
          }, Number(step.config?.timeoutMs ?? 4000));
          if (!res.ok) throw new Error(res.error ?? 'custom logic failed');
          const out: any = res.output;
          if (out && typeof out === 'object' && typeof out.signal === 'string') outcome.signal = out.signal;
          push(step, 'ok', `${block.name} returned ${JSON.stringify(out)} in ${res.ms}ms.`, out);
          break;
        }

        case 'branch': {
          const expects = String(step.config?.expects ?? '');
          if (!expects) { push(step, 'info', 'Condition passes through — nothing to check.'); break; }
          const ok = outcome.signal === expects;
          if (!ok) outcome.halted = true;
          push(step, ok ? 'ok' : 'skip',
            `Needs a ${expects} signal, current signal is ${outcome.signal ?? 'none'} — ${ok ? 'continuing' : 'stopping this lane'}.`);
          break;
        }

        case 'risk': {
          const dd = Number(step.config?.maxDrawdownPct ?? 10);
          const pnlPct = shared.startEquity > 0 ? ((hooks.account.equity - shared.startEquity) / shared.startEquity) * 100 : 0;
          if (pnlPct <= -dd) {
            if (step.config?.blockOnBreach !== false) { outcome.halted = true; shared.stoppedByRisk = true; }
            push(step, 'error', `Loss limit reached: ${pnlPct.toFixed(2)}% against a ${dd}% limit.`);
          } else {
            push(step, 'ok', `Risk fine: ${pnlPct.toFixed(2)}% against a ${dd}% limit.`);
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
              : `Alert armed: watching ${outcome.label} for ${dir} ${trigger} (now ${price.toFixed(4)}).`);
          break;
        }

        case 'buy':
        case 'sell': {
          if (!outcome.ticker) throw new Error('no asset chosen earlier in this lane');
          const price = hooks.getPrice(outcome.ticker);
          if (!(price > 0)) throw new Error(`no live price for ${outcome.label}`);
          let amount = Number(step.config?.amountUsd ?? 0);
          if (!(amount > 0)) throw new Error('investment amount must be greater than zero');

          if (step.kind === 'buy') {
            const remaining = shared.budget - shared.invested;
            if (remaining <= 0) {
              push(step, 'skip', `Strategy budget of $${shared.budget.toLocaleString()} is already committed — order skipped.`);
              break;
            }
            if (amount > remaining) {
              push(step, 'info', `Trimmed the order from $${amount.toLocaleString()} to the remaining budget of $${remaining.toLocaleString()}.`);
              amount = remaining;
            }
          }

          const qty = amount / price;
          const order = hooks.submitOrder({ symbol: outcome.ticker, side: step.kind, qty, type: 'market', price, botSource: true });
          if (step.kind === 'buy') { shared.invested += amount; outcome.invested += amount; }
          push(step, 'ok',
            `${step.kind === 'buy' ? 'Bought' : 'Sold'} $${Math.round(amount).toLocaleString()} of ${outcome.label} at ${order.price.toFixed(4)} (fee $${order.fees.toFixed(2)}).`);
          break;
        }

        default:
          push(step, 'info', `${step.label} has no runtime behaviour.`);
      }
    } catch (err: any) {
      outcome.errors += 1;
      push(step, 'error', `${step.label} failed: ${err?.message ?? err}`);
      // Operators can mark a step as non-fatal; otherwise the lane stops here.
      if (step.continueOnError !== true) {
        outcome.halted = true;
        push(step, 'skip', 'Lane stopped after the failure above.');
      }
    }

  }

  return outcome;
}

/** Executes every parallel lane simultaneously, then any consensus lanes. */
export async function runGraph(
  graph: PipeGraph,
  hooks: RunHooks,
  onEvent: (e: RunEvent) => void,
): Promise<RunResult> {
  const events: RunEvent[] = [];
  const emit = (e: RunEvent) => { events.push(e); onEvent(e); };
  const startedAt = now();

  const shared: SharedState = {
    stoppedByRisk: false,
    invested: 0,
    budget: Math.max(0, Number(graph.risk?.maxTotalInvestmentUsd ?? plannedInvestment(graph))),
    startEquity: hooks.account.equity,
  };

  const parallel = graph.lanes.filter((l) => !l.consensus);
  const consensus = graph.lanes.filter((l) => l.consensus);

  emit({
    ts: now(), laneId: '', laneName: 'Strategy', stepId: null, stepLabel: 'Start',
    status: 'info',
    message: `Running ${parallel.length} lane${parallel.length === 1 ? '' : 's'} at the same time with a $${shared.budget.toLocaleString()} budget and a ${graph.risk.maxDrawdownPct}% loss limit.`,
  });

  const outcomes = await Promise.all(parallel.map((lane) => runLane(lane, hooks, shared, emit, [])));

  for (const lane of consensus) {
    const res = await runLane(lane, hooks, shared, emit, outcomes);
    outcomes.push(res);
  }

  const errors = outcomes.reduce((n, o) => n + o.errors, 0);
  const finishedAt = now();

  emit({
    ts: finishedAt, laneId: '', laneName: 'Strategy', stepId: null, stepLabel: 'Finish',
    status: errors ? 'error' : 'ok',
    message: `Finished in ${((finishedAt - startedAt) / 1000).toFixed(1)}s — invested $${Math.round(shared.invested).toLocaleString()}, ${errors} error${errors === 1 ? '' : 's'}.`,
  });

  return {
    events, lanes: outcomes, invested: shared.invested, errors,
    stoppedByRisk: shared.stoppedByRisk, startedAt, finishedAt,
  };
}