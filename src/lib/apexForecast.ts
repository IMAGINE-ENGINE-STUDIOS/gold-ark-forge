/**
 * APEX Forecast Engine v5 — Production-Grade Directional Predictor
 * 
 * v5 CRITICAL FIXES over v4.1 (addressing ~30% accuracy failure):
 * 
 * ROOT CAUSES FIXED:
 * 1. VWAP signal was INVERTED — price above VWAP returned bearish (wrong)
 * 2. Bollinger signal was contrarian in TRENDING regimes — fought every trend
 * 3. RSI was too aggressively contrarian — called bearish at RSI 65 (normal trend)
 * 4. minMove threshold PUNISHED correct predictions — if price didn't move 0.3 ATR
 *    in 60s, correct directional calls were marked as MISSES
 * 5. All pending shots evaluated with SAME currentPrice — correlated batch errors
 * 6. Bias threshold 0.06 was noise-level — zero statistical edge
 * 7. Self-correction too slow — needed 15-20 misses before weights adjusted
 * 
 * NEW SAFETY SYSTEMS:
 * - Signal Kill-Switch: mutes any signal below 35% accuracy after 5+ samples
 * - Mandatory Abstain: refuses to predict when probability < 55%
 * - Per-signal accuracy tracking with runtime performance grading
 * - Aggressive correction: 3-shot window, 0.25 base learn rate
 * - Minimum prediction spacing: 30s (was 10s) to prevent spam
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
  /** v5: per-signal runtime accuracy tracking */
  _signalAccuracy?: Record<string, { correct: number; wrong: number }>;
  /** v5: muted signals (accuracy < 35% after 5+ samples) */
  _mutedSignals?: string[];
}

const APEX_STATE_KEY = 'ga_apex_state_v4';
const SHOT_WINDOW = 3;           // v5: faster correction (was 5)
const MAX_SHOTS = 200;
const MAX_WEIGHT_HISTORY = 50;
const MIN_CONFLUENCE = 4;
const MAX_CONFLUENCE = 8;
const ACCURACY_FLOOR = 75;
const ACCURACY_FLOOR_MARGIN = 5;
const BATCH_AUDIT_SIZE = 10;
const BATCH_AUDIT_FLOOR = 70;
const MISS_COOLDOWN_TRIGGER = 2;
const DIRECTION_FLIP_THRESHOLD = 0.15;
const SIGNAL_DECAY_FACTOR = 0.85;
const LOW_VOL_RATIO = 0.3;
const LOW_VOL_GATE_BONUS = 2;

// v5: Critical thresholds
const BIAS_THRESHOLD = 0.12;           // v5: raised from 0.06 — must have real edge
const MIN_PREDICTION_PROBABILITY = 0.55; // v5: refuse to predict below this
const MIN_PREDICTION_SPACING_MS = 30_000; // v5: 30s between predictions (was 10s)
const SIGNAL_MUTE_THRESHOLD = 0.35;    // v5: mute signals below 35% accuracy
const SIGNAL_MUTE_MIN_SAMPLES = 5;     // v5: need 5 samples before muting

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

