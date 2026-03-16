/**
 * APEX Forecast Engine v4.1 — Regime-Aware, Confluence-Gated Direction Predictor
 * 
 * NO fake data. NO sinusoidal simulation. ALL math-based on real indicator signals.
 * 
 * v4.1 additions over v4:
 * 1. Multi-timeframe confirmation filter (5x aggregation veto gate)
 * 2. Cooldown after 2 consecutive misses (120–600s pause)
 * 3. Signal decay weighting (recency bias on momentum/ROC/SMA)
 * 4. Volatility-aware confluence gate (+2 in low-vol regimes)
 * 5. Direction persistence filter (|bias| > 0.15 to flip direction)
 * 6. Weighted accuracy scoring (time-decayed recent predictions)
 */

import {
  computeSMA,
  computeEMA,
  computeRSI as computeRSIArray,
  computeATR,
  computeMACD,
  computeBollingerBands,
} from '@/components/trading/IndicatorOverlay';

// ─── Types ───────────────────────────────────────────────

export interface ApexForecastPoint {
  time: string;
  apexForecast: number;
  apexColor: string;
  apexHigh?: number;
  apexLow?: number;
  waveGhost?: number;
}

export interface ApexShotRecord {
  id: string;
  timestamp: number;
  symbol: string;
  timeframe: string;
  predictedDirection: 'bullish' | 'bearish' | 'neutral';
  predictedPrice: number;
  entryPrice: number;
  probability: number;
  signalVotes: Record<string, number>;
  regime: 'trending' | 'ranging';
  confluenceCount: number;
  atrAtEntry: number;
  evalDelayMs: number;
  actualPrice?: number;
  correct?: boolean;
  error?: number;
}

export interface ApexWeights {
  rsi: number;
  sma20: number;
  sma50: number;
  ema20: number;
  macd: number;
  boll: number;
  momentum: number;
  vwap: number;
  stochastic: number;
  roc: number;
  adx: number;
  smaCross: number;
}

export interface WeightSnapshot {
  generation: number;
  timestamp: number;
  weights: ApexWeights;
  accuracy: number;
  correctionApplied: boolean;
  regime: 'trending' | 'ranging';
}

export interface ApexState {
  trendingWeights: ApexWeights;
  rangingWeights: ApexWeights;
  /** Legacy accessor — returns trending weights for backward compat */
  weights: ApexWeights;
  shots: ApexShotRecord[];
  corrections: number;
  generation: number;
  winRate: number;
  streak: number;
  weightHistory: WeightSnapshot[];
  _lastBatchAuditCount?: number;
  _consecutiveMisses?: number;
  _cooldownUntil?: number;
  _lastPredictedDirection?: 'bullish' | 'bearish' | 'neutral';
}

const APEX_STATE_KEY = 'ga_apex_state_v4';
const SHOT_WINDOW = 5;
const MAX_SHOTS = 200;
const MAX_WEIGHT_HISTORY = 50;
const MIN_CONFLUENCE = 4;        // base minimum agreeing signals
const MAX_CONFLUENCE = 8;        // max when accuracy is poor
const ACCURACY_FLOOR = 75;       // target minimum accuracy %
const ACCURACY_FLOOR_MARGIN = 5; // start tightening at 80%
const BATCH_AUDIT_SIZE = 10;     // evaluate true accuracy every N predictions
const BATCH_AUDIT_FLOOR = 70;    // trigger deep correction if overall < 70%
const MISS_COOLDOWN_TRIGGER = 2; // consecutive misses before cooldown
const DIRECTION_FLIP_THRESHOLD = 0.15; // min |bias| to flip direction
const SIGNAL_DECAY_FACTOR = 0.85; // exponential decay for recency bias
const LOW_VOL_RATIO = 0.3;       // ATR ratio below which = low vol regime
const LOW_VOL_GATE_BONUS = 2;    // extra confluence required in low vol

const DEFAULT_WEIGHTS: ApexWeights = {
  rsi: 0.60,
  sma20: 0.45,
  sma50: 0.35,
  ema20: 0.40,
  macd: 0.55,
  boll: 0.45,
  momentum: 0.50,
  vwap: 0.35,
  stochastic: 0.55,
  roc: 0.50,
  adx: 0.40,
  smaCross: 0.50,
};

// Regime multipliers
const TRENDING_BOOST: Partial<Record<keyof ApexWeights, number>> = {
  momentum: 1.5, sma20: 1.4, sma50: 1.3, ema20: 1.4, macd: 1.5, smaCross: 1.5, roc: 1.3, adx: 1.2,
  boll: 0.5, vwap: 0.5, rsi: 0.7,
};
const RANGING_BOOST: Partial<Record<keyof ApexWeights, number>> = {
  boll: 1.5, rsi: 1.5, vwap: 1.4, stochastic: 1.4,
  momentum: 0.5, macd: 0.6, smaCross: 0.6, sma50: 0.6,
};

// ─── Persistence ─────────────────────────────────────────

function loadState(): ApexState {
  try {
    const raw = localStorage.getItem(APEX_STATE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        trendingWeights: { ...DEFAULT_WEIGHTS, ...parsed.trendingWeights },
        rangingWeights: { ...DEFAULT_WEIGHTS, ...parsed.rangingWeights },
        weights: { ...DEFAULT_WEIGHTS, ...parsed.trendingWeights },
        shots: parsed.shots ?? [],
        corrections: parsed.corrections ?? 0,
        generation: parsed.generation ?? 0,
        winRate: parsed.winRate ?? 0,
        streak: parsed.streak ?? 0,
        weightHistory: parsed.weightHistory ?? [],
        _lastBatchAuditCount: parsed._lastBatchAuditCount ?? 0,
        _consecutiveMisses: parsed._consecutiveMisses ?? 0,
        _cooldownUntil: parsed._cooldownUntil ?? 0,
        _lastPredictedDirection: parsed._lastPredictedDirection ?? 'neutral',
      };
    }
  } catch { /* ignore */ }
  return {
    trendingWeights: { ...DEFAULT_WEIGHTS },
    rangingWeights: { ...DEFAULT_WEIGHTS },
    weights: { ...DEFAULT_WEIGHTS },
    shots: [],
    corrections: 0,
    generation: 0,
    winRate: 0,
    streak: 0,
    weightHistory: [],
    _lastBatchAuditCount: 0,
    _consecutiveMisses: 0,
    _cooldownUntil: 0,
    _lastPredictedDirection: 'neutral',
  };
}

