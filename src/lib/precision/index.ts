// ─────────────────────────────────────────────────────────────
// PRECISION RANK — deterministic multi-timeframe + Monte Carlo
// analytics used by the Indicator Rank dashboard.
// Pure functions, no side effects, no fake data — returns null
// when there is insufficient history.
// ─────────────────────────────────────────────────────────────
import { buildTechnicalSnapshot, type TechnicalSnapshot } from '@/lib/technicalSignals';

export type Direction = 'long' | 'short';
export type Timeframe = '1h' | '4h' | '1d';
export type Regime = 'trend' | 'range' | 'squeeze' | 'mixed';
export type RiskLabel = 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME';
export type SetupLabel =
  | 'DONCHIAN BREAKOUT'
  | 'MEAN REVERSION'
  | 'MACD CROSS'
  | 'TREND CONTINUATION'
  | 'NO CLEAN SETUP';

export interface Candles { closes: number[]; highs: number[]; lows: number[] }

export interface TFStats {
  tf: Timeframe;
  bias: number;         // -1..1
  confidence: number;   // 0..1
  direction: 'bullish' | 'bearish' | 'neutral';
  regime: Regime;
  adx: number;
  bbWidthPct: number;
  snapshot: TechnicalSnapshot;
}

export interface MonteCarloResult {
  pGoal: number;         // prob of hitting goal before horizon
  eReturnPct: number;    // expected terminal return %
  eMaxDDPct: number;     // expected worst drawdown along the path %
  p10ReturnPct: number;
  p90ReturnPct: number;
}

export interface PrecisionRow {
  key: string;
  ticker: string;
  label: string;
  cat: string;
  price: number;
  atrPct: number;               // per-period ATR (1h)
  realizedVolPct: number;       // stdev log returns
  histMaxDDPct: number;         // max drawdown last 168h
  mtf: Partial<Record<Timeframe, TFStats>>;
  mtfAlignment: number;         // -1..1 (agreement across TFs)
  regime: Regime;
  setup: SetupLabel;
  setupStrength: number;        // 0..1
  monteCarlo: MonteCarloResult;
  compositeScore: number;       // 0..100 deterministic
  riskLabel: RiskLabel;
  // Optional AI overlay (populated by edge function)
  ai?: {
    adjustedScore: number;      // 0..100
    expectedReturnPct: number;
    maxDrawdownPct: number;
    entry: number;
    stopLoss: number;
    takeProfit: number;
    riskLabel: RiskLabel;
    rationale: string;
  };
}

// ───── Utility ─────
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const mean = (a: number[]) => a.reduce((s, x) => s + x, 0) / Math.max(a.length, 1);
const stdev = (a: number[]) => {
  if (a.length < 2) return 0;
  const m = mean(a);
  return Math.sqrt(mean(a.map(x => (x - m) ** 2)));
};

// ───── Timeframe resampling ─────
// Input series is hourly. 4h groups 4 samples, 1d groups 24.
export function resample(candles: Candles, factor: number): Candles | null {
  const n = candles.closes.length;
  if (n < factor * 5) return null;
  const closes: number[] = [];
  const highs: number[] = [];
  const lows: number[] = [];
  for (let i = 0; i + factor <= n; i += factor) {
    const cs = candles.closes.slice(i, i + factor);
    const hs = candles.highs.slice(i, i + factor);
    const ls = candles.lows.slice(i, i + factor);
    closes.push(cs[cs.length - 1]);
    highs.push(Math.max(...hs));
    lows.push(Math.min(...ls));
  }
  return { closes, highs, lows };
}

// ───── Volatility & drawdown ─────
export function atrPct(c: Candles, period = 14): number {
  const cs = c.closes;
  const n = Math.min(period, cs.length - 1);
  if (n <= 0) return 0;
  let sum = 0;
  for (let i = cs.length - n; i < cs.length; i++) {
    sum += Math.abs(cs[i] - cs[i - 1]) / Math.max(cs[i - 1], 1e-9);
  }
  return sum / n;
}

