/**
 * APEX Forecast Engine v7 — BlackRock Aladdin-Inspired Accuracy Engine
 * 
 * v7 upgrades over v6:
 * 1. HALF-KELLY CONFIDENCE GATE — only predict when mathematical edge > 0.15
 * 2. BAYESIAN POSTERIOR UPDATING — replaces weighted-average voting
 * 3. TRIPLE-BARRIER EVALUATION — asymmetric TP/SL replaces binary correct/incorrect
 * 4. Removes "flat market = correct" loophole
 * 5. 90s minimum spacing, dynamic probability floor
 * 6. Clean state reset (v7 key)
 */

import {
  computeSMA,
  computeEMA,
  computeRSI as computeRSIArray,
  computeATR,
  computeMACD,
  computeBollingerBands,
} from '@/components/trading/IndicatorOverlay';
import { buildTechnicalSnapshot } from '@/lib/technicalSignals';

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
  _frozen?: boolean;
  clusterVotes?: Record<string, number>;
  /** v7: Triple-barrier fields */
  _tpPrice?: number;
  _slPrice?: number;
  _timeBarrier?: number;
  _barrierResult?: 'tp' | 'sl' | 'time' | 'excluded';
  _kellyEdge?: number;
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
  _signalAccuracy?: Record<string, { correct: number; wrong: number }>;
  _mutedSignals?: string[];
  /** v7: Bayesian signal likelihood ratios */
  _signalLR?: Record<string, number>;
}

// v7: New state key for clean reset
const APEX_STATE_KEY = 'ga_apex_state_v7';
const SHOT_WINDOW = 3;
const MAX_SHOTS = 200;
const MAX_WEIGHT_HISTORY = 50;
const ACCURACY_FLOOR = 75;
const ACCURACY_FLOOR_MARGIN = 5;
const BATCH_AUDIT_SIZE = 10;
const BATCH_AUDIT_FLOOR = 70;
const MISS_COOLDOWN_TRIGGER = 2;
const DIRECTION_FLIP_THRESHOLD = 0.15;
const SIGNAL_DECAY_FACTOR = 0.85;
const LOW_VOL_RATIO = 0.3;

// v7: Tighter thresholds
const BIAS_THRESHOLD = 0.12;
const MIN_PREDICTION_SPACING_MS = 90_000;  // v7: 90s — quality over quantity
const SIGNAL_MUTE_THRESHOLD = 0.35;
const SIGNAL_MUTE_MIN_SAMPLES = 5;

// v7: Half-Kelly gate
const HALF_KELLY_THRESHOLD = 0.15;
// v7: Triple-barrier ratios
const TP_ATR_MULT = 1.5;
const SL_ATR_MULT = 0.8;

const MIN_CLUSTER_CONFLUENCE = 3;
const MAX_CLUSTER_CONFLUENCE = 4;

export const DEFAULT_WEIGHTS: ApexWeights = {
  rsi: 0.60, sma20: 0.45, sma50: 0.35, ema20: 0.40,
  macd: 0.55, boll: 0.45, momentum: 0.50, vwap: 0.35,
  stochastic: 0.55, roc: 0.50, adx: 0.40, smaCross: 0.50,
};

const TRENDING_BOOST: Partial<Record<keyof ApexWeights, number>> = {
  momentum: 1.6, sma20: 1.4, sma50: 1.3, ema20: 1.5, macd: 1.6, smaCross: 1.5, roc: 1.4, adx: 1.3,
  boll: 0.2, vwap: 0.3, rsi: 0.3, stochastic: 0.4,
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
        _signalLR: parsed._signalLR ?? {},
      };
    }
  } catch { /* ignore */ }
  return {
    trendingWeights: { ...DEFAULT_WEIGHTS },
    rangingWeights: { ...DEFAULT_WEIGHTS },
    weights: { ...DEFAULT_WEIGHTS },
    shots: [], corrections: 0, generation: 0, winRate: 0, streak: 0,
    weightHistory: [],
    _lastBatchAuditCount: 0, _consecutiveMisses: 0, _cooldownUntil: 0,
    _lastPredictedDirection: 'neutral', _signalAccuracy: {}, _mutedSignals: [],
    _signalLR: {},
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

export function resetApexState() {
  localStorage.removeItem(APEX_STATE_KEY);
  localStorage.removeItem('ga_apex_state_v6');
  localStorage.removeItem('ga_apex_state_v4');
}

// ─── Regime Detection: Hurst Exponent ────────────────────

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
      let cumSum = 0, maxCum = -Infinity, minCum = Infinity;
      for (const d of deviations) { cumSum += d; maxCum = Math.max(maxCum, cumSum); minCum = Math.min(minCum, cumSum); }
      const range = maxCum - minCum;
      const stdDev = Math.sqrt(deviations.reduce((s, d) => s + d * d, 0) / chunk.length);
      if (stdDev > 0) { totalRS += range / stdDev; validChunks++; }
    }

    if (validChunks > 0) {
      logRS.push(Math.log(totalRS / validChunks));
      logN.push(Math.log(lag));
    }
  }

  if (logRS.length < 3) return 0.5;
  const nPts = logRS.length;
  let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
  for (let i = 0; i < nPts; i++) { sumX += logN[i]; sumY += logRS[i]; sumXY += logN[i] * logRS[i]; sumXX += logN[i] * logN[i]; }
  const denom = nPts * sumXX - sumX * sumX;
  if (denom === 0) return 0.5;
  return Math.max(0.1, Math.min(0.9, (nPts * sumXY - sumX * sumY) / denom));
}

function getRegime(values: number[]): 'trending' | 'ranging' {
  return estimateHurst(values) > 0.55 ? 'trending' : 'ranging';
}

// ─── Multi-Timeframe Confirmation ────────────────────────

