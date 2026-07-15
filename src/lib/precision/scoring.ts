// ─────────────────────────────────────────────────────────────
// GOLD ARROW DECISION SCORE (GADS)
// A 6-pillar, transparent, deterministic scoring engine.
//
//   GADS = Σ  wᵢ · pillarᵢ    where every pillar is 0..100.
//
// Pillars (default weights):
//   Edge         0.22  — directional bias vs. trade side across MTF
//   Probability  0.20  — Monte-Carlo P(Goal) with Bayesian shrink
//   Expectancy   0.20  — Sharpe-like expected-return / vol ratio
//   RiskQuality  0.18  — inverse composite of ATR·RV·tail·DD·disagreement
//   Confluence   0.12  — count of confirming signals (setup / regime / ADX)
//   Liquidity    0.08  — category prior + bar-to-bar stability
//
// After every symbol is scored we run a within-category z-score pass
// on Edge / Probability / Expectancy so scores are cross-comparable
// across BTC and gold and forex majors on the same 0..100 canvas.
// ─────────────────────────────────────────────────────────────
import type { Candles, Direction, PrecisionRow, RiskLabel, Timeframe } from './index';

export type PillarKey =
  | 'edge' | 'probability' | 'expectancy'
  | 'riskQuality' | 'confluence' | 'liquidity';

export interface Pillar {
  key: PillarKey;
  label: string;
  value: number;           // 0..100
  weight: number;          // 0..1
  contribution: number;    // value · weight
  rationale: string;       // human-readable why
}

export interface GadsResult {
  raw: number;                        // 0..100 blend of pillars
  pillars: Pillar[];
  scoreHealth: 'green' | 'amber' | 'red';
  scoreHealthReason: string;
}

const clamp = (v: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, v));
const finite = (v: unknown, fb = 0) => {
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : fb;
};

// Weights sum to 1.0
export const GADS_WEIGHTS: Record<PillarKey, number> = {
  edge: 0.22,
  probability: 0.20,
  expectancy: 0.20,
  riskQuality: 0.18,
  confluence: 0.12,
  liquidity: 0.08,
};

// ── Liquidity priors per category (rough tier score 0..100) ─────
const CATEGORY_LIQUIDITY: Record<string, number> = {
  forex: 92,
  indices: 88,
  metals: 84,
  crypto: 78,
  energy: 74,
  stocks: 70,
};

// ── Pillar builders ──────────────────────────────────────────────
function edgePillar(r: PrecisionRow, direction: Direction): Pillar {
  const alignRaw = direction === 'long' ? finite(r.mtfAlignment) : -finite(r.mtfAlignment);
  // Squash to 0..100 through tanh so extreme alignment saturates smoothly.
  const base = 50 + 50 * Math.tanh(2 * alignRaw);
  const regimeFit =
    r.regime === 'trend' && r.setup !== 'MEAN REVERSION' ? 1.10
      : r.regime === 'range' && r.setup === 'MEAN REVERSION' ? 1.08
      : r.regime === 'squeeze' ? 0.85
      : 1.0;
  const value = clamp(base * regimeFit);
  return {
    key: 'edge',
    label: 'Edge',
    value,
    weight: GADS_WEIGHTS.edge,
    contribution: value * GADS_WEIGHTS.edge,
    rationale: `MTF align ${(alignRaw * 100).toFixed(0)} vs ${direction.toUpperCase()} · regime ${r.regime.toUpperCase()} · fit ×${regimeFit.toFixed(2)}`,
  };
}

function probabilityPillar(r: PrecisionRow): Pillar {
  const paths = 800;
  const alpha = paths / (paths + 50); // Bayesian shrink toward 0.5
  const pAdj = alpha * finite(r.monteCarlo.pGoal) + (1 - alpha) * 0.5;
  const value = clamp(pAdj * 100);
  return {
    key: 'probability',
    label: 'Probability',
    value,
    weight: GADS_WEIGHTS.probability,
    contribution: value * GADS_WEIGHTS.probability,
    rationale: `P(Goal) ${(finite(r.monteCarlo.pGoal) * 100).toFixed(1)}% · Bayes-shrunk to ${(pAdj * 100).toFixed(1)}% (800-path MC)`,
  };
}

