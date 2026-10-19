/* ─────────────────── Strategy library ───────────────────
   One-click strategies for Pipeline V4. Built-ins ship in code;
   the operator's own strategies are saved to localStorage and
   survive reloads. Loading a strategy replaces the current graph —
   the previous graph is always kept by the graph store's automatic
   backup, so a load is never destructive.
   ─────────────────────────────────────────────────────────── */

import { emptyGraph, makeLane, makeStep, type PipeGraph } from './pipelineGraph';
import { BLOCK_BY_ID } from './pipelineBlocks';
import { AGENT_TEMPLATE_BY_ID, templateConfig } from './agentTemplates';
import { buildSipvbGraph } from './sipvbPreset';

const blockConfig = (id: string) => ({ ...(BLOCK_BY_ID.get(id)?.config ?? {}) });

export interface LibraryEntry {
  id: string;
  name: string;
  blurb: string;
  builtIn: boolean;
  savedAt?: number;
  build: () => PipeGraph;
}

/* ── Built-in: Retest Rider — buy the dip after the break, not the chase ── */
const buildRetestRider = (): PipeGraph => {
  const g = emptyGraph();
  g.name = 'Retest Rider — buy the pullback';
  g.risk = { maxDrawdownPct: 3, maxTotalInvestmentUsd: 20000 };
  g.session = { durationMin: 60, tickSec: 5, flattenOnStop: true, tradeWindowEt: '09:30-16:00' };
  const lane = makeLane('Scanner — breakout retests', 0);
  lane.steps = [
    makeStep('screen', 'Find assets by condition', { ...blockConfig('screen'), classId: 'breakout', limit: 5, bindTop: true }),
    makeStep('analysis', 'PULLBACK ENTRY', { programId: 'pullback_entry', params: { window: 30 } }),
    makeStep('branch', 'Only continue if bullish', { expects: 'bullish' }),
    makeStep('analysis', 'TREND SCORE', { programId: 'trend', params: {} }),
    makeStep('branch', 'Only continue if bullish', { expects: 'bullish' }),
    makeStep('buy', 'Buy the retest', {
      ...blockConfig('buy'), amountUsd: 2500, takeProfitPct: 1.0, stopLossPct: 0.45,
      maxHoldMin: 25, maxEntries: 3, cooldownMin: 2,
      scaleOutPct: 50, takeProfit2Pct: 2.0, trailPct: 0.4,
    }),
  ];
  const referee = makeLane('Referee — consensus & risk', 1);
  referee.consensus = true;
  referee.agree = { mode: 'any', expects: 'bullish', minConfidence: 0, veto: true };
  const guardian = AGENT_TEMPLATE_BY_ID.get('risk_guardian')!;
  referee.steps = [
    makeStep('agent', 'Risk Guardian (consensus)', { ...blockConfig('agent_referee'), ...templateConfig(guardian), model: 'llama-3.3-70b-versatile' }),
    makeStep('risk', 'Loss limit −3%', { ...blockConfig('risk'), maxDrawdownPct: 3, blockOnBreach: true }),
  ];
  g.lanes = [lane, referee];
  g.updatedAt = Date.now();
  return g;
};

/* ── Built-in: Fade the Stretch — mean reversion on exhausted moves ── */
const buildFade = (): PipeGraph => {
  const g = emptyGraph();
  g.name = 'Fade the Stretch — mean reversion';
  g.risk = { maxDrawdownPct: 2.5, maxTotalInvestmentUsd: 15000 };
  g.session = { durationMin: 60, tickSec: 5, flattenOnStop: true, tradeWindowEt: '09:30-16:00' };
  const lane = makeLane('Scanner — oversold stretch', 0);
  const fade = AGENT_TEMPLATE_BY_ID.get('fade_trader')!;
  lane.steps = [
    makeStep('screen', 'Find assets by condition', { ...blockConfig('screen'), classId: 'oversold', limit: 5, bindTop: true }),
    makeStep('analysis', 'Z-SCORE', { programId: 'zscore', params: { window: 50 } }),
    makeStep('branch', 'Only continue if bearish', { expects: 'bearish' }),
    makeStep('agent', 'Fade Trader', { ...blockConfig('agent'), ...templateConfig(fade), model: 'llama-3.3-70b-versatile' }),
    makeStep('buy', 'Buy the bounce', {
      ...blockConfig('buy'), amountUsd: 2000, takeProfitPct: 0.8, stopLossPct: 0.4,
      maxHoldMin: 30, maxEntries: 2, cooldownMin: 3,
      scaleOutPct: 50, takeProfit2Pct: 1.6, trailPct: 0.3,
    }),
  ];
  const referee = makeLane('Referee — consensus & risk', 1);
  referee.consensus = true;
  referee.agree = { mode: 'any', expects: 'bullish', minConfidence: 0, veto: true };
  const guardian = AGENT_TEMPLATE_BY_ID.get('risk_guardian')!;
  referee.steps = [
    makeStep('agent', 'Risk Guardian (consensus)', { ...blockConfig('agent_referee'), ...templateConfig(guardian), model: 'llama-3.3-70b-versatile' }),
    makeStep('risk', 'Loss limit −2.5%', { ...blockConfig('risk'), maxDrawdownPct: 2.5, blockOnBreach: true }),
  ];
  g.lanes = [lane, referee];
  g.updatedAt = Date.now();
  return g;
};

