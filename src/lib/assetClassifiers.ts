// Asset classification engine — Pipeline v2
// Derives institutional "screens" (hottest, best performing, biggest opportunity,
// critical risk, ...) from LIVE quote telemetry only. No synthetic data: when a
// symbol has no live feed it is simply unclassified.

export interface AssetMetrics {
  ticker: string;
  label: string;
  cat: string;
  symbolKey: string;
  last: number;
  change24h: number | null;
  /** Rolling live samples captured by the pipeline substrate (most recent last). */
  samples: number[];
}

export interface DerivedMetrics {
  change: number;          // % 24h (0 when unknown)
  volatility: number;      // % stdev of sample returns, annualless
  momentum: number;        // % drift across the live sample window
  rangePos: number;        // 0..1 position within the sampled range
  drawdown: number;        // % below sampled high (negative)
  samples: number;
}

export const deriveMetrics = (m: AssetMetrics): DerivedMetrics => {
  const s = m.samples.filter((v) => Number.isFinite(v) && v > 0);
  const n = s.length;
  const change = typeof m.change24h === 'number' ? m.change24h : 0;
  if (n < 2) {
    return { change, volatility: Math.abs(change) / 3, momentum: change, rangePos: 0.5, drawdown: 0, samples: n };
  }
  const rets: number[] = [];
  for (let i = 1; i < n; i++) rets.push(((s[i] - s[i - 1]) / s[i - 1]) * 100);
  const mean = rets.reduce((a, b) => a + b, 0) / rets.length;
  const variance = rets.reduce((a, b) => a + (b - mean) ** 2, 0) / rets.length;
  const volatility = Math.sqrt(variance) * Math.sqrt(rets.length);
  const hi = Math.max(...s);
  const lo = Math.min(...s);
  const last = s[n - 1];
  return {
    change,
    volatility: Number.isFinite(volatility) ? volatility : 0,
    momentum: ((last - s[0]) / s[0]) * 100,
    rangePos: hi > lo ? (last - lo) / (hi - lo) : 0.5,
    drawdown: hi > 0 ? ((last - hi) / hi) * 100 : 0,
    samples: n,
  };
};

/** Screen identifier — the catalog below is the source of truth. */
export type ClassId = string;

export interface ClassDefinition {
  id: ClassId;
  label: string;
  blurb: string;
  tint: string;                 // tailwind color fragment
  /** Score 0..1 — higher is a stronger member of this class. 0 = not a member. */
  score: (d: DerivedMetrics) => number;
}

const clamp01 = (v: number) => (Number.isFinite(v) ? Math.max(0, Math.min(1, v)) : 0);