function expectancyPillar(r: PrecisionRow, horizonH: number): Pillar {
  const eRet = finite(r.ai?.expectedReturnPct ?? r.monteCarlo.eReturnPct);
  // sigma per hour in %; scale by √H for horizon vol
  const sigmaH = finite(r.realizedVolPct) * 100 * Math.sqrt(Math.max(1, horizonH));
  const denom = Math.max(sigmaH, 0.05);
  const sharpeLike = eRet / denom; // typical range roughly -1.5..1.5
  const value = clamp(50 + 25 * sharpeLike);
  return {
    key: 'expectancy',
    label: 'Expectancy',
    value,
    weight: GADS_WEIGHTS.expectancy,
    contribution: value * GADS_WEIGHTS.expectancy,
    rationale: `E[Ret] ${eRet.toFixed(2)}% ÷ σ√H ${denom.toFixed(2)}% → sharpe-like ${sharpeLike.toFixed(2)}`,
  };
}

function riskQualityPillar(r: PrecisionRow): { pillar: Pillar; composite: number } {
  const atr = finite(r.atrPct);
  const rv = finite(r.realizedVolPct);
  const dd = finite(r.histMaxDDPct);
  const p10 = Math.abs(finite(r.monteCarlo.p10ReturnPct)) / 100; // to fraction
  const disagree = 1 - Math.abs(finite(r.mtfAlignment));
  const composite =
    0.40 * atr +
    0.25 * rv +
    0.15 * p10 +
    0.10 * dd +
    0.10 * disagree * 0.05; // scale disagreement to comparable magnitude
  // Exponential decay: 0 → 100, big → 0. k tuned so ~0.03 comp → ~50.
  const value = clamp(100 * Math.exp(-30 * composite));
  return {
    pillar: {
      key: 'riskQuality',
      label: 'RiskQuality',
      value,
      weight: GADS_WEIGHTS.riskQuality,
      contribution: value * GADS_WEIGHTS.riskQuality,
      rationale: `ATR ${(atr * 100).toFixed(2)}% · RV ${(rv * 100).toFixed(2)}% · |p10| ${(p10 * 100).toFixed(1)}% · DD ${(dd * 100).toFixed(1)}% · disagree ${(disagree * 100).toFixed(0)}`,
    },
    composite,
  };
}

function confluencePillar(r: PrecisionRow, direction: Direction): Pillar {
  const wantDir = direction === 'long' ? 'bullish' : 'bearish';
  const tfs = Object.keys(r.mtf) as Timeframe[];
  let confirms = 0;
  let checks = 0;
  // 1) Each MTF that agrees with side
  tfs.forEach(tf => {
    checks++;
    if (r.mtf[tf]?.direction === wantDir) confirms++;
    else if (r.mtf[tf]?.direction === 'neutral') confirms += 0.5;
  });
  // 2) Setup strength (0..1)
  checks += 1;
  confirms += finite(r.setupStrength);
  // 3) Regime fit
  checks += 1;
  if (r.regime === 'trend' && r.setup !== 'MEAN REVERSION') confirms += 1;
  else if (r.regime === 'range' && r.setup === 'MEAN REVERSION') confirms += 1;
  else if (r.regime === 'squeeze') confirms += 0.2;
  else confirms += 0.6;
  // 4) ADX strength on 1h
  checks += 1;
  const adx = finite(r.mtf['1h']?.adx, 18);
  confirms += clamp(adx / 40, 0, 1);

  const value = clamp((confirms / checks) * 100);
  return {
    key: 'confluence',
    label: 'Confluence',
    value,
    weight: GADS_WEIGHTS.confluence,
    contribution: value * GADS_WEIGHTS.confluence,
    rationale: `${confirms.toFixed(1)}/${checks} confirming signals · ADX ${adx.toFixed(0)} · setup ${(finite(r.setupStrength) * 100).toFixed(0)}%`,
  };
}

function liquidityPillar(r: PrecisionRow, candles?: Candles | null): Pillar {
  const base = CATEGORY_LIQUIDITY[r.cat] ?? 65;
  // Bar-to-bar gap variance penalty
  let penalty = 0;
  if (candles && candles.closes.length > 20) {
    const cs = candles.closes.slice(-40);
    const gaps: number[] = [];
    for (let i = 1; i < cs.length; i++) {
      gaps.push(Math.abs(cs[i] - cs[i - 1]) / Math.max(cs[i - 1], 1e-9));
    }
    const m = gaps.reduce((s, x) => s + x, 0) / gaps.length;
    const varG = gaps.reduce((s, x) => s + (x - m) ** 2, 0) / gaps.length;
    penalty = clamp(Math.sqrt(varG) * 400, 0, 25);
  }
  const value = clamp(base - penalty);
  return {
    key: 'liquidity',
    label: 'Liquidity',
    value,
    weight: GADS_WEIGHTS.liquidity,
    contribution: value * GADS_WEIGHTS.liquidity,
    rationale: `${r.cat} prior ${base} − stability penalty ${penalty.toFixed(1)}`,
  };
}