function saveState(state: ApexState) {
  try {
    const trimmed = {
      ...state,
      shots: state.shots.slice(0, MAX_SHOTS),
      weightHistory: state.weightHistory.slice(0, MAX_WEIGHT_HISTORY),
    };
    localStorage.setItem(APEX_STATE_KEY, JSON.stringify(trimmed));
  } catch { /* */ }
}

// ─── Regime Detection: Hurst Exponent Estimate ───────────

function estimateHurst(values: number[], maxLag = 20): number {
  const n = Math.min(values.length, 100);
  if (n < 20) return 0.5;
  const slice = values.slice(-n);

  const logRS: number[] = [];
  const logN: number[] = [];

  for (let lag = 4; lag <= Math.min(maxLag, Math.floor(n / 2)); lag++) {
    const chunks = Math.floor(n / lag);
    let totalRS = 0;
    let validChunks = 0;

    for (let c = 0; c < chunks; c++) {
      const chunk = slice.slice(c * lag, (c + 1) * lag);
      const mean = chunk.reduce((a, b) => a + b, 0) / chunk.length;
      const deviations = chunk.map(v => v - mean);

      let cumSum = 0;
      let maxCum = -Infinity;
      let minCum = Infinity;
      for (const d of deviations) {
        cumSum += d;
        maxCum = Math.max(maxCum, cumSum);
        minCum = Math.min(minCum, cumSum);
      }
      const range = maxCum - minCum;
      const stdDev = Math.sqrt(deviations.reduce((s, d) => s + d * d, 0) / chunk.length);

      if (stdDev > 0) {
        totalRS += range / stdDev;
        validChunks++;
      }
    }

    if (validChunks > 0) {
      logRS.push(Math.log(totalRS / validChunks));
      logN.push(Math.log(lag));
    }
  }

  if (logRS.length < 3) return 0.5;

  const nPts = logRS.length;
  let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
  for (let i = 0; i < nPts; i++) {
    sumX += logN[i];
    sumY += logRS[i];
    sumXY += logN[i] * logRS[i];
    sumXX += logN[i] * logN[i];
  }
  const denom = nPts * sumXX - sumX * sumX;
  if (denom === 0) return 0.5;
  const hurst = (nPts * sumXY - sumX * sumY) / denom;

  return Math.max(0.1, Math.min(0.9, hurst));
}

function getRegime(values: number[]): 'trending' | 'ranging' {
  const hurst = estimateHurst(values);
  return hurst > 0.55 ? 'trending' : 'ranging';
}

// ─── v4.1: Multi-Timeframe Confirmation Filter ──────────
// Aggregates candles into 5x-period bars, computes SMA20 + momentum on those.
// Returns a directional bias: >0 = higher TF bullish, <0 = bearish, 0 = neutral.

function higherTimeframeBias(values: number[], highs: number[], lows: number[]): number {
  const aggFactor = 5;
  const minBars = aggFactor * 20; // need at least 20 aggregated bars for SMA20
  if (values.length < minBars) return 0; // not enough data, no filter

  // Aggregate into 5x bars (use close of last bar in group)
  const aggCloses: number[] = [];
  const aggHighs: number[] = [];
  const aggLows: number[] = [];
  const usable = values.length - (values.length % aggFactor);
  for (let i = 0; i < usable; i += aggFactor) {
    const closeSlice = values.slice(i, i + aggFactor);
    const highSlice = highs.slice(i, i + aggFactor);
    const lowSlice = lows.slice(i, i + aggFactor);
    aggCloses.push(closeSlice[closeSlice.length - 1]);
    aggHighs.push(Math.max(...highSlice));
    aggLows.push(Math.min(...lowSlice));
  }

  if (aggCloses.length < 20) return 0;

  // SMA20 on aggregated data
  const sma = computeSMA(aggCloses, 20);
  const latestSMA = sma[sma.length - 1];
  const latestClose = aggCloses[aggCloses.length - 1];
  if (!latestSMA || !latestClose) return 0;

  // ATR on aggregated data
  const atrArr = computeATR(aggHighs, aggLows, aggCloses);
  const atr = atrArr[atrArr.length - 1] || latestClose * 0.005;

  // SMA distance signal
  const smaDist = (latestClose - latestSMA) / atr;

  // Momentum on aggregated data (last 5 aggregated bars)
  const momN = Math.min(5, aggCloses.length);
  const momSlice = aggCloses.slice(-momN);
  let momSum = 0;
  for (let i = 1; i < momSlice.length; i++) {
    momSum += momSlice[i] - momSlice[i - 1];
  }
  const momSignal = atr > 0 ? (momSum / (momN - 1)) / atr : 0;

  // Combined higher-TF bias
  const htfBias = Math.max(-1, Math.min(1, (smaDist * 0.6 + momSignal * 0.4)));
  return htfBias;
}

// ─── v4.1: Signal Decay Weighting (Recency Bias) ────────
// Applies exponential decay to linear regression / ROC lookback,
// giving recent bars more influence.

function applyDecayWeights(slice: number[], decayFactor: number): number[] {
  // Returns weighted values where recent values have more weight
  // Used in momentum/ROC slope calculations
  const n = slice.length;
  const weights: number[] = [];
  for (let i = 0; i < n; i++) {
    weights.push(Math.pow(decayFactor, n - 1 - i)); // oldest = lowest weight
  }
  return weights;
}

// ─── Individual Signal Computations (Pure Math) ──────────
// Each returns a vote in [-1, +1] range with STRONG scaling

function signalRSI(values: number[]): number {
  const rsiArr = computeRSIArray(values);
  const rsi = rsiArr[rsiArr.length - 1];
  if (rsi === undefined || isNaN(rsi)) return 0;
  if (rsi < 15) return 1.0;
  if (rsi < 25) return 0.8;
  if (rsi < 35) return 0.5;
  if (rsi > 85) return -1.0;
  if (rsi > 75) return -0.8;
  if (rsi > 65) return -0.5;
  return (50 - rsi) / 40;
}

function signalSMA(values: number[], period: number, atr: number): number {
  const sma = computeSMA(values, period);
  const latest = sma[sma.length - 1];
  const current = values[values.length - 1];
  if (!latest || !current || atr <= 0) return 0;
  const dist = (current - latest) / atr;
  return Math.max(-1, Math.min(1, dist * 0.6));
}

