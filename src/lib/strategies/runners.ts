/**
 * Deterministic strategy runners. Pure functions.
 * Each returns an intent { action, qty, reason } given price, history, params, state.
 * NO LLM. NO eval. Paper-only (long-side; sell = close).
 */

export type StrategyAction = 'buy' | 'sell' | 'hold';
export interface StrategyIntent {
  action: StrategyAction;
  qty: number;
  reason: string;
  newState?: Record<string, any>;
}

export interface RunnerCtx {
  price: number;
  closes: number[];        // may be empty
  params: Record<string, any>;
  state: Record<string, any>;
  ownedQty: number;        // current long qty for symbol
  avgEntry: number;        // avg entry (0 if none)
  equity: number;
  now: number;
}

const mean = (a: number[]) => a.reduce((s, v) => s + v, 0) / (a.length || 1);
const stdev = (a: number[]) => {
  if (a.length < 2) return 0;
  const m = mean(a);
  return Math.sqrt(a.reduce((s, v) => s + (v - m) ** 2, 0) / (a.length - 1));
};

/** GRID — buy when price drops one step below last buy, close a slice on step-up. */
export function runGrid(ctx: RunnerCtx): StrategyIntent {
  const notional = Number(ctx.params.notionalUsd ?? 2500);
  const levels   = Math.max(2, Number(ctx.params.levels ?? 10));
  const stepPct  = Math.max(0.001, Number(ctx.params.stepPct ?? 0.01)); // 1% grid step
  const perLevelUsd = notional / levels;
  const perLevelQty = perLevelUsd / ctx.price;

  const anchor = ctx.state.anchor ?? ctx.price;
  const lastBuy = ctx.state.lastBuy ?? anchor;

  // sell a slice when up one step from avg entry
  if (ctx.ownedQty > 0 && ctx.price >= ctx.avgEntry * (1 + stepPct)) {
    const qty = Math.min(ctx.ownedQty, perLevelQty);
    return { action: 'sell', qty, reason: `grid +${(stepPct*100).toFixed(2)}% take-profit`,
      newState: { anchor, lastBuy: ctx.price } };
  }
  // buy a slice when down one step from lastBuy
  if (ctx.price <= lastBuy * (1 - stepPct)) {
    // cap total exposure
    if (ctx.ownedQty * ctx.price >= notional) {
      return { action: 'hold', qty: 0, reason: 'grid cap reached' };
    }
    return { action: 'buy', qty: perLevelQty, reason: `grid −${(stepPct*100).toFixed(2)}% add`,
      newState: { anchor, lastBuy: ctx.price } };
  }
  return { action: 'hold', qty: 0, reason: 'grid within band', newState: { anchor, lastBuy } };
}

/** DCA — fixed USD every periodMs. */
export function runDca(ctx: RunnerCtx): StrategyIntent {
  const periodMs = Math.max(1000, Number(ctx.params.periodMs ?? 60_000)); // 1min default for demo
  const contribution = Math.max(1, Number(ctx.params.contribution ?? 100));
  const last = ctx.state.lastBuy ?? 0;
  if (ctx.now - last < periodMs) {
    return { action: 'hold', qty: 0, reason: `dca waits ${Math.round((periodMs - (ctx.now-last))/1000)}s` };
  }
  const qty = contribution / ctx.price;
  return { action: 'buy', qty, reason: `dca $${contribution}`, newState: { lastBuy: ctx.now } };
}

/** MEAN-REVERSION — z-score on closes. Buy z<-entryZ, close when z>-exitZ or |z|>stopZ. */
export function runMeanReversion(ctx: RunnerCtx): StrategyIntent {
  const window = Math.max(5, Number(ctx.params.window ?? 20));
  const entryZ = Number(ctx.params.entryZ ?? 2);
  const exitZ  = Number(ctx.params.exitZ ?? 0.2);
  const stopZ  = Number(ctx.params.stopZ ?? 3.5);
  const notional = Number(ctx.params.notionalUsd ?? 1000);

  const c = ctx.closes.slice(-window);
  if (c.length < window) return { action: 'hold', qty: 0, reason: `warmup ${c.length}/${window}` };
  const m = mean(c);
  const s = stdev(c);
  if (s === 0) return { action: 'hold', qty: 0, reason: 'zero σ' };
  const z = (ctx.price - m) / s;

  if (ctx.ownedQty > 0) {
    if (z >= -exitZ || Math.abs(z) >= stopZ) {
      return { action: 'sell', qty: ctx.ownedQty, reason: `mr exit z=${z.toFixed(2)}` };
    }
    return { action: 'hold', qty: 0, reason: `mr hold z=${z.toFixed(2)}` };
  }
  if (z <= -entryZ) {
    return { action: 'buy', qty: notional / ctx.price, reason: `mr entry z=${z.toFixed(2)}` };
  }
  return { action: 'hold', qty: 0, reason: `mr flat z=${z.toFixed(2)}` };
}

/** TREND-FOLLOWING — Donchian breakout on closes. */
export function runTrend(ctx: RunnerCtx): StrategyIntent {
  const entryLen = Math.max(5, Number(ctx.params.entryLen ?? 20));
  const exitLen  = Math.max(3, Number(ctx.params.exitLen ?? 10));
  const notional = Number(ctx.params.notionalUsd ?? 1000);

  const c = ctx.closes;
  if (c.length < entryLen + 1) return { action: 'hold', qty: 0, reason: `warmup ${c.length}/${entryLen}` };
  const priorEntry = c.slice(-(entryLen+1), -1);
  const priorExit  = c.slice(-(exitLen +1), -1);
  const hi = Math.max(...priorEntry);
  const lo = Math.min(...priorExit);

  if (ctx.ownedQty > 0) {
    if (ctx.price <= lo) return { action: 'sell', qty: ctx.ownedQty, reason: `trend exit <${lo.toFixed(2)}` };
    return { action: 'hold', qty: 0, reason: `trend hold >${lo.toFixed(2)}` };
  }
  if (ctx.price >= hi) {
    return { action: 'buy', qty: notional / ctx.price, reason: `trend breakout >${hi.toFixed(2)}` };
  }
  return { action: 'hold', qty: 0, reason: `trend flat` };
}

export const RUNNERS = {
  grid: runGrid,
  dca: runDca,
  meanReversion: runMeanReversion,
  trendFollowing: runTrend,
} as const;

export type RunnableKind = keyof typeof RUNNERS;