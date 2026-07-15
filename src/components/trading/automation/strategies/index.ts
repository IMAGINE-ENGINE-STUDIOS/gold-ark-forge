/**
 * Strategy template registry.
 *
 * Each entry is a *declarative* description of a deterministic trading
 * strategy. No LLM. No `eval`. Params are primitives only, validated at
 * deploy-time. Implementations of the actual tick loops arrive in
 * Phase 1 execution — this file defines the *shape* + defaults + risk
 * rationale that the Bots gallery UI renders today.
 */

export type StrategyKind =
  | 'grid'
  | 'dca'
  | 'momentum'
  | 'meanReversion'
  | 'trendFollowing'
  | 'pairs'
  | 'wave';

export interface StrategyParamSpec {
  key: string;
  label: string;
  type: 'number' | 'enum';
  default: number | string;
  min?: number;
  max?: number;
  step?: number;
  options?: string[];
  unit?: string;
  help?: string;
}

export interface StrategyTemplate {
  kind: StrategyKind;
  name: string;
  short: string;
  formula: string;
  citation: string;
  category: 'range' | 'accumulation' | 'directional' | 'reversion' | 'relative-value' | 'ai';
  risk: 'low' | 'medium' | 'high';
  params: StrategyParamSpec[];
  pitfalls: string[];
  /** True if the strategy is fully wired end-to-end today. */
  ready: boolean;
}

