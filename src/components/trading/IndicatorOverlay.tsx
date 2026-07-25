import { useMemo, useState, useRef, useEffect } from 'react';
import { Line, ReferenceLine, ComposedChart, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ChevronDown } from 'lucide-react';

// ─── Indicator computation functions ─────────────────────

export const computeSMA = (prices: number[], period: number): number[] => {
  const result: number[] = [];
  for (let i = 0; i < prices.length; i++) {
    if (i < period - 1) { result.push(NaN); continue; }
    const slice = prices.slice(i - period + 1, i + 1);
    result.push(slice.reduce((a, b) => a + b, 0) / period);
  }
  return result;
};

export const computeEMA = (prices: number[], period: number): number[] => {
  const k = 2 / (period + 1);
  const result: number[] = [];
  let ema = NaN;
  for (let i = 0; i < prices.length; i++) {
    if (i < period - 1) { result.push(NaN); continue; }
    if (i === period - 1) {
      ema = prices.slice(0, period).reduce((a, b) => a + b, 0) / period;
    } else {
      ema = prices[i] * k + ema * (1 - k);
    }
    result.push(ema);
  }
  return result;
};

export const computeBollingerBands = (prices: number[], period = 20, stdDev = 2) => {
  const sma = computeSMA(prices, period);
  const upper: number[] = [];
  const lower: number[] = [];
  for (let i = 0; i < prices.length; i++) {
    if (isNaN(sma[i])) { upper.push(NaN); lower.push(NaN); continue; }
    const slice = prices.slice(i - period + 1, i + 1);
    const mean = sma[i];
    const variance = slice.reduce((s, v) => s + (v - mean) ** 2, 0) / period;
    const sd = Math.sqrt(variance) * stdDev;
    upper.push(mean + sd);
    lower.push(mean - sd);
  }
  return { middle: sma, upper, lower };
};

export const computeMACD = (prices: number[], fast = 12, slow = 26, signal = 9) => {
  const emaFast = computeEMA(prices, fast);
  const emaSlow = computeEMA(prices, slow);
  const macdLine = emaFast.map((f, i) => (isNaN(f) || isNaN(emaSlow[i])) ? NaN : f - emaSlow[i]);
  const validMacd = macdLine.filter(v => !isNaN(v));
  const signalLine = computeEMA(validMacd, signal);
  const padded: number[] = [];
  let si = 0;
  for (let i = 0; i < macdLine.length; i++) {
    if (isNaN(macdLine[i])) { padded.push(NaN); continue; }
    padded.push(si < signalLine.length ? signalLine[si] : NaN);
    si++;
  }
  const histogram = macdLine.map((m, i) => (isNaN(m) || isNaN(padded[i])) ? NaN : m - padded[i]);
  return { macd: macdLine, signal: padded, histogram };
};

export const computeATR = (highs: number[], lows: number[], closes: number[], period = 14): number[] => {
  const trs: number[] = [highs[0] - lows[0]];
  for (let i = 1; i < closes.length; i++) {
    trs.push(Math.max(highs[i] - lows[i], Math.abs(highs[i] - closes[i - 1]), Math.abs(lows[i] - closes[i - 1])));
  }
  const result: number[] = [];
  for (let i = 0; i < trs.length; i++) {
    if (i < period - 1) { result.push(NaN); continue; }
    if (i === period - 1) {
      result.push(trs.slice(0, period).reduce((a, b) => a + b, 0) / period);
    } else {
      result.push((result[result.length - 1] * (period - 1) + trs[i]) / period);
    }
  }
  return result;
};

export const computeRSI = (prices: number[], period = 14): number[] => {
  const result: number[] = [NaN];
  const changes = prices.map((p, i) => i > 0 ? p - prices[i - 1] : 0);
  let avgGain = 0, avgLoss = 0;
  for (let i = 1; i <= period; i++) {
    if (changes[i] > 0) avgGain += changes[i];
    else avgLoss -= changes[i];
    result.push(NaN);
  }
  avgGain /= period;
  avgLoss /= period;
  result.pop();
  if (avgLoss === 0) result.push(100);
  else result.push(100 - 100 / (1 + avgGain / avgLoss));

  for (let i = period + 1; i < prices.length; i++) {
    const change = changes[i];
    avgGain = (avgGain * (period - 1) + (change > 0 ? change : 0)) / period;
    avgLoss = (avgLoss * (period - 1) + (change < 0 ? -change : 0)) / period;
    if (avgLoss === 0) result.push(100);
    else result.push(100 - 100 / (1 + avgGain / avgLoss));
  }
  return result;
};

export const computeStochRSI = (prices: number[], rsiPeriod = 14, stochPeriod = 14): number[] => {
  const rsi = computeRSI(prices, rsiPeriod);
  const result: number[] = [];
  for (let i = 0; i < rsi.length; i++) {
    if (isNaN(rsi[i]) || i < rsiPeriod + stochPeriod - 1) { result.push(NaN); continue; }
    const slice = rsi.slice(i - stochPeriod + 1, i + 1).filter(v => !isNaN(v));
    if (slice.length < stochPeriod) { result.push(NaN); continue; }
    const min = Math.min(...slice);
    const max = Math.max(...slice);
    result.push(max === min ? 50 : ((rsi[i] - min) / (max - min)) * 100);
  }
  return result;
};

export const computeParabolicSAR = (highs: number[], lows: number[], af = 0.02, maxAf = 0.2): number[] => {
  const result: number[] = [lows[0]];
  let isLong = true;
  let sar = lows[0];
  let ep = highs[0];
  let accel = af;
  for (let i = 1; i < highs.length; i++) {
    sar = sar + accel * (ep - sar);
    if (isLong) {
      if (lows[i] < sar) {
        isLong = false; sar = ep; ep = lows[i]; accel = af;
      } else {
        if (highs[i] > ep) { ep = highs[i]; accel = Math.min(accel + af, maxAf); }
      }
    } else {
      if (highs[i] > sar) {
        isLong = true; sar = ep; ep = highs[i]; accel = af;
      } else {
        if (lows[i] < ep) { ep = lows[i]; accel = Math.min(accel + af, maxAf); }
      }
    }
    result.push(sar);
  }
  return result;
};

export const computeIchimoku = (highs: number[], lows: number[], tenkan = 9, kijun = 26, senkou = 52) => {
  const midpoint = (h: number[], l: number[], period: number, idx: number) => {
    if (idx < period - 1) return NaN;
    const hSlice = h.slice(idx - period + 1, idx + 1);
    const lSlice = l.slice(idx - period + 1, idx + 1);
    return (Math.max(...hSlice) + Math.min(...lSlice)) / 2;
  };
  const tenkanSen = highs.map((_, i) => midpoint(highs, lows, tenkan, i));
  const kijunSen = highs.map((_, i) => midpoint(highs, lows, kijun, i));
  const senkouA = tenkanSen.map((t, i) => (isNaN(t) || isNaN(kijunSen[i])) ? NaN : (t + kijunSen[i]) / 2);
  const senkouB = highs.map((_, i) => midpoint(highs, lows, senkou, i));
  return { tenkanSen, kijunSen, senkouA, senkouB };
};