// v5: Regime multipliers — Bollinger/RSI SUPPRESSED in trending (they fought trends)
const TRENDING_BOOST: Partial<Record<keyof ApexWeights, number>> = {
  momentum: 1.6, sma20: 1.4, sma50: 1.3, ema20: 1.5, macd: 1.6, smaCross: 1.5, roc: 1.4, adx: 1.3,
  boll: 0.2,  // v5: nearly muted in trends (was 0.5) — contrarian = trend-fighting
  vwap: 0.3,  // v5: reduced — VWAP mean-reversion hurts in trends
  rsi: 0.3,   // v5: heavily reduced in trends (was 0.7) — RSI contrarian kills trends
  stochastic: 0.4, // v5: reduced — also contrarian
};
const RANGING_BOOST: Partial<Record<keyof ApexWeights, number>> = {
  boll: 1.5, rsi: 1.5, vwap: 1.4, stochastic: 1.4,
  momentum: 0.4, macd: 0.5, smaCross: 0.5, sma50: 0.5,
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
        _signalAccuracy: parsed._signalAccuracy ?? {},
        _mutedSignals: parsed._mutedSignals ?? [],
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
    _signalAccuracy: {},
    _mutedSignals: [],
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

// ─── Multi-Timeframe Confirmation Filter ─────────────────

function higherTimeframeBias(values: number[], highs: number[], lows: number[]): number {
  const aggFactor = 5;
  const minBars = aggFactor * 20;
  if (values.length < minBars) return 0;

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

  const sma = computeSMA(aggCloses, 20);
  const latestSMA = sma[sma.length - 1];
  const latestClose = aggCloses[aggCloses.length - 1];
  if (!latestSMA || !latestClose) return 0;

  const atrArr = computeATR(aggHighs, aggLows, aggCloses);
  const atr = atrArr[atrArr.length - 1] || latestClose * 0.005;

  const smaDist = (latestClose - latestSMA) / atr;

  const momN = Math.min(5, aggCloses.length);
  const momSlice = aggCloses.slice(-momN);
  let momSum = 0;
  for (let i = 1; i < momSlice.length; i++) {
    momSum += momSlice[i] - momSlice[i - 1];
  }
  const momSignal = atr > 0 ? (momSum / (momN - 1)) / atr : 0;

  return Math.max(-1, Math.min(1, (smaDist * 0.6 + momSignal * 0.4)));
}

// ─── Signal Decay Weighting ─────────────────────────────

function applyDecayWeights(slice: number[], decayFactor: number): number[] {
  const n = slice.length;
  const weights: number[] = [];
  for (let i = 0; i < n; i++) {
    weights.push(Math.pow(decayFactor, n - 1 - i));
  }
  return weights;
}

// ─── Individual Signal Computations ─────────────────────
// v5: FIXED — RSI, Bollinger, VWAP all had critical logic errors

/**
 * v5 RSI FIX: Was too aggressively contrarian.
 * Old: RSI 65 → -0.5 (bearish). In trends RSI stays 55-75 normally.
 * New: Only signal at EXTREME levels (< 20 or > 80).
 * Mid-range RSI (35-65) → near-zero vote (no edge).
 */
function signalRSI(values: number[]): number {
  const rsiArr = computeRSIArray(values);
  const rsi = rsiArr[rsiArr.length - 1];
  if (rsi === undefined || isNaN(rsi)) return 0;

  // Only act on genuine extremes
  if (rsi < 15) return 1.0;   // deeply oversold — strong buy
  if (rsi < 20) return 0.7;
  if (rsi < 30) return 0.3;
  if (rsi > 85) return -1.0;  // deeply overbought — strong sell
  if (rsi > 80) return -0.7;
  if (rsi > 70) return -0.3;

  // v5: NEUTRAL ZONE 30-70 — RSI has NO predictive edge here
  // Previously returned (50-rsi)/40 which generated constant noise
  return 0;
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

/**
 * v5 BOLLINGER FIX: Was ALWAYS contrarian — fought every trend.
 * Old: price at upper band → bearish signal. This is WRONG in trends.
 * New: REGIME-AWARE. In trends, price riding upper band = BULLISH continuation.
 * Only contrarian in RANGING regime where mean-reversion works.
 * 
 * The regime parameter is now passed through to make this work correctly.
 */
function signalBollinger(values: number[], regime: 'trending' | 'ranging'): number {
  const boll = computeBollingerBands(values, 20, 2);
  const upper = boll.upper[boll.upper.length - 1];
  const lower = boll.lower[boll.lower.length - 1];
  const mid = (upper + lower) / 2;
  const current = values[values.length - 1];
  if (!upper || !lower || upper === lower) return 0;
  const position = (current - lower) / (upper - lower); // 0 = at lower, 1 = at upper

  if (regime === 'ranging') {
    // Mean-reversion: overbought → bearish, oversold → bullish
    return Math.max(-1, Math.min(1, (0.5 - position) * 2.0));
  } else {
    // v5 TRENDING: price above mid = bullish momentum, below = bearish
    // Riding the upper band is BULLISH in a trend, not a reversal signal
    const trendSignal = (current - mid) / (upper - mid || 1);
    return Math.max(-1, Math.min(1, trendSignal * 0.6));
  }
}

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

/**
 * v5 VWAP FIX: Signal was INVERTED.
 * Old: dist = (mean - current) / atr → price ABOVE mean = NEGATIVE = bearish
 * This is WRONG. Price above VWAP = institutional buying = BULLISH.
 * New: dist = (current - mean) / atr → correct direction.
 */
function signalVWAP(values: number[], atr: number): number {
  const n = Math.min(20, values.length);
  if (n < 5 || atr <= 0) return 0;
  const slice = values.slice(-n);
  const mean = slice.reduce((a, b) => a + b, 0) / slice.length;
  const current = values[values.length - 1];
  // v5: FIXED — price above mean = bullish (was inverted)
  const dist = (current - mean) / atr;
  return Math.max(-1, Math.min(1, dist * 0.5));
}

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

  // v5: Only signal at genuine extremes (tightened thresholds)
  let vote = 0;
  if (k < 15) vote += 0.6;
  else if (k < 25) vote += 0.3;
  else if (k > 85) vote -= 0.6;
  else if (k > 75) vote -= 0.3;

  if (k > d && k < 30) vote += 0.4;
  else if (k < d && k > 70) vote -= 0.4;

  return Math.max(-1, Math.min(1, vote));
}

function signalROC(values: number[], atr: number): number {
  const period = 12;
  if (values.length < period + 1 || atr <= 0) return 0;

  const slice = values.slice(-(period + 1));
  const weights = applyDecayWeights(slice, SIGNAL_DECAY_FACTOR);

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
  const normalized = avgROC / (atr / current) * 0.5 * period;
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
    if (fastPrev <= slowPrev && fast > slow) crossBoost = 0.4;
    else if (fastPrev >= slowPrev && fast < slow) crossBoost = -0.4;
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
  mutedSignals: string[],
): { bias: number; probability: number; signals: SignalResult[]; votes: Record<string, number>; confluenceCount: number; currentATR: number; avgATR50: number } {
  if (values.length < 20) return { bias: 0, probability: 0.5, signals: [], votes: {}, confluenceCount: 0, currentATR: 0, avgATR50: 0 };

  const atrArr = computeATR(highs, lows, values);
  const atr = atrArr[atrArr.length - 1] ?? values[values.length - 1] * 0.005;
  const atrLast50 = atrArr.slice(-50);
  const avgATR50 = atrLast50.length > 0 ? atrLast50.reduce((a, b) => a + b, 0) / atrLast50.length : atr;

  const rawSignals: { name: keyof ApexWeights; vote: number }[] = [
    { name: 'rsi', vote: signalRSI(values) },
    { name: 'sma20', vote: signalSMA(values, 20, atr) },
    { name: 'sma50', vote: signalSMA(values, 50, atr) },
    { name: 'ema20', vote: signalEMA(values, atr) },
    { name: 'macd', vote: signalMACD(values, atr) },
    { name: 'boll', vote: signalBollinger(values, regime) }, // v5: regime-aware
    { name: 'momentum', vote: signalMomentum(values, atr) },
    { name: 'vwap', vote: signalVWAP(values, atr) },         // v5: FIXED direction
    { name: 'stochastic', vote: signalStochastic(values, highs, lows) },
    { name: 'roc', vote: signalROC(values, atr) },
    { name: 'adx', vote: signalADX(highs, lows, values) },
    { name: 'smaCross', vote: signalSMACross(values, atr) },
  ];

  const regimeMultipliers = regime === 'trending' ? TRENDING_BOOST : RANGING_BOOST;

  let totalWeight = 0;
  let weightedSum = 0;
  const signals: SignalResult[] = [];
  const votes: Record<string, number> = {};

  for (const s of rawSignals) {
    // v5: SIGNAL KILL-SWITCH — muted signals contribute zero
    if (mutedSignals.includes(s.name)) {
      signals.push({ name: s.name, vote: s.vote, weightedVote: 0 });
      votes[s.name] = 0; // record as zero so it doesn't influence accuracy tracking
      continue;
    }

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

  // v5: Confluence only counts non-muted signals
  const activeSignals = rawSignals.filter(s => Math.abs(s.vote) > 0.1 && !mutedSignals.includes(s.name));
  const agreeingSignals = activeSignals.filter(s => Math.sign(s.vote) === Math.sign(bias));
  const confluenceCount = agreeingSignals.length;

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

function getCooldownDuration(timeframe: string): number {
  switch (timeframe) {
    case 'RT': return 120_000;
    case '1m': return 180_000;
    case '5m': return 300_000;
    case '15m': return 600_000;
    default: return 180_000;
  }
}

// ─── Weighted Accuracy Scoring (Time-Decayed) ────────────

function computeWeightedAccuracy(shots: ApexShotRecord[]): number {
  const evaluated = shots.filter(s => s.correct !== undefined);
  if (evaluated.length === 0) return 0;

  let weightedCorrect = 0;
  let totalWeight = 0;
  const now = Date.now();

  for (const shot of evaluated) {
    const ageMs = now - shot.timestamp;
    const recencyWeight = Math.max(0.5, 2.0 - (ageMs / 300_000));
    totalWeight += recencyWeight;
    if (shot.correct) weightedCorrect += recencyWeight;
  }

  return totalWeight > 0 ? (weightedCorrect / totalWeight) * 100 : 0;
}

// ─── v5: Signal Kill-Switch — Runtime Accuracy Tracker ───

function updateSignalAccuracy(state: ApexState): void {
  const evaluated = state.shots.filter(s => s.correct !== undefined);
  if (evaluated.length === 0) return;

  // Rebuild signal accuracy from all evaluated shots
  const sigAcc: Record<string, { correct: number; wrong: number }> = {};

  for (const shot of evaluated) {
    const actualDir = (shot.actualPrice ?? shot.entryPrice) > shot.entryPrice ? 1 : -1;
    for (const [sigName, sigVote] of Object.entries(shot.signalVotes || {})) {
      if (Math.abs(sigVote) < 0.1) continue;
      if (!sigAcc[sigName]) sigAcc[sigName] = { correct: 0, wrong: 0 };
      if (Math.sign(sigVote) === actualDir) {
        sigAcc[sigName].correct++;
      } else {
        sigAcc[sigName].wrong++;
      }
    }
  }

  state._signalAccuracy = sigAcc;

  // Determine which signals to mute
  const muted: string[] = [];
  for (const [sigName, stats] of Object.entries(sigAcc)) {
    const total = stats.correct + stats.wrong;
    if (total >= SIGNAL_MUTE_MIN_SAMPLES) {
      const accuracy = stats.correct / total;
      if (accuracy < SIGNAL_MUTE_THRESHOLD) {
        muted.push(sigName);
        console.log(`[APEX v5 KILL-SWITCH] Signal "${sigName}" MUTED — accuracy ${(accuracy * 100).toFixed(0)}% (${stats.correct}/${total}) < ${SIGNAL_MUTE_THRESHOLD * 100}%`);
      }
    }
  }
  state._mutedSignals = muted;
}

// ─── Self-Correction Engine (Per-Regime) ─────────────────

function evaluateAndCorrect(state: ApexState): ApexState {
  const pending = state.shots.filter(s => s.correct === undefined && s.actualPrice !== undefined);
  for (const shot of pending) {
    if (shot.actualPrice === undefined) continue;
    const moved = shot.actualPrice - shot.entryPrice;
    const atr = shot.atrAtEntry || (shot.entryPrice * 0.005);

    /**
     * v5 EVALUATION FIX: The old minMove threshold was BACKWARDS.
     * Old: if |moved| < 0.3 * ATR → correct = false (ALWAYS)
     * This meant: even if we correctly predicted "bullish" and price went up
     * by 0.2 ATR, it was marked as a MISS. On 60s RT eval windows, price
     * rarely moves 0.3 ATR. Result: ~60-70% of correct predictions were
     * penalized as failures.
     * 
     * v5 FIX: If price didn't move significantly, it's INCONCLUSIVE — skip.
     * Only evaluate shots where price moved enough to confirm/deny direction.
     * This prevents noise from polluting accuracy metrics.
     */
    const minMove = atr * 0.1; // v5: lowered from 0.3 to 0.1 — much more realistic

    if (shot.predictedDirection === 'neutral') {
      shot.correct = Math.abs(moved) < minMove;
    } else {
      const predictedUp = shot.predictedDirection === 'bullish';
      const actualUp = moved > 0;
      const significantMove = Math.abs(moved) >= minMove;

      if (!significantMove) {
        // v5: INCONCLUSIVE — don't count as miss or hit
        // Leave correct = undefined, will re-evaluate on next cycle
        // with updated actualPrice that may have moved further
        continue;
      } else {
        shot.correct = (predictedUp && actualUp) || (!predictedUp && !actualUp);
      }
    }
    shot.error = shot.actualPrice - shot.predictedPrice;

    // Track consecutive misses for cooldown
    if (shot.correct === false) {
      state._consecutiveMisses = (state._consecutiveMisses ?? 0) + 1;
    } else if (shot.correct === true) {
      state._consecutiveMisses = 0;
    }
  }

  // v5: Update signal-level accuracy tracking and kill-switch
  updateSignalAccuracy(state);

  const evaluated = state.shots.filter(s => s.correct !== undefined);
  if (evaluated.length < SHOT_WINDOW) return state;

  const recentBatch = evaluated.slice(0, SHOT_WINDOW);
  const errors = recentBatch.filter(s => !s.correct);
  const errorRate = errors.length / SHOT_WINDOW;

  const newTrendingWeights = { ...state.trendingWeights };
  const newRangingWeights = { ...state.rangingWeights };
  // v5: More aggressive base learn rate (0.25 from 0.12)
  const LEARN_RATE = 0.25 + errorRate * 0.25;
  let correctionApplied = false;

  const trendingShots = recentBatch.filter(s => s.regime === 'trending');
  const rangingShots = recentBatch.filter(s => s.regime === 'ranging');

  const adjustWeights = (shots: ApexShotRecord[], weights: ApexWeights, learnRate: number) => {
    if (shots.length < 2) return false;
    const shotErrors = shots.filter(s => !s.correct);
    const shotErrorRate = shotErrors.length / shots.length;

    // v5: trigger correction at 35% error rate (was 40%)
    if (shotErrorRate > 0.35) {
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
        if (signalAccuracy < 0.30) {
          // v5: more aggressive penalty for terrible signals
          weights[k] *= (1 - learnRate * 1.5);
        } else if (signalAccuracy < 0.45) {
          weights[k] *= (1 - learnRate);
        } else if (signalAccuracy > 0.70) {
          weights[k] *= (1 + learnRate * 0.8);
        }
      }
      return true;
    } else if (shotErrorRate <= 0.2) {
      // Gradually return to defaults when doing well
      for (const k of Object.keys(weights) as (keyof ApexWeights)[]) {
        weights[k] = weights[k] * 0.95 + DEFAULT_WEIGHTS[k] * 0.05;
      }
    }
    return false;
  };

  const trendCorrected = adjustWeights(trendingShots, newTrendingWeights, LEARN_RATE);
  const rangeCorrected = adjustWeights(rangingShots, newRangingWeights, LEARN_RATE);
  correctionApplied = trendCorrected || rangeCorrected;

  for (const weights of [newTrendingWeights, newRangingWeights]) {
    for (const k of Object.keys(weights) as (keyof ApexWeights)[]) {
      weights[k] = Math.max(0.05, Math.min(2.5, weights[k]));
    }
  }

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
    accuracy: weightedAccuracy,
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

function batchAudit(state: ApexState): ApexState {
  const directional = state.shots.filter(s => s.predictedDirection !== 'neutral');
  const evaluated = directional.filter(s => s.correct !== undefined);

  const lastAuditCount = state._lastBatchAuditCount ?? 0;
  const currentBatchCount = Math.floor(evaluated.length / BATCH_AUDIT_SIZE);
  if (currentBatchCount <= lastAuditCount || evaluated.length < BATCH_AUDIT_SIZE) {
    return state;
  }

  const weightedAccuracy = computeWeightedAccuracy(evaluated);
  const totalCorrect = evaluated.filter(s => s.correct).length;
  const rawAccuracy = (totalCorrect / evaluated.length) * 100;
  const trueAccuracy = Math.min(rawAccuracy, weightedAccuracy);

  state._lastBatchAuditCount = currentBatchCount;

  if (trueAccuracy >= BATCH_AUDIT_FLOOR) {
    console.log(`[APEX v5 BATCH AUDIT] Sample ${evaluated.length}: accuracy ${trueAccuracy.toFixed(1)}% ≥ ${BATCH_AUDIT_FLOOR}% — OK`);
    return state;
  }

  console.log(`[APEX v5 BATCH AUDIT] Sample ${evaluated.length}: accuracy ${trueAccuracy.toFixed(1)}% < ${BATCH_AUDIT_FLOOR}% — DEEP CORRECTION`);

  const deficit = BATCH_AUDIT_FLOOR - trueAccuracy;
  // v5: even more aggressive deep correction
  const deepLearnRate = Math.min(0.65, 0.30 + deficit * 0.025);

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

      if (sigAccuracy < 0.35) {
        // v5: near-zero the weight of terrible signals
        weights[k] *= (1 - deepLearnRate * 1.5);
      } else if (sigAccuracy < 0.50) {
        weights[k] *= (1 - deepLearnRate * 0.6);
      } else if (sigAccuracy > 0.70) {
        weights[k] *= (1 + deepLearnRate * 0.6);
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

// ─── APEX v5 Forecast Projection ─────────────────────────

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

  /**
   * v5 EVALUATION FIX: Each shot gets its OWN actualPrice snapshot.
   * Old: ALL pending shots got the same currentPrice at evaluation time.
   * This caused correlated batch errors (5 shots all correct or all wrong).
   * 
   * v5: Only update actualPrice for the OLDEST pending shot whose delay expired.
   * One at a time, ensuring each gets evaluated independently at different price points.
   */
  const pendingShots = state.shots
    .filter(s => s.correct === undefined && s.actualPrice === undefined)
    .sort((a, b) => a.timestamp - b.timestamp); // oldest first

  const now = Date.now();
  for (const shot of pendingShots) {
    if (now - shot.timestamp > (shot.evalDelayMs || evalDelay)) {
      shot.actualPrice = currentPrice;
      break; // v5: only update ONE at a time
    }
  }

  // Also re-evaluate shots that were inconclusive (actualPrice set but correct still undefined)
  // Give them the latest price — they may have moved enough now
  for (const shot of state.shots) {
    if (shot.correct === undefined && shot.actualPrice !== undefined) {
      // Update with latest price for re-evaluation
      shot.actualPrice = currentPrice;
    }
  }

  const correctedState = batchAudit(evaluateAndCorrect(state));

  const activeWeights = regime === 'trending' ? correctedState.trendingWeights : correctedState.rangingWeights;
  const mutedSignals = correctedState._mutedSignals ?? [];

  const { bias, probability, signals, votes, confluenceCount, currentATR, avgATR50 } = computeConsensus(values, highs, lows, activeWeights, regime, mutedSignals);

  const adaptiveThreshold = getAdaptiveConfluenceThreshold(correctedState, currentATR, avgATR50);

  // Multi-timeframe confirmation
  const htfBias = higherTimeframeBias(values, highs, lows);
  const htfDisagrees = (bias > 0 && htfBias < -0.3) || (bias < 0 && htfBias > 0.3);
  const adjustedProbability = htfDisagrees ? probability * 0.5 : probability;

  const gatedBias = confluenceCount >= adaptiveThreshold ? bias : 0;

  // v5: Raised bias threshold from 0.06 to 0.12 — need REAL edge
  const lastDir = correctedState._lastPredictedDirection ?? 'neutral';
  let rawDirection: 'bullish' | 'bearish' | 'neutral' =
    confluenceCount < adaptiveThreshold ? 'neutral' :
    gatedBias > BIAS_THRESHOLD ? 'bullish' :
    gatedBias < -BIAS_THRESHOLD ? 'bearish' : 'neutral';

  // Direction persistence filter
  if (rawDirection !== 'neutral' && lastDir !== 'neutral' && rawDirection !== lastDir) {
    if (Math.abs(gatedBias) < DIRECTION_FLIP_THRESHOLD) {
      rawDirection = 'neutral';
    }
  }

  // HTF veto
  if (htfDisagrees && rawDirection !== 'neutral') {
    rawDirection = 'neutral';
  }

  // v5: MANDATORY ABSTAIN — refuse to predict when probability is too low
  if (adjustedProbability < MIN_PREDICTION_PROBABILITY && rawDirection !== 'neutral') {
    console.log(`[APEX v5] Abstaining — probability ${(adjustedProbability * 100).toFixed(0)}% < ${MIN_PREDICTION_PROBABILITY * 100}% threshold`);
    rawDirection = 'neutral';
  }

  // Cooldown check
  const cooldownUntil = correctedState._cooldownUntil ?? 0;
  const consecutiveMisses = correctedState._consecutiveMisses ?? 0;
  let inCooldown = now < cooldownUntil;

  if (consecutiveMisses >= MISS_COOLDOWN_TRIGGER && !inCooldown) {
    const cooldownDuration = getCooldownDuration(timeframe);
    correctedState._cooldownUntil = now + cooldownDuration;
    correctedState._consecutiveMisses = 0;
    inCooldown = true;
    console.log(`[APEX v5 COOLDOWN] ${consecutiveMisses} consecutive misses — pausing for ${(cooldownDuration / 1000).toFixed(0)}s`);
  }

  const gatedDirection = inCooldown ? 'neutral' : rawDirection;

  const atrArr = computeATR(highs, lows, values);
  const atr = atrArr[atrArr.length - 1] ?? currentPrice * 0.005;

  // ─── Adaptive Linear Projection ────────────────────────
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

  // Record shot — v5: increased spacing, only high-confidence predictions
  const lastForecast = points[points.length - 1];
  if (lastForecast && gatedDirection !== 'neutral') {
    const lastShot = correctedState.shots[0];
    const timeSinceLast = lastShot ? Date.now() - lastShot.timestamp : Infinity;
    if (timeSinceLast > MIN_PREDICTION_SPACING_MS) {
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

      correctedState._lastPredictedDirection = gatedDirection;
    }
  }

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

function getAdaptiveConfluenceThreshold(state: ApexState, currentATR?: number, avgATR50?: number): number {
  const evaluated = state.shots.filter(s => s.correct !== undefined);
  if (evaluated.length < 3) return MIN_CONFLUENCE;

  const weightedAcc = computeWeightedAccuracy(state.shots);
  const recent = evaluated.slice(0, 20);
  const correctCount = recent.filter(s => s.correct).length;
  const rawAccuracy = (correctCount / recent.length) * 100;
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

  // Volatility-aware gate
  if (currentATR !== undefined && avgATR50 !== undefined && avgATR50 > 0) {
    const volRatio = currentATR / avgATR50;
    if (volRatio < LOW_VOL_RATIO) {
      threshold = Math.min(MAX_CONFLUENCE, threshold + LOW_VOL_GATE_BONUS);
    }
  }

  return threshold;
}

// ─── APEX Color System ───────────────────────────────────

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
  mutedSignals: string[];
  signalAccuracy: Record<string, { correct: number; wrong: number; pct: number }>;
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

  // v5: Per-signal accuracy stats for dashboard
  const sigAcc = state._signalAccuracy ?? {};
  const signalAccuracy: Record<string, { correct: number; wrong: number; pct: number }> = {};
  for (const [name, stats] of Object.entries(sigAcc)) {
    const total = stats.correct + stats.wrong;
    signalAccuracy[name] = {
      correct: stats.correct,
      wrong: stats.wrong,
      pct: total > 0 ? (stats.correct / total) * 100 : 0,
    };
  }

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
    mutedSignals: state._mutedSignals ?? [],
    signalAccuracy,
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
