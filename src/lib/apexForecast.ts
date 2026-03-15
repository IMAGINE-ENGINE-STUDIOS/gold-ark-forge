/**
 * APEX Forecast Engine v4 — Regime-Aware, Confluence-Gated Direction Predictor
 * 
 * NO fake data. NO sinusoidal simulation. ALL math-based on real indicator signals.
 * 
 * v4 improvements over v3:
 * 1. 12 independent signals (up from 8): +Stochastic, +ROC, +ADX-style, +SMA Cross
 * 2. Hurst-based regime detection: trending vs mean-reverting → separate weight sets
 * 3. Confluence gate: requires 4+ signals to agree before issuing directional call
 * 4. Adaptive linear projection with ATR envelope (no fake sine waves)
 * 5. Timeframe-adaptive evaluation windows (60s–300s)
 * 6. Magnitude-aware scoring: direction + minimum ATR movement
 * 7. Per-regime weight learning: trending corrections don't degrade ranging performance
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
}

const APEX_STATE_KEY = 'ga_apex_state_v4';
const SHOT_WINDOW = 5;
const MAX_SHOTS = 200;
const MAX_WEIGHT_HISTORY = 50;
const MIN_CONFLUENCE = 4;        // base minimum agreeing signals
const MAX_CONFLUENCE = 8;        // max when accuracy is poor
const ACCURACY_FLOOR = 75;       // target minimum accuracy %
const ACCURACY_FLOOR_MARGIN = 5; // start tightening at 80%

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

  // Rescaled range (R/S) method - simplified
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

      // Cumulative deviations
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

  // Linear regression of log(R/S) vs log(n) → slope = Hurst exponent
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

function signalMomentum(values: number[], atr: number): number {
  const n = Math.min(10, values.length);
  if (n < 3 || atr <= 0) return 0;
  const slice = values.slice(-n);
  let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
  for (let i = 0; i < slice.length; i++) {
    sumX += i; sumY += slice[i]; sumXY += i * slice[i]; sumXX += i * i;
  }
  const denom = n * sumXX - sumX * sumX;
  if (denom === 0) return 0;
  const slope = (n * sumXY - sumX * sumY) / denom;
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

  // Compute %K
  const kValues: number[] = [];
  for (let i = period - 1; i < values.length; i++) {
    const highSlice = highs.slice(i - period + 1, i + 1);
    const lowSlice = lows.slice(i - period + 1, i + 1);
    const highest = Math.max(...highSlice);
    const lowest = Math.min(...lowSlice);
    if (highest === lowest) { kValues.push(50); continue; }
    kValues.push(((values[i] - lowest) / (highest - lowest)) * 100);
  }

  // Smooth %K to get %K(slow)
  if (kValues.length < smoothK) return 0;
  const kSmoothed: number[] = [];
  for (let i = smoothK - 1; i < kValues.length; i++) {
    const avg = kValues.slice(i - smoothK + 1, i + 1).reduce((a, b) => a + b, 0) / smoothK;
    kSmoothed.push(avg);
  }

  // %D = SMA of smoothed %K
  const dPeriod = 3;
  if (kSmoothed.length < dPeriod) return 0;
  const dValues: number[] = [];
  for (let i = dPeriod - 1; i < kSmoothed.length; i++) {
    const avg = kSmoothed.slice(i - dPeriod + 1, i + 1).reduce((a, b) => a + b, 0) / dPeriod;
    dValues.push(avg);
  }

  const k = kSmoothed[kSmoothed.length - 1];
  const d = dValues[dValues.length - 1];

  // Overbought/oversold + crossover
  let vote = 0;
  if (k < 20) vote += 0.6;
  else if (k < 30) vote += 0.3;
  else if (k > 80) vote -= 0.6;
  else if (k > 70) vote -= 0.3;

  // K/D crossover
  if (k > d && k < 40) vote += 0.4; // bullish cross in oversold
  else if (k < d && k > 60) vote -= 0.4; // bearish cross in overbought

  return Math.max(-1, Math.min(1, vote));
}

function signalROC(values: number[], atr: number): number {
  const period = 12;
  if (values.length < period + 1 || atr <= 0) return 0;
  const current = values[values.length - 1];
  const past = values[values.length - 1 - period];
  if (past === 0) return 0;
  const roc = (current - past) / past;
  // Normalize by ATR-relative scale
  const normalized = roc / (atr / current) * 0.5;
  return Math.max(-1, Math.min(1, normalized));
}

function signalADX(highs: number[], lows: number[], values: number[]): number {
  // Simplified ADX: measures trend strength without direction
  // Returns 0 for no trend, positive for uptrend strength, negative for downtrend strength
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

  // DX normalized and signed by direction
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

  // Also check recent crossover direction for stronger signal
  const fastPrev = sma10[sma10.length - 3];
  const slowPrev = sma20[sma20.length - 3];
  let crossBoost = 0;
  if (!isNaN(fastPrev) && !isNaN(slowPrev)) {
    const wasBelowOrAt = fastPrev <= slowPrev;
    const isAbove = fast > slow;
    const wasAboveOrAt = fastPrev >= slowPrev;
    const isBelow = fast < slow;
    if (wasBelowOrAt && isAbove) crossBoost = 0.4; // bullish cross
    else if (wasAboveOrAt && isBelow) crossBoost = -0.4; // bearish cross
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
): { bias: number; probability: number; signals: SignalResult[]; votes: Record<string, number>; confluenceCount: number } {
  if (values.length < 20) return { bias: 0, probability: 0.5, signals: [], votes: {}, confluenceCount: 0 };

  const atrArr = computeATR(highs, lows, values);
  const atr = atrArr[atrArr.length - 1] ?? values[values.length - 1] * 0.005;

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

  // Strong probability scaling: agreement * bias magnitude
  const rawProb = 0.5 + (agreement - 0.5) * Math.abs(bias) * 1.2;
  const probability = Math.max(0.1, Math.min(0.95, rawProb));

  return { bias, probability, signals, votes, confluenceCount };
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

// ─── Self-Correction Engine (Per-Regime) ─────────────────

function evaluateAndCorrect(state: ApexState): ApexState {
  // Mark pending shots with actual outcomes using magnitude-aware scoring
  const pending = state.shots.filter(s => s.correct === undefined && s.actualPrice !== undefined);
  for (const shot of pending) {
    if (shot.actualPrice === undefined) continue;
    const moved = shot.actualPrice - shot.entryPrice;
    const atr = shot.atrAtEntry || (shot.entryPrice * 0.005);
    const minMove = atr * 0.3; // must move at least 0.3 ATR to count

    if (shot.predictedDirection === 'neutral') {
      // Neutral is correct if price didn't move significantly
      shot.correct = Math.abs(moved) < minMove;
    } else {
      const predictedUp = shot.predictedDirection === 'bullish';
      const actualUp = moved > 0;
      const significantMove = Math.abs(moved) >= minMove;

      if (!significantMove) {
        // Insufficient movement — neutral outcome, treat as correct for neutral, incorrect for directional
        shot.correct = false;
      } else {
        shot.correct = (predictedUp && actualUp) || (!predictedUp && !actualUp);
      }
    }
    shot.error = shot.actualPrice - shot.predictedPrice;
  }

  // Check for complete evaluation window
  const evaluated = state.shots.filter(s => s.correct !== undefined);
  if (evaluated.length < SHOT_WINDOW) return state;

  const recentBatch = evaluated.slice(0, SHOT_WINDOW);
  const errors = recentBatch.filter(s => !s.correct);
  const errorRate = errors.length / SHOT_WINDOW;

  // Per-regime weight adjustment
  const newTrendingWeights = { ...state.trendingWeights };
  const newRangingWeights = { ...state.rangingWeights };
  const LEARN_RATE = 0.12 + errorRate * 0.18;
  let correctionApplied = false;

  // Separate recent shots by regime
  const trendingShots = recentBatch.filter(s => s.regime === 'trending');
  const rangingShots = recentBatch.filter(s => s.regime === 'ranging');

  const adjustWeights = (shots: ApexShotRecord[], weights: ApexWeights) => {
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
          weights[k] *= (1 - LEARN_RATE);
        } else if (signalAccuracy > 0.65) {
          weights[k] *= (1 + LEARN_RATE * 0.6);
        }
      }
      return true;
    } else if (shotErrorRate <= 0.2) {
      // Gentle regression toward defaults
      for (const k of Object.keys(weights) as (keyof ApexWeights)[]) {
        weights[k] = weights[k] * 0.95 + DEFAULT_WEIGHTS[k] * 0.05;
      }
    }
    return false;
  };

  const trendCorrected = adjustWeights(trendingShots, newTrendingWeights);
  const rangeCorrected = adjustWeights(rangingShots, newRangingWeights);
  correctionApplied = trendCorrected || rangeCorrected;

  // Clamp all weights
  for (const weights of [newTrendingWeights, newRangingWeights]) {
    for (const k of Object.keys(weights) as (keyof ApexWeights)[]) {
      weights[k] = Math.max(0.05, Math.min(2.5, weights[k]));
    }
  }

  // Compute overall stats
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
    accuracy: winRate,
    correctionApplied,
    regime: currentRegime,
  };

  return {
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

// ─── APEX v4 Forecast Projection ─────────────────────────

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
  const correctedState = evaluateAndCorrect(state);

  // Select regime-appropriate weights
  const activeWeights = regime === 'trending' ? correctedState.trendingWeights : correctedState.rangingWeights;

  // Compute consensus from real indicators with regime weighting
  const { bias, probability, signals, votes, confluenceCount } = computeConsensus(values, highs, lows, activeWeights, regime);

  // ADAPTIVE CONFLUENCE GATE: raise threshold when accuracy drops below floor
  const adaptiveThreshold = getAdaptiveConfluenceThreshold(correctedState);
  const gatedBias = confluenceCount >= adaptiveThreshold ? bias : 0;
  const gatedDirection: 'bullish' | 'bearish' | 'neutral' =
    confluenceCount < adaptiveThreshold ? 'neutral' :
    gatedBias > 0.06 ? 'bullish' :
    gatedBias < -0.06 ? 'bearish' : 'neutral';

  const atrArr = computeATR(highs, lows, values);
  const atr = atrArr[atrArr.length - 1] ?? currentPrice * 0.005;

  // ─── Adaptive Linear Projection (NO sinusoids) ─────────
  // Forecast = currentPrice + (bias * ATR * decay) per step
  // Band = ATR * sqrt(step) — statistically correct random walk envelope

  const points: ApexForecastPoint[] = [];
  const now = Date.now();
  const decimals = currentPrice < 10 ? 4 : 2;

  // Momentum factor from recent price action
  const momN = Math.min(8, values.length);
  const momSlice = values.slice(-momN);
  let weightedMom = 0, wSum = 0;
  for (let i = 1; i < momSlice.length; i++) {
    const w = Math.exp(i * 0.4);
    weightedMom += (momSlice[i] - momSlice[i - 1]) * w;
    wSum += w;
  }
  const momentum = wSum > 0 ? weightedMom / wSum : 0;

  // Decay rate: faster for lower confidence
  const decayRate = 0.15 + (1 - probability) * 0.25;

  for (let i = 1; i <= numPoints; i++) {
    const t = i / numPoints;
    const decay = Math.exp(-t * decayRate);

    // Linear drift from consensus bias
    const drift = gatedBias * atr * 0.12 * probability * i * decay;

    // Momentum carry (decaying)
    const momContrib = momentum * i * 0.15 * decay;

    // Mean-reversion pull (strengthens over time for ranging regime)
    const recentMean = values.slice(-20).reduce((a, b) => a + b, 0) / Math.min(20, values.length);
    const pullStrength = regime === 'ranging' ? 0.025 * t : 0.008 * t;
    const meanPull = (recentMean - currentPrice) * pullStrength * (1 - probability);

    const forecastPrice = currentPrice + drift + momContrib + meanPull;

    // Confidence band: ATR * sqrt(step) — proper random walk scaling
    const bandWidth = atr * Math.sqrt(i / numPoints) * (0.8 + (1 - probability) * 0.8);

    // Color: direction-coded with HIGH CONTRAST
    const prevForecast = i === 1 ? currentPrice :
      currentPrice + gatedBias * atr * 0.12 * probability * (i - 1) * Math.exp(-(i - 1) / numPoints * decayRate) +
      momentum * (i - 1) * 0.15 * Math.exp(-(i - 1) / numPoints * decayRate);

    const localSlope = forecastPrice - prevForecast;
    const slopeBias = Math.max(-1, Math.min(1, localSlope / (atr * 0.05)));

    const futureTime = new Date(now + i * intervalMs);

    const point: ApexForecastPoint = {
      time: labelFn(futureTime),
      apexForecast: parseFloat(forecastPrice.toFixed(decimals)),
      apexColor: biasToApexColor(slopeBias, probability),
      apexHigh: parseFloat((forecastPrice + bandWidth).toFixed(decimals)),
      apexLow: parseFloat((forecastPrice - bandWidth).toFixed(decimals)),
    };

    if (wavePoints[i - 1]) {
      point.waveGhost = wavePoints[i - 1].forecast;
    }

    points.push(point);
  }

  // Record shot ONLY for directional predictions (bullish/bearish)
  // Neutral = "no prediction" — doesn't count toward accuracy
  const lastForecast = points[points.length - 1];
  if (lastForecast && gatedDirection !== 'neutral') {
    // Throttle: don't record if last shot was < 10s ago (prevent spamming from re-renders)
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
        probability,
        signalVotes: votes,
        regime,
        confluenceCount,
        atrAtEntry: atr,
        evalDelayMs: evalDelay,
      };
      correctedState.shots.unshift(newShot);
      if (correctedState.shots.length > MAX_SHOTS) correctedState.shots.length = MAX_SHOTS;
    }
  }

  // Update the weights accessor
  correctedState.weights = activeWeights;

  saveState(correctedState);

  return {
    points,
    bias: gatedBias,
    confidence: probability,
    probability,
    direction: gatedDirection,
    signals,
    state: correctedState,
    regime,
    confluenceCount,
  };
}

// ─── Adaptive Confluence Threshold ───────────────────────

function getAdaptiveConfluenceThreshold(state: ApexState): number {
  const evaluated = state.shots.filter(s => s.correct !== undefined);
  if (evaluated.length < 3) return MIN_CONFLUENCE; // not enough data, use base

  // Use rolling window of last 20 evaluated shots
  const recent = evaluated.slice(0, 20);
  const correctCount = recent.filter(s => s.correct).length;
  const recentAccuracy = (correctCount / recent.length) * 100;

  if (recentAccuracy >= ACCURACY_FLOOR + ACCURACY_FLOOR_MARGIN) {
    // Accuracy well above floor — relax threshold
    return MIN_CONFLUENCE;
  } else if (recentAccuracy >= ACCURACY_FLOOR) {
    // In the margin zone — slightly tighter
    return Math.min(MAX_CONFLUENCE, MIN_CONFLUENCE + 1);
  } else {
    // Below floor — progressively tighten to recover accuracy
    // The further below, the higher the threshold (more selective = fewer but better predictions)
    const deficit = ACCURACY_FLOOR - recentAccuracy;
    const extra = Math.ceil(deficit / 10); // +1 per 10% deficit
    return Math.min(MAX_CONFLUENCE, MIN_CONFLUENCE + 1 + extra);
  }
}

// ─── APEX Color System — Maximum Contrast ────────────────

function biasToApexColor(bias: number, confidence: number): string {
  const clamped = Math.max(-1, Math.min(1, bias));
  const alpha = 0.85 + confidence * 0.15;

  if (clamped > 0.1) {
    // Bullish = electric green → neon
    const intensity = Math.min(1, clamped / 0.4);
    const hue = 140 + intensity * 10;
    const sat = 80 + intensity * 20;
    const light = 50 + intensity * 12;
    return `hsla(${hue}, ${sat}%, ${light}%, ${alpha})`;
  } else if (clamped < -0.1) {
    // Bearish = vivid crimson → hot red
    const intensity = Math.min(1, Math.abs(clamped) / 0.4);
    const hue = 0 + intensity * 10;
    const sat = 85 + intensity * 15;
    const light = 48 + intensity * 12;
    return `hsla(${hue}, ${sat}%, ${light}%, ${alpha})`;
  } else {
    // Neutral = bright amber
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
  last5Accuracy: string;
  last5Detail: Array<{ correct: boolean; direction: string; error: number }>;
  weights: ApexWeights;
  weightHistory: WeightSnapshot[];
  shots: ApexShotRecord[];
  probability: number;
  direction: string;
  regime?: 'trending' | 'ranging';
}

export function getApexStats(): ApexStats {
  const state = loadState();
  const evaluated = state.shots.filter(s => s.correct !== undefined);
  const last5 = evaluated.slice(0, 5);
  const last5Correct = last5.filter(s => s.correct).length;

  return {
    generation: state.generation,
    corrections: state.corrections,
    winRate: state.winRate,
    streak: state.streak,
    totalShots: evaluated.length,
    last5Accuracy: last5.length > 0 ? `${last5Correct}/${last5.length}` : '—',
    last5Detail: last5.map(s => ({
      correct: !!s.correct,
      direction: s.predictedDirection,
      error: s.error ?? 0,
    })),
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