const CORE_CLASSES: ClassDefinition[] = [
  { id: 'hottest', label: 'HOTTEST', blurb: 'Largest live move combined with elevated activity.', tint: 'orange',
    score: (d) => clamp01((Math.abs(d.change) / 6) * 0.7 + (d.volatility / 4) * 0.3) },
  { id: 'best', label: 'BEST PERFORMING', blurb: 'Strongest positive 24h return.', tint: 'emerald',
    score: (d) => clamp01(d.change / 5) },
  { id: 'worst', label: 'WORST PERFORMING', blurb: 'Deepest negative 24h return.', tint: 'rose',
    score: (d) => clamp01(-d.change / 5) },
  { id: 'opportunity', label: 'BIGGEST OPPORTUNITY', blurb: 'Washed-out price near range low with live volatility to pay for the risk.', tint: 'gold',
    score: (d) => clamp01((1 - d.rangePos) * 0.5 + clamp01(-d.change / 6) * 0.3 + clamp01(d.volatility / 5) * 0.2) },
  { id: 'critical_risk', label: 'CRITICAL RISK', blurb: 'Sharp drawdown with expanding volatility — position risk is live.', tint: 'red',
    score: (d) => clamp01(clamp01(-d.drawdown / 8) * 0.5 + clamp01(-d.change / 6) * 0.3 + clamp01(d.volatility / 5) * 0.2) },
  { id: 'volatility_storm', label: 'VOLATILITY STORM', blurb: 'Sample volatility far above the book average.', tint: 'amber',
    score: (d) => clamp01(d.volatility / 6) },
  { id: 'calm', label: 'CALM WATERS', blurb: 'Minimal dispersion — clean for grid & scalp programs.', tint: 'sky',
    score: (d) => clamp01(1 - d.volatility / 2) * (d.samples > 2 ? 1 : 0.4) },
  { id: 'breakout', label: 'BREAKOUT', blurb: 'Trading at the top of the live range with positive drift.', tint: 'emerald',
    score: (d) => clamp01(d.rangePos * 0.6 + clamp01(d.momentum / 2) * 0.4) },
  { id: 'breakdown', label: 'BREAKDOWN', blurb: 'Pinned to range lows with negative drift.', tint: 'rose',
    score: (d) => clamp01((1 - d.rangePos) * 0.6 + clamp01(-d.momentum / 2) * 0.4) },
  { id: 'oversold', label: 'OVERSOLD', blurb: 'Stretched below fair drift — mean-reversion candidate.', tint: 'cyan',
    score: (d) => clamp01(-d.change / 4) * clamp01(1 - d.rangePos) },
  { id: 'overbought', label: 'OVERBOUGHT', blurb: 'Stretched above fair drift — fade candidate.', tint: 'fuchsia',
    score: (d) => clamp01(d.change / 4) * clamp01(d.rangePos) },
  { id: 'trend_up', label: 'TREND UP', blurb: 'Persistent positive drift across the live window.', tint: 'emerald',
    score: (d) => clamp01(d.momentum / 3) * (d.change >= 0 ? 1 : 0.5) },
  { id: 'trend_down', label: 'TREND DOWN', blurb: 'Persistent negative drift across the live window.', tint: 'rose',
    score: (d) => clamp01(-d.momentum / 3) * (d.change <= 0 ? 1 : 0.5) },
  { id: 'momentum_surge', label: 'MOMENTUM SURGE', blurb: 'Acceleration inside the current session.', tint: 'violet',
    score: (d) => clamp01(d.momentum / 2.5) * clamp01(Math.abs(d.change) / 3) },
  { id: 'mean_revert', label: 'MEAN REVERSION', blurb: 'Mid-range with mild volatility — statistical fade setups.', tint: 'indigo',
    score: (d) => clamp01(1 - Math.abs(d.rangePos - 0.5) * 2) * clamp01(d.volatility / 3) },
  { id: 'stability_anchor', label: 'STABILITY ANCHOR', blurb: 'Low move, low dispersion — collateral-grade behaviour.', tint: 'slate',
    score: (d) => clamp01(1 - Math.abs(d.change) / 1.5) * clamp01(1 - d.volatility / 2) },
  { id: 'accumulation', label: 'ACCUMULATION', blurb: 'Quiet base building off the lows.', tint: 'teal',
    score: (d) => clamp01(1 - d.volatility / 2.5) * clamp01(1 - d.rangePos) },
  { id: 'distribution', label: 'DISTRIBUTION', blurb: 'Quiet stalling at the highs — supply overhead.', tint: 'orange',
    score: (d) => clamp01(1 - d.volatility / 2.5) * clamp01(d.rangePos) },
];