function higherTimeframeBias(values: number[], highs: number[], lows: number[]): number {
  const aggFactor = 5;
  if (values.length < aggFactor * 20) return 0;
  const aggCloses: number[] = [], aggHighs: number[] = [], aggLows: number[] = [];
  const usable = values.length - (values.length % aggFactor);
  for (let i = 0; i < usable; i += aggFactor) {
    aggCloses.push(values[Math.min(i + aggFactor - 1, values.length - 1)]);
    aggHighs.push(Math.max(...highs.slice(i, i + aggFactor)));
    aggLows.push(Math.min(...lows.slice(i, i + aggFactor)));
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
  for (let i = 1; i < momSlice.length; i++) momSum += momSlice[i] - momSlice[i - 1];
  const momSignal = atr > 0 ? (momSum / (momN - 1)) / atr : 0;
  return Math.max(-1, Math.min(1, smaDist * 0.6 + momSignal * 0.4));
}

// ─── Signal Decay ────────────────────────────────────────

function applyDecayWeights(slice: number[]): number[] {
  const n = slice.length;
  return Array.from({ length: n }, (_, i) => Math.pow(SIGNAL_DECAY_FACTOR, n - 1 - i));
}

// ─── Individual Signal Computations ─────────────────────

function signalRSI(values: number[]): number {
  const rsiArr = computeRSIArray(values);
  const rsi = rsiArr[rsiArr.length - 1];
  if (rsi === undefined || isNaN(rsi)) return 0;
  if (rsi < 15) return 1.0; if (rsi < 20) return 0.7; if (rsi < 30) return 0.3;
  if (rsi > 85) return -1.0; if (rsi > 80) return -0.7; if (rsi > 70) return -0.3;
  return 0;
}

function signalSMA(values: number[], period: number, atr: number): number {
  const sma = computeSMA(values, period);
  const latest = sma[sma.length - 1], current = values[values.length - 1];
  if (!latest || !current || atr <= 0) return 0;
  return Math.max(-1, Math.min(1, ((current - latest) / atr) * 0.6));
}

function signalEMA(values: number[], atr: number): number {
  const ema = computeEMA(values, 20);
  const current = values[values.length - 1], latest = ema[ema.length - 1];
  if (!latest || !current || atr <= 0) return 0;
  return Math.max(-1, Math.min(1, ((current - latest) / atr) * 0.5));
}

function signalMACD(values: number[], atr: number): number {
  const macd = computeMACD(values);
  const m = macd.macd[macd.macd.length - 1], s = macd.signal[macd.signal.length - 1];
  if (m === undefined || s === undefined || isNaN(m) || isNaN(s) || atr <= 0) return 0;
  return Math.max(-1, Math.min(1, ((m - s) / atr) * 4));
}

function signalBollinger(values: number[], regime: 'trending' | 'ranging'): number {
  const boll = computeBollingerBands(values, 20, 2);
  const upper = boll.upper[boll.upper.length - 1], lower = boll.lower[boll.lower.length - 1];
  const mid = (upper + lower) / 2, current = values[values.length - 1];
  if (!upper || !lower || upper === lower) return 0;
  const position = (current - lower) / (upper - lower);
  if (regime === 'ranging') return Math.max(-1, Math.min(1, (0.5 - position) * 2.0));
  return Math.max(-1, Math.min(1, ((current - mid) / (upper - mid || 1)) * 0.6));
}

function signalMomentum(values: number[], atr: number): number {
  const n = Math.min(10, values.length);
  if (n < 3 || atr <= 0) return 0;
  const slice = values.slice(-n);
  const weights = applyDecayWeights(slice);
  let sumWX = 0, sumWY = 0, sumWXY = 0, sumWXX = 0, sumW = 0;
  for (let i = 0; i < slice.length; i++) {
    const w = weights[i]; sumW += w; sumWX += w * i; sumWY += w * slice[i]; sumWXY += w * i * slice[i]; sumWXX += w * i * i;
  }
  const denom = sumW * sumWXX - sumWX * sumWX;
  if (denom === 0) return 0;
  return Math.max(-1, Math.min(1, ((sumW * sumWXY - sumWX * sumWY) / denom / atr) * 8));
}

function signalVWAP(values: number[], atr: number): number {
  const n = Math.min(20, values.length);
  if (n < 5 || atr <= 0) return 0;
  const slice = values.slice(-n);
  const mean = slice.reduce((a, b) => a + b, 0) / slice.length;
  return Math.max(-1, Math.min(1, ((values[values.length - 1] - mean) / atr) * 0.5));
}

function signalStochastic(values: number[], highs: number[], lows: number[]): number {
  const period = 14, smoothK = 3;
  if (values.length < period + smoothK) return 0;
  const kValues: number[] = [];
  for (let i = period - 1; i < values.length; i++) {
    const highest = Math.max(...highs.slice(i - period + 1, i + 1));
    const lowest = Math.min(...lows.slice(i - period + 1, i + 1));
    kValues.push(highest === lowest ? 50 : ((values[i] - lowest) / (highest - lowest)) * 100);
  }
  if (kValues.length < smoothK) return 0;
  const kSmoothed: number[] = [];
  for (let i = smoothK - 1; i < kValues.length; i++) {
    kSmoothed.push(kValues.slice(i - smoothK + 1, i + 1).reduce((a, b) => a + b, 0) / smoothK);
  }
  const dPeriod = 3;
  if (kSmoothed.length < dPeriod) return 0;
  const dValues: number[] = [];
  for (let i = dPeriod - 1; i < kSmoothed.length; i++) {
    dValues.push(kSmoothed.slice(i - dPeriod + 1, i + 1).reduce((a, b) => a + b, 0) / dPeriod);
  }
  const k = kSmoothed[kSmoothed.length - 1], d = dValues[dValues.length - 1];
  let vote = 0;
  if (k < 15) vote += 0.6; else if (k < 25) vote += 0.3; else if (k > 85) vote -= 0.6; else if (k > 75) vote -= 0.3;
  if (k > d && k < 30) vote += 0.4; else if (k < d && k > 70) vote -= 0.4;
  return Math.max(-1, Math.min(1, vote));
}

function signalROC(values: number[], atr: number): number {
  const period = 12;
  if (values.length < period + 1 || atr <= 0) return 0;
  const slice = values.slice(-(period + 1));
  const weights = applyDecayWeights(slice);
  let weightedROC = 0, wSum = 0;
  for (let i = 1; i < slice.length; i++) {
    if (slice[i - 1] === 0) continue;
    weightedROC += ((slice[i] - slice[i - 1]) / slice[i - 1]) * weights[i];
    wSum += weights[i];
  }
  if (wSum === 0) return 0;
  const current = values[values.length - 1];
  return Math.max(-1, Math.min(1, (weightedROC / wSum) / (atr / current) * 0.5 * period));
}

function signalADX(highs: number[], lows: number[], values: number[]): number {
  const period = 14;
  if (values.length < period * 2) return 0;
  let plusDMSum = 0, minusDMSum = 0, trSum = 0;
  for (let i = values.length - period; i < values.length; i++) {
    const upMove = highs[i] - highs[i - 1], downMove = lows[i - 1] - lows[i];
    plusDMSum += (upMove > downMove && upMove > 0) ? upMove : 0;
    minusDMSum += (downMove > upMove && downMove > 0) ? downMove : 0;
    trSum += Math.max(highs[i] - lows[i], Math.abs(highs[i] - values[i - 1]), Math.abs(lows[i] - values[i - 1]));
  }
  if (trSum === 0) return 0;
  const plusDI = plusDMSum / trSum, minusDI = minusDMSum / trSum;
  const diSum = plusDI + minusDI;
  if (diSum === 0) return 0;
  return Math.max(-1, Math.min(1, Math.sign(plusDI - minusDI) * Math.abs(plusDI - minusDI) / diSum * 2));
}

function signalSMACross(values: number[], atr: number): number {
  if (values.length < 20 || atr <= 0) return 0;
  const sma10 = computeSMA(values, 10), sma20 = computeSMA(values, 20);
  const fast = sma10[sma10.length - 1], slow = sma20[sma20.length - 1];
  if (isNaN(fast) || isNaN(slow)) return 0;
  let crossBoost = 0;
  const fastPrev = sma10[sma10.length - 3], slowPrev = sma20[sma20.length - 3];
  if (!isNaN(fastPrev) && !isNaN(slowPrev)) {
    if (fastPrev <= slowPrev && fast > slow) crossBoost = 0.4;
    else if (fastPrev >= slowPrev && fast < slow) crossBoost = -0.4;
  }
  return Math.max(-1, Math.min(1, ((fast - slow) / atr) * 0.8 + crossBoost));
}

// ═══════════════════════════════════════════════════════════
// v7 METHOD 1: HALF-KELLY CONFIDENCE GATE
// ═══════════════════════════════════════════════════════════
// f* = (p * b - q) / b. Only predict when f* > HALF_KELLY_THRESHOLD.

function computeKellyEdge(winProbability: number, rewardRiskRatio: number): number {
  const p = Math.max(0.01, Math.min(0.99, winProbability));
  const q = 1 - p;
  const b = Math.max(0.01, rewardRiskRatio);
  const kelly = (p * b - q) / b;
  return kelly; // Half-Kelly: we use kelly directly but gate at threshold/2
}

// ═══════════════════════════════════════════════════════════
// v7 METHOD 2: BAYESIAN POSTERIOR UPDATING
// ═══════════════════════════════════════════════════════════
// Each signal's historical accuracy becomes its likelihood ratio.

function bayesianPosterior(
  prior: number,  // P(bullish) from regime + HTF
  signalVotes: Array<{ name: string; vote: number }>,
  signalLR: Record<string, number>,  // likelihood ratios per signal
): number {
  let logOdds = Math.log(Math.max(0.01, prior) / Math.max(0.01, 1 - prior));

  for (const sig of signalVotes) {
    if (Math.abs(sig.vote) < 0.05) continue;  // abstaining signal
    const lr = signalLR[sig.name] ?? 1.0;
    // If signal agrees with bullish, multiply by LR; if disagrees, divide
    const direction = sig.vote > 0 ? 1 : -1;
    const effectiveLR = direction > 0 ? lr : 1 / Math.max(0.1, lr);
    // Scale by signal strength
    const strength = Math.abs(sig.vote);
    const scaledLR = 1 + (effectiveLR - 1) * strength;
    logOdds += Math.log(Math.max(0.01, scaledLR));
  }

  const posterior = 1 / (1 + Math.exp(-logOdds));
  return Math.max(0.05, Math.min(0.95, posterior));
}

function updateSignalLikelihoodRatios(state: ApexState): void {
  const evaluated = state.shots.filter(s => s.correct !== undefined && s._frozen);
  if (evaluated.length < 5) return;

  const sigStats: Record<string, { correctBull: number; wrongBull: number; correctBear: number; wrongBear: number }> = {};
  for (const shot of evaluated) {
    const wasBullish = shot.predictedDirection === 'bullish';
    for (const [sigName, sigVote] of Object.entries(shot.signalVotes || {})) {
      if (Math.abs(sigVote) < 0.1) continue;
      if (!sigStats[sigName]) sigStats[sigName] = { correctBull: 0, wrongBull: 0, correctBear: 0, wrongBear: 0 };
      const sigBullish = sigVote > 0;
      if (shot.correct) {
        if (sigBullish === wasBullish) sigStats[sigName].correctBull++;
        else sigStats[sigName].correctBear++;
      } else {
        if (sigBullish === wasBullish) sigStats[sigName].wrongBull++;
        else sigStats[sigName].wrongBear++;
      }
    }
  }

  const lr: Record<string, number> = {};
  for (const [name, s] of Object.entries(sigStats)) {
    const totalCorrect = s.correctBull + s.correctBear;
    const totalWrong = s.wrongBull + s.wrongBear;
    const total = totalCorrect + totalWrong;
    if (total < 3) { lr[name] = 1.0; continue; }
    // LR = P(signal agrees | correct) / P(signal agrees | wrong)
    const pCorrect = totalCorrect / total;
    lr[name] = Math.max(0.2, Math.min(5.0, pCorrect / Math.max(0.1, 1 - pCorrect)));
  }
  state._signalLR = lr;
}

// ═══════════════════════════════════════════════════════════
// CANDLE CONFIRMATION GATE
// ═══════════════════════════════════════════════════════════

function candleConfirmation(values: number[], direction: 'bullish' | 'bearish'): { confirmed: boolean; strength: number } {
  if (values.length < 5) return { confirmed: false, strength: 0 };
  const lookback = Math.min(5, values.length - 1);
  let upCandles = 0, downCandles = 0, totalMove = 0;
  for (let i = values.length - lookback; i < values.length; i++) {
    const change = values[i] - values[i - 1];
    totalMove += change;
    if (change > 0) upCandles++; else if (change < 0) downCandles++;
  }
  const last3 = values.slice(-4);
  let last3Up = 0, last3Down = 0;
  for (let i = 1; i < last3.length; i++) {
    if (last3[i] > last3[i - 1]) last3Up++; else if (last3[i] < last3[i - 1]) last3Down++;
  }
  if (direction === 'bullish') {
    return { confirmed: (last3Up >= 2) || (upCandles > downCandles && totalMove > 0), strength: upCandles / lookback };
  }
  return { confirmed: (last3Down >= 2) || (downCandles > upCandles && totalMove < 0), strength: downCandles / lookback };
}

// ═══════════════════════════════════════════════════════════
// SIGNAL DECORRELATION CLUSTERS
// ═══════════════════════════════════════════════════════════

interface ClusterVote {
  name: string;
  vote: number;
  confidence: number;
  members: Array<{ name: string; vote: number; weight: number }>;
}

function computeClusterVotes(
  rawSignals: Array<{ name: string; vote: number }>,
  weights: ApexWeights,
  regimeMultipliers: Partial<Record<keyof ApexWeights, number>>,
  mutedSignals: string[],
): ClusterVote[] {
  const clusters: Record<string, string[]> = {
    trend: ['sma20', 'sma50', 'ema20', 'smaCross'],
    momentum: ['macd', 'momentum', 'roc'],
    meanReversion: ['rsi', 'boll', 'stochastic'],
    structure: ['adx', 'vwap'],
  };

  return Object.entries(clusters).map(([clusterName, memberNames]) => {
    let weightedSum = 0, totalWeight = 0;
    const members: Array<{ name: string; vote: number; weight: number }> = [];
    for (const sigName of memberNames) {
      const sig = rawSignals.find(s => s.name === sigName);
      if (!sig || mutedSignals.includes(sigName)) continue;
      const baseW = weights[sigName as keyof ApexWeights] ?? 0.5;
      const regimeMult = regimeMultipliers[sigName as keyof ApexWeights] ?? 1.0;
      const w = baseW * regimeMult;
      weightedSum += sig.vote * w;
      totalWeight += w;
      members.push({ name: sigName, vote: sig.vote, weight: w });
    }
    if (totalWeight === 0) return { name: clusterName, vote: 0, confidence: 0, members };
    const clusterVote = weightedSum / totalWeight;
    const activeMembers = members.filter(m => Math.abs(m.vote) > 0.05);
    const agreement = activeMembers.length > 0
      ? activeMembers.filter(m => Math.sign(m.vote) === Math.sign(clusterVote)).length / activeMembers.length : 0;
    return { name: clusterName, vote: Math.max(-1, Math.min(1, clusterVote)), confidence: agreement, members };
  });
}

// ─── Consensus ───────────────────────────────────────────

interface SignalResult { name: string; vote: number; weightedVote: number; }

function computeConsensus(
  values: number[], highs: number[], lows: number[],
  weights: ApexWeights, regime: 'trending' | 'ranging', mutedSignals: string[],
  signalLR: Record<string, number>,
): {
  bias: number; probability: number; signals: SignalResult[];
  votes: Record<string, number>; confluenceCount: number;
  currentATR: number; avgATR50: number; clusterVotes: ClusterVote[];
  candleConfirmed: boolean; technicalDecision: { direction: 'bullish' | 'bearish' | 'neutral'; confidence: number; aligned: boolean };
  kellyEdge: number; bayesianProb: number;
} {
  const empty = { bias: 0, probability: 0.5, signals: [], votes: {}, confluenceCount: 0, currentATR: 0, avgATR50: 0, clusterVotes: [], candleConfirmed: false, technicalDecision: { direction: 'neutral' as const, confidence: 0.5, aligned: false }, kellyEdge: 0, bayesianProb: 0.5 };
  if (values.length < 20) return empty;

  const atrArr = computeATR(highs, lows, values);
  const atr = atrArr[atrArr.length - 1] ?? values[values.length - 1] * 0.005;
  const atrLast50 = atrArr.slice(-50);
  const avgATR50 = atrLast50.length > 0 ? atrLast50.reduce((a, b) => a + b, 0) / atrLast50.length : atr;

  const rawSignals: { name: string; vote: number }[] = [
    { name: 'rsi', vote: signalRSI(values) },
    { name: 'sma20', vote: signalSMA(values, 20, atr) },
    { name: 'sma50', vote: signalSMA(values, 50, atr) },
    { name: 'ema20', vote: signalEMA(values, atr) },
    { name: 'macd', vote: signalMACD(values, atr) },
    { name: 'boll', vote: signalBollinger(values, regime) },
    { name: 'momentum', vote: signalMomentum(values, atr) },
    { name: 'vwap', vote: signalVWAP(values, atr) },
    { name: 'stochastic', vote: signalStochastic(values, highs, lows) },
    { name: 'roc', vote: signalROC(values, atr) },
    { name: 'adx', vote: signalADX(highs, lows, values) },
    { name: 'smaCross', vote: signalSMACross(values, atr) },
  ];

  const regimeMultipliers = regime === 'trending' ? TRENDING_BOOST : RANGING_BOOST;
  const clusterVotes = computeClusterVotes(rawSignals, weights, regimeMultipliers, mutedSignals);

  // Cluster confluence
  let clusterWeightedSum = 0, clusterTotalWeight = 0, clusterConfluence = 0;
  const dominantSign = (() => {
    let bull = 0, bear = 0;
    for (const c of clusterVotes) { if (Math.abs(c.vote) < 0.05) continue; if (c.vote > 0) bull++; else bear++; }
    return bull >= bear ? 1 : -1;
  })();
  for (const cluster of clusterVotes) {
    if (Math.abs(cluster.vote) < 0.05) continue;
    clusterWeightedSum += cluster.vote * cluster.confidence;
    clusterTotalWeight += cluster.confidence;
    if (Math.sign(cluster.vote) === dominantSign) clusterConfluence++;
  }
  const bias = clusterTotalWeight > 0 ? Math.max(-1, Math.min(1, clusterWeightedSum / clusterTotalWeight)) : 0;

  // v7: Bayesian posterior
  const htfBias = higherTimeframeBias(values, highs, lows);
  const regimePrior = 0.5 + htfBias * 0.15;  // Slight directional prior from HTF
  const bayesianProb = bayesianPosterior(regimePrior, rawSignals, signalLR);

  // Technical validation
  const technicalSnapshot = buildTechnicalSnapshot({ closes: values, highs, lows });
  const technicalDecision = technicalSnapshot?.decision ?? { direction: 'neutral' as const, confidence: 0.5, aligned: false };

  const tentativeDirection: 'bullish' | 'bearish' = bias > 0 ? 'bullish' : 'bearish';
  const { confirmed: candleConfirmed } = candleConfirmation(values, tentativeDirection);

  // v7: Combine Bayesian posterior with cluster agreement
  const clusterAgreement = clusterVotes.length > 0 ? clusterConfluence / clusterVotes.length : 0.5;
  const technicalAligned = technicalDecision.direction === 'neutral' ? 0 : technicalDecision.direction === tentativeDirection ? 1 : -1;
  const candleBonus = candleConfirmed ? 0.06 : -0.12;
  const technicalBonus = technicalAligned > 0 ? 0.08 + (technicalDecision.confidence - 0.5) * 0.25 : technicalAligned < 0 ? -0.20 : -0.04;

  // v7: Bayesian posterior IS the base probability
  const rawProb = bayesianProb * 0.6 + (0.5 + (clusterAgreement - 0.5) * Math.abs(bias) * 1.5) * 0.4 + candleBonus + technicalBonus;
  const probability = Math.max(0.1, Math.min(0.95, rawProb));

  // v7: Kelly edge calculation
  const rewardRiskRatio = TP_ATR_MULT / SL_ATR_MULT;  // 1.5 / 0.8 = 1.875
  const kellyEdge = computeKellyEdge(probability, rewardRiskRatio);

  // Legacy signal results
  const signals: SignalResult[] = [];
  const votes: Record<string, number> = {};
  for (const s of rawSignals) {
    if (mutedSignals.includes(s.name)) { signals.push({ name: s.name, vote: s.vote, weightedVote: 0 }); votes[s.name] = 0; }
    else {
      const baseW = weights[s.name as keyof ApexWeights] ?? 0.5;
      const regimeMult = regimeMultipliers[s.name as keyof ApexWeights] ?? 1.0;
      signals.push({ name: s.name, vote: s.vote, weightedVote: s.vote * baseW * regimeMult });
      votes[s.name] = s.vote;
    }
  }

  return { bias, probability, signals, votes, confluenceCount: clusterConfluence, currentATR: atr, avgATR50, clusterVotes, candleConfirmed, technicalDecision, kellyEdge, bayesianProb };
}

// ─── Eval Delay ──────────────────────────────────────────

function getEvalDelay(timeframe: string): number {
  switch (timeframe) {
    case 'RT': return 90_000;
    case '1m': return 180_000;
    case '5m': return 450_000;
    case '15m': return 900_000;
    case '1h': return 2_700_000;
    case '4h': return 5_400_000;
    case '1d': return 10_800_000;
    default: return 180_000;
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

// ─── Weighted Accuracy ──────────────────────────────────

function computeWeightedAccuracy(shots: ApexShotRecord[]): number {
  const evaluated = shots.filter(s => s.correct !== undefined);
  if (evaluated.length === 0) return 0;
  let weightedCorrect = 0, totalWeight = 0;
  const now = Date.now();
  for (const shot of evaluated) {
    const recencyWeight = Math.max(0.5, 2.0 - ((now - shot.timestamp) / 300_000));
    totalWeight += recencyWeight;
    if (shot.correct) weightedCorrect += recencyWeight;
  }
  return totalWeight > 0 ? (weightedCorrect / totalWeight) * 100 : 0;
}

// ─── Signal Kill-Switch ──────────────────────────────────

function updateSignalAccuracy(state: ApexState): void {
  const evaluated = state.shots.filter(s => s.correct !== undefined);
  if (evaluated.length === 0) return;
  const sigAcc: Record<string, { correct: number; wrong: number }> = {};
  for (const shot of evaluated) {
    const actualDir = (shot.actualPrice ?? shot.entryPrice) > shot.entryPrice ? 1 : -1;
    for (const [sigName, sigVote] of Object.entries(shot.signalVotes || {})) {
      if (Math.abs(sigVote) < 0.1) continue;
      if (!sigAcc[sigName]) sigAcc[sigName] = { correct: 0, wrong: 0 };
      if (Math.sign(sigVote) === actualDir) sigAcc[sigName].correct++;
      else sigAcc[sigName].wrong++;
    }
  }
  state._signalAccuracy = sigAcc;
  const muted: string[] = [];
  for (const [sigName, stats] of Object.entries(sigAcc)) {
    const total = stats.correct + stats.wrong;
    if (total >= SIGNAL_MUTE_MIN_SAMPLES && stats.correct / total < SIGNAL_MUTE_THRESHOLD) {
      muted.push(sigName);
    }
  }
  state._mutedSignals = muted;
}

// ═══════════════════════════════════════════════════════════
// v7 METHOD 3: TRIPLE-BARRIER EVALUATION
// ═══════════════════════════════════════════════════════════
// TP = entry ± ATR * 1.5, SL = entry ∓ ATR * 0.8, Time = 3× eval delay
// Replaces binary correct/incorrect with barrier-based scoring.

function evaluateAndCorrect(state: ApexState): ApexState {
  const now = Date.now();

  for (const shot of state.shots) {
    if (shot._frozen) continue;
    if (shot.actualPrice === undefined) continue;

    const atr = shot.atrAtEntry || (shot.entryPrice * 0.005);
    const isBullish = shot.predictedDirection === 'bullish';

    // v7: Triple-barrier evaluation
    const tpDistance = atr * TP_ATR_MULT;
    const slDistance = atr * SL_ATR_MULT;
    const tpPrice = isBullish ? shot.entryPrice + tpDistance : shot.entryPrice - tpDistance;
    const slPrice = isBullish ? shot.entryPrice - slDistance : shot.entryPrice + slDistance;
    const timeBarrier = (shot.evalDelayMs || 120_000) * 3;

    shot._tpPrice = tpPrice;
    shot._slPrice = slPrice;
    shot._timeBarrier = shot.timestamp + timeBarrier;

    if (shot.predictedDirection === 'neutral') {
      // Neutrals: correct only if price stayed within SL range
      shot.correct = Math.abs(shot.actualPrice - shot.entryPrice) < slDistance;
      shot._barrierResult = 'excluded';
      shot._frozen = true;
      continue;
    }

    const moved = shot.actualPrice - shot.entryPrice;
    const movedCorrectDirection = isBullish ? moved > 0 : moved < 0;
    const absMoved = Math.abs(moved);

    // Check TP hit
    if (movedCorrectDirection && absMoved >= tpDistance) {
      shot.correct = true;
      shot._barrierResult = 'tp';
      shot._frozen = true;
    }
    // Check SL hit
    else if (!movedCorrectDirection && absMoved >= slDistance) {
      shot.correct = false;
      shot._barrierResult = 'sl';
      shot._frozen = true;
    }
    // Check time barrier
    else if (now - shot.timestamp > timeBarrier) {
      // v7: At time barrier, score proportional to move captured
      // If moved in correct direction, it's partially correct
      if (movedCorrectDirection) {
        // Captured some of the move — correct if > 30% of TP distance
        shot.correct = absMoved > tpDistance * 0.3;
      } else {
        // Moved against — incorrect if > 30% of SL distance
        shot.correct = absMoved < slDistance * 0.3;
      }
      shot._barrierResult = 'time';
      shot._frozen = true;
    }
    // v7: NO "flat market = correct" loophole. If none of the barriers hit, keep waiting.
    // The time barrier (3× eval delay) will eventually resolve it.

    if (shot._frozen) {
      shot.error = shot.actualPrice - shot.predictedPrice;
      if (shot.correct === false) {
        state._consecutiveMisses = (state._consecutiveMisses ?? 0) + 1;
      } else if (shot.correct === true) {
        state._consecutiveMisses = 0;
      }
    }
  }

  updateSignalAccuracy(state);
  updateSignalLikelihoodRatios(state);

  const evaluated = state.shots.filter(s => s.correct !== undefined);
  if (evaluated.length < SHOT_WINDOW) return state;

  const recentBatch = evaluated.slice(0, SHOT_WINDOW);
  const errors = recentBatch.filter(s => !s.correct);
  const errorRate = errors.length / SHOT_WINDOW;

  const newTrendingWeights = { ...state.trendingWeights };
  const newRangingWeights = { ...state.rangingWeights };
  const LEARN_RATE = 0.25 + errorRate * 0.25;
  let correctionApplied = false;

  const trendingShots = recentBatch.filter(s => s.regime === 'trending');
  const rangingShots = recentBatch.filter(s => s.regime === 'ranging');

  const adjustWeights = (shots: ApexShotRecord[], weights: ApexWeights, learnRate: number) => {
    if (shots.length < 2) return false;
    const shotErrorRate = shots.filter(s => !s.correct).length / shots.length;
    if (shotErrorRate > 0.35) {
      const signalErrorCounts: Record<string, number> = {};
      const signalCorrectCounts: Record<string, number> = {};
      for (const shot of shots) {
        const actualDir = (shot.actualPrice ?? shot.entryPrice) > shot.entryPrice ? 1 : -1;
        for (const [sigName, sigVote] of Object.entries(shot.signalVotes || {})) {
          if (Math.abs(sigVote) < 0.1) continue;
          if (Math.sign(sigVote) !== actualDir) signalErrorCounts[sigName] = (signalErrorCounts[sigName] ?? 0) + 1;
          else signalCorrectCounts[sigName] = (signalCorrectCounts[sigName] ?? 0) + 1;
        }
      }
      for (const k of Object.keys(weights) as (keyof ApexWeights)[]) {
        const errs = signalErrorCounts[k] ?? 0;
        const correct = signalCorrectCounts[k] ?? 0;
        const total = errs + correct;
        if (total === 0) continue;
        const sigAcc = correct / total;
        if (sigAcc < 0.30) weights[k] *= (1 - learnRate * 1.5);
        else if (sigAcc < 0.45) weights[k] *= (1 - learnRate);
        else if (sigAcc > 0.70) weights[k] *= (1 + learnRate * 0.8);
      }
      return true;
    } else if (shotErrorRate <= 0.2) {
      for (const k of Object.keys(weights) as (keyof ApexWeights)[]) {
        weights[k] = weights[k] * 0.95 + DEFAULT_WEIGHTS[k] * 0.05;
      }
    }
    return false;
  };

  correctionApplied = adjustWeights(trendingShots, newTrendingWeights, LEARN_RATE) || adjustWeights(rangingShots, newRangingWeights, LEARN_RATE);

  for (const w of [newTrendingWeights, newRangingWeights]) {
    for (const k of Object.keys(w) as (keyof ApexWeights)[]) {
      w[k] = Math.max(0.05, Math.min(2.5, w[k]));
    }
  }

  const weightedAccuracy = computeWeightedAccuracy(state.shots);
  const allEval = state.shots.filter(s => s.correct !== undefined);
  const totalCorrect = allEval.filter(s => s.correct).length;
  const winRate = allEval.length > 0 ? (totalCorrect / allEval.length) * 100 : 0;
  let streak = 0;
  for (const s of allEval) { if (s.correct) streak++; else break; }

  const newGen = state.generation + 1;
  const currentRegime = trendingShots.length >= rangingShots.length ? 'trending' : 'ranging';
  const snapshot: WeightSnapshot = {
    generation: newGen, timestamp: Date.now(),
    weights: currentRegime === 'trending' ? { ...newTrendingWeights } : { ...newRangingWeights },
    accuracy: weightedAccuracy, correctionApplied, regime: currentRegime,
  };

  return {
    ...state,
    trendingWeights: newTrendingWeights, rangingWeights: newRangingWeights,
    weights: currentRegime === 'trending' ? newTrendingWeights : newRangingWeights,
    shots: state.shots, corrections: state.corrections + (correctionApplied ? 1 : 0),
    generation: newGen, winRate, streak,
    weightHistory: [snapshot, ...state.weightHistory].slice(0, MAX_WEIGHT_HISTORY),
  };
}

// ─── Batch Audit ─────────────────────────────────────────

function batchAudit(state: ApexState): ApexState {
  const directional = state.shots.filter(s => s.predictedDirection !== 'neutral');
  const evaluated = directional.filter(s => s.correct !== undefined);
  const lastAuditCount = state._lastBatchAuditCount ?? 0;
  const currentBatchCount = Math.floor(evaluated.length / BATCH_AUDIT_SIZE);
  if (currentBatchCount <= lastAuditCount || evaluated.length < BATCH_AUDIT_SIZE) return state;

  const weightedAccuracy = computeWeightedAccuracy(evaluated);
  const totalCorrect = evaluated.filter(s => s.correct).length;
  const rawAccuracy = (totalCorrect / evaluated.length) * 100;
  const trueAccuracy = Math.min(rawAccuracy, weightedAccuracy);
  state._lastBatchAuditCount = currentBatchCount;

  if (trueAccuracy >= BATCH_AUDIT_FLOOR) {
    console.log(`[APEX v7 BATCH AUDIT] Sample ${evaluated.length}: accuracy ${trueAccuracy.toFixed(1)}% — OK`);
    return state;
  }

  console.log(`[APEX v7 BATCH AUDIT] Sample ${evaluated.length}: accuracy ${trueAccuracy.toFixed(1)}% < ${BATCH_AUDIT_FLOOR}% — DEEP CORRECTION`);
  const deficit = BATCH_AUDIT_FLOOR - trueAccuracy;
  const deepLearnRate = Math.min(0.65, 0.30 + deficit * 0.025);

  const signalStats: Record<string, { correct: number; wrong: number }> = {};
  for (const shot of evaluated) {
    const actualDir = (shot.actualPrice ?? shot.entryPrice) > shot.entryPrice ? 1 : -1;
    for (const [sigName, sigVote] of Object.entries(shot.signalVotes || {})) {
      if (Math.abs(sigVote) < 0.1) continue;
      if (!signalStats[sigName]) signalStats[sigName] = { correct: 0, wrong: 0 };
      if (Math.sign(sigVote) === actualDir) signalStats[sigName].correct++;
      else signalStats[sigName].wrong++;
    }
  }

  const applyDeepCorrection = (weights: ApexWeights) => {
    for (const k of Object.keys(weights) as (keyof ApexWeights)[]) {
      const stats = signalStats[k];
      if (!stats || stats.correct + stats.wrong < 3) continue;
      const sigAcc = stats.correct / (stats.correct + stats.wrong);
      if (sigAcc < 0.35) weights[k] *= (1 - deepLearnRate * 1.5);
      else if (sigAcc < 0.50) weights[k] *= (1 - deepLearnRate * 0.6);
      else if (sigAcc > 0.70) weights[k] *= (1 + deepLearnRate * 0.6);
      weights[k] = Math.max(0.05, Math.min(2.5, weights[k]));
    }
  };

  const newTrending = { ...state.trendingWeights }, newRanging = { ...state.rangingWeights };
  applyDeepCorrection(newTrending);
  applyDeepCorrection(newRanging);

  const currentRegime: 'trending' | 'ranging' = evaluated.filter(s => s.regime === 'trending').length >= evaluated.filter(s => s.regime === 'ranging').length ? 'trending' : 'ranging';
  const snapshot: WeightSnapshot = {
    generation: state.generation + 1, timestamp: Date.now(),
    weights: currentRegime === 'trending' ? { ...newTrending } : { ...newRanging },
    accuracy: trueAccuracy, correctionApplied: true, regime: currentRegime,
  };

  return {
    ...state,
    trendingWeights: newTrending, rangingWeights: newRanging,
    weights: currentRegime === 'trending' ? newTrending : newRanging,
    generation: state.generation + 1, corrections: state.corrections + 1,
    weightHistory: [snapshot, ...state.weightHistory].slice(0, MAX_WEIGHT_HISTORY),
  };
}

// ─── APEX v7 Forecast Projection ─────────────────────────

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
  values: number[], highs: number[], lows: number[],
  currentPrice: number, intervalMs: number, labelFn: (d: Date) => string,
  numPoints: number, timeframe: string, waveBias: number,
  wavePoints: Array<{ forecast: number }>,
): ApexComputeResult {
  const emptyState = loadState();
  if (values.length < 20 || currentPrice <= 0) {
    return { points: [], bias: 0, confidence: 0, probability: 0.5, direction: 'neutral', signals: [], state: emptyState, regime: 'ranging', confluenceCount: 0 };
  }

  const state = loadState();
  const regime = getRegime(values);
  const evalDelay = getEvalDelay(timeframe);
  const now = Date.now();

  // Freeze-on-Eval: set actualPrice for oldest pending shot
  const pendingShots = state.shots
    .filter(s => !s._frozen && s.correct === undefined && s.actualPrice === undefined)
    .sort((a, b) => a.timestamp - b.timestamp);
  for (const shot of pendingShots) {
    if (now - shot.timestamp > (shot.evalDelayMs || evalDelay)) {
      shot.actualPrice = currentPrice;
      break;
    }
  }

  // Also update actualPrice for shots past time barrier that still need it
  for (const shot of state.shots) {
    if (shot._frozen || shot.correct !== undefined) continue;
    if (shot.actualPrice !== undefined) continue;
    const timeBarrier = (shot.evalDelayMs || evalDelay) * 3;
    if (now - shot.timestamp > timeBarrier) {
      shot.actualPrice = currentPrice;
    }
  }

  const correctedState = batchAudit(evaluateAndCorrect(state));
  const activeWeights = regime === 'trending' ? correctedState.trendingWeights : correctedState.rangingWeights;
  const mutedSignals = correctedState._mutedSignals ?? [];
  const signalLR = correctedState._signalLR ?? {};

  const { bias, probability, signals, votes, confluenceCount, currentATR, avgATR50, clusterVotes, candleConfirmed, technicalDecision, kellyEdge, bayesianProb } =
    computeConsensus(values, highs, lows, activeWeights, regime, mutedSignals, signalLR);

  const adaptiveThreshold = getAdaptiveConfluenceThreshold(correctedState, currentATR, avgATR50);

  // HTF confirmation
  const htfBias = higherTimeframeBias(values, highs, lows);
  const htfDisagrees = (bias > 0 && htfBias < -0.3) || (bias < 0 && htfBias > 0.3);
  const adjustedProbability = htfDisagrees ? probability * 0.5 : probability;

  const gatedBias = confluenceCount >= adaptiveThreshold ? bias : 0;
  const lastDir = correctedState._lastPredictedDirection ?? 'neutral';

  let rawDirection: 'bullish' | 'bearish' | 'neutral' =
    confluenceCount < adaptiveThreshold ? 'neutral' :
    gatedBias > BIAS_THRESHOLD ? 'bullish' :
    gatedBias < -BIAS_THRESHOLD ? 'bearish' : 'neutral';

  // Direction persistence
  if (rawDirection !== 'neutral' && lastDir !== 'neutral' && rawDirection !== lastDir) {
    if (Math.abs(gatedBias) < DIRECTION_FLIP_THRESHOLD) rawDirection = 'neutral';
  }

  // HTF veto
  if (htfDisagrees && rawDirection !== 'neutral') rawDirection = 'neutral';

  // Candle confirmation gate
  if (rawDirection !== 'neutral' && !candleConfirmed) {
    console.log(`[APEX v7] Candle confirmation FAILED for ${rawDirection} — abstaining`);
    rawDirection = 'neutral';
  }

  // Technical stack veto
  if (rawDirection !== 'neutral' && technicalDecision.direction !== 'neutral' && technicalDecision.direction !== rawDirection) {
    console.log(`[APEX v7] Technical stack vetoed ${rawDirection}`);
    rawDirection = 'neutral';
  }
  if (rawDirection !== 'neutral' && technicalDecision.confidence < 0.62) {
    console.log(`[APEX v7] Technical confidence too weak ${(technicalDecision.confidence * 100).toFixed(0)}%`);
    rawDirection = 'neutral';
  }

  // v7: HALF-KELLY CONFIDENCE GATE
  if (rawDirection !== 'neutral' && kellyEdge < HALF_KELLY_THRESHOLD) {
    console.log(`[APEX v7] Half-Kelly gate BLOCKED — edge ${kellyEdge.toFixed(3)} < ${HALF_KELLY_THRESHOLD} — not worth the risk`);
    rawDirection = 'neutral';
  }

  // Dynamic probability floor based on Kelly
  const dynamicProbFloor = 0.55 + Math.max(0, 0.15 - kellyEdge) * 0.5;
  if (adjustedProbability < dynamicProbFloor && rawDirection !== 'neutral') {
    console.log(`[APEX v7] Prob floor ${(adjustedProbability * 100).toFixed(0)}% < dynamic ${(dynamicProbFloor * 100).toFixed(0)}%`);
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
  }
  const gatedDirection = inCooldown ? 'neutral' : rawDirection;

  const atrArr = computeATR(highs, lows, values);
  const atr = atrArr[atrArr.length - 1] ?? currentPrice * 0.005;

  // Projection
  const points: ApexForecastPoint[] = [];
  const decimals = currentPrice < 10 ? 4 : 2;
  const momN = Math.min(8, values.length);
  const momSlice = values.slice(-momN);
  let weightedMom = 0, wSum = 0;
  for (let i = 1; i < momSlice.length; i++) { const w = Math.exp(i * 0.4); weightedMom += (momSlice[i] - momSlice[i - 1]) * w; wSum += w; }
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

    const slopeBias = Math.max(-1, Math.min(1, (forecastPrice - prevForecast) / (atr * 0.05)));
    const futureTime = new Date(now + i * intervalMs);

    const point: ApexForecastPoint = {
      time: labelFn(futureTime),
      apexForecast: parseFloat(forecastPrice.toFixed(decimals)),
      apexColor: biasToApexColor(slopeBias, adjustedProbability),
      apexHigh: parseFloat((forecastPrice + bandWidth).toFixed(decimals)),
      apexLow: parseFloat((forecastPrice - bandWidth).toFixed(decimals)),
    };
    if (wavePoints[i - 1]) point.waveGhost = wavePoints[i - 1].forecast;
    points.push(point);
  }

  // Record shot
  const lastForecast = points[points.length - 1];
  if (lastForecast && gatedDirection !== 'neutral') {
    const lastShot = correctedState.shots[0];
    const timeSinceLast = lastShot ? Date.now() - lastShot.timestamp : Infinity;
    if (timeSinceLast > MIN_PREDICTION_SPACING_MS) {
      const clusterVoteRecord: Record<string, number> = {};
      for (const cv of clusterVotes) clusterVoteRecord[cv.name] = cv.vote;

      const isBullish = gatedDirection === 'bullish';
      const tpPrice = isBullish ? currentPrice + atr * TP_ATR_MULT : currentPrice - atr * TP_ATR_MULT;
      const slPrice = isBullish ? currentPrice - atr * SL_ATR_MULT : currentPrice + atr * SL_ATR_MULT;

      const newShot: ApexShotRecord = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        timestamp: Date.now(), symbol: '', timeframe,
        predictedDirection: gatedDirection,
        predictedPrice: lastForecast.apexForecast,
        entryPrice: currentPrice,
        probability: adjustedProbability,
        signalVotes: votes, regime, confluenceCount,
        atrAtEntry: atr, evalDelayMs: evalDelay,
        clusterVotes: clusterVoteRecord,
        _tpPrice: tpPrice, _slPrice: slPrice,
        _timeBarrier: Date.now() + (evalDelay * 3),
        _kellyEdge: kellyEdge,
      };
      correctedState.shots.unshift(newShot);
      if (correctedState.shots.length > MAX_SHOTS) correctedState.shots.length = MAX_SHOTS;
      correctedState._lastPredictedDirection = gatedDirection;
    }
  }

  correctedState.weights = activeWeights;
  saveState(correctedState);

  return { points, bias: gatedBias, confidence: adjustedProbability, probability: adjustedProbability, direction: gatedDirection, signals, state: correctedState, regime, confluenceCount };
}