/* ── Built-in: Momentum Rider — trend following with a trailing stop ── */
const buildMomentumRider = (): PipeGraph => {
  const g = emptyGraph();
  g.name = 'Momentum Rider — ride the trend';
  g.risk = { maxDrawdownPct: 3, maxTotalInvestmentUsd: 20000 };
  g.session = { durationMin: 120, tickSec: 5, flattenOnStop: true, tradeWindowEt: '09:30-16:00' };
  const lane = makeLane('Scanner — trend up', 0);
  lane.steps = [
    makeStep('screen', 'Find assets by condition', { ...blockConfig('screen'), classId: 'trend_up', limit: 5, bindTop: true }),
    makeStep('analysis', 'TREND SCORE', { programId: 'trend', params: {} }),
    makeStep('branch', 'Only continue if bullish', { expects: 'bullish' }),
    makeStep('analysis', 'MACD', { programId: 'macd', params: {} }),
    makeStep('branch', 'Only continue if bullish', { expects: 'bullish' }),
    makeStep('buy', 'Ride it', {
      ...blockConfig('buy'), amountUsd: 2500, takeProfitPct: 3.0, stopLossPct: 0.7,
      maxHoldMin: 60, maxEntries: 2, cooldownMin: 5,
      scaleOutPct: 0, takeProfit2Pct: 0, trailPct: 0.5,
    }),
  ];
  const referee = makeLane('Referee — consensus & risk', 1);
  referee.consensus = true;
  referee.agree = { mode: 'any', expects: 'bullish', minConfidence: 0, veto: true };
  const guardian = AGENT_TEMPLATE_BY_ID.get('risk_guardian')!;
  referee.steps = [
    makeStep('agent', 'Risk Guardian (consensus)', { ...blockConfig('agent_referee'), ...templateConfig(guardian), model: 'llama-3.3-70b-versatile' }),
    makeStep('risk', 'Loss limit −3%', { ...blockConfig('risk'), maxDrawdownPct: 3, blockOnBreach: true }),
  ];
  g.lanes = [lane, referee];
  g.updatedAt = Date.now();
  return g;
};

export const BUILT_IN_STRATEGIES: LibraryEntry[] = [
  {
    id: 'builtin_6x', name: '6X — Stocks-in-Play Volatility Breakout', builtIn: true,
    blurb: 'The house strategy. In-play screens → confirmed breakouts → Entry Sniper → bank 50% at +1%, runner to +2% behind a trailing stop. Referee veto, −3% session limit, ET stock window.',
    build: buildSipvbGraph,
  },
  {
    id: 'builtin_retest', name: 'Retest Rider — buy the pullback', builtIn: true,
    blurb: 'Waits for a breakout, then buys the orderly retest of the broken level instead of chasing. Same precision exits as the 6X.',
    build: buildRetestRider,
  },
  {
    id: 'builtin_fade', name: 'Fade the Stretch — mean reversion', builtIn: true,
    blurb: 'Fades exhausted downside stretches (oversold + deep z-score) only when the Fade Trader agrees the knife has stopped falling. Tighter risk envelope.',
    build: buildFade,
  },
  {
    id: 'builtin_momentum', name: 'Momentum Rider — ride the trend', builtIn: true,
    blurb: 'Trend following: trend + MACD agreement, wide +3% target, 0.5% trailing stop, two-hour sessions. Fewer, bigger moves.',
    build: buildMomentumRider,
  },
];

/* ── Operator-saved strategies (localStorage) ── */
const KEY = 'ga_strategy_library_v1';

interface SavedEntry { id: string; name: string; savedAt: number; graph: PipeGraph }

const readSaved = (): SavedEntry[] => {
  try {
    const raw = localStorage.getItem(KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr.filter((e) => e && e.id && e.graph) : [];
  } catch { return []; }
};

export const listSavedStrategies = (): LibraryEntry[] =>
  readSaved().map((e) => ({
    id: e.id,
    name: e.name,
    blurb: `Saved ${new Date(e.savedAt).toLocaleString()} · ${e.graph.lanes?.length ?? 0} lanes`,
    builtIn: false,
    savedAt: e.savedAt,
    build: () => JSON.parse(JSON.stringify(e.graph)) as PipeGraph,
  }));

export const saveStrategy = (name: string, graph: PipeGraph): LibraryEntry => {
  const entry: SavedEntry = {
    id: `saved_${Date.now().toString(36)}`,
    name: name.trim() || graph.name || 'Untitled strategy',
    savedAt: Date.now(),
    graph: JSON.parse(JSON.stringify(graph)),
  };
  const all = [entry, ...readSaved()].slice(0, 24);
  try { localStorage.setItem(KEY, JSON.stringify(all)); } catch { /* storage full — non-fatal */ }
  return { id: entry.id, name: entry.name, blurb: '', builtIn: false, savedAt: entry.savedAt, build: () => JSON.parse(JSON.stringify(entry.graph)) };
};

export const deleteSavedStrategy = (id: string) => {
  try { localStorage.setItem(KEY, JSON.stringify(readSaved().filter((e) => e.id !== id))); } catch { /* ignore */ }
};