export const computeWilliamsR = (highs: number[], lows: number[], closes: number[], period = 14): number[] => {
  const result: number[] = [];
  for (let i = 0; i < closes.length; i++) {
    if (i < period - 1) { result.push(NaN); continue; }
    const hh = Math.max(...highs.slice(i - period + 1, i + 1));
    const ll = Math.min(...lows.slice(i - period + 1, i + 1));
    result.push(hh === ll ? -50 : ((hh - closes[i]) / (hh - ll)) * -100);
  }
  return result;
};

export const computeADX = (highs: number[], lows: number[], closes: number[], period = 14) => {
  const plusDM: number[] = [0];
  const minusDM: number[] = [0];
  for (let i = 1; i < highs.length; i++) {
    const upMove = highs[i] - highs[i - 1];
    const downMove = lows[i - 1] - lows[i];
    plusDM.push(upMove > downMove && upMove > 0 ? upMove : 0);
    minusDM.push(downMove > upMove && downMove > 0 ? downMove : 0);
  }
  const atr = computeATR(highs, lows, closes, period);
  const smoothPlusDM = computeEMA(plusDM, period);
  const smoothMinusDM = computeEMA(minusDM, period);
  const plusDI = smoothPlusDM.map((v, i) => (isNaN(v) || isNaN(atr[i]) || atr[i] === 0) ? NaN : (v / atr[i]) * 100);
  const minusDI = smoothMinusDM.map((v, i) => (isNaN(v) || isNaN(atr[i]) || atr[i] === 0) ? NaN : (v / atr[i]) * 100);
  const dx = plusDI.map((p, i) => (isNaN(p) || isNaN(minusDI[i]) || p + minusDI[i] === 0) ? NaN : (Math.abs(p - minusDI[i]) / (p + minusDI[i])) * 100);
  const adx = computeEMA(dx.filter(v => !isNaN(v)), period);
  return { adx, plusDI, minusDI };
};

// ─── NEW MT5 INDICATORS ─────────────────────────────────

export const computeCCI = (highs: number[], lows: number[], closes: number[], period = 20): number[] => {
  const tp = closes.map((c, i) => (highs[i] + lows[i] + c) / 3);
  const result: number[] = [];
  for (let i = 0; i < tp.length; i++) {
    if (i < period - 1) { result.push(NaN); continue; }
    const slice = tp.slice(i - period + 1, i + 1);
    const mean = slice.reduce((a, b) => a + b, 0) / period;
    const meanDev = slice.reduce((a, v) => a + Math.abs(v - mean), 0) / period;
    result.push(meanDev === 0 ? 0 : (tp[i] - mean) / (0.015 * meanDev));
  }
  return result;
};

export const computeMomentum = (prices: number[], period = 14): number[] => {
  return prices.map((p, i) => i < period ? NaN : p - prices[i - period]);
};

export const computeOBV = (closes: number[], volumes?: number[]): number[] => {
  const result: number[] = [0];
  for (let i = 1; i < closes.length; i++) {
    const vol = volumes?.[i] ?? 1000 + Math.random() * 500;
    if (closes[i] > closes[i - 1]) result.push(result[i - 1] + vol);
    else if (closes[i] < closes[i - 1]) result.push(result[i - 1] - vol);
    else result.push(result[i - 1]);
  }
  return result;
};

export const computeMFI = (highs: number[], lows: number[], closes: number[], period = 14): number[] => {
  const tp = closes.map((c, i) => (highs[i] + lows[i] + c) / 3);
  const result: number[] = [];
  for (let i = 0; i < closes.length; i++) {
    if (i < period) { result.push(NaN); continue; }
    let posFlow = 0, negFlow = 0;
    for (let j = i - period + 1; j <= i; j++) {
      const flow = tp[j] * (1000 + Math.random() * 500);
      if (tp[j] > tp[j - 1]) posFlow += flow;
      else negFlow += flow;
    }
    const mfRatio = negFlow === 0 ? 100 : posFlow / negFlow;
    result.push(100 - 100 / (1 + mfRatio));
  }
  return result;
};

export const computeAwesomeOscillator = (highs: number[], lows: number[]): number[] => {
  const midpoints = highs.map((h, i) => (h + lows[i]) / 2);
  const sma5 = computeSMA(midpoints, 5);
  const sma34 = computeSMA(midpoints, 34);
  return sma5.map((v, i) => (isNaN(v) || isNaN(sma34[i])) ? NaN : v - sma34[i]);
};

export const computeAlligator = (highs: number[], lows: number[]) => {
  const midpoints = highs.map((h, i) => (h + lows[i]) / 2);
  const jaw = computeSMA(midpoints, 13);
  const teeth = computeSMA(midpoints, 8);
  const lips = computeSMA(midpoints, 5);
  return { jaw, teeth, lips };
};

export const computeEnvelopes = (prices: number[], period = 20, deviation = 0.002) => {
  const sma = computeSMA(prices, period);
  return {
    upper: sma.map(v => isNaN(v) ? NaN : v * (1 + deviation)),
    middle: sma,
    lower: sma.map(v => isNaN(v) ? NaN : v * (1 - deviation)),
  };
};

export const computeStdDev = (prices: number[], period = 20): number[] => {
  const result: number[] = [];
  for (let i = 0; i < prices.length; i++) {
    if (i < period - 1) { result.push(NaN); continue; }
    const slice = prices.slice(i - period + 1, i + 1);
    const mean = slice.reduce((a, b) => a + b, 0) / period;
    const variance = slice.reduce((s, v) => s + (v - mean) ** 2, 0) / period;
    result.push(Math.sqrt(variance));
  }
  return result;
};

export const computeDeMarker = (highs: number[], lows: number[], period = 14): number[] => {
  const result: number[] = [];
  for (let i = 0; i < highs.length; i++) {
    if (i < period) { result.push(NaN); continue; }
    let deMax = 0, deMin = 0;
    for (let j = i - period + 1; j <= i; j++) {
      const hiDiff = highs[j] - highs[j - 1];
      const loDiff = lows[j - 1] - lows[j];
      deMax += hiDiff > 0 ? hiDiff : 0;
      deMin += loDiff > 0 ? loDiff : 0;
    }
    result.push(deMax + deMin === 0 ? 0.5 : deMax / (deMax + deMin));
  }
  return result;
};