function signalEMA(values: number[], atr: number): number {
  const ema = computeEMA(values, 20);
  const current = values[values.length - 1];
  const latest = ema[ema.length - 1];
  if (!latest || !current || atr <= 0) return 0;
  const dist = (current - latest) / atr;
  return Math.max(-1, Math.min(1, dist * 0.5));
}

function signalMACD(values: number[], atr: number): number {
  const macd = computeMACD(values);
  const macdVal = macd.macd[macd.macd.length - 1];
  const sigVal = macd.signal[macd.signal.length - 1];
  if (macdVal === undefined || sigVal === undefined || isNaN(macdVal) || isNaN(sigVal) || atr <= 0) return 0;
  const crossover = macdVal - sigVal;
  return Math.max(-1, Math.min(1, (crossover / atr) * 4));
}

function signalBollinger(values: number[]): number {
  const boll = computeBollingerBands(values, 20, 2);
  const upper = boll.upper[boll.upper.length - 1];
  const lower = boll.lower[boll.lower.length - 1];
  const current = values[values.length - 1];
  if (!upper || !lower || upper === lower) return 0;
  const position = (current - lower) / (upper - lower);
  return Math.max(-1, Math.min(1, (0.5 - position) * 2.5));
}

// v4.1: Momentum with decay weighting (recency bias)
function signalMomentum(values: number[], atr: number): number {
  const n = Math.min(10, values.length);
  if (n < 3 || atr <= 0) return 0;
  const slice = values.slice(-n);
  const weights = applyDecayWeights(slice, SIGNAL_DECAY_FACTOR);

  let sumWX = 0, sumWY = 0, sumWXY = 0, sumWXX = 0, sumW = 0;
  for (let i = 0; i < slice.length; i++) {
    const w = weights[i];
    sumW += w;
    sumWX += w * i;
    sumWY += w * slice[i];
    sumWXY += w * i * slice[i];
    sumWXX += w * i * i;
  }
  const denom = sumW * sumWXX - sumWX * sumWX;
  if (denom === 0) return 0;
  const slope = (sumW * sumWXY - sumWX * sumWY) / denom;
  return Math.max(-1, Math.min(1, (slope / atr) * 8));
}

function signalVWAP(values: number[], atr: number): number {
  const n = Math.min(20, values.length);
  if (n < 5 || atr <= 0) return 0;
  const slice = values.slice(-n);
  const mean = slice.reduce((a, b) => a + b, 0) / slice.length;
  const current = values[values.length - 1];
  const dist = (mean - current) / atr;
  return Math.max(-1, Math.min(1, dist * 0.7));
}

// ─── NEW v4 Signals ──────────────────────────────────────

function signalStochastic(values: number[], highs: number[], lows: number[]): number {
  const period = 14;
  const smoothK = 3;
  if (values.length < period + smoothK) return 0;

  const kValues: number[] = [];
  for (let i = period - 1; i < values.length; i++) {
    const highSlice = highs.slice(i - period + 1, i + 1);
    const lowSlice = lows.slice(i - period + 1, i + 1);
    const highest = Math.max(...highSlice);
    const lowest = Math.min(...lowSlice);
    if (highest === lowest) { kValues.push(50); continue; }
    kValues.push(((values[i] - lowest) / (highest - lowest)) * 100);
  }

  if (kValues.length < smoothK) return 0;
  const kSmoothed: number[] = [];
  for (let i = smoothK - 1; i < kValues.length; i++) {
    const avg = kValues.slice(i - smoothK + 1, i + 1).reduce((a, b) => a + b, 0) / smoothK;
    kSmoothed.push(avg);
  }

  const dPeriod = 3;
  if (kSmoothed.length < dPeriod) return 0;
  const dValues: number[] = [];
  for (let i = dPeriod - 1; i < kSmoothed.length; i++) {
    const avg = kSmoothed.slice(i - dPeriod + 1, i + 1).reduce((a, b) => a + b, 0) / dPeriod;
    dValues.push(avg);
  }

  const k = kSmoothed[kSmoothed.length - 1];
  const d = dValues[dValues.length - 1];

  let vote = 0;
  if (k < 20) vote += 0.6;
  else if (k < 30) vote += 0.3;
  else if (k > 80) vote -= 0.6;
  else if (k > 70) vote -= 0.3;

  if (k > d && k < 40) vote += 0.4;
  else if (k < d && k > 60) vote -= 0.4;

  return Math.max(-1, Math.min(1, vote));
}

// v4.1: ROC with decay weighting
function signalROC(values: number[], atr: number): number {
  const period = 12;
  if (values.length < period + 1 || atr <= 0) return 0;

  // Apply decay: weight recent bars more for a smoothed ROC
  const slice = values.slice(-(period + 1));
  const weights = applyDecayWeights(slice, SIGNAL_DECAY_FACTOR);

  // Weighted average of per-bar ROC
  let weightedROC = 0, wSum = 0;
  for (let i = 1; i < slice.length; i++) {
    if (slice[i - 1] === 0) continue;
    const barROC = (slice[i] - slice[i - 1]) / slice[i - 1];
    weightedROC += barROC * weights[i];
    wSum += weights[i];
  }
  if (wSum === 0) return 0;
  const avgROC = weightedROC / wSum;

  const current = values[values.length - 1];
  const normalized = avgROC / (atr / current) * 0.5 * period; // scale comparable to original
  return Math.max(-1, Math.min(1, normalized));
}

function signalADX(highs: number[], lows: number[], values: number[]): number {
  const period = 14;
  if (values.length < period * 2) return 0;

  let plusDMSum = 0, minusDMSum = 0, trSum = 0;
  for (let i = values.length - period; i < values.length; i++) {
    const upMove = highs[i] - highs[i - 1];
    const downMove = lows[i - 1] - lows[i];
    const plusDM = (upMove > downMove && upMove > 0) ? upMove : 0;
    const minusDM = (downMove > upMove && downMove > 0) ? downMove : 0;
    const tr = Math.max(highs[i] - lows[i], Math.abs(highs[i] - values[i - 1]), Math.abs(lows[i] - values[i - 1]));
    plusDMSum += plusDM;
    minusDMSum += minusDM;
    trSum += tr;
  }

  if (trSum === 0) return 0;
  const plusDI = plusDMSum / trSum;
  const minusDI = minusDMSum / trSum;
  const diDiff = plusDI - minusDI;
  const diSum = plusDI + minusDI;
  if (diSum === 0) return 0;

  const dx = Math.abs(diDiff) / diSum;
  const direction = Math.sign(diDiff);
  return Math.max(-1, Math.min(1, direction * dx * 2));
}