/* ── Extended screen catalog ── */
const EXTRA: ClassDefinition[] = [
  { id: 'squeeze', label: 'COILED SPRING', blurb: 'Volatility compressed against a flat tape — expansion pending.', tint: 'teal', score: (d) => clamp01(1 - d.volatility / 1.5) * clamp01(1 - Math.abs(d.momentum) / 2) },
  { id: 'expansion', label: 'RANGE EXPANSION', blurb: 'Volatility opening up with directional drift.', tint: 'amber', score: (d) => clamp01(d.volatility / 4) * clamp01(Math.abs(d.momentum) / 2) },
  { id: 'gap_up', label: 'GAP UP', blurb: 'Sharp positive dislocation on the live tape.', tint: 'emerald', score: (d) => clamp01(d.change / 3) * clamp01(d.rangePos) },
  { id: 'gap_down', label: 'GAP DOWN', blurb: 'Sharp negative dislocation on the live tape.', tint: 'rose', score: (d) => clamp01(-d.change / 3) * clamp01(1 - d.rangePos) },
  { id: 'reversal_up', label: 'REVERSAL UP', blurb: 'Down on the day but reclaiming the range.', tint: 'cyan', score: (d) => clamp01(-d.change / 4) * clamp01(d.rangePos) },
  { id: 'reversal_down', label: 'REVERSAL DOWN', blurb: 'Up on the day but rolling off the highs.', tint: 'fuchsia', score: (d) => clamp01(d.change / 4) * clamp01(1 - d.rangePos) },
  { id: 'grind_up', label: 'GRIND UP', blurb: 'Slow persistent lift with low dispersion.', tint: 'emerald', score: (d) => clamp01(d.momentum / 2) * clamp01(1 - d.volatility / 3) },
  { id: 'grind_down', label: 'GRIND DOWN', blurb: 'Slow persistent bleed with low dispersion.', tint: 'rose', score: (d) => clamp01(-d.momentum / 2) * clamp01(1 - d.volatility / 3) },
  { id: 'capitulation', label: 'CAPITULATION', blurb: 'Violent flush into the range low.', tint: 'red', score: (d) => clamp01(-d.change / 5) * clamp01(d.volatility / 4) * clamp01(1 - d.rangePos) },
  { id: 'euphoria', label: 'EUPHORIA', blurb: 'Vertical chase into the range high.', tint: 'orange', score: (d) => clamp01(d.change / 5) * clamp01(d.volatility / 4) * clamp01(d.rangePos) },
  { id: 'liquidity_grade', label: 'EXECUTION GRADE', blurb: 'Tight tick behaviour — cheapest to execute.', tint: 'sky', score: (d) => clamp01(1 - d.volatility / 1.2) * (d.samples > 3 ? 1 : 0.5) },
  { id: 'scalp_ready', label: 'SCALP READY', blurb: 'Mid-range chop with enough tick range to scalp.', tint: 'cyan', score: (d) => clamp01(1 - Math.abs(d.rangePos - 0.5) * 2) * clamp01(d.volatility / 2.5) },
  { id: 'grid_ready', label: 'GRID READY', blurb: 'Bounded oscillation suited to grid programs.', tint: 'teal', score: (d) => clamp01(1 - Math.abs(d.momentum) / 2) * clamp01(d.volatility / 2) },
  { id: 'swing_ready', label: 'SWING READY', blurb: 'Clean multi-sample drift with tolerable risk.', tint: 'emerald', score: (d) => clamp01(Math.abs(d.momentum) / 2.5) * clamp01(1 - d.volatility / 4) },
  { id: 'carry_grade', label: 'CARRY GRADE', blurb: 'Boring, stable and cheap to hold.', tint: 'slate', score: (d) => clamp01(1 - Math.abs(d.change) / 1) * clamp01(1 - d.volatility / 1.5) },
  { id: 'hedge_candidate', label: 'HEDGE CANDIDATE', blurb: 'Moving against the crowd — portfolio offset.', tint: 'indigo', score: (d) => clamp01(-d.change / 3) * clamp01(1 - d.volatility / 4) },
  { id: 'high_beta', label: 'HIGH BETA', blurb: 'Amplified response to market swings.', tint: 'violet', score: (d) => clamp01(d.volatility / 3) * clamp01(Math.abs(d.change) / 3) },
  { id: 'low_beta', label: 'LOW BETA', blurb: 'Muted response to market swings.', tint: 'slate', score: (d) => clamp01(1 - d.volatility / 2) * clamp01(1 - Math.abs(d.change) / 2) },
  { id: 'stretched_high', label: 'STRETCHED HIGH', blurb: 'Pinned at range top after a big run.', tint: 'fuchsia', score: (d) => clamp01(d.rangePos) * clamp01(d.momentum / 2) },
  { id: 'stretched_low', label: 'STRETCHED LOW', blurb: 'Pinned at range bottom after a big flush.', tint: 'cyan', score: (d) => clamp01(1 - d.rangePos) * clamp01(-d.momentum / 2) },
  { id: 'recovering', label: 'RECOVERING', blurb: 'Lifting out of a drawdown.', tint: 'emerald', score: (d) => clamp01(-d.drawdown / 6) * clamp01(d.momentum / 2) },
  { id: 'deteriorating', label: 'DETERIORATING', blurb: 'Fresh lows with worsening drift.', tint: 'rose', score: (d) => clamp01(-d.drawdown / 6) * clamp01(-d.momentum / 2) },
  { id: 'quiet_drift_up', label: 'QUIET DRIFT UP', blurb: 'Low-noise positive tape — trend-follow base.', tint: 'emerald', score: (d) => clamp01(d.momentum / 1.5) * clamp01(1 - d.volatility / 2) },
  { id: 'quiet_drift_down', label: 'QUIET DRIFT DOWN', blurb: 'Low-noise negative tape — short base.', tint: 'rose', score: (d) => clamp01(-d.momentum / 1.5) * clamp01(1 - d.volatility / 2) },
  { id: 'whipsaw', label: 'WHIPSAW', blurb: 'High dispersion with no net progress — avoid trend logic.', tint: 'amber', score: (d) => clamp01(d.volatility / 3) * clamp01(1 - Math.abs(d.momentum) / 1.5) },
  { id: 'tight_range', label: 'TIGHT RANGE', blurb: 'Narrow band — breakout watchlist.', tint: 'sky', score: (d) => clamp01(1 - d.volatility / 1) },
  { id: 'new_highs', label: 'NEW HIGHS', blurb: 'Printing at the top of the live window.', tint: 'emerald', score: (d) => clamp01((d.rangePos - 0.9) * 10) },
  { id: 'new_lows', label: 'NEW LOWS', blurb: 'Printing at the bottom of the live window.', tint: 'rose', score: (d) => clamp01((0.1 - d.rangePos) * 10) },
  { id: 'risk_off', label: 'RISK OFF', blurb: 'Falling with expanding dispersion — defensive posture.', tint: 'red', score: (d) => clamp01(-d.change / 4) * clamp01(d.volatility / 3) },
  { id: 'risk_on', label: 'RISK ON', blurb: 'Rising with healthy participation.', tint: 'emerald', score: (d) => clamp01(d.change / 4) * clamp01(d.volatility / 4) },
  { id: 'blowoff_risk', label: 'BLOW-OFF RISK', blurb: 'Parabolic extension — trail stops tight.', tint: 'orange', score: (d) => clamp01(d.momentum / 3) * clamp01(d.volatility / 3) * clamp01(d.rangePos) },
  { id: 'falling_knife', label: 'FALLING KNIFE', blurb: 'Accelerating decline — do not average down.', tint: 'red', score: (d) => clamp01(-d.momentum / 3) * clamp01(d.volatility / 3) * clamp01(1 - d.rangePos) },
  { id: 'base_building', label: 'BASE BUILDING', blurb: 'Volatility collapsing after a decline.', tint: 'teal', score: (d) => clamp01(-d.drawdown / 8) * clamp01(1 - d.volatility / 2) },
  { id: 'topping', label: 'TOPPING', blurb: 'Momentum fading at the highs.', tint: 'orange', score: (d) => clamp01(d.rangePos) * clamp01(1 - Math.abs(d.momentum) / 1.5) * clamp01(d.change / 3) },
  { id: 'bottoming', label: 'BOTTOMING', blurb: 'Selling pressure fading at the lows.', tint: 'cyan', score: (d) => clamp01(1 - d.rangePos) * clamp01(1 - Math.abs(d.momentum) / 1.5) * clamp01(-d.change / 3) },
  { id: 'fresh_signal', label: 'FRESH TELEMETRY', blurb: 'Deepest live sample history — most trustworthy stats.', tint: 'gold', score: (d) => clamp01(d.samples / 40) },
  { id: 'thin_data', label: 'THIN TELEMETRY', blurb: 'Few live samples — treat every signal as provisional.', tint: 'slate', score: (d) => clamp01(1 - d.samples / 12) },
  { id: 'big_movers', label: 'BIG MOVERS', blurb: 'Absolute move leaders regardless of direction.', tint: 'orange', score: (d) => clamp01(Math.abs(d.change) / 4) },
  { id: 'flat_tape', label: 'FLAT TAPE', blurb: 'Barely moving — no edge for directional programs.', tint: 'slate', score: (d) => clamp01(1 - Math.abs(d.change) / 0.8) * clamp01(1 - Math.abs(d.momentum) / 1) },
  { id: 'asymmetric', label: 'ASYMMETRIC SETUP', blurb: 'Deep drawdown with rebuilding drift — best reward/risk.', tint: 'gold', score: (d) => clamp01(-d.drawdown / 10) * clamp01(d.momentum / 1.5) * clamp01(1 - d.volatility / 4) },
];