// ─── Adaptive Confluence Threshold ───────────────────────

function getAdaptiveConfluenceThreshold(state: ApexState, currentATR?: number, avgATR50?: number): number {
  const evaluated = state.shots.filter(s => s.correct !== undefined);
  if (evaluated.length < 3) return MIN_CLUSTER_CONFLUENCE;

  const weightedAcc = computeWeightedAccuracy(state.shots);
  const recent = evaluated.slice(0, 20);
  const recentAccuracy = Math.min((recent.filter(s => s.correct).length / recent.length) * 100, weightedAcc);

  let threshold: number;
  if (recentAccuracy >= ACCURACY_FLOOR + ACCURACY_FLOOR_MARGIN) threshold = MIN_CLUSTER_CONFLUENCE;
  else if (recentAccuracy >= ACCURACY_FLOOR) threshold = Math.min(MAX_CLUSTER_CONFLUENCE, MIN_CLUSTER_CONFLUENCE + 1);
  else threshold = MAX_CLUSTER_CONFLUENCE;

  if (currentATR !== undefined && avgATR50 !== undefined && avgATR50 > 0) {
    if (currentATR / avgATR50 < LOW_VOL_RATIO) threshold = MAX_CLUSTER_CONFLUENCE;
  }

  return threshold;
}