// ── Public API ───────────────────────────────────────────────────
export function computeGads(
  r: PrecisionRow,
  opts: { direction: Direction; horizonH: number; candles?: Candles | null },
): GadsResult {
  const edge = edgePillar(r, opts.direction);
  const prob = probabilityPillar(r);
  const exp = expectancyPillar(r, opts.horizonH);
  const rq = riskQualityPillar(r);
  const conf = confluencePillar(r, opts.direction);
  const liq = liquidityPillar(r, opts.candles ?? null);

  const pillars: Pillar[] = [edge, prob, exp, rq.pillar, conf, liq];
  const raw = clamp(pillars.reduce((s, p) => s + p.contribution, 0));

  // Health check: were inputs sufficient?
  const bars = opts.candles?.closes.length ?? 0;
  const tfCount = Object.keys(r.mtf).length;
  let health: 'green' | 'amber' | 'red' = 'green';
  let reason = 'All inputs live · full MTF · sufficient history';
  if (bars < 60 || tfCount < 2) { health = 'amber'; reason = `Only ${bars} bars · ${tfCount} timeframes resolved`; }
  if (bars < 30 || !Number.isFinite(r.monteCarlo.pGoal)) { health = 'red'; reason = 'Insufficient history for reliable score'; }
  if (!Number.isFinite(r.price) || r.price <= 0) { health = 'red'; reason = 'Live price unavailable'; }

  return { raw, pillars, scoreHealth: health, scoreHealthReason: reason };
}

// ── Cross-symbol relative score (within category z-normalization) ──
export function finalizeRelativeScores<T extends PrecisionRow & { gads: number }>(rows: T[]): T[] {
  if (rows.length < 3) {
    return rows.map(r => Object.assign(r, { relativeScore: r.gads }));
  }
  const byCat = new Map<string, T[]>();
  rows.forEach(r => {
    const arr = byCat.get(r.cat) ?? [];
    arr.push(r);
    byCat.set(r.cat, arr);
  });
  byCat.forEach(list => {
    if (list.length < 2) {
      list.forEach(r => Object.assign(r, { relativeScore: r.gads }));
      return;
    }
    const m = list.reduce((s, r) => s + r.gads, 0) / list.length;
    const sd = Math.sqrt(list.reduce((s, r) => s + (r.gads - m) ** 2, 0) / list.length) || 1;
    list.forEach(r => {
      const z = (r.gads - m) / sd;
      // Map z ∈ [-2..2] → 15..90 with a soft sigmoid
      const rel = 50 + 20 * Math.tanh(z);
      // Blend raw and relative 60/40 so absolute quality still matters
      Object.assign(r, { relativeScore: clamp(0.6 * r.gads + 0.4 * rel, 0, 100) });
    });
  });
  return rows;
}

// ── Extended risk tier (5 levels) ───────────────────────────────
export type RiskTier5 = 'LOW' | 'MODERATE' | 'ELEVATED' | 'HIGH' | 'EXTREME';

export function computeRiskTier(r: PrecisionRow, goalPct: number): {
  tier: RiskTier5;
  composite: number;
  legacy: RiskLabel;
} {
  const atr = finite(r.atrPct);
  const rv = finite(r.realizedVolPct);
  const dd = finite(r.histMaxDDPct);
  const p10 = Math.abs(finite(r.monteCarlo.p10ReturnPct)) / Math.max(goalPct, 0.1);
  const disagree = 1 - Math.abs(finite(r.mtfAlignment));
  const composite =
    0.40 * atr +
    0.25 * rv +
    0.15 * p10 * 0.01 +
    0.10 * dd +
    0.10 * disagree * 0.05;
  let tier: RiskTier5;
  if (composite < 0.006) tier = 'LOW';
  else if (composite < 0.014) tier = 'MODERATE';
  else if (composite < 0.026) tier = 'ELEVATED';
  else if (composite < 0.045) tier = 'HIGH';
  else tier = 'EXTREME';
  const legacy: RiskLabel =
    tier === 'LOW' ? 'LOW'
    : tier === 'MODERATE' ? 'MEDIUM'
    : tier === 'ELEVATED' ? 'MEDIUM'
    : tier === 'HIGH' ? 'HIGH' : 'EXTREME';
  return { tier, composite, legacy };
}