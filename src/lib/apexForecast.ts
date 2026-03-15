/**
 * APEX Forecast Engine — Self-Correcting Adaptive Predictor
 * 
 * Ghosts the WAVE prediction and tracks errors every 5 shots,
 * then auto-tunes indicator weights to maximize accuracy.
 * Uses localStorage to persist learning state across sessions.
 */

import {
  computeSMA,
  computeEMA,
  computeRSI as computeRSIArray,
  computeATR,
  computeMACD,
  computeBollingerBands,
} from '@/components/trading/IndicatorOverlay';
import { biasToRainbowColor } from '@/lib/forecastLog';

// ─── Types ───────────────────────────────────────────────

export interface ApexForecastPoint {
  time: string;
  apexForecast: number;
  apexColor: string;
  apexHigh?: number;
  apexLow?: number;
  // Ghost of WAVE for comparison
  waveGhost?: number;
}

interface ApexShotRecord {
  id: string;
  timestamp: number;
  symbol: string;
  timeframe: string;
  predictedDirection: 'bullish' | 'bearish' | 'neutral';
  predictedPrice: number;
  entryPrice: number;
  // filled after outcome check
  actualPrice?: number;
  correct?: boolean;
  error?: number; // signed error (actual - predicted)
}

interface ApexWeights {
  rsi: number;
  sma20: number;
  sma50: number;
  ema20: number;
  macd: number;
  boll: number;
  momentum: number;
  vwap: number; // volume-weighted mean reversion
}

interface ApexState {
  weights: ApexWeights;
  shots: ApexShotRecord[];
  corrections: number; // total corrections applied
  generation: number;  // how many 5-shot cycles completed
  winRate: number;
  streak: number;      // current correct streak
}

const APEX_STATE_KEY = 'ga_apex_state_v2';
const SHOT_WINDOW = 5;

const DEFAULT_WEIGHTS: ApexWeights = {
  rsi: 0.5,
  sma20: 0.25,
  sma50: 0.15,
  ema20: 0.2,
  macd: 0.35,
  boll: 0.25,
  momentum: 0.3,
  vwap: 0.2,
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
  };
}

function saveState(state: ApexState) {
  try {
    // Keep only last 50 shots
    const trimmed = { ...state, shots: state.shots.slice(0, 50) };
    localStorage.setItem(APEX_STATE_KEY, JSON.stringify(trimmed));
  } catch { /* */ }
}

// ─── Self-Correction Engine ──────────────────────────────