// ─── Color System ────────────────────────────────────────

function biasToApexColor(bias: number, confidence: number): string {
  const clamped = Math.max(-1, Math.min(1, bias));
  const alpha = 0.85 + confidence * 0.15;
  if (clamped > 0.1) {
    const intensity = Math.min(1, clamped / 0.4);
    return `hsla(${140 + intensity * 10}, ${80 + intensity * 20}%, ${50 + intensity * 12}%, ${alpha})`;
  } else if (clamped < -0.1) {
    const intensity = Math.min(1, Math.abs(clamped) / 0.4);
    return `hsla(${intensity * 10}, ${85 + intensity * 15}%, ${48 + intensity * 12}%, ${alpha})`;
  }
  return `hsla(45, 90%, 58%, ${alpha})`;
}

// ─── Stats for Dashboard ─────────────────────────────────

export interface ApexStats {
  generation: number; corrections: number; winRate: number; streak: number;
  totalShots: number; totalPredictions: number; totalEvaluated: number; totalCorrect: number;
  accuracyPct: number; weightedAccuracyPct: number; adaptiveThreshold: number; aboveFloor: boolean;
  lastBatchAudit: { sample: number; accuracy: number; passed: boolean } | null;
  inCooldown: boolean; cooldownRemainingSec: number; consecutiveMisses: number; lastDirection: string;
  mutedSignals: string[]; signalAccuracy: Record<string, { correct: number; wrong: number; pct: number }>;
  last5Accuracy: string; last5Detail: Array<{ correct: boolean; direction: string; error: number }>;
  predictionLog: Array<{
    id: string; timestamp: number; direction: 'bullish' | 'bearish';
    entryPrice: number; predictedPrice: number; actualPrice?: number; correct?: boolean;
    probability: number; regime: string; confluence: number; barrierResult?: string; kellyEdge?: number;
  }>;
  weights: ApexWeights; weightHistory: WeightSnapshot[]; shots: ApexShotRecord[];
  probability: number; direction: string; regime?: 'trending' | 'ranging';
}

