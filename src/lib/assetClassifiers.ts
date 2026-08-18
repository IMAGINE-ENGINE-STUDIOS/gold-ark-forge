// Asset classification engine — Pipeline v2
// Derives institutional "screens" (hottest, best performing, biggest opportunity,
// critical risk, ...) from LIVE quote telemetry only. No synthetic data: when a
// symbol has no live feed it is simply unclassified.

export interface AssetMetrics {
  ticker: string;
  label: string;
  cat: string;
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

export type ClassId =
  | 'hottest' | 'best' | 'worst' | 'opportunity' | 'critical_risk'
  | 'volatility_storm' | 'calm' | 'breakout' | 'breakdown'
  | 'oversold' | 'overbought' | 'trend_up' | 'trend_down'
  | 'momentum_surge' | 'mean_revert' | 'stability_anchor'
  | 'accumulation' | 'distribution';

export interface ClassDefinition {
  id: ClassId;
  label: string;
  blurb: string;
  tint: string;                 // tailwind color fragment
  /** Score 0..1 — higher is a stronger member of this class. 0 = not a member. */
  score: (d: DerivedMetrics) => number;
}

const clamp01 = (v: number) => (Number.isFinite(v) ? Math.max(0, Math.min(1, v)) : 0);

export const ASSET_CLASSES: ClassDefinition[] = [
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
    score: (d) => clamp01(Math.abs(d.momentum) / 2.5) * clamp01(Math.abs(d.change) / 3) },
  { id: 'mean_revert', label: 'MEAN REVERSION', blurb: 'Mid-range with mild volatility — statistical fade setups.', tint: 'indigo',
    score: (d) => clamp01(1 - Math.abs(d.rangePos - 0.5) * 2) * clamp01(d.volatility / 3) },
  { id: 'stability_anchor', label: 'STABILITY ANCHOR', blurb: 'Low move, low dispersion — collateral-grade behaviour.', tint: 'slate',
    score: (d) => clamp01(1 - Math.abs(d.change) / 1.5) * clamp01(1 - d.volatility / 2) },
  { id: 'accumulation', label: 'ACCUMULATION', blurb: 'Quiet base building off the lows.', tint: 'teal',
    score: (d) => clamp01(1 - d.volatility / 2.5) * clamp01(1 - d.rangePos) },
  { id: 'distribution', label: 'DISTRIBUTION', blurb: 'Quiet stalling at the highs — supply overhead.', tint: 'orange',
    score: (d) => clamp01(1 - d.volatility / 2.5) * clamp01(d.rangePos) },
];

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
export const rankByClass = (assets: ClassifiedAsset[], id: ClassId, limit = 10) =>
  assets
    .filter((a) => a.scores[id] > 0.05)
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