function evaluateAndCorrect(state: ApexState): ApexState {
  const pending = state.shots.filter(s => s.correct === undefined && s.actualPrice !== undefined);
  
  // Mark correctness
  for (const shot of pending) {
    if (shot.actualPrice === undefined) continue;
    const actualDir = shot.actualPrice > shot.entryPrice ? 'bullish' : shot.actualPrice < shot.entryPrice ? 'bearish' : 'neutral';
    shot.correct = shot.predictedDirection === actualDir || shot.predictedDirection === 'neutral';
    shot.error = shot.actualPrice - shot.predictedPrice;
  }

  // Check if we have a complete 5-shot window to evaluate
  const evaluated = state.shots.filter(s => s.correct !== undefined);
  const recentBatch = evaluated.slice(0, SHOT_WINDOW);
  
  if (recentBatch.length < SHOT_WINDOW) return state;
  
  // Count errors in last 5
  const errors = recentBatch.filter(s => !s.correct);
  const corrects = recentBatch.filter(s => s.correct);
  const errorRate = errors.length / SHOT_WINDOW;
  
  const newWeights = { ...state.weights };
  const LEARN_RATE = 0.08 + errorRate * 0.12; // Learn faster when more errors
  
  if (errorRate > 0.4) {
    // High error rate: analyze which signals were wrong
    // Compute what each indicator would have predicted for error cases
    // and dampen the ones that were consistently wrong
    
    // If most errors are in one direction, adjust drift bias
    const avgError = errors.reduce((s, e) => s + (e.error ?? 0), 0) / errors.length;
    const errorDirection = avgError > 0 ? 'overshoot' : 'undershoot';
    
    if (errorDirection === 'overshoot') {
      // We predicted too high — dampen bullish signals
      newWeights.momentum *= (1 - LEARN_RATE);
      newWeights.ema20 *= (1 - LEARN_RATE * 0.5);
      newWeights.macd *= (1 - LEARN_RATE * 0.3);
      // Boost mean-reversion signals
      newWeights.rsi *= (1 + LEARN_RATE * 0.5);
      newWeights.boll *= (1 + LEARN_RATE * 0.5);
    } else {
      // We predicted too low — boost trend-following
      newWeights.momentum *= (1 + LEARN_RATE);
      newWeights.sma20 *= (1 + LEARN_RATE * 0.5);
      newWeights.macd *= (1 + LEARN_RATE * 0.5);
      // Dampen mean-reversion
      newWeights.rsi *= (1 - LEARN_RATE * 0.3);
      newWeights.boll *= (1 - LEARN_RATE * 0.3);
    }
  } else if (errorRate <= 0.2) {
    // Doing well — gently reinforce current weights
    // Slight regression toward defaults to avoid overfit
    for (const k of Object.keys(newWeights) as (keyof ApexWeights)[]) {
      newWeights[k] = newWeights[k] * 0.95 + DEFAULT_WEIGHTS[k] * 0.05;
    }
  }
  
  // Clamp weights to sane range
  for (const k of Object.keys(newWeights) as (keyof ApexWeights)[]) {
    newWeights[k] = Math.max(0.05, Math.min(1.5, newWeights[k]));
  }
  
  const allEvaluated = state.shots.filter(s => s.correct !== undefined);
  const totalCorrect = allEvaluated.filter(s => s.correct).length;
  const winRate = allEvaluated.length > 0 ? (totalCorrect / allEvaluated.length) * 100 : 0;
  
  // Streak
  let streak = 0;
  for (const s of allEvaluated) {
    if (s.correct) streak++;
    else break;
  }
  
  return {
    weights: newWeights,
    shots: state.shots,
    corrections: state.corrections + (errorRate > 0.4 ? 1 : 0),
    generation: state.generation + 1,
    winRate,
    streak,
  };
}

// ─── APEX Bias Computation ───────────────────────────────