// v4.1: SMA Cross with decay-weighted slope
function signalSMACross(values: number[], atr: number): number {
  if (values.length < 20 || atr <= 0) return 0;
  const sma10 = computeSMA(values, 10);
  const sma20 = computeSMA(values, 20);
  const fast = sma10[sma10.length - 1];
  const slow = sma20[sma20.length - 1];
  if (isNaN(fast) || isNaN(slow)) return 0;

  const crossDist = (fast - slow) / atr;

  const fastPrev = sma10[sma10.length - 3];
  const slowPrev = sma20[sma20.length - 3];
  let crossBoost = 0;
  if (!isNaN(fastPrev) && !isNaN(slowPrev)) {
    const wasBelowOrAt = fastPrev <= slowPrev;
    const isAbove = fast > slow;
    const wasAboveOrAt = fastPrev >= slowPrev;
    const isBelow = fast < slow;
    if (wasBelowOrAt && isAbove) crossBoost = 0.4;
    else if (wasAboveOrAt && isBelow) crossBoost = -0.4;
  }

  return Math.max(-1, Math.min(1, crossDist * 0.8 + crossBoost));
}

// ─── Weighted Consensus with Regime + Confluence ─────────

interface SignalResult {
  name: string;
  vote: number;
  weightedVote: number;
}

function computeConsensus(
  values: number[],
  highs: number[],
  lows: number[],
  weights: ApexWeights,
  regime: 'trending' | 'ranging',
): { bias: number; probability: number; signals: SignalResult[]; votes: Record<string, number>; confluenceCount: number; currentATR: number; avgATR50: number } {
  if (values.length < 20) return { bias: 0, probability: 0.5, signals: [], votes: {}, confluenceCount: 0, currentATR: 0, avgATR50: 0 };

  const atrArr = computeATR(highs, lows, values);
  const atr = atrArr[atrArr.length - 1] ?? values[values.length - 1] * 0.005;

  // v4.1: Compute average ATR over last 50 bars for volatility ratio
  const atrLast50 = atrArr.slice(-50);
  const avgATR50 = atrLast50.length > 0 ? atrLast50.reduce((a, b) => a + b, 0) / atrLast50.length : atr;

  const rawSignals: { name: keyof ApexWeights; vote: number }[] = [
    { name: 'rsi', vote: signalRSI(values) },
    { name: 'sma20', vote: signalSMA(values, 20, atr) },
    { name: 'sma50', vote: signalSMA(values, 50, atr) },
    { name: 'ema20', vote: signalEMA(values, atr) },
    { name: 'macd', vote: signalMACD(values, atr) },
    { name: 'boll', vote: signalBollinger(values) },
    { name: 'momentum', vote: signalMomentum(values, atr) },
    { name: 'vwap', vote: signalVWAP(values, atr) },
    { name: 'stochastic', vote: signalStochastic(values, highs, lows) },
    { name: 'roc', vote: signalROC(values, atr) },
    { name: 'adx', vote: signalADX(highs, lows, values) },
    { name: 'smaCross', vote: signalSMACross(values, atr) },
  ];

  // Apply regime multipliers
  const regimeMultipliers = regime === 'trending' ? TRENDING_BOOST : RANGING_BOOST;

  let totalWeight = 0;
  let weightedSum = 0;
  const signals: SignalResult[] = [];
  const votes: Record<string, number> = {};

  for (const s of rawSignals) {
    const baseW = weights[s.name];
    const regimeMult = regimeMultipliers[s.name] ?? 1.0;
    const w = baseW * regimeMult;
    const wv = s.vote * w;
    weightedSum += wv;
    totalWeight += w;
    signals.push({ name: s.name, vote: s.vote, weightedVote: wv });
    votes[s.name] = s.vote;
  }

  const bias = totalWeight > 0 ? Math.max(-1, Math.min(1, weightedSum / totalWeight)) : 0;

  // Confluence: count signals with |vote| > 0.1 that agree with bias direction
  const activeSignals = rawSignals.filter(s => Math.abs(s.vote) > 0.1);
  const agreeingSignals = activeSignals.filter(s => Math.sign(s.vote) === Math.sign(bias));
  const confluenceCount = agreeingSignals.length;

  // Probability based on confluence ratio and bias magnitude
  const totalActive = activeSignals.length;
  const agreement = totalActive > 0 ? agreeingSignals.length / totalActive : 0.5;

  const rawProb = 0.5 + (agreement - 0.5) * Math.abs(bias) * 1.2;
  const probability = Math.max(0.1, Math.min(0.95, rawProb));

  return { bias, probability, signals, votes, confluenceCount, currentATR: atr, avgATR50 };
}

// ─── Timeframe-Adaptive Evaluation Delay ─────────────────

function getEvalDelay(timeframe: string): number {
  switch (timeframe) {
    case 'RT': return 60_000;
    case '1m': return 120_000;
    case '5m': return 300_000;
    case '15m': return 600_000;
    case '1h': return 1_800_000;
    case '4h': return 3_600_000;
    case '1d': return 7_200_000;
    default: return 120_000;
  }
}

// ─── v4.1: Cooldown duration based on timeframe ──────────

function getCooldownDuration(timeframe: string): number {
  switch (timeframe) {
    case 'RT': return 120_000;    // 2 min
    case '1m': return 180_000;    // 3 min
    case '5m': return 300_000;    // 5 min
    case '15m': return 600_000;   // 10 min
    default: return 180_000;
  }
}

// ─── v4.1: Weighted Accuracy Scoring (Time-Decayed) ──────
// Recent predictions (last 5 min) count 2x, older decay to 0.5x

function computeWeightedAccuracy(shots: ApexShotRecord[]): number {
  const evaluated = shots.filter(s => s.correct !== undefined);
  if (evaluated.length === 0) return 0;

  let weightedCorrect = 0;
  let totalWeight = 0;
  const now = Date.now();

  for (const shot of evaluated) {
    const ageMs = now - shot.timestamp;
    // 2x for <5min, decays to 0.5x for old predictions
    const recencyWeight = Math.max(0.5, 2.0 - (ageMs / 300_000));
    totalWeight += recencyWeight;
    if (shot.correct) weightedCorrect += recencyWeight;
  }

  return totalWeight > 0 ? (weightedCorrect / totalWeight) * 100 : 0;
}