export function realizedVolPct(c: Candles, lookback = 20): number {
  const cs = c.closes;
  if (cs.length < lookback + 1) return 0;
  const rets: number[] = [];
  for (let i = cs.length - lookback; i < cs.length; i++) {
    rets.push(Math.log(cs[i] / cs[i - 1]));
  }
  return stdev(rets);
}

export function maxDrawdownPct(c: Candles): number {
  let peak = c.closes[0];
  let dd = 0;
  for (const p of c.closes) {
    peak = Math.max(peak, p);
    dd = Math.min(dd, (p - peak) / peak);
  }
  return Math.abs(dd);
}

// ───── Bollinger width % ─────
function bbWidthPct(c: Candles, period = 20): number {
  const cs = c.closes;
  if (cs.length < period) return 0;
  const window = cs.slice(-period);
  const m = mean(window);
  const sd = stdev(window);
  if (m <= 0) return 0;
  return (4 * sd) / m; // (upper-lower)/mean
}

// ───── Regime detection ─────
function detectRegime(adx: number, bbWidth: number): Regime {
  if (bbWidth < 0.02) return 'squeeze';
  if (adx >= 22) return 'trend';
  if (adx < 18) return 'range';
  return 'mixed';
}

// ───── Setup detection ─────
function detectSetup(c: Candles, snap: TechnicalSnapshot): { setup: SetupLabel; strength: number } {
  const closes = c.closes;
  const price = closes[closes.length - 1];
  const donchHigh = Math.max(...c.highs.slice(-20, -1));
  const donchLow = Math.min(...c.lows.slice(-20, -1));
  const range = donchHigh - donchLow || 1;

  if (price >= donchHigh) {
    return { setup: 'DONCHIAN BREAKOUT', strength: clamp((price - donchHigh) / range * 5 + 0.6, 0.6, 0.95) };
  }
  if (price <= donchLow) {
    return { setup: 'DONCHIAN BREAKOUT', strength: clamp((donchLow - price) / range * 5 + 0.6, 0.6, 0.95) };
  }
  const rsiRow = snap.oscillators.find(r => r.name.startsWith('RSI'));
  const rsi = rsiRow?.value ?? 50;
  if (rsi < 30 || rsi > 70) {
    return { setup: 'MEAN REVERSION', strength: clamp(Math.abs(rsi - 50) / 40, 0.5, 0.9) };
  }
  const macdRow = snap.oscillators.find(r => r.name === 'MACD Level');
  if (macdRow && Math.abs(macdRow.value) > 0) {
    return { setup: 'MACD CROSS', strength: clamp(Math.abs(macdRow.value) / (price * 0.005), 0.4, 0.85) };
  }
  if (snap.decision.direction !== 'neutral' && snap.decision.confidence > 0.65) {
    return { setup: 'TREND CONTINUATION', strength: snap.decision.confidence };
  }
  return { setup: 'NO CLEAN SETUP', strength: 0.2 };
}

// ───── Multi-timeframe snapshot ─────
function tfSnapshot(c: Candles, tf: Timeframe): TFStats | null {
  const snap = buildTechnicalSnapshot(c);
  if (!snap) return null;
  const adxRow = snap.oscillators.find(r => r.name.startsWith('ADX'));
  const adx = adxRow?.value ?? 18;
  const bbW = bbWidthPct(c);
  return {
    tf,
    bias: snap.overallBias,
    confidence: snap.decision.confidence,
    direction: snap.decision.direction,
    regime: detectRegime(adx, bbW),
    adx,
    bbWidthPct: bbW,
    snapshot: snap,
  };
}