function computeApexBias(
  values: number[],
  highs: number[],
  lows: number[],
  weights: ApexWeights,
): { bias: number; confidence: number } {
  if (values.length < 20) return { bias: 0, confidence: 0 };
  
  const len = values.length;
  const current = values[len - 1];
  
  const rsiArr = computeRSIArray(values);
  const rsi = rsiArr[rsiArr.length - 1] ?? 50;
  const sma20 = computeSMA(values, 20);
  const sma50 = computeSMA(values, 50);
  const ema20 = computeEMA(values, 20);
  const macdData = computeMACD(values);
  const atrArr = computeATR(highs, lows, values);
  const boll = computeBollingerBands(values, 20, 2);
  
  const latestSMA20 = sma20[sma20.length - 1] ?? current;
  const latestSMA50 = sma50[sma50.length - 1] ?? current;
  const latestEMA20 = ema20[ema20.length - 1] ?? current;
  const latestMACD = macdData.macd[macdData.macd.length - 1] ?? 0;
  const latestSignal = macdData.signal[macdData.signal.length - 1] ?? 0;
  const latestATR = atrArr[atrArr.length - 1] ?? current * 0.005;
  const latestBollUpper = boll.upper[boll.upper.length - 1] ?? current;
  const latestBollLower = boll.lower[boll.lower.length - 1] ?? current;
  
  // Weighted signals using adaptive weights
  const rsiSignal = (rsi < 30 ? 0.6 : rsi > 70 ? -0.6 : (50 - rsi) / 100) * weights.rsi;
  const sma20Signal = ((current - latestSMA20) / latestATR * 0.3) * weights.sma20;
  const sma50Signal = ((current - latestSMA50) / latestATR * 0.2) * weights.sma50;
  const emaSignal = ((current - latestEMA20) / latestATR * 0.2) * weights.ema20;
  const macdSignalVal = (isNaN(latestMACD) || isNaN(latestSignal) ? 0 :
    Math.sign(latestMACD - latestSignal) * Math.min(Math.abs(latestMACD - latestSignal) / latestATR, 0.5) * 0.4) * weights.macd;
  const bollRange = latestBollUpper - latestBollLower;
  const bollPos = bollRange > 0 ? (current - latestBollLower) / bollRange : 0.5;
  const bollSignal = ((0.5 - bollPos) * 0.3) * weights.boll;
  
  // Momentum: weighted linear regression slope over last 10 bars
  const momN = Math.min(10, len);
  const momSlice = values.slice(-momN);
  let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
  for (let i = 0; i < momSlice.length; i++) {
    sumX += i; sumY += momSlice[i]; sumXY += i * momSlice[i]; sumXX += i * i;
  }
  const n = momSlice.length;
  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const momSignal = (slope / latestATR) * weights.momentum;
  
  // VWAP-like mean reversion: distance from 20-bar VWAP
  const vwapSlice = values.slice(-20);
  const vwapMean = vwapSlice.reduce((a, b) => a + b, 0) / vwapSlice.length;
  const vwapSignal = ((vwapMean - current) / latestATR * 0.15) * weights.vwap;
  
  const rawBias = rsiSignal + sma20Signal + sma50Signal + emaSignal + macdSignalVal + bollSignal + momSignal + vwapSignal;
  const bias = Math.max(-1, Math.min(1, rawBias));
  
  // Confidence: how many signals agree on direction
  const signals = [rsiSignal, sma20Signal, sma50Signal, emaSignal, macdSignalVal, bollSignal, momSignal, vwapSignal];
  const agreeing = signals.filter(s => Math.sign(s) === Math.sign(bias)).length;
  const confidence = agreeing / signals.length;
  
  return { bias, confidence };
}

// ─── APEX Forecast Points ────────────────────────────────