// ─── Self-Correction Engine (Per-Regime) ─────────────────

function evaluateAndCorrect(state: ApexState): ApexState {
  // Mark pending shots with actual outcomes using magnitude-aware scoring
  const pending = state.shots.filter(s => s.correct === undefined && s.actualPrice !== undefined);
  for (const shot of pending) {
    if (shot.actualPrice === undefined) continue;
    const moved = shot.actualPrice - shot.entryPrice;
    const atr = shot.atrAtEntry || (shot.entryPrice * 0.005);
    const minMove = atr * 0.3;

    if (shot.predictedDirection === 'neutral') {
      shot.correct = Math.abs(moved) < minMove;
    } else {
      const predictedUp = shot.predictedDirection === 'bullish';
      const actualUp = moved > 0;
      const significantMove = Math.abs(moved) >= minMove;

      if (!significantMove) {
        shot.correct = false;
      } else {
        shot.correct = (predictedUp && actualUp) || (!predictedUp && !actualUp);
      }
    }
    shot.error = shot.actualPrice - shot.predictedPrice;

    // v4.1: Track consecutive misses for cooldown
    if (shot.correct === false) {
      state._consecutiveMisses = (state._consecutiveMisses ?? 0) + 1;
    } else if (shot.correct === true) {
      state._consecutiveMisses = 0;
    }
  }

  // Check for complete evaluation window
  const evaluated = state.shots.filter(s => s.correct !== undefined);
  if (evaluated.length < SHOT_WINDOW) return state;

  const recentBatch = evaluated.slice(0, SHOT_WINDOW);
  const errors = recentBatch.filter(s => !s.correct);
  const errorRate = errors.length / SHOT_WINDOW;

  const newTrendingWeights = { ...state.trendingWeights };
  const newRangingWeights = { ...state.rangingWeights };
  const LEARN_RATE = 0.12 + errorRate * 0.18;
  let correctionApplied = false;

  const trendingShots = recentBatch.filter(s => s.regime === 'trending');
  const rangingShots = recentBatch.filter(s => s.regime === 'ranging');

  const adjustWeights = (shots: ApexShotRecord[], weights: ApexWeights, learnRate: number) => {
    if (shots.length < 2) return false;
    const shotErrors = shots.filter(s => !s.correct);
    const shotErrorRate = shotErrors.length / shots.length;

    if (shotErrorRate > 0.4) {
      const signalErrorCounts: Record<string, number> = {};
      const signalCorrectCounts: Record<string, number> = {};

      for (const shot of shots) {
        const actualDir = (shot.actualPrice ?? shot.entryPrice) > shot.entryPrice ? 1 : -1;
        for (const [sigName, sigVote] of Object.entries(shot.signalVotes || {})) {
          if (Math.abs(sigVote) < 0.1) continue;
          if (Math.sign(sigVote) !== actualDir) {
            signalErrorCounts[sigName] = (signalErrorCounts[sigName] ?? 0) + 1;
          } else {
            signalCorrectCounts[sigName] = (signalCorrectCounts[sigName] ?? 0) + 1;
          }
        }
      }

      for (const k of Object.keys(weights) as (keyof ApexWeights)[]) {
        const errs = signalErrorCounts[k] ?? 0;
        const correct = signalCorrectCounts[k] ?? 0;
        const total = errs + correct;
        if (total === 0) continue;

        const signalAccuracy = correct / total;
        if (signalAccuracy < 0.35) {
          weights[k] *= (1 - learnRate);
        } else if (signalAccuracy > 0.65) {
          weights[k] *= (1 + learnRate * 0.6);
        }
      }
      return true;
    } else if (shotErrorRate <= 0.2) {
      for (const k of Object.keys(weights) as (keyof ApexWeights)[]) {
        weights[k] = weights[k] * 0.95 + DEFAULT_WEIGHTS[k] * 0.05;
      }
    }
    return false;
  };

  const trendCorrected = adjustWeights(trendingShots, newTrendingWeights, LEARN_RATE);
  const rangeCorrected = adjustWeights(rangingShots, newRangingWeights, LEARN_RATE);
  correctionApplied = trendCorrected || rangeCorrected;

  // Clamp all weights
  for (const weights of [newTrendingWeights, newRangingWeights]) {
    for (const k of Object.keys(weights) as (keyof ApexWeights)[]) {
      weights[k] = Math.max(0.05, Math.min(2.5, weights[k]));
    }
  }

  // v4.1: Use weighted accuracy scoring (recency bias)
  const weightedAccuracy = computeWeightedAccuracy(state.shots);
  const allEvaluated = state.shots.filter(s => s.correct !== undefined);
  const totalCorrect = allEvaluated.filter(s => s.correct).length;
  const winRate = allEvaluated.length > 0 ? (totalCorrect / allEvaluated.length) * 100 : 0;

  let streak = 0;
  for (const s of allEvaluated) {
    if (s.correct) streak++;
    else break;
  }

  const newGeneration = state.generation + 1;
  const currentRegime = trendingShots.length >= rangingShots.length ? 'trending' : 'ranging';

  const snapshot: WeightSnapshot = {
    generation: newGeneration,
    timestamp: Date.now(),
    weights: currentRegime === 'trending' ? { ...newTrendingWeights } : { ...newRangingWeights },
    accuracy: weightedAccuracy, // v4.1: use weighted accuracy
    correctionApplied,
    regime: currentRegime,
  };

  return {
    ...state,
    trendingWeights: newTrendingWeights,
    rangingWeights: newRangingWeights,
    weights: currentRegime === 'trending' ? newTrendingWeights : newRangingWeights,
    shots: state.shots,
    corrections: state.corrections + (correctionApplied ? 1 : 0),
    generation: newGeneration,
    winRate,
    streak,
    weightHistory: [snapshot, ...state.weightHistory].slice(0, MAX_WEIGHT_HISTORY),
  };
}

// ─── 10-Prediction Batch Audit ───────────────────────────
// v4.1: Uses weighted accuracy scoring for audit evaluation