// ───── Monte Carlo GBM path simulation ─────
// Uses closed-form Brownian bridge is complex; use simple discrete GBM with N=1000 paths.
// Seeded PRNG for stability between renders.
function mulberry32(a: number) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function gauss(rand: () => number): number {
  // Box-Muller
  const u = Math.max(rand(), 1e-9);
  const v = rand();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

export function monteCarlo(params: {
  driftPerStep: number;   // log drift per hour
  sigmaPerStep: number;   // stdev of log return per hour
  horizonSteps: number;   // e.g. 24 hours
  goalPct: number;        // e.g. 0.02 for +2%
  direction: Direction;
  paths?: number;
  seed?: number;
}): MonteCarloResult {
  const paths = params.paths ?? 800;
  const rand = mulberry32(params.seed ?? 42);
  let hits = 0;
  const terminals: number[] = [];
  const maxDDs: number[] = [];
  const goalLog = Math.log(1 + (params.direction === 'long' ? params.goalPct : -params.goalPct));

  for (let p = 0; p < paths; p++) {
    let cum = 0;      // cumulative log return
    let peak = 0;
    let trough = 0;
    let hit = false;
    for (let t = 0; t < params.horizonSteps; t++) {
      cum += params.driftPerStep + params.sigmaPerStep * gauss(rand);
      peak = Math.max(peak, cum);
      trough = Math.min(trough, cum);
      if (!hit) {
        if (params.direction === 'long' && cum >= goalLog) { hit = true; hits++; }
        else if (params.direction === 'short' && cum <= goalLog) { hit = true; hits++; }
      }
    }
    terminals.push(cum);
    // path max drawdown (from peak to trough after peak)
    maxDDs.push(Math.abs(Math.min(0, trough)));
  }
  terminals.sort((a, b) => a - b);
  const q = (p: number) => terminals[Math.floor(clamp(p, 0, 0.999) * terminals.length)];
  const toPct = (l: number) => (Math.exp(l) - 1) * 100;
  return {
    pGoal: hits / paths,
    eReturnPct: toPct(mean(terminals)),
    eMaxDDPct: (1 - Math.exp(-mean(maxDDs))) * 100,
    p10ReturnPct: toPct(q(0.10)),
    p90ReturnPct: toPct(q(0.90)),
  };
}

// ───── Risk classification ─────
function riskFromVol(atr: number, dd: number): RiskLabel {
  const composite = atr + dd * 0.15;
  if (composite < 0.008) return 'LOW';
  if (composite < 0.02) return 'MEDIUM';
  if (composite < 0.045) return 'HIGH';
  return 'EXTREME';
}

// ───── Main entrypoint per symbol ─────
export function buildPrecisionRow(input: {
  key: string; ticker: string; label: string; cat: string; price: number;
  candles1h: Candles;
  goalPct: number;
  horizonH: number;
  direction: Direction;
}): PrecisionRow | null {
  const { candles1h } = input;
  if (candles1h.closes.length < 60) return null;

  const s1h = tfSnapshot(candles1h, '1h');
  const c4h = resample(candles1h, 4);
  const cd = resample(candles1h, 24);
  const s4h = c4h ? tfSnapshot(c4h, '4h') : null;
  const s1d = cd ? tfSnapshot(cd, '1d') : null;
  if (!s1h) return null;

  const mtf: Partial<Record<Timeframe, TFStats>> = { '1h': s1h };
  if (s4h) mtf['4h'] = s4h;
  if (s1d) mtf['1d'] = s1d;

  // MTF alignment: mean of directional biases weighted (1h .25, 4h .35, 1d .40)
  const w = { '1h': 0.25, '4h': 0.35, '1d': 0.4 } as Record<Timeframe, number>;
  let totW = 0, sumB = 0;
  (Object.keys(mtf) as Timeframe[]).forEach(tf => {
    const s = mtf[tf]!;
    sumB += s.bias * w[tf];
    totW += w[tf];
  });
  const mtfAlignment = totW > 0 ? sumB / totW : 0;

  // Volatility metrics
  const atr = atrPct(candles1h, 14);
  const rv = realizedVolPct(candles1h, 20);
  const dd = maxDrawdownPct(candles1h);

  // Regime aggregate (majority)
  const regimeCounts: Record<Regime, number> = { trend: 0, range: 0, squeeze: 0, mixed: 0 };
  (Object.keys(mtf) as Timeframe[]).forEach(tf => { regimeCounts[mtf[tf]!.regime]++; });
  const regime = (Object.keys(regimeCounts) as Regime[]).sort((a, b) => regimeCounts[b] - regimeCounts[a])[0];

  // Setup
  const { setup, strength } = detectSetup(candles1h, s1h.snapshot);

  // Monte Carlo — use drift from mtfAlignment × atr, sigma from realized vol
  const drift = mtfAlignment * atr * 0.5; // per-hour log drift
  const sigma = Math.max(rv, atr * 0.7, 1e-4);
  const mc = monteCarlo({
    driftPerStep: drift,
    sigmaPerStep: sigma,
    horizonSteps: Math.max(1, Math.round(input.horizonH)),
    goalPct: input.goalPct / 100,
    direction: input.direction,
    seed: hashSeed(input.ticker + input.horizonH + input.goalPct + input.direction),
  });

  // Composite score (0..100)
  const wantDir = input.direction === 'long' ? 'bullish' : 'bearish';
  const alignedBonus = s1h.direction === wantDir ? 1 : (s1h.direction === 'neutral' ? 0.7 : 0.45);
  const trendBonus = regime === 'trend' && setup !== 'MEAN REVERSION' ? 1.1
                    : regime === 'range' && setup === 'MEAN REVERSION' ? 1.1
                    : regime === 'squeeze' ? 0.85 : 1;
  const tailPenalty = 1 / (1 + (atr * 15 + dd * 0.6));
  const composite = clamp(
    100 * mc.pGoal * (0.55 + 0.45 * strength) * alignedBonus * trendBonus * tailPenalty,
    0, 100,
  );

  const riskLabel = riskFromVol(atr, dd);

  return {
    key: input.key,
    ticker: input.ticker,
    label: input.label,
    cat: input.cat,
    price: input.price,
    atrPct: atr,
    realizedVolPct: rv,
    histMaxDDPct: dd,
    mtf,
    mtfAlignment,
    regime,
    setup,
    setupStrength: strength,
    monteCarlo: mc,
    compositeScore: composite,
    riskLabel,
  };
}

function hashSeed(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

// ───── Ranker ─────
export function rankRows(rows: PrecisionRow[]): PrecisionRow[] {
  const riskOrder: Record<RiskLabel, number> = { LOW: 0, MEDIUM: 1, HIGH: 2, EXTREME: 3 };
  return [...rows].sort((a, b) => {
    const ra = riskOrder[a.ai?.riskLabel ?? a.riskLabel];
    const rb = riskOrder[b.ai?.riskLabel ?? b.riskLabel];
    if (ra !== rb) return ra - rb;
    const sa = a.ai?.adjustedScore ?? a.compositeScore;
    const sb = b.ai?.adjustedScore ?? b.compositeScore;
    return sb - sa;
  });
}

// ───── AI candidate payload (compact) ─────
export function toAICandidate(r: PrecisionRow) {
  return {
    ticker: r.ticker,
    label: r.label,
    category: r.cat,
    price: r.price,
    atrPct: +(r.atrPct * 100).toFixed(3),
    realizedVolPct: +(r.realizedVolPct * 100).toFixed(3),
    histMaxDDPct: +(r.histMaxDDPct * 100).toFixed(2),
    mtfAlignment: +r.mtfAlignment.toFixed(3),
    regime: r.regime,
    setup: r.setup,
    setupStrength: +r.setupStrength.toFixed(3),
    pGoal: +r.monteCarlo.pGoal.toFixed(3),
    eReturnPct: +r.monteCarlo.eReturnPct.toFixed(2),
    eMaxDDPct: +r.monteCarlo.eMaxDDPct.toFixed(2),
    p10ReturnPct: +r.monteCarlo.p10ReturnPct.toFixed(2),
    p90ReturnPct: +r.monteCarlo.p90ReturnPct.toFixed(2),
    compositeScore: +r.compositeScore.toFixed(1),
    riskLabel: r.riskLabel,
    biasByTf: Object.fromEntries(
      (Object.keys(r.mtf) as Timeframe[]).map(tf => [tf, +r.mtf[tf]!.bias.toFixed(3)]),
    ),
  };
}