export const computeForceIndex = (closes: number[], period = 13): number[] => {
  const raw = closes.map((c, i) => i === 0 ? 0 : (c - closes[i - 1]) * (1000 + Math.random() * 500));
  return computeEMA(raw, period);
};

export const computeBullsPower = (highs: number[], closes: number[], period = 13): number[] => {
  const ema = computeEMA(closes, period);
  return highs.map((h, i) => isNaN(ema[i]) ? NaN : h - ema[i]);
};

export const computeBearsPower = (lows: number[], closes: number[], period = 13): number[] => {
  const ema = computeEMA(closes, period);
  return lows.map((l, i) => isNaN(ema[i]) ? NaN : l - ema[i]);
};

export const computeOsMA = (prices: number[]): number[] => {
  const macdData = computeMACD(prices);
  return macdData.histogram;
};

export const computeVWAP = (highs: number[], lows: number[], closes: number[]): number[] => {
  const result: number[] = [];
  let cumTPV = 0, cumVol = 0;
  for (let i = 0; i < closes.length; i++) {
    const tp = (highs[i] + lows[i] + closes[i]) / 3;
    const vol = 1000 + Math.random() * 500;
    cumTPV += tp * vol;
    cumVol += vol;
    result.push(cumTPV / cumVol);
  }
  return result;
};

export const computePivotPoints = (highs: number[], lows: number[], closes: number[]) => {
  const len = closes.length;
  const p = new Array(len).fill(NaN);
  const r1 = new Array(len).fill(NaN), r2 = new Array(len).fill(NaN), r3 = new Array(len).fill(NaN);
  const s1 = new Array(len).fill(NaN), s2 = new Array(len).fill(NaN), s3 = new Array(len).fill(NaN);
  for (let i = 1; i < len; i++) {
    const H = highs[i - 1], L = lows[i - 1], C = closes[i - 1];
    const pivot = (H + L + C) / 3;
    p[i] = pivot; r1[i] = 2 * pivot - L; s1[i] = 2 * pivot - H;
    r2[i] = pivot + (H - L); s2[i] = pivot - (H - L);
    r3[i] = H + 2 * (pivot - L); s3[i] = L - 2 * (H - pivot);
  }
  return { p, r1, r2, r3, s1, s2, s3 };
};

export const computeDonchian = (highs: number[], lows: number[], period = 20) => {
  const upper: number[] = [], lower: number[] = [], middle: number[] = [];
  for (let i = 0; i < highs.length; i++) {
    if (i < period - 1) { upper.push(NaN); lower.push(NaN); middle.push(NaN); continue; }
    const hh = Math.max(...highs.slice(i - period + 1, i + 1));
    const ll = Math.min(...lows.slice(i - period + 1, i + 1));
    upper.push(hh); lower.push(ll); middle.push((hh + ll) / 2);
  }
  return { upper, middle, lower };
};

export const computeKeltner = (highs: number[], lows: number[], closes: number[], emaPeriod = 20, atrPeriod = 10, mult = 1.5) => {
  const mid = computeEMA(closes, emaPeriod);
  const atr = computeATR(highs, lows, closes, atrPeriod);
  return {
    upper: mid.map((m, i) => (isNaN(m) || isNaN(atr[i])) ? NaN : m + mult * atr[i]),
    middle: mid,
    lower: mid.map((m, i) => (isNaN(m) || isNaN(atr[i])) ? NaN : m - mult * atr[i]),
  };
};

export const computeCMF = (highs: number[], lows: number[], closes: number[], period = 20): number[] => {
  const result: number[] = [];
  for (let i = 0; i < closes.length; i++) {
    if (i < period - 1) { result.push(NaN); continue; }
    let sumMFV = 0, sumVol = 0;
    for (let j = i - period + 1; j <= i; j++) {
      const hl = highs[j] - lows[j];
      const mfm = hl === 0 ? 0 : ((closes[j] - lows[j]) - (highs[j] - closes[j])) / hl;
      const vol = 1000 + Math.random() * 500;
      sumMFV += mfm * vol;
      sumVol += vol;
    }
    result.push(sumVol === 0 ? 0 : sumMFV / sumVol);
  }
  return result;
};

export const computeADLine = (highs: number[], lows: number[], closes: number[]): number[] => {
  const result: number[] = [];
  let ad = 0;
  for (let i = 0; i < closes.length; i++) {
    const hl = highs[i] - lows[i];
    const mfm = hl === 0 ? 0 : ((closes[i] - lows[i]) - (highs[i] - closes[i])) / hl;
    const vol = 1000 + Math.random() * 500;
    ad += mfm * vol;
    result.push(ad);
  }
  return result;
};

// ─── Available indicator definitions ─────────────────────

export type IndicatorKey =
  | 'bollinger' | 'macd' | 'atr' | 'parabolicSar' | 'ichimoku'
  | 'fibonacci' | 'stochRsi' | 'williamsR' | 'adx' | 'sma20' | 'sma50' | 'ema20'
  | 'cci' | 'momentum' | 'obv' | 'mfi' | 'awesomeOsc' | 'alligator'
  | 'envelopes' | 'stdDev' | 'demarker' | 'forceIndex' | 'bullsPower' | 'bearsPower' | 'osma'
  | 'vwap' | 'pivotPoints' | 'donchian' | 'keltner' | 'cmf' | 'adLine';

export interface IndicatorDef {
  key: IndicatorKey;
  label: string;
  color: string;
  category: 'overlay' | 'oscillator';
}