function batchAudit(state: ApexState): ApexState {
  const directional = state.shots.filter(s => s.predictedDirection !== 'neutral');
  const evaluated = directional.filter(s => s.correct !== undefined);

  const lastAuditCount = state._lastBatchAuditCount ?? 0;
  const currentBatchCount = Math.floor(evaluated.length / BATCH_AUDIT_SIZE);
  if (currentBatchCount <= lastAuditCount || evaluated.length < BATCH_AUDIT_SIZE) {
    return state;
  }

  // v4.1: Use weighted accuracy for batch audit too
  const weightedAccuracy = computeWeightedAccuracy(evaluated);
  const totalCorrect = evaluated.filter(s => s.correct).length;
  const rawAccuracy = (totalCorrect / evaluated.length) * 100;
  // Use the worse of raw vs weighted to be conservative
  const trueAccuracy = Math.min(rawAccuracy, weightedAccuracy);

  state._lastBatchAuditCount = currentBatchCount;

  if (trueAccuracy >= BATCH_AUDIT_FLOOR) {
    console.log(`[APEX BATCH AUDIT] Sample ${evaluated.length}: accuracy ${trueAccuracy.toFixed(1)}% ≥ ${BATCH_AUDIT_FLOOR}% — OK`);
    return state;
  }

  console.log(`[APEX BATCH AUDIT] Sample ${evaluated.length}: accuracy ${trueAccuracy.toFixed(1)}% < ${BATCH_AUDIT_FLOOR}% — DEEP CORRECTION`);

  const deficit = BATCH_AUDIT_FLOOR - trueAccuracy;
  const deepLearnRate = Math.min(0.50, 0.20 + deficit * 0.02);

  const signalStats: Record<string, { correct: number; wrong: number }> = {};
  for (const shot of evaluated) {
    const actualDir = (shot.actualPrice ?? shot.entryPrice) > shot.entryPrice ? 1 : -1;
    for (const [sigName, sigVote] of Object.entries(shot.signalVotes || {})) {
      if (Math.abs(sigVote) < 0.1) continue;
      if (!signalStats[sigName]) signalStats[sigName] = { correct: 0, wrong: 0 };
      if (Math.sign(sigVote) === actualDir) {
        signalStats[sigName].correct++;
      } else {
        signalStats[sigName].wrong++;
      }
    }
  }

  const applyDeepCorrection = (weights: ApexWeights) => {
    for (const k of Object.keys(weights) as (keyof ApexWeights)[]) {
      const stats = signalStats[k];
      if (!stats) continue;
      const total = stats.correct + stats.wrong;
      if (total < 3) continue;
      const sigAccuracy = stats.correct / total;

      if (sigAccuracy < 0.40) {
        weights[k] *= (1 - deepLearnRate);
      } else if (sigAccuracy < 0.55) {
        weights[k] *= (1 - deepLearnRate * 0.4);
      } else if (sigAccuracy > 0.70) {
        weights[k] *= (1 + deepLearnRate * 0.5);
      }

      weights[k] = Math.max(0.05, Math.min(2.5, weights[k]));
    }
  };

  const newTrending = { ...state.trendingWeights };
  const newRanging = { ...state.rangingWeights };
  applyDeepCorrection(newTrending);
  applyDeepCorrection(newRanging);

  const currentRegime: 'trending' | 'ranging' =
    evaluated.filter(s => s.regime === 'trending').length >=
    evaluated.filter(s => s.regime === 'ranging').length
      ? 'trending' : 'ranging';

  const snapshot: WeightSnapshot = {
    generation: state.generation + 1,
    timestamp: Date.now(),
    weights: currentRegime === 'trending' ? { ...newTrending } : { ...newRanging },
    accuracy: trueAccuracy,
    correctionApplied: true,
    regime: currentRegime,
  };

  return {
    ...state,
    trendingWeights: newTrending,
    rangingWeights: newRanging,
    weights: currentRegime === 'trending' ? newTrending : newRanging,
    generation: state.generation + 1,
    corrections: state.corrections + 1,
    weightHistory: [snapshot, ...state.weightHistory].slice(0, MAX_WEIGHT_HISTORY),
  };
}

// ─── APEX v4.1 Forecast Projection ──────────────────────

export interface ApexComputeResult {
  points: ApexForecastPoint[];
  bias: number;
  confidence: number;
  probability: number;
  direction: 'bullish' | 'bearish' | 'neutral';
  signals: SignalResult[];
  state: ApexState;
  regime: 'trending' | 'ranging';
  confluenceCount: number;
}