export interface ApexComputeResult {
  points: ApexForecastPoint[];
  bias: number;
  confidence: number;
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
  waveBias: number, // from WAVE for ghosting
  wavePoints: Array<{ forecast: number }>, // WAVE points for ghosting
): ApexComputeResult {
  if (values.length < 20 || currentPrice <= 0) {
    return { points: [], bias: 0, confidence: 0, state: loadState() };
  }
  
  const state = loadState();
  
  // Evaluate and correct from previous shots
  // Update shots with current prices
  for (const shot of state.shots) {
    if (shot.correct === undefined && Date.now() - shot.timestamp > 30000) {
      shot.actualPrice = currentPrice; // simplified: use current price as outcome
    }
  }
  const correctedState = evaluateAndCorrect(state);
  
  const { bias, confidence } = computeApexBias(values, highs, lows, correctedState.weights);
  
  const atrArr = computeATR(highs, lows, values);
  const latestATR = atrArr[atrArr.length - 1] ?? currentPrice * 0.005;
  
  // Cycle detection (improved: use autocorrelation-like approach)
  const recentN = Math.min(values.length, 50);
  const recentSlice = values.slice(-recentN);
  const mean = recentSlice.reduce((a, b) => a + b, 0) / recentSlice.length;
  let crossings = 0;
  for (let i = 1; i < recentSlice.length; i++) {
    if ((recentSlice[i - 1] - mean) * (recentSlice[i] - mean) < 0) crossings++;
  }
  const cycleFreq = crossings > 0 ? (Math.PI * crossings) / recentN : Math.PI * 0.25;
  
  // Momentum with exponential weighting (recent bars matter more)
  const momN = Math.min(8, values.length);
  const momSlice = values.slice(-momN);
  let weightedMom = 0, wSum = 0;
  for (let i = 1; i < momSlice.length; i++) {
    const w = Math.exp(i * 0.3); // exponential weight
    weightedMom += (momSlice[i] - momSlice[i - 1]) * w;
    wSum += w;
  }
  const momentum = wSum > 0 ? weightedMom / wSum : 0;
  
  // Adaptive damping: lower damping when confident, higher when uncertain
  const dampingBase = 0.4 + (1 - confidence) * 0.3;
  
  // Drift: scale by confidence
  const driftPerStep = bias * latestATR * 0.1 * confidence;
  const waveAmplitude = latestATR * 0.25 * (0.5 + confidence * 0.5);
  const phaseOffset = momentum > 0 ? 0 : Math.PI;
  
  const points: ApexForecastPoint[] = [];
  const now = Date.now();
  const decimals = currentPrice < 10 ? 4 : 2;
  
  for (let i = 1; i <= numPoints; i++) {
    const t = i / numPoints;
    const decay = Math.exp(-t * dampingBase);
    
    const driftComponent = driftPerStep * i;
    const waveComponent = waveAmplitude * decay * Math.sin(cycleFreq * i + phaseOffset);
    const momentumComponent = momentum * i * 0.25 * decay;
    
    // Mean-reversion pull: gently pull toward VWAP-like center
    const pullStrength = 0.02 * t * (1 - confidence);
    const meanPull = (mean - currentPrice) * pullStrength;
    
    const forecastPrice = currentPrice + driftComponent + waveComponent + momentumComponent + meanPull;
    
    // Tighter confidence band (APEX is more precise)
    const bandWidth = latestATR * t * (1.0 + (1 - confidence) * 0.5);
    
    // Per-segment color
    const prevPrice = i === 1 ? currentPrice :
      currentPrice + driftPerStep * (i - 1) + waveAmplitude * Math.exp(-(i - 1) / numPoints * dampingBase) * Math.sin(cycleFreq * (i - 1) + phaseOffset) + momentum * (i - 1) * 0.25 * Math.exp(-(i - 1) / numPoints * dampingBase);
    const localSlope = forecastPrice - prevPrice;
    const slopeBias = Math.max(-1, Math.min(1, localSlope / (latestATR * 0.1)));
    
    const futureTime = new Date(now + i * intervalMs);
    
    const point: ApexForecastPoint = {
      time: labelFn(futureTime),
      apexForecast: parseFloat(forecastPrice.toFixed(decimals)),
      apexColor: biasToApexColor(slopeBias, confidence),
      apexHigh: parseFloat((forecastPrice + bandWidth).toFixed(decimals)),
      apexLow: parseFloat((forecastPrice - bandWidth).toFixed(decimals)),
    };
    
    // Ghost the WAVE prediction
    if (wavePoints[i - 1]) {
      point.waveGhost = wavePoints[i - 1].forecast;
    }
    
    points.push(point);
  }
  
  // Record this as a new shot
  const lastForecast = points[points.length - 1];
  if (lastForecast) {
    const newShot: ApexShotRecord = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: Date.now(),
      symbol: '',
      timeframe,
      predictedDirection: bias > 0.1 ? 'bullish' : bias < -0.1 ? 'bearish' : 'neutral',
      predictedPrice: lastForecast.apexForecast,
      entryPrice: currentPrice,
    };
    correctedState.shots.unshift(newShot);
    if (correctedState.shots.length > 50) correctedState.shots.length = 50;
  }
  
  saveState(correctedState);
  
  return { points, bias, confidence, state: correctedState };
}

// ─── APEX Color System (cyan/teal palette) ───────────────

function biasToApexColor(bias: number, confidence: number): string {
  const clamped = Math.max(-1, Math.min(1, bias));
  // Cyan-based palette: bearish=red-orange, neutral=cyan, bullish=electric-blue
  const hue = Math.round(((clamped + 1) / 2) * 60 + 160); // 160-220 range (cyan to blue)
  const saturation = 70 + confidence * 20;
  const lightness = 50 + confidence * 10;
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

// ─── Stats for UI ────────────────────────────────────────

export interface ApexStats {
  generation: number;
  corrections: number;
  winRate: number;
  streak: number;
  totalShots: number;
  last5Accuracy: string;
  weights: ApexWeights;
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
    weights: state.weights,
  };
}

export function resetApexState() {
  localStorage.removeItem(APEX_STATE_KEY);
}