export const STRATEGY_TEMPLATES: StrategyTemplate[] = [
  {
    kind: 'grid',
    name: 'GRID',
    short: 'Layered buy/sell ladder inside a defined range.',
    formula: 'Pᵢ = P₀ · (1 ± r)^i · ATR-scaled Δ',
    citation: 'Classic market-making / range-trading pattern',
    category: 'range',
    risk: 'medium',
    params: [
      { key: 'levels',     label: 'Levels',       type: 'number', default: 10,  min: 4,  max: 40,  step: 1 },
      { key: 'atrMult',    label: 'ATR spacing',  type: 'number', default: 0.5, min: 0.1, max: 3, step: 0.1 },
      { key: 'notionalUsd',label: 'Total notional', type: 'number', default: 2500, min: 100, max: 100000, step: 100, unit: 'USD' },
    ],
    pitfalls: ['Trending markets blow through the range', 'Fee drag at tight spacing', 'Inventory imbalance on one side'],
    ready: false,
  },
  {
    kind: 'dca',
    name: 'DCA / VALUE AVERAGING',
    short: 'Time-scheduled accumulation targeting a growth path.',
    formula: 'orderₜ = V_target(t) − V_actual(t), clamped to ±cap',
    citation: 'Edleson (1988), Value Averaging',
    category: 'accumulation',
    risk: 'low',
    params: [
      { key: 'periodDays',   label: 'Period',           type: 'number', default: 7,   min: 1, max: 90, step: 1, unit: 'days' },
      { key: 'contribution', label: 'Base contribution',type: 'number', default: 100, min: 10, max: 10000, step: 10, unit: 'USD' },
      { key: 'targetGrowth', label: 'Target growth',    type: 'number', default: 0.08, min: 0, max: 0.5, step: 0.01, unit: '/yr' },
      { key: 'orderCapMult', label: 'Order cap',        type: 'number', default: 3,   min: 1, max: 10, step: 0.5, unit: '× base' },
    ],
    pitfalls: ['VA can demand large buys after crashes (cap it)', 'Underperforms lump-sum in expectation', 'Tax drag from forced sells in rallies'],
    ready: false,
  },
  {
    kind: 'momentum',
    name: 'MOMENTUM 12-1',
    short: 'Long the winners, skip the last month to avoid reversal.',
    formula: 'rank by return(t-12m → t-1m), long top decile',
    citation: 'Jegadeesh & Titman (1993), J. Finance',
    category: 'directional',
    risk: 'medium',
    params: [
      { key: 'lookbackMonths', label: 'Lookback', type: 'number', default: 12, min: 3, max: 24, step: 1, unit: 'mo' },
      { key: 'skipMonths',     label: 'Skip',     type: 'number', default: 1,  min: 0, max: 3,  step: 1, unit: 'mo' },
      { key: 'holdMonths',     label: 'Hold',     type: 'number', default: 3,  min: 1, max: 12, step: 1, unit: 'mo' },
      { key: 'topPct',         label: 'Top decile', type: 'number', default: 10, min: 5, max: 33, step: 1, unit: '%' },
    ],
    pitfalls: ['Momentum crashes on sharp reversals', 'Crowding into same names', 'Transaction costs on rebalancing'],
    ready: false,
  },
  {
    kind: 'meanReversion',
    name: 'MEAN-REVERSION (Z-SCORE)',
    short: 'Fade extremes vs a rolling mean.',
    formula: 'z = (P − SMAₙ) / σₙ · entry |z|>k · exit z→0',
    citation: 'Bollinger bands + z-score entry, regime-gated',
    category: 'reversion',
    risk: 'medium',
    params: [
      { key: 'window',   label: 'SMA window', type: 'number', default: 20, min: 5, max: 100, step: 1 },
      { key: 'entryZ',   label: 'Entry |z|',  type: 'number', default: 2,  min: 1, max: 4,   step: 0.1 },
      { key: 'exitZ',    label: 'Exit |z|',   type: 'number', default: 0.2,min: 0, max: 1,   step: 0.05 },
      { key: 'stopZ',    label: 'Stop |z|',   type: 'number', default: 3.5,min: 2, max: 6,   step: 0.1 },
    ],
    pitfalls: ['Fails badly in trending regimes (band walk)', 'Needs ADX / regime filter'],
    ready: false,
  },
  {
    kind: 'trendFollowing',
    name: 'TREND-FOLLOWING (Donchian/Turtle)',
    short: 'Breakout entries with ATR-based unit sizing.',
    formula: 'entry = max(H, 20) · exit = min(L, 10) · unit = 1% eq / (ATR · 2)',
    citation: 'Faith (2007), Way of the Turtle',
    category: 'directional',
    risk: 'high',
    params: [
      { key: 'entryLen',    label: 'Entry channel', type: 'number', default: 20, min: 10, max: 100, step: 5, unit: 'bars' },
      { key: 'exitLen',     label: 'Exit channel',  type: 'number', default: 10, min: 5,  max: 55,  step: 5, unit: 'bars' },
      { key: 'riskPct',     label: 'Risk / unit',   type: 'number', default: 1,  min: 0.1, max: 2,  step: 0.1, unit: '%' },
      { key: 'stopATRMult', label: 'Stop',          type: 'number', default: 2,  min: 1, max: 5,   step: 0.5, unit: '× ATR' },
    ],
    pitfalls: ['~35–40% win rate — relies on fat tails', 'Long whipsaw periods', 'Correlated across trend systems in crashes'],
    ready: false,
  },
  {
    kind: 'pairs',
    name: 'PAIRS / STAT-ARB',
    short: 'Cointegrated pair, trade the spread z-score.',
    formula: 'S = Y − β·X · enter |z|>2 · exit |z|<0.5 · stop |z|>3.5',
    citation: 'Engle & Granger (1987); Gatev, Goetzmann & Rouwenhorst (2006)',
    category: 'relative-value',
    risk: 'high',
    params: [
      { key: 'lookback',    label: 'Lookback',   type: 'number', default: 90, min: 30, max: 250, step: 5, unit: 'd' },
      { key: 'entryZ',      label: 'Entry z',    type: 'number', default: 2,  min: 1,  max: 4,   step: 0.1 },
      { key: 'exitZ',       label: 'Exit z',     type: 'number', default: 0.5,min: 0,  max: 1.5, step: 0.05 },
      { key: 'stopZ',       label: 'Stop z',     type: 'number', default: 3.5,min: 2,  max: 6,   step: 0.1 },
      { key: 'adfPValueMax',label: 'ADF p-max',  type: 'number', default: 0.05,min: 0.01, max: 0.15, step: 0.01 },
    ],
    pitfalls: ['Hedge ratio drifts silently (re-test cointegration)', 'Two-legged fills = slippage', 'Borrow cost for short leg'],
    ready: false,
  },
  {
    kind: 'wave',
    name: 'WAVE (LIVE)',
    short: 'Damped-sinusoid forecast bot. Ships today.',
    formula: 'Proprietary WAVE forecast + Half-Kelly gate',
    citation: 'Gold Arrow proprietary',
    category: 'ai',
    risk: 'medium',
    params: [], // config lives in the WaveBotPanel widget itself
    pitfalls: ['Paper trading only for now', 'Sensitive to volatility regime'],
    ready: true,
  },
];