export function computeApexForecast(
  values: number[],
  highs: number[],
  lows: number[],
  currentPrice: number,
  intervalMs: number,
  labelFn: (d: Date) => string,
  numPoints: number,
  timeframe: string,
  waveBias: number,
  wavePoints: Array<{ forecast: number }>,
): ApexComputeResult {
  const emptyState = loadState();
  if (values.length < 20 || currentPrice <= 0) {
    return { points: [], bias: 0, confidence: 0, probability: 0.5, direction: 'neutral', signals: [], state: emptyState, regime: 'ranging', confluenceCount: 0 };
  }

  const state = loadState();
  const regime = getRegime(values);
  const evalDelay = getEvalDelay(timeframe);

  // Update pending shots with actual price after appropriate delay
  for (const shot of state.shots) {
    if (shot.correct === undefined && Date.now() - shot.timestamp > (shot.evalDelayMs || evalDelay)) {
      shot.actualPrice = currentPrice;
    }
  }
  const correctedState = batchAudit(evaluateAndCorrect(state));

  // Select regime-appropriate weights
  const activeWeights = regime === 'trending' ? correctedState.trendingWeights : correctedState.rangingWeights;

  // Compute consensus from real indicators with regime weighting
  const { bias, probability, signals, votes, confluenceCount, currentATR, avgATR50 } = computeConsensus(values, highs, lows, activeWeights, regime);

  // v4.1: ADAPTIVE CONFLUENCE GATE with volatility awareness
  const adaptiveThreshold = getAdaptiveConfluenceThreshold(correctedState, currentATR, avgATR50);

  // v4.1: Multi-timeframe confirmation filter
  const htfBias = higherTimeframeBias(values, highs, lows);
  const htfDisagrees = (bias > 0 && htfBias < -0.3) || (bias < 0 && htfBias > 0.3);

  // If higher timeframe disagrees, halve the probability
  const adjustedProbability = htfDisagrees ? probability * 0.5 : probability;

  const gatedBias = confluenceCount >= adaptiveThreshold ? bias : 0;

  // v4.1: Direction persistence filter
  const lastDir = correctedState._lastPredictedDirection ?? 'neutral';
  let rawDirection: 'bullish' | 'bearish' | 'neutral' =
    confluenceCount < adaptiveThreshold ? 'neutral' :
    gatedBias > 0.06 ? 'bullish' :
    gatedBias < -0.06 ? 'bearish' : 'neutral';

  // If flipping direction, require higher bias magnitude
  if (rawDirection !== 'neutral' && lastDir !== 'neutral' && rawDirection !== lastDir) {
    if (Math.abs(gatedBias) < DIRECTION_FLIP_THRESHOLD) {
      rawDirection = 'neutral'; // not strong enough to flip
    }
  }

  // v4.1: If higher TF disagrees strongly, veto the prediction
  if (htfDisagrees && rawDirection !== 'neutral') {
    rawDirection = 'neutral';
  }

  // v4.1: Cooldown check — skip prediction if in cooldown
  const now = Date.now();
  const cooldownUntil = correctedState._cooldownUntil ?? 0;
  const consecutiveMisses = correctedState._consecutiveMisses ?? 0;
  let inCooldown = now < cooldownUntil;

  // Trigger new cooldown if we just hit the miss threshold
  if (consecutiveMisses >= MISS_COOLDOWN_TRIGGER && !inCooldown) {
    const cooldownDuration = getCooldownDuration(timeframe);
    correctedState._cooldownUntil = now + cooldownDuration;
    correctedState._consecutiveMisses = 0; // reset after triggering
    inCooldown = true;
    console.log(`[APEX COOLDOWN] ${consecutiveMisses} consecutive misses — pausing predictions for ${(cooldownDuration / 1000).toFixed(0)}s`);
  }

  const gatedDirection = inCooldown ? 'neutral' : rawDirection;

  const atrArr = computeATR(highs, lows, values);
  const atr = atrArr[atrArr.length - 1] ?? currentPrice * 0.005;

  // ─── Adaptive Linear Projection (NO sinusoids) ─────────
  const points: ApexForecastPoint[] = [];
  const decimals = currentPrice < 10 ? 4 : 2;

  const momN = Math.min(8, values.length);
  const momSlice = values.slice(-momN);
  let weightedMom = 0, wSum = 0;
  for (let i = 1; i < momSlice.length; i++) {
    const w = Math.exp(i * 0.4);
    weightedMom += (momSlice[i] - momSlice[i - 1]) * w;
    wSum += w;
  }
  const momentum = wSum > 0 ? weightedMom / wSum : 0;

  const decayRate = 0.15 + (1 - adjustedProbability) * 0.25;

  for (let i = 1; i <= numPoints; i++) {
    const t = i / numPoints;
    const decay = Math.exp(-t * decayRate);

    const drift = gatedBias * atr * 0.12 * adjustedProbability * i * decay;
    const momContrib = momentum * i * 0.15 * decay;
    const recentMean = values.slice(-20).reduce((a, b) => a + b, 0) / Math.min(20, values.length);
    const pullStrength = regime === 'ranging' ? 0.025 * t : 0.008 * t;
    const meanPull = (recentMean - currentPrice) * pullStrength * (1 - adjustedProbability);

    const forecastPrice = currentPrice + drift + momContrib + meanPull;

    const bandWidth = atr * Math.sqrt(i / numPoints) * (0.8 + (1 - adjustedProbability) * 0.8);

    const prevForecast = i === 1 ? currentPrice :
      currentPrice + gatedBias * atr * 0.12 * adjustedProbability * (i - 1) * Math.exp(-(i - 1) / numPoints * decayRate) +
      momentum * (i - 1) * 0.15 * Math.exp(-(i - 1) / numPoints * decayRate);

    const localSlope = forecastPrice - prevForecast;
    const slopeBias = Math.max(-1, Math.min(1, localSlope / (atr * 0.05)));

    const futureTime = new Date(now + i * intervalMs);

    const point: ApexForecastPoint = {
      time: labelFn(futureTime),
      apexForecast: parseFloat(forecastPrice.toFixed(decimals)),
      apexColor: biasToApexColor(slopeBias, adjustedProbability),
      apexHigh: parseFloat((forecastPrice + bandWidth).toFixed(decimals)),
      apexLow: parseFloat((forecastPrice - bandWidth).toFixed(decimals)),
    };

    if (wavePoints[i - 1]) {
      point.waveGhost = wavePoints[i - 1].forecast;
    }

    points.push(point);
  }

  // Record shot ONLY for directional predictions (bullish/bearish)
  const lastForecast = points[points.length - 1];
  if (lastForecast && gatedDirection !== 'neutral') {
    const lastShot = correctedState.shots[0];
    const timeSinceLast = lastShot ? Date.now() - lastShot.timestamp : Infinity;
    if (timeSinceLast > 10_000) {
      const newShot: ApexShotRecord = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        timestamp: Date.now(),
        symbol: '',
        timeframe,
        predictedDirection: gatedDirection,
        predictedPrice: lastForecast.apexForecast,
        entryPrice: currentPrice,
        probability: adjustedProbability,
        signalVotes: votes,
        regime,
        confluenceCount,
        atrAtEntry: atr,
        evalDelayMs: evalDelay,
      };
      correctedState.shots.unshift(newShot);
      if (correctedState.shots.length > MAX_SHOTS) correctedState.shots.length = MAX_SHOTS;

      // v4.1: Update last predicted direction for persistence filter
      correctedState._lastPredictedDirection = gatedDirection;
    }
  }

  // Update the weights accessor
  correctedState.weights = activeWeights;

  saveState(correctedState);

  return {
    points,
    bias: gatedBias,
    confidence: adjustedProbability,
    probability: adjustedProbability,
    direction: gatedDirection,
    signals,
    state: correctedState,
    regime,
    confluenceCount,
  };
}

// ─── Adaptive Confluence Threshold ───────────────────────
// v4.1: Now includes volatility-aware gate bonus