const STRATEGY_SCREENS: ClassDefinition[] = [
  { id: 'in_play', label: 'STOCKS IN PLAY', blurb: 'The SIP-VB selection: a real move underway, live volatility to harvest, and enough prints to trust the stats.', tint: 'gold',
    score: (d) => (d.samples >= 8 ? clamp01(Math.abs(d.change) / 3) * 0.45 + clamp01(d.volatility / 3.5) * 0.3 + clamp01(d.samples / 40) * 0.25 : 0) },
  { id: 'momentum_crash', label: 'MOMENTUM CRASH', blurb: 'Acceleration to the downside inside the current session.', tint: 'rose',
    score: (d) => clamp01(-d.momentum / 2.5) * clamp01(Math.abs(d.change) / 3) },
];

export const ASSET_CLASSES: ClassDefinition[] = [...CORE_CLASSES, ...EXTRA, ...STRATEGY_SCREENS];

export const CLASS_BY_ID = new Map(ASSET_CLASSES.map((c) => [c.id, c]));

export interface ClassifiedAsset extends AssetMetrics {
  derived: DerivedMetrics;
  scores: Record<ClassId, number>;
  top: { id: ClassId; score: number }[];
}

export const classifyAssets = (metrics: AssetMetrics[]): ClassifiedAsset[] =>
  metrics
    .filter((m) => m.last > 0)
    .map((m) => {
      const derived = deriveMetrics(m);
      const scores = {} as Record<ClassId, number>;
      ASSET_CLASSES.forEach((c) => { scores[c.id] = Number(c.score(derived).toFixed(4)); });
      const top = ASSET_CLASSES
        .map((c) => ({ id: c.id, score: scores[c.id] }))
        .filter((s) => s.score >= 0.35)
        .sort((a, b) => b.score - a.score)
        .slice(0, 3);
      return { ...m, derived, scores, top };
    });