export const INDICATORS: IndicatorDef[] = [
  // Overlays
  { key: 'bollinger', label: 'Bollinger', color: 'hsl(210,80%,60%)', category: 'overlay' },
  { key: 'sma20', label: 'SMA 20', color: 'hsl(43,72%,50%)', category: 'overlay' },
  { key: 'sma50', label: 'SMA 50', color: 'hsl(280,60%,60%)', category: 'overlay' },
  { key: 'ema20', label: 'EMA 20', color: 'hsl(170,70%,50%)', category: 'overlay' },
  { key: 'ichimoku', label: 'Ichimoku', color: 'hsl(0,70%,55%)', category: 'overlay' },
  { key: 'parabolicSar', label: 'SAR', color: 'hsl(38,90%,55%)', category: 'overlay' },
  { key: 'alligator', label: 'Alligator', color: 'hsl(217,91%,60%)', category: 'overlay' },
  { key: 'envelopes', label: 'Envelopes', color: 'hsl(300,50%,55%)', category: 'overlay' },
  { key: 'vwap', label: 'VWAP', color: 'hsl(45,85%,55%)', category: 'overlay' },
  { key: 'pivotPoints', label: 'Pivots', color: 'hsl(200,70%,60%)', category: 'overlay' },
  { key: 'donchian', label: 'Donchian', color: 'hsl(160,65%,50%)', category: 'overlay' },
  { key: 'keltner', label: 'Keltner', color: 'hsl(320,60%,55%)', category: 'overlay' },
  { key: 'fibonacci', label: 'Fibonacci', color: 'hsl(43,72%,50%)', category: 'overlay' },
  // Oscillators
  { key: 'macd', label: 'MACD', color: 'hsl(217,91%,60%)', category: 'oscillator' },
  { key: 'stochRsi', label: 'Stoch RSI', color: 'hsl(262,83%,58%)', category: 'oscillator' },
  { key: 'williamsR', label: 'Williams %R', color: 'hsl(340,70%,55%)', category: 'oscillator' },
  { key: 'adx', label: 'ADX', color: 'hsl(25,95%,53%)', category: 'oscillator' },
  { key: 'atr', label: 'ATR', color: 'hsl(145,60%,45%)', category: 'oscillator' },
  { key: 'cci', label: 'CCI', color: 'hsl(190,80%,50%)', category: 'oscillator' },
  { key: 'momentum', label: 'Momentum', color: 'hsl(30,90%,55%)', category: 'oscillator' },
  { key: 'obv', label: 'OBV', color: 'hsl(120,50%,50%)', category: 'oscillator' },
  { key: 'mfi', label: 'MFI', color: 'hsl(55,70%,50%)', category: 'oscillator' },
  { key: 'awesomeOsc', label: 'Awesome', color: 'hsl(145,70%,45%)', category: 'oscillator' },
  { key: 'stdDev', label: 'Std Dev', color: 'hsl(200,60%,55%)', category: 'oscillator' },
  { key: 'demarker', label: 'DeMarker', color: 'hsl(350,65%,55%)', category: 'oscillator' },
  { key: 'forceIndex', label: 'Force', color: 'hsl(280,70%,55%)', category: 'oscillator' },
  { key: 'bullsPower', label: 'Bulls', color: 'hsl(145,70%,50%)', category: 'oscillator' },
  { key: 'bearsPower', label: 'Bears', color: 'hsl(0,70%,55%)', category: 'oscillator' },
  { key: 'osma', label: 'OsMA', color: 'hsl(40,80%,50%)', category: 'oscillator' },
  { key: 'cmf', label: 'CMF', color: 'hsl(180,70%,45%)', category: 'oscillator' },
  { key: 'adLine', label: 'A/D Line', color: 'hsl(90,55%,50%)', category: 'oscillator' },
];

// ─── Indicator Toggle Bar with Overflow Dropdown ─────────

const MAX_VISIBLE_INDICATORS = 12;

interface IndicatorToggleBarProps {
  active: Set<IndicatorKey>;
  onToggle: (key: IndicatorKey) => void;
}