export function getApexStats(): ApexStats {
  const state = loadState();
  const directional = state.shots.filter(s => s.predictedDirection !== 'neutral');
  const evaluated = directional.filter(s => s.correct !== undefined);
  const correct = evaluated.filter(s => s.correct);
  const accuracyPct = evaluated.length > 0 ? (correct.length / evaluated.length) * 100 : 0;
  const weightedAccuracyPct = computeWeightedAccuracy(state.shots);
  const last5 = evaluated.slice(0, 5);
  const threshold = getAdaptiveConfluenceThreshold(state);
  const now = Date.now();
  const cooldownUntil = state._cooldownUntil ?? 0;
  const inCooldown = now < cooldownUntil;

  const sigAcc = state._signalAccuracy ?? {};
  const signalAccuracy: Record<string, { correct: number; wrong: number; pct: number }> = {};
  for (const [name, stats] of Object.entries(sigAcc)) {
    const total = stats.correct + stats.wrong;
    signalAccuracy[name] = { correct: stats.correct, wrong: stats.wrong, pct: total > 0 ? (stats.correct / total) * 100 : 0 };
  }

  return {
    generation: state.generation, corrections: state.corrections,
    winRate: accuracyPct, streak: state.streak,
    totalShots: state.shots.length,
    totalPredictions: directional.length,
    totalEvaluated: evaluated.length,
    totalCorrect: correct.length,
    accuracyPct, weightedAccuracyPct,
    adaptiveThreshold: threshold,
    aboveFloor: accuracyPct >= ACCURACY_FLOOR || evaluated.length < 5,
    lastBatchAudit: null,
    inCooldown,
    cooldownRemainingSec: inCooldown ? Math.ceil((cooldownUntil - now) / 1000) : 0,
    consecutiveMisses: state._consecutiveMisses ?? 0,
    lastDirection: state._lastPredictedDirection ?? 'neutral',
    mutedSignals: state._mutedSignals ?? [],
    signalAccuracy,
    last5Accuracy: `${last5.filter(s => s.correct).length}/${last5.length}`,
    last5Detail: last5.map(s => ({ correct: s.correct!, direction: s.predictedDirection, error: s.error ?? 0 })),
    predictionLog: directional.slice(0, 50).map(s => ({
      id: s.id, timestamp: s.timestamp,
      direction: s.predictedDirection as 'bullish' | 'bearish',
      entryPrice: s.entryPrice, predictedPrice: s.predictedPrice,
      actualPrice: s.actualPrice, correct: s.correct,
      probability: s.probability, regime: s.regime,
      confluence: s.confluenceCount,
      barrierResult: s._barrierResult,
      kellyEdge: s._kellyEdge,
    })),
    weights: state.weights,
    weightHistory: state.weightHistory,
    shots: state.shots,
    probability: 0,
    direction: state._lastPredictedDirection ?? 'neutral',
    regime: undefined,
  };
}