/** Rank the universe for one class — the screen a SCREEN node resolves at runtime. */
const EVIDENCE_EXEMPT = new Set(['thin_data', 'fresh_signal', 'in_play']);
export const rankByClass = (assets: ClassifiedAsset[], id: ClassId, limit = 10) =>
  assets
    .filter((a) => a.scores[id] > 0.05 && (EVIDENCE_EXEMPT.has(id) || a.derived.samples >= 8))
    .sort((a, b) => b.scores[id] - a.scores[id])
    .slice(0, limit);

export const classTint = (tint: string) => {
  switch (tint) {
    case 'emerald': return 'text-emerald-400 border-emerald-400/40 bg-emerald-400/10';
    case 'rose':    return 'text-rose-400 border-rose-400/40 bg-rose-400/10';
    case 'red':     return 'text-red-400 border-red-400/40 bg-red-400/10';
    case 'orange':  return 'text-orange-400 border-orange-400/40 bg-orange-400/10';
    case 'amber':   return 'text-amber-400 border-amber-400/40 bg-amber-400/10';
    case 'sky':     return 'text-sky-400 border-sky-400/40 bg-sky-400/10';
    case 'cyan':    return 'text-cyan-400 border-cyan-400/40 bg-cyan-400/10';
    case 'violet':  return 'text-violet-400 border-violet-400/40 bg-violet-400/10';
    case 'fuchsia': return 'text-fuchsia-400 border-fuchsia-400/40 bg-fuchsia-400/10';
    case 'indigo':  return 'text-indigo-400 border-indigo-400/40 bg-indigo-400/10';
    case 'teal':    return 'text-teal-400 border-teal-400/40 bg-teal-400/10';
    case 'slate':   return 'text-slate-300 border-slate-300/40 bg-slate-300/10';
    default:        return 'text-gold-light border-gold/40 bg-gold/10';
  }
};