function getAdaptiveConfluenceThreshold(state: ApexState, currentATR?: number, avgATR50?: number): number {
  const evaluated = state.shots.filter(s => s.correct !== undefined);
  if (evaluated.length < 3) return MIN_CONFLUENCE;

  // v4.1: Use weighted accuracy for threshold decisions
  const weightedAcc = computeWeightedAccuracy(state.shots);
  const recent = evaluated.slice(0, 20);
  const correctCount = recent.filter(s => s.correct).length;
  const rawAccuracy = (correctCount / recent.length) * 100;
  // Use the worse of raw vs weighted
  const recentAccuracy = Math.min(rawAccuracy, weightedAcc);

  let threshold: number;
  if (recentAccuracy >= ACCURACY_FLOOR + ACCURACY_FLOOR_MARGIN) {
    threshold = MIN_CONFLUENCE;
  } else if (recentAccuracy >= ACCURACY_FLOOR) {
    threshold = Math.min(MAX_CONFLUENCE, MIN_CONFLUENCE + 1);
  } else {
    const deficit = ACCURACY_FLOOR - recentAccuracy;
    const extra = Math.ceil(deficit / 10);
    threshold = Math.min(MAX_CONFLUENCE, MIN_CONFLUENCE + 1 + extra);
  }

  // v4.1: Volatility-aware gate — raise threshold in low-vol environments
  if (currentATR !== undefined && avgATR50 !== undefined && avgATR50 > 0) {
    const volRatio = currentATR / avgATR50;
    if (volRatio < LOW_VOL_RATIO) {
      threshold = Math.min(MAX_CONFLUENCE, threshold + LOW_VOL_GATE_BONUS);
    }
  }

  return threshold;
}

// ─── APEX Color System — Maximum Contrast ────────────────

function biasToApexColor(bias: number, confidence: number): string {
  const clamped = Math.max(-1, Math.min(1, bias));
  const alpha = 0.85 + confidence * 0.15;

  if (clamped > 0.1) {
    const intensity = Math.min(1, clamped / 0.4);
    const hue = 140 + intensity * 10;
    const sat = 80 + intensity * 20;
    const light = 50 + intensity * 12;
    return `hsla(${hue}, ${sat}%, ${light}%, ${alpha})`;
  } else if (clamped < -0.1) {
    const intensity = Math.min(1, Math.abs(clamped) / 0.4);
    const hue = 0 + intensity * 10;
    const sat = 85 + intensity * 15;
    const light = 48 + intensity * 12;
    return `hsla(${hue}, ${sat}%, ${light}%, ${alpha})`;
  } else {
    return `hsla(45, 90%, 58%, ${alpha})`;
  }
}

// ─── Stats for UI / Dashboard ────────────────────────────

export interface ApexStats {
  generation: number;
  corrections: number;
  winRate: number;
  streak: number;
  totalShots: number;
  totalPredictions: number;
  totalEvaluated: number;
  totalCorrect: number;
  accuracyPct: number;
  weightedAccuracyPct: number;
  adaptiveThreshold: number;
  aboveFloor: boolean;
  lastBatchAudit: { sample: number; accuracy: number; passed: boolean } | null;
  inCooldown: boolean;
  cooldownRemainingSec: number;
  consecutiveMisses: number;
  lastDirection: string;
  last5Accuracy: string;
  last5Detail: Array<{ correct: boolean; direction: string; error: number }>;
  predictionLog: Array<{
    id: string;
    timestamp: number;
    direction: 'bullish' | 'bearish';
    entryPrice: number;
    predictedPrice: number;
    actualPrice?: number;
    correct?: boolean;
    probability: number;
    regime: string;
    confluence: number;
  }>;
  weights: ApexWeights;
  weightHistory: WeightSnapshot[];
  shots: ApexShotRecord[];
  probability: number;
  direction: string;
  regime?: 'trending' | 'ranging';
}

export function getApexStats(): ApexStats {
  const state = loadState();
  const directional = state.shots.filter(s => s.predictedDirection !== 'neutral');
  const evaluated = directional.filter(s => s.correct !== undefined);
  const correct = evaluated.filter(s => s.correct);
  const accuracyPct = evaluated.length > 0 ? (correct.length / evaluated.length) * 100 : 0;
  const weightedAccuracyPct = computeWeightedAccuracy(state.shots);
  const last5 = evaluated.slice(0, 5);
  const last5Correct = last5.filter(s => s.correct).length;
  const threshold = getAdaptiveConfluenceThreshold(state);

  const now = Date.now();
  const cooldownUntil = state._cooldownUntil ?? 0;
  const inCooldown = now < cooldownUntil;
  const cooldownRemainingSec = inCooldown ? Math.ceil((cooldownUntil - now) / 1000) : 0;

  const predictionLog = directional.slice(0, 50).map(s => ({
    id: s.id,
    timestamp: s.timestamp,
    direction: s.predictedDirection as 'bullish' | 'bearish',
    entryPrice: s.entryPrice,
    predictedPrice: s.predictedPrice,
    actualPrice: s.actualPrice,
    correct: s.correct,
    probability: s.probability,
    regime: s.regime,
    confluence: s.confluenceCount,
  }));

  return {
    generation: state.generation,
    corrections: state.corrections,
    winRate: accuracyPct,
    streak: state.streak,
    totalShots: state.shots.length,
    totalPredictions: directional.length,
    totalEvaluated: evaluated.length,
    totalCorrect: correct.length,
    accuracyPct,
    weightedAccuracyPct,
    adaptiveThreshold: threshold,
    aboveFloor: accuracyPct >= ACCURACY_FLOOR || evaluated.length < 3,
    lastBatchAudit: evaluated.length >= BATCH_AUDIT_SIZE
      ? { sample: evaluated.length, accuracy: accuracyPct, passed: accuracyPct >= BATCH_AUDIT_FLOOR }
      : null,
    inCooldown,
    cooldownRemainingSec,
    consecutiveMisses: state._consecutiveMisses ?? 0,
    lastDirection: state._lastPredictedDirection ?? 'neutral',
    last5Accuracy: last5.length > 0 ? `${last5Correct}/${last5.length}` : '—',
    last5Detail: last5.map(s => ({
      correct: !!s.correct,
      direction: s.predictedDirection,
      error: s.error ?? 0,
    })),
    predictionLog,
    weights: state.weights,
    weightHistory: state.weightHistory,
    shots: state.shots,
    probability: 0.5,
    direction: 'neutral',
  };
}

export function resetApexState() {
  localStorage.removeItem(APEX_STATE_KEY);
}

export { DEFAULT_WEIGHTS };
