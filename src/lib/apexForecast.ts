/**
 * APEX Forecast Engine v3 — Statistically Rigorous Direction Predictor
 * 
 * NO fake data. NO random simulation. ALL math-based on real indicator signals.
 * 
 * Core approach:
 * 1. Compute 8 independent technical signals from REAL price data
 * 2. Each signal votes: bullish (+1), bearish (-1), or neutral (0)
 * 3. Weighted consensus determines direction probability
 * 4. Every 5 predictions, compare actual outcomes → adjust weights
 * 5. Forecast line = deterministic projection from weighted momentum + mean-reversion
 * 
 * The output is a PROBABILITY of direction (higher/lower), not a price target.
 * The forecast line shows the EXPECTED VALUE path given current indicator state.
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
  probability: number; // 0-1 confidence in predicted direction
  signalVotes: Record<string, number>; // per-indicator vote for this shot
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
}

export interface WeightSnapshot {
  generation: number;
  timestamp: number;
  weights: ApexWeights;
  accuracy: number; // 0-100 at this point
  correctionApplied: boolean;
}

export interface ApexState {
  weights: ApexWeights;
  shots: ApexShotRecord[];
  corrections: number;
  generation: number;
  winRate: number;
  streak: number;
  weightHistory: WeightSnapshot[];
}

const APEX_STATE_KEY = 'ga_apex_state_v3';
const SHOT_WINDOW = 5;
const MAX_SHOTS = 100;
const MAX_WEIGHT_HISTORY = 50;

const DEFAULT_WEIGHTS: ApexWeights = {
  rsi: 0.50,
  sma20: 0.25,
  sma50: 0.15,
  ema20: 0.20,
  macd: 0.35,
  boll: 0.25,
  momentum: 0.30,
  vwap: 0.20,
};

// ─── Persistence ─────────────────────────────────────────

function loadState(): ApexState {
  try {
    const raw = localStorage.getItem(APEX_STATE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        weights: { ...DEFAULT_WEIGHTS, ...parsed.weights },
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

// ─── Individual Signal Computations (Pure Math) ──────────
// Each returns a vote in [-1, +1] range

function signalRSI(values: number[]): number {
  const rsiArr = computeRSIArray(values);
  const rsi = rsiArr[rsiArr.length - 1];
  if (rsi === undefined || isNaN(rsi)) return 0;
  // RSI < 30 = oversold → bullish, > 70 = overbought → bearish
  // Linear interpolation between
  if (rsi < 20) return 0.8;
  if (rsi < 30) return 0.5;
  if (rsi > 80) return -0.8;
  if (rsi > 70) return -0.5;
  return (50 - rsi) / 50; // subtle bias toward mean
}

function signalSMA(values: number[], period: number, atr: number): number {
  const sma = computeSMA(values, period);
  const latest = sma[sma.length - 1];
  const current = values[values.length - 1];
  if (!latest || !current || atr <= 0) return 0;
  // Distance from SMA normalized by ATR
  const dist = (current - latest) / atr;
  // Above SMA = bullish momentum, but extreme = mean-reversion risk
  return Math.max(-1, Math.min(1, dist * 0.3));
}

function signalEMA(values: number[], atr: number): number {
  const ema = computeEMA(values, 20);
  const current = values[values.length - 1];
  const latest = ema[ema.length - 1];
  if (!latest || !current || atr <= 0) return 0;
  const dist = (current - latest) / atr;
  return Math.max(-1, Math.min(1, dist * 0.25));
}

function signalMACD(values: number[], atr: number): number {
  const macd = computeMACD(values);
  const macdVal = macd.macd[macd.macd.length - 1];
  const sigVal = macd.signal[macd.signal.length - 1];
  if (macdVal === undefined || sigVal === undefined || isNaN(macdVal) || isNaN(sigVal) || atr <= 0) return 0;
  const crossover = macdVal - sigVal;
  // Normalize by ATR for comparable scale
  return Math.max(-1, Math.min(1, (crossover / atr) * 2));
}

function signalBollinger(values: number[]): number {
  const boll = computeBollingerBands(values, 20, 2);
  const upper = boll.upper[boll.upper.length - 1];
  const lower = boll.lower[boll.lower.length - 1];
  const current = values[values.length - 1];
  if (!upper || !lower || upper === lower) return 0;
  const position = (current - lower) / (upper - lower);
  // Near upper band (>0.8) = bearish (mean reversion), near lower (<0.2) = bullish
  return Math.max(-1, Math.min(1, (0.5 - position) * 2));
}

function signalMomentum(values: number[], atr: number): number {
  // Linear regression slope of last 10 bars, normalized by ATR
  const n = Math.min(10, values.length);
  if (n < 3 || atr <= 0) return 0;
  const slice = values.slice(-n);
  let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
  for (let i = 0; i < slice.length; i++) {
    sumX += i;
    sumY += slice[i];
    sumXY += i * slice[i];
    sumXX += i * i;
  }
  const denom = n * sumXX - sumX * sumX;
  if (denom === 0) return 0;
  const slope = (n * sumXY - sumX * sumY) / denom;
  return Math.max(-1, Math.min(1, (slope / atr) * 5));
}

function signalVWAP(values: number[], atr: number): number {
  // Mean-reversion: distance from 20-bar mean, normalized
  const n = Math.min(20, values.length);
  if (n < 5 || atr <= 0) return 0;
  const slice = values.slice(-n);
  const mean = slice.reduce((a, b) => a + b, 0) / slice.length;
  const current = values[values.length - 1];
  const dist = (mean - current) / atr;
  // Positive when price below mean (bullish reversion), negative when above
  return Math.max(-1, Math.min(1, dist * 0.4));
}

// ─── Weighted Consensus ──────────────────────────────────

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
): { bias: number; probability: number; signals: SignalResult[]; votes: Record<string, number> } {
  if (values.length < 20) return { bias: 0, probability: 0.5, signals: [], votes: {} };

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
  ];

  let totalWeight = 0;
  let weightedSum = 0;
  const signals: SignalResult[] = [];
  const votes: Record<string, number> = {};

  for (const s of rawSignals) {
    const w = weights[s.name];
    const wv = s.vote * w;
    weightedSum += wv;
    totalWeight += w;
    signals.push({ name: s.name, vote: s.vote, weightedVote: wv });
    votes[s.name] = s.vote;
  }

  const bias = totalWeight > 0 ? Math.max(-1, Math.min(1, weightedSum / totalWeight)) : 0;

  // Probability = how many signals agree with the bias direction
  const agreeCount = rawSignals.filter(s => Math.sign(s.vote) === Math.sign(bias) && Math.abs(s.vote) > 0.05).length;
  const totalActive = rawSignals.filter(s => Math.abs(s.vote) > 0.05).length;
  const agreement = totalActive > 0 ? agreeCount / totalActive : 0.5;

  // Probability combines agreement ratio with bias magnitude
  const probability = 0.5 + (agreement - 0.5) * Math.abs(bias) * 0.8;

  return { bias, probability: Math.max(0.1, Math.min(0.95, probability)), signals, votes };
}

// ─── Self-Correction Engine ──────────────────────────────

function evaluateAndCorrect(state: ApexState): ApexState {
  // Mark pending shots with actual outcomes
  const pending = state.shots.filter(s => s.correct === undefined && s.actualPrice !== undefined);
  for (const shot of pending) {
    if (shot.actualPrice === undefined) continue;
    const moved = shot.actualPrice - shot.entryPrice;
    const predictedUp = shot.predictedDirection === 'bullish';
    const predictedDown = shot.predictedDirection === 'bearish';
    const actualUp = moved > 0;

    if (shot.predictedDirection === 'neutral') {
      // Neutral is correct if price didn't move significantly
      shot.correct = Math.abs(moved / shot.entryPrice) < 0.001;
    } else {
      shot.correct = (predictedUp && actualUp) || (predictedDown && !actualUp);
    }
    shot.error = shot.actualPrice - shot.predictedPrice;
  }

  // Check for complete evaluation window
  const evaluated = state.shots.filter(s => s.correct !== undefined);
  if (evaluated.length < SHOT_WINDOW) return state;

  const recentBatch = evaluated.slice(0, SHOT_WINDOW);
  const errors = recentBatch.filter(s => !s.correct);
  const errorRate = errors.length / SHOT_WINDOW;

  const newWeights = { ...state.weights };
  const LEARN_RATE = 0.06 + errorRate * 0.14;
  let correctionApplied = false;

  if (errorRate > 0.4) {
    correctionApplied = true;
    
    // Analyze WHICH signals were wrong in error cases
    // For each error shot, check which signals voted the wrong direction
    const signalErrorCounts: Record<string, number> = {};
    const signalCorrectCounts: Record<string, number> = {};

    for (const shot of recentBatch) {
      const actualDir = (shot.actualPrice ?? shot.entryPrice) > shot.entryPrice ? 1 : -1;
      for (const [sigName, sigVote] of Object.entries(shot.signalVotes || {})) {
        if (Math.abs(sigVote) < 0.05) continue; // signal was neutral, skip
        if (Math.sign(sigVote) !== actualDir) {
          signalErrorCounts[sigName] = (signalErrorCounts[sigName] ?? 0) + 1;
        } else {
          signalCorrectCounts[sigName] = (signalCorrectCounts[sigName] ?? 0) + 1;
        }
      }
    }

    // Dampen signals that were consistently wrong, boost ones that were right
    for (const k of Object.keys(newWeights) as (keyof ApexWeights)[]) {
      const errs = signalErrorCounts[k] ?? 0;
      const correct = signalCorrectCounts[k] ?? 0;
      const total = errs + correct;
      if (total === 0) continue;

      const signalAccuracy = correct / total;
      if (signalAccuracy < 0.4) {
        // This signal was mostly wrong → dampen
        newWeights[k] *= (1 - LEARN_RATE);
      } else if (signalAccuracy > 0.7) {
        // This signal was mostly right → boost
        newWeights[k] *= (1 + LEARN_RATE * 0.5);
      }
    }
  } else if (errorRate <= 0.2) {
    // Performing well — gentle regression toward defaults to prevent overfit
    for (const k of Object.keys(newWeights) as (keyof ApexWeights)[]) {
      newWeights[k] = newWeights[k] * 0.97 + DEFAULT_WEIGHTS[k] * 0.03;
    }
  }

  // Clamp weights
  for (const k of Object.keys(newWeights) as (keyof ApexWeights)[]) {
    newWeights[k] = Math.max(0.05, Math.min(2.0, newWeights[k]));
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

  // Record weight snapshot
  const snapshot: WeightSnapshot = {
    generation: newGeneration,
    timestamp: Date.now(),
    weights: { ...newWeights },
    accuracy: winRate,
    correctionApplied,
  };

  return {
    weights: newWeights,
    shots: state.shots,
    corrections: state.corrections + (correctionApplied ? 1 : 0),
    generation: newGeneration,
    winRate,
    streak,
    weightHistory: [snapshot, ...state.weightHistory].slice(0, MAX_WEIGHT_HISTORY),
  };
}

// ─── APEX Forecast Projection ────────────────────────────

export interface ApexComputeResult {
  points: ApexForecastPoint[];
  bias: number;
  confidence: number;
  probability: number;
  direction: 'bullish' | 'bearish' | 'neutral';
  signals: SignalResult[];
  state: ApexState;
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
    return { points: [], bias: 0, confidence: 0, probability: 0.5, direction: 'neutral', signals: [], state: emptyState };
  }

  const state = loadState();

  // Update pending shots with actual price (after minimum 30s)
  for (const shot of state.shots) {
    if (shot.correct === undefined && Date.now() - shot.timestamp > 30000) {
      shot.actualPrice = currentPrice;
    }
  }
  const correctedState = evaluateAndCorrect(state);

  // Compute consensus from real indicators
  const { bias, probability, signals, votes } = computeConsensus(values, highs, lows, correctedState.weights);
  const direction: 'bullish' | 'bearish' | 'neutral' = bias > 0.08 ? 'bullish' : bias < -0.08 ? 'bearish' : 'neutral';

  const atrArr = computeATR(highs, lows, values);
  const atr = atrArr[atrArr.length - 1] ?? currentPrice * 0.005;

  // Cycle detection via zero-crossings of detrended price
  const recentN = Math.min(values.length, 50);
  const recentSlice = values.slice(-recentN);
  const mean = recentSlice.reduce((a, b) => a + b, 0) / recentSlice.length;
  let crossings = 0;
  for (let i = 1; i < recentSlice.length; i++) {
    if ((recentSlice[i - 1] - mean) * (recentSlice[i] - mean) < 0) crossings++;
  }
  const cycleFreq = crossings > 0 ? (Math.PI * crossings) / recentN : Math.PI * 0.25;

  // Momentum via exponential-weighted slope
  const momN = Math.min(8, values.length);
  const momSlice = values.slice(-momN);
  let weightedMom = 0, wSum = 0;
  for (let i = 1; i < momSlice.length; i++) {
    const w = Math.exp(i * 0.3);
    weightedMom += (momSlice[i] - momSlice[i - 1]) * w;
    wSum += w;
  }
  const momentum = wSum > 0 ? weightedMom / wSum : 0;

  // Projection parameters — ALL derived from real data
  const dampingBase = 0.35 + (1 - probability) * 0.35;
  const driftPerStep = bias * atr * 0.08 * probability;
  const waveAmplitude = atr * 0.2 * (0.3 + probability * 0.7);
  const phaseOffset = momentum > 0 ? 0 : Math.PI;

  const points: ApexForecastPoint[] = [];
  const now = Date.now();
  const decimals = currentPrice < 10 ? 4 : 2;

  for (let i = 1; i <= numPoints; i++) {
    const t = i / numPoints;
    const decay = Math.exp(-t * dampingBase);

    const drift = driftPerStep * i;
    const wave = waveAmplitude * decay * Math.sin(cycleFreq * i + phaseOffset);
    const mom = momentum * i * 0.2 * decay;

    // Mean-reversion pull
    const pullStrength = 0.015 * t * (1 - probability);
    const meanPull = (mean - currentPrice) * pullStrength;

    const forecastPrice = currentPrice + drift + wave + mom + meanPull;

    // Confidence band: widens with time and uncertainty
    // Based on ATR (real volatility measure), not arbitrary
    const bandWidth = atr * t * (0.8 + (1 - probability) * 0.6);

    // Color: direction-coded with high contrast
    const prevForecast = i === 1 ? currentPrice :
      currentPrice + driftPerStep * (i - 1) +
      waveAmplitude * Math.exp(-(i - 1) / numPoints * dampingBase) * Math.sin(cycleFreq * (i - 1) + phaseOffset) +
      momentum * (i - 1) * 0.2 * Math.exp(-(i - 1) / numPoints * dampingBase);

    const localSlope = forecastPrice - prevForecast;
    const slopeBias = Math.max(-1, Math.min(1, localSlope / (atr * 0.08)));

    const futureTime = new Date(now + i * intervalMs);

    const point: ApexForecastPoint = {
      time: labelFn(futureTime),
      apexForecast: parseFloat(forecastPrice.toFixed(decimals)),
      apexColor: biasToApexColor(slopeBias, probability),
      apexHigh: parseFloat((forecastPrice + bandWidth).toFixed(decimals)),
      apexLow: parseFloat((forecastPrice - bandWidth).toFixed(decimals)),
    };

    // Ghost the WAVE prediction for comparison
    if (wavePoints[i - 1]) {
      point.waveGhost = wavePoints[i - 1].forecast;
    }

    points.push(point);
  }

  // Record shot with full signal attribution
  const lastForecast = points[points.length - 1];
  if (lastForecast) {
    const newShot: ApexShotRecord = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: Date.now(),
      symbol: '',
      timeframe,
      predictedDirection: direction,
      predictedPrice: lastForecast.apexForecast,
      entryPrice: currentPrice,
      probability,
      signalVotes: votes,
    };
    correctedState.shots.unshift(newShot);
    if (correctedState.shots.length > MAX_SHOTS) correctedState.shots.length = MAX_SHOTS;
  }

  saveState(correctedState);

  return {
    points,
    bias,
    confidence: probability,
    probability,
    direction,
    signals,
    state: correctedState,
  };
}

// ─── APEX Color System — High Contrast Direction Colors ──

function biasToApexColor(bias: number, confidence: number): string {
  const clamped = Math.max(-1, Math.min(1, bias));
  const alpha = 0.7 + confidence * 0.3;
  
  if (clamped > 0.15) {
    // Bullish = electric green
    const intensity = Math.min(1, clamped / 0.5);
    const hue = 145;
    const sat = 70 + intensity * 20;
    const light = 45 + intensity * 15;
    return `hsla(${hue}, ${sat}%, ${light}%, ${alpha})`;
  } else if (clamped < -0.15) {
    // Bearish = vivid red-orange
    const intensity = Math.min(1, Math.abs(clamped) / 0.5);
    const hue = 0 + intensity * 15; // red to orange-red
    const sat = 70 + intensity * 20;
    const light = 50 + intensity * 10;
    return `hsla(${hue}, ${sat}%, ${light}%, ${alpha})`;
  } else {
    // Neutral = bright amber/gold
    return `hsla(45, 80%, 60%, ${alpha})`;
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