export const IndicatorToggleBar = ({ active, onToggle }: IndicatorToggleBarProps) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [maxVisible, setMaxVisible] = useState(MAX_VISIBLE_INDICATORS);

  // Dynamically calculate how many fit
  useEffect(() => {
    const measure = () => {
      if (!containerRef.current) return;
      const containerW = containerRef.current.offsetWidth;
      // Each button is ~60px wide + 4px gap, dropdown toggle ~60px
      const btnWidth = 58;
      const dropdownBtnWidth = 70;
      const available = containerW - dropdownBtnWidth - 8;
      setMaxVisible(Math.max(4, Math.floor(available / btnWidth)));
    };
    measure();
    const observer = new ResizeObserver(measure);
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    if (!showDropdown) return;
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showDropdown]);

  const visibleIndicators = INDICATORS.slice(0, maxVisible);
  const overflowIndicators = INDICATORS.slice(maxVisible);
  const overflowActiveCount = overflowIndicators.filter(ind => active.has(ind.key)).length;

  return (
    <div ref={containerRef} className="flex items-center gap-1 py-1 px-2 relative">
      {visibleIndicators.map((ind) => (
        <button
          key={ind.key}
          onClick={() => onToggle(ind.key)}
          className={`flex-shrink-0 px-2 py-0.5 text-[8px] font-mono tracking-wider rounded transition-all border ${
            active.has(ind.key)
              ? 'text-gold bg-gold/15 border-gold/30'
              : 'text-marble/30 border-gold/5 hover:text-marble/50'
          }`}
        >
          {ind.label}
        </button>
      ))}
      {overflowIndicators.length > 0 && (
        <div ref={dropdownRef} className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className={`flex items-center gap-0.5 px-2 py-0.5 text-[8px] font-mono tracking-wider rounded transition-all border ${
              showDropdown || overflowActiveCount > 0
                ? 'text-gold bg-gold/15 border-gold/30'
                : 'text-marble/30 border-gold/5 hover:text-marble/50'
            }`}
          >
            MORE{overflowActiveCount > 0 && ` (${overflowActiveCount})`}
            <ChevronDown className={`w-2.5 h-2.5 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
          </button>
          {showDropdown && (
            <div className="absolute top-full right-0 mt-1 z-50 bg-navy-dark border border-gold/20 rounded-lg shadow-xl min-w-[180px] max-h-[300px] overflow-y-auto">
              <div className="px-3 py-1.5 text-[8px] font-display tracking-[0.15em] text-marble/25 border-b border-gold/10 sticky top-0 bg-navy-dark">
                MORE INDICATORS
              </div>
              {overflowIndicators.map((ind) => (
                <button
                  key={ind.key}
                  onClick={() => onToggle(ind.key)}
                  className={`w-full flex items-center gap-2 px-3 py-1.5 text-left transition-colors border-b border-gold/5 last:border-0 ${
                    active.has(ind.key)
                      ? 'bg-gold/10 text-gold'
                      : 'text-marble/40 hover:text-marble/70 hover:bg-navy-light/30'
                  }`}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: ind.color }}
                  />
                  <span className="text-[9px] font-mono">{ind.label}</span>
                  <span className="text-[7px] text-marble/20 ml-auto uppercase">{ind.category}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Inject indicator data into chart data ───────────────

export interface ChartDataPoint {
  time: string;
  value: number;
  open: number;
  close: number;
  high: number;
  low: number;
  [key: string]: string | number;
}

export const enrichChartData = (data: ChartDataPoint[], activeIndicators: Set<IndicatorKey>): ChartDataPoint[] => {
  if (activeIndicators.size === 0) return data;
  const closes = data.map(d => d.value);
  const highs = data.map(d => d.high);
  const lows = data.map(d => d.low);
  const enriched = data.map((d, i) => ({ ...d }));

  if (activeIndicators.has('sma20')) {
    const sma = computeSMA(closes, 20);
    sma.forEach((v, i) => { if (!isNaN(v)) enriched[i].sma20 = parseFloat(v.toFixed(2)); });
  }
  if (activeIndicators.has('sma50')) {
    const sma = computeSMA(closes, 50);
    sma.forEach((v, i) => { if (!isNaN(v)) enriched[i].sma50 = parseFloat(v.toFixed(2)); });
  }
  if (activeIndicators.has('ema20')) {
    const ema = computeEMA(closes, 20);
    ema.forEach((v, i) => { if (!isNaN(v)) enriched[i].ema20 = parseFloat(v.toFixed(2)); });
  }
  if (activeIndicators.has('bollinger')) {
    const bb = computeBollingerBands(closes);
    bb.upper.forEach((v, i) => { if (!isNaN(v)) enriched[i].bbUpper = parseFloat(v.toFixed(2)); });
    bb.middle.forEach((v, i) => { if (!isNaN(v)) enriched[i].bbMiddle = parseFloat(v.toFixed(2)); });
    bb.lower.forEach((v, i) => { if (!isNaN(v)) enriched[i].bbLower = parseFloat(v.toFixed(2)); });
  }
  if (activeIndicators.has('ichimoku')) {
    const ich = computeIchimoku(highs, lows);
    ich.tenkanSen.forEach((v, i) => { if (!isNaN(v)) enriched[i].ichTenkan = parseFloat(v.toFixed(2)); });
    ich.kijunSen.forEach((v, i) => { if (!isNaN(v)) enriched[i].ichKijun = parseFloat(v.toFixed(2)); });
    ich.senkouA.forEach((v, i) => { if (!isNaN(v)) enriched[i].ichSenkouA = parseFloat(v.toFixed(2)); });
    ich.senkouB.forEach((v, i) => { if (!isNaN(v)) enriched[i].ichSenkouB = parseFloat(v.toFixed(2)); });
  }
  if (activeIndicators.has('parabolicSar')) {
    const sar = computeParabolicSAR(highs, lows);
    sar.forEach((v, i) => { enriched[i].psar = parseFloat(v.toFixed(2)); });
  }
  if (activeIndicators.has('alligator')) {
    const al = computeAlligator(highs, lows);
    al.jaw.forEach((v, i) => { if (!isNaN(v)) enriched[i].alJaw = parseFloat(v.toFixed(2)); });
    al.teeth.forEach((v, i) => { if (!isNaN(v)) enriched[i].alTeeth = parseFloat(v.toFixed(2)); });
    al.lips.forEach((v, i) => { if (!isNaN(v)) enriched[i].alLips = parseFloat(v.toFixed(2)); });
  }
  if (activeIndicators.has('envelopes')) {
    const env = computeEnvelopes(closes);
    env.upper.forEach((v, i) => { if (!isNaN(v)) enriched[i].envUpper = parseFloat(v.toFixed(2)); });
    env.middle.forEach((v, i) => { if (!isNaN(v)) enriched[i].envMiddle = parseFloat(v.toFixed(2)); });
    env.lower.forEach((v, i) => { if (!isNaN(v)) enriched[i].envLower = parseFloat(v.toFixed(2)); });
  }
  if (activeIndicators.has('fibonacci')) {
    const max = Math.max(...closes);
    const min = Math.min(...closes);
    const diff = max - min;
    const levels = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1];
    levels.forEach(l => {
      const val = parseFloat((max - diff * l).toFixed(2));
      enriched.forEach(d => { d[`fib${l * 1000}`] = val; });
    });
  }
  // ─── Oscillator enrichment ──────────────────────────────
  if (activeIndicators.has('macd')) {
    const m = computeMACD(closes);
    m.macd.forEach((v, i) => { if (!isNaN(v)) enriched[i].macdLine = parseFloat(v.toFixed(4)); });
    m.signal.forEach((v, i) => { if (!isNaN(v)) enriched[i].macdSignal = parseFloat(v.toFixed(4)); });
    m.histogram.forEach((v, i) => { if (!isNaN(v)) enriched[i].macdHist = parseFloat(v.toFixed(4)); });
  }
  if (activeIndicators.has('atr')) {
    const vals = computeATR(highs, lows, closes);
    vals.forEach((v, i) => { if (!isNaN(v)) enriched[i].atr = parseFloat(v.toFixed(4)); });
  }
  if (activeIndicators.has('stochRsi')) {
    const vals = computeStochRSI(closes);
    vals.forEach((v, i) => { if (!isNaN(v)) enriched[i].stochRsi = parseFloat(v.toFixed(2)); });
  }
  if (activeIndicators.has('williamsR')) {
    const vals = computeWilliamsR(highs, lows, closes);
    vals.forEach((v, i) => { if (!isNaN(v)) enriched[i].williamsR = parseFloat(v.toFixed(2)); });
  }
  if (activeIndicators.has('adx')) {
    const vals = computeADX(highs, lows, closes);
    vals.adx.forEach((v, i) => { if (!isNaN(v)) enriched[i < enriched.length ? i : enriched.length - 1].adxVal = parseFloat(v.toFixed(2)); });
  }
  if (activeIndicators.has('cci')) {
    const vals = computeCCI(highs, lows, closes);
    vals.forEach((v, i) => { if (!isNaN(v)) enriched[i].cci = parseFloat(v.toFixed(2)); });
  }
  if (activeIndicators.has('momentum')) {
    const vals = computeMomentum(closes);
    vals.forEach((v, i) => { if (!isNaN(v)) enriched[i].momentum = parseFloat(v.toFixed(2)); });
  }
  if (activeIndicators.has('obv')) {
    const vals = computeOBV(closes);
    vals.forEach((v, i) => { enriched[i].obv = parseFloat(v.toFixed(2)); });
  }
  if (activeIndicators.has('mfi')) {
    const vals = computeMFI(highs, lows, closes);
    vals.forEach((v, i) => { if (!isNaN(v)) enriched[i].mfi = parseFloat(v.toFixed(2)); });
  }
  if (activeIndicators.has('awesomeOsc')) {
    const vals = computeAwesomeOscillator(highs, lows);
    vals.forEach((v, i) => { if (!isNaN(v)) enriched[i].ao = parseFloat(v.toFixed(2)); });
  }
  if (activeIndicators.has('stdDev')) {
    const vals = computeStdDev(closes);
    vals.forEach((v, i) => { if (!isNaN(v)) enriched[i].stddev = parseFloat(v.toFixed(2)); });
  }
  if (activeIndicators.has('demarker')) {
    const vals = computeDeMarker(highs, lows);
    vals.forEach((v, i) => { if (!isNaN(v)) enriched[i].demarker = parseFloat(v.toFixed(2)); });
  }
  if (activeIndicators.has('forceIndex')) {
    const vals = computeForceIndex(closes);
    vals.forEach((v, i) => { if (!isNaN(v)) enriched[i].force = parseFloat(v.toFixed(2)); });
  }
  if (activeIndicators.has('bullsPower')) {
    const vals = computeBullsPower(highs, closes);
    vals.forEach((v, i) => { if (!isNaN(v)) enriched[i].bulls = parseFloat(v.toFixed(2)); });
  }
  if (activeIndicators.has('bearsPower')) {
    const vals = computeBearsPower(lows, closes);
    vals.forEach((v, i) => { if (!isNaN(v)) enriched[i].bears = parseFloat(v.toFixed(2)); });
  }
  if (activeIndicators.has('osma')) {
    const vals = computeOsMA(closes);
    vals.forEach((v, i) => { if (!isNaN(v)) enriched[i].osma = parseFloat(v.toFixed(2)); });
  }
  if (activeIndicators.has('vwap')) {
    const vals = computeVWAP(highs, lows, closes);
    vals.forEach((v, i) => { if (!isNaN(v)) enriched[i].vwap = parseFloat(v.toFixed(2)); });
  }
  if (activeIndicators.has('pivotPoints')) {
    const pp = computePivotPoints(highs, lows, closes);
    pp.p.forEach((v, i) => { if (!isNaN(v)) enriched[i].pivotP = parseFloat(v.toFixed(2)); });
    pp.r1.forEach((v, i) => { if (!isNaN(v)) enriched[i].pivotR1 = parseFloat(v.toFixed(2)); });
    pp.r2.forEach((v, i) => { if (!isNaN(v)) enriched[i].pivotR2 = parseFloat(v.toFixed(2)); });
    pp.r3.forEach((v, i) => { if (!isNaN(v)) enriched[i].pivotR3 = parseFloat(v.toFixed(2)); });
    pp.s1.forEach((v, i) => { if (!isNaN(v)) enriched[i].pivotS1 = parseFloat(v.toFixed(2)); });
    pp.s2.forEach((v, i) => { if (!isNaN(v)) enriched[i].pivotS2 = parseFloat(v.toFixed(2)); });
    pp.s3.forEach((v, i) => { if (!isNaN(v)) enriched[i].pivotS3 = parseFloat(v.toFixed(2)); });
  }
  if (activeIndicators.has('donchian')) {
    const dc = computeDonchian(highs, lows);
    dc.upper.forEach((v, i) => { if (!isNaN(v)) enriched[i].donchianUpper = parseFloat(v.toFixed(2)); });
    dc.middle.forEach((v, i) => { if (!isNaN(v)) enriched[i].donchianMiddle = parseFloat(v.toFixed(2)); });
    dc.lower.forEach((v, i) => { if (!isNaN(v)) enriched[i].donchianLower = parseFloat(v.toFixed(2)); });
  }
  if (activeIndicators.has('keltner')) {
    const kc = computeKeltner(highs, lows, closes);
    kc.upper.forEach((v, i) => { if (!isNaN(v)) enriched[i].keltnerUpper = parseFloat(v.toFixed(2)); });
    kc.middle.forEach((v, i) => { if (!isNaN(v)) enriched[i].keltnerMiddle = parseFloat(v.toFixed(2)); });
    kc.lower.forEach((v, i) => { if (!isNaN(v)) enriched[i].keltnerLower = parseFloat(v.toFixed(2)); });
  }
  if (activeIndicators.has('cmf')) {
    const vals = computeCMF(highs, lows, closes);
    vals.forEach((v, i) => { if (!isNaN(v)) enriched[i].cmf = parseFloat(v.toFixed(4)); });
  }
  if (activeIndicators.has('adLine')) {
    const vals = computeADLine(highs, lows, closes);
    vals.forEach((v, i) => { if (!isNaN(v)) enriched[i].adLine = parseFloat(v.toFixed(2)); });
  }
  return enriched;
};

// ─── Render indicator lines as Recharts children ─────────

// Oscillator indicator keys — used to detect if oscillator panel should show
export const OSCILLATOR_KEYS: IndicatorKey[] = [
  'macd', 'stochRsi', 'williamsR', 'adx', 'atr', 'cci', 'momentum', 'obv',
  'mfi', 'awesomeOsc', 'stdDev', 'demarker', 'forceIndex', 'bullsPower', 'bearsPower', 'osma',
  'cmf', 'adLine',
];

export const hasActiveOscillators = (active: Set<IndicatorKey>): boolean =>
  OSCILLATOR_KEYS.some(k => active.has(k));

// ─── Render OVERLAY indicator lines only (on price Y-axis) ──
export const getIndicatorLines = (activeIndicators: Set<IndicatorKey>) => {
  const lines: JSX.Element[] = [];
  if (activeIndicators.has('sma20')) lines.push(<Line key="sma20" type="monotone" dataKey="sma20" stroke="hsl(43,72%,50%)" strokeWidth={1} dot={false} strokeDasharray="4 2" connectNulls />);
  if (activeIndicators.has('sma50')) lines.push(<Line key="sma50" type="monotone" dataKey="sma50" stroke="hsl(280,60%,60%)" strokeWidth={1} dot={false} strokeDasharray="4 2" connectNulls />);
  if (activeIndicators.has('ema20')) lines.push(<Line key="ema20" type="monotone" dataKey="ema20" stroke="hsl(170,70%,50%)" strokeWidth={1} dot={false} connectNulls />);
  if (activeIndicators.has('bollinger')) {
    lines.push(<Line key="bbU" type="monotone" dataKey="bbUpper" stroke="hsl(210,80%,60%)" strokeWidth={1} dot={false} strokeDasharray="3 3" connectNulls />);
    lines.push(<Line key="bbM" type="monotone" dataKey="bbMiddle" stroke="hsl(210,80%,60%)" strokeWidth={0.5} dot={false} strokeDasharray="2 4" connectNulls />);
    lines.push(<Line key="bbL" type="monotone" dataKey="bbLower" stroke="hsl(210,80%,60%)" strokeWidth={1} dot={false} strokeDasharray="3 3" connectNulls />);
  }
  if (activeIndicators.has('ichimoku')) {
    lines.push(<Line key="ichT" type="monotone" dataKey="ichTenkan" stroke="hsl(0,70%,55%)" strokeWidth={1} dot={false} connectNulls />);
    lines.push(<Line key="ichK" type="monotone" dataKey="ichKijun" stroke="hsl(210,70%,55%)" strokeWidth={1} dot={false} connectNulls />);
    lines.push(<Line key="ichA" type="monotone" dataKey="ichSenkouA" stroke="hsl(145,60%,45%)" strokeWidth={0.8} dot={false} strokeDasharray="2 2" connectNulls />);
    lines.push(<Line key="ichB" type="monotone" dataKey="ichSenkouB" stroke="hsl(0,60%,50%)" strokeWidth={0.8} dot={false} strokeDasharray="2 2" connectNulls />);
  }
  if (activeIndicators.has('parabolicSar')) lines.push(<Line key="psar" type="monotone" dataKey="psar" stroke="hsl(38,90%,55%)" strokeWidth={0} dot={{ r: 1.5, fill: 'hsl(38,90%,55%)' }} connectNulls />);
  if (activeIndicators.has('alligator')) {
    lines.push(<Line key="alJaw" type="monotone" dataKey="alJaw" stroke="hsl(217,91%,60%)" strokeWidth={1.5} dot={false} connectNulls />);
    lines.push(<Line key="alTeeth" type="monotone" dataKey="alTeeth" stroke="hsl(0,70%,55%)" strokeWidth={1} dot={false} connectNulls />);
    lines.push(<Line key="alLips" type="monotone" dataKey="alLips" stroke="hsl(145,70%,50%)" strokeWidth={1} dot={false} connectNulls />);
  }
  if (activeIndicators.has('envelopes')) {
    lines.push(<Line key="envU" type="monotone" dataKey="envUpper" stroke="hsl(300,50%,55%)" strokeWidth={1} dot={false} strokeDasharray="4 3" connectNulls />);
    lines.push(<Line key="envM" type="monotone" dataKey="envMiddle" stroke="hsl(300,50%,55%)" strokeWidth={0.5} dot={false} strokeDasharray="2 4" connectNulls />);
    lines.push(<Line key="envL" type="monotone" dataKey="envLower" stroke="hsl(300,50%,55%)" strokeWidth={1} dot={false} strokeDasharray="4 3" connectNulls />);
  }
  if (activeIndicators.has('vwap')) {
    lines.push(<Line key="vwap" type="monotone" dataKey="vwap" stroke="hsl(45,85%,55%)" strokeWidth={1.5} dot={false} connectNulls />);
  }
  if (activeIndicators.has('pivotPoints')) {
    lines.push(<Line key="pivP" type="monotone" dataKey="pivotP" stroke="hsl(200,70%,60%)" strokeWidth={1} dot={false} strokeDasharray="6 3" connectNulls />);
    lines.push(<Line key="pivR1" type="monotone" dataKey="pivotR1" stroke="hsl(0,65%,55%)" strokeWidth={0.8} dot={false} strokeDasharray="4 4" connectNulls />);
    lines.push(<Line key="pivR2" type="monotone" dataKey="pivotR2" stroke="hsl(0,65%,55%)" strokeWidth={0.6} dot={false} strokeDasharray="3 5" connectNulls />);
    lines.push(<Line key="pivR3" type="monotone" dataKey="pivotR3" stroke="hsl(0,65%,55%)" strokeWidth={0.5} dot={false} strokeDasharray="2 6" connectNulls />);
    lines.push(<Line key="pivS1" type="monotone" dataKey="pivotS1" stroke="hsl(145,60%,50%)" strokeWidth={0.8} dot={false} strokeDasharray="4 4" connectNulls />);
    lines.push(<Line key="pivS2" type="monotone" dataKey="pivotS2" stroke="hsl(145,60%,50%)" strokeWidth={0.6} dot={false} strokeDasharray="3 5" connectNulls />);
    lines.push(<Line key="pivS3" type="monotone" dataKey="pivotS3" stroke="hsl(145,60%,50%)" strokeWidth={0.5} dot={false} strokeDasharray="2 6" connectNulls />);
  }
  if (activeIndicators.has('donchian')) {
    lines.push(<Line key="dcU" type="monotone" dataKey="donchianUpper" stroke="hsl(160,65%,50%)" strokeWidth={1} dot={false} connectNulls />);
    lines.push(<Line key="dcM" type="monotone" dataKey="donchianMiddle" stroke="hsl(160,65%,50%)" strokeWidth={0.5} dot={false} strokeDasharray="3 4" connectNulls />);
    lines.push(<Line key="dcL" type="monotone" dataKey="donchianLower" stroke="hsl(160,65%,50%)" strokeWidth={1} dot={false} connectNulls />);
  }
  if (activeIndicators.has('keltner')) {
    lines.push(<Line key="kcU" type="monotone" dataKey="keltnerUpper" stroke="hsl(320,60%,55%)" strokeWidth={1} dot={false} connectNulls />);
    lines.push(<Line key="kcM" type="monotone" dataKey="keltnerMiddle" stroke="hsl(320,60%,55%)" strokeWidth={1.2} dot={false} connectNulls />);
    lines.push(<Line key="kcL" type="monotone" dataKey="keltnerLower" stroke="hsl(320,60%,55%)" strokeWidth={1} dot={false} connectNulls />);
  }
  return lines;
};

// ─── Oscillator panel data keys + config ─────────────────
interface OscillatorConfig {
  key: IndicatorKey;
  dataKeys: { key: string; color: string; dash?: string }[];
  domain?: [number, number];
  refLines?: { y: number; color: string; label: string }[];
  label: string;
}

const OSCILLATOR_CONFIGS: OscillatorConfig[] = [
  { key: 'macd', label: 'MACD', dataKeys: [{ key: 'macdLine', color: 'hsl(217,91%,60%)' }, { key: 'macdSignal', color: 'hsl(0,70%,55%)', dash: '3 3' }, { key: 'macdHist', color: 'hsl(145,60%,45%)' }] },
  { key: 'stochRsi', label: 'Stoch RSI', dataKeys: [{ key: 'stochRsi', color: 'hsl(262,83%,58%)' }], domain: [0, 100], refLines: [{ y: 20, color: 'hsl(145,60%,45%)', label: '20' }, { y: 80, color: 'hsl(0,70%,55%)', label: '80' }] },
  { key: 'williamsR', label: 'Williams %R', dataKeys: [{ key: 'williamsR', color: 'hsl(340,70%,55%)' }], domain: [-100, 0], refLines: [{ y: -20, color: 'hsl(0,70%,55%)', label: '-20' }, { y: -80, color: 'hsl(145,60%,45%)', label: '-80' }] },
  { key: 'adx', label: 'ADX', dataKeys: [{ key: 'adxVal', color: 'hsl(25,95%,53%)' }], domain: [0, 100], refLines: [{ y: 25, color: 'hsl(43,72%,50%)', label: '25' }] },
  { key: 'atr', label: 'ATR', dataKeys: [{ key: 'atr', color: 'hsl(145,60%,45%)' }] },
  { key: 'cci', label: 'CCI', dataKeys: [{ key: 'cci', color: 'hsl(190,80%,50%)' }], refLines: [{ y: 100, color: 'hsl(0,70%,55%)', label: '+100' }, { y: -100, color: 'hsl(145,60%,45%)', label: '-100' }] },
  { key: 'momentum', label: 'Momentum', dataKeys: [{ key: 'momentum', color: 'hsl(30,90%,55%)' }], refLines: [{ y: 0, color: 'hsl(40,25%,96%)', label: '0' }] },
  { key: 'obv', label: 'OBV', dataKeys: [{ key: 'obv', color: 'hsl(120,50%,50%)' }] },
  { key: 'mfi', label: 'MFI', dataKeys: [{ key: 'mfi', color: 'hsl(55,70%,50%)' }], domain: [0, 100], refLines: [{ y: 20, color: 'hsl(145,60%,45%)', label: '20' }, { y: 80, color: 'hsl(0,70%,55%)', label: '80' }] },
  { key: 'awesomeOsc', label: 'Awesome', dataKeys: [{ key: 'ao', color: 'hsl(145,70%,45%)' }], refLines: [{ y: 0, color: 'hsl(40,25%,96%)', label: '0' }] },
  { key: 'stdDev', label: 'Std Dev', dataKeys: [{ key: 'stddev', color: 'hsl(200,60%,55%)' }] },
  { key: 'demarker', label: 'DeMarker', dataKeys: [{ key: 'demarker', color: 'hsl(350,65%,55%)' }], domain: [0, 1], refLines: [{ y: 0.3, color: 'hsl(145,60%,45%)', label: '0.3' }, { y: 0.7, color: 'hsl(0,70%,55%)', label: '0.7' }] },
  { key: 'forceIndex', label: 'Force', dataKeys: [{ key: 'force', color: 'hsl(280,70%,55%)' }], refLines: [{ y: 0, color: 'hsl(40,25%,96%)', label: '0' }] },
  { key: 'bullsPower', label: 'Bulls', dataKeys: [{ key: 'bulls', color: 'hsl(145,70%,50%)' }], refLines: [{ y: 0, color: 'hsl(40,25%,96%)', label: '0' }] },
  { key: 'bearsPower', label: 'Bears', dataKeys: [{ key: 'bears', color: 'hsl(0,70%,55%)' }], refLines: [{ y: 0, color: 'hsl(40,25%,96%)', label: '0' }] },
  { key: 'osma', label: 'OsMA', dataKeys: [{ key: 'osma', color: 'hsl(40,80%,50%)' }], refLines: [{ y: 0, color: 'hsl(40,25%,96%)', label: '0' }] },
  { key: 'cmf', label: 'CMF', dataKeys: [{ key: 'cmf', color: 'hsl(180,70%,45%)' }], domain: [-1, 1], refLines: [{ y: 0, color: 'hsl(40,25%,96%)', label: '0' }] },
  { key: 'adLine', label: 'A/D Line', dataKeys: [{ key: 'adLine', color: 'hsl(90,55%,50%)' }] },
];




interface OscillatorPanelProps {
  data: ChartDataPoint[];
  activeIndicators: Set<IndicatorKey>;
}

export const OscillatorPanel = ({ data, activeIndicators }: OscillatorPanelProps) => {
  const activeOscillators = OSCILLATOR_CONFIGS.filter(c => activeIndicators.has(c.key));
  if (activeOscillators.length === 0) return null;

  return (
    <div className="flex flex-col gap-0.5 w-full">
      {activeOscillators.map((osc) => {
        // Compute Y domain
        let domain: [any, any] = ['auto', 'auto'];
        if (osc.domain) {
          domain = osc.domain;
        } else {
          // Auto-scale from data
          const allVals = osc.dataKeys.flatMap(dk => data.map(d => d[dk.key] as number).filter(v => v !== undefined && !isNaN(v)));
          if (allVals.length > 0) {
            const min = Math.min(...allVals);
            const max = Math.max(...allVals);
            const pad = (max - min) * 0.1 || 1;
            domain = [min - pad, max + pad];
          }
        }

        return (
          <div key={osc.key} className="w-full" style={{ height: '100px' }}>
            <div className="flex items-center px-2 py-0.5 border-t border-gold/10">
              <span className="text-[8px] font-mono tracking-wider text-marble/30">{osc.label}</span>
            </div>
            <ResponsiveContainer width="100%" height="85%">
              <ComposedChart data={data} margin={{ top: 2, right: 5, left: 10, bottom: 2 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(213,28%,24%)" strokeOpacity={0.5} />
                <XAxis dataKey="time" tick={false} axisLine={{ stroke: 'hsl(213,28%,24%)' }} tickLine={false} height={1} />
                <YAxis
                  domain={domain}
                  tick={{ fontSize: 8, fill: 'hsl(40,25%,96%,0.15)' }}
                  axisLine={false}
                  tickLine={false}
                  width={50}
                  tickFormatter={(v: number) => typeof v === 'number' ? (Math.abs(v) >= 1000 ? `${(v / 1000).toFixed(1)}k` : v.toFixed(v < 1 && v > -1 ? 2 : 1)) : ''}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    return (
                      <div className="bg-navy-dark border border-gold/30 rounded px-2 py-1 shadow-lg">
                        {payload.map((p: any) => (
                          <p key={p.dataKey} className="text-[9px] font-mono" style={{ color: p.stroke }}>
                            {p.name}: {typeof p.value === 'number' ? p.value.toFixed(2) : p.value}
                          </p>
                        ))}
                      </div>
                    );
                  }}
                />
                {osc.refLines?.map((rl) => (
                  <ReferenceLine
                    key={`${osc.key}-ref-${rl.y}`}
                    y={rl.y}
                    stroke={rl.color}
                    strokeDasharray="4 4"
                    strokeWidth={0.5}
                    strokeOpacity={0.4}
                    label={{ value: rl.label, position: 'right', fill: rl.color, fontSize: 7, opacity: 0.6 }}
                  />
                ))}
                {osc.dataKeys.map((dk) => (
                  <Line
                    key={dk.key}
                    type="monotone"
                    dataKey={dk.key}
                    stroke={dk.color}
                    strokeWidth={1.2}
                    dot={false}
                    connectNulls
                    isAnimationActive={false}
                    strokeDasharray={dk.dash}
                    name={dk.key}
                  />
                ))}
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        );
      })}
    </div>
  );
};

export const getFibonacciLines = (activeIndicators: Set<IndicatorKey>, data: ChartDataPoint[]) => {
  if (!activeIndicators.has('fibonacci') || !data.length) return [];
  const closes = data.map(d => d.value);
  const max = Math.max(...closes);
  const min = Math.min(...closes);
  const diff = max - min;
  const levels = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1];
  return levels.map(l => {
    const val = max - diff * l;
    return (
      <ReferenceLine
        key={`fib-${l}`}
        y={val}
        stroke="hsl(43,72%,50%)"
        strokeDasharray="3 6"
        strokeWidth={0.5}
        strokeOpacity={0.4}
        label={{ value: `${(l * 100).toFixed(1)}%`, position: 'right', fill: 'hsl(43,72%,50%)', fontSize: 7 }}
      />
    );
  });
};
