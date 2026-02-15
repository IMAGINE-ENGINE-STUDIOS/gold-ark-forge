import { useMemo, useState } from 'react';
import { Line, ReferenceLine } from 'recharts';

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
      const flow = tp[j] * (1000 + Math.random() * 500); // synthetic volume
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
  // Jaw (blue): 13-period SMMA shifted 8 bars forward
  const jaw = computeSMA(midpoints, 13);
  // Teeth (red): 8-period SMMA shifted 5 bars forward
  const teeth = computeSMA(midpoints, 8);
  // Lips (green): 5-period SMMA shifted 3 bars forward
  const lips = computeSMA(midpoints, 5);
  return { jaw, teeth, lips };
};

export const computeEnvelopes = (prices: number[], period = 20, deviation = 0.1) => {
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

// ─── Available indicator definitions ─────────────────────

export type IndicatorKey =
  | 'bollinger' | 'macd' | 'atr' | 'parabolicSar' | 'ichimoku'
  | 'fibonacci' | 'stochRsi' | 'williamsR' | 'adx' | 'sma20' | 'sma50' | 'ema20'
  | 'cci' | 'momentum' | 'obv' | 'mfi' | 'awesomeOsc' | 'alligator'
  | 'envelopes' | 'stdDev' | 'demarker' | 'forceIndex' | 'bullsPower' | 'bearsPower' | 'osma';

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
];

// ─── Indicator Toggle Bar ────────────────────────────────

interface IndicatorToggleBarProps {
  active: Set<IndicatorKey>;
  onToggle: (key: IndicatorKey) => void;
}

export const IndicatorToggleBar = ({ active, onToggle }: IndicatorToggleBarProps) => (
  <div className="flex gap-1 overflow-x-auto py-1 px-2 scrollbar-hide">
    {INDICATORS.map((ind) => (
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
  </div>
);

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
  return enriched;
};

// ─── Render indicator lines as Recharts children ─────────

export const getIndicatorLines = (activeIndicators: Set<IndicatorKey>) => {
  const lines: JSX.Element[] = [];

  if (activeIndicators.has('sma20')) {
    lines.push(<Line key="sma20" type="monotone" dataKey="sma20" stroke="hsl(43,72%,50%)" strokeWidth={1} dot={false} strokeDasharray="4 2" connectNulls />);
  }
  if (activeIndicators.has('sma50')) {
    lines.push(<Line key="sma50" type="monotone" dataKey="sma50" stroke="hsl(280,60%,60%)" strokeWidth={1} dot={false} strokeDasharray="4 2" connectNulls />);
  }
  if (activeIndicators.has('ema20')) {
    lines.push(<Line key="ema20" type="monotone" dataKey="ema20" stroke="hsl(170,70%,50%)" strokeWidth={1} dot={false} connectNulls />);
  }
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
  if (activeIndicators.has('parabolicSar')) {
    lines.push(<Line key="psar" type="monotone" dataKey="psar" stroke="hsl(38,90%,55%)" strokeWidth={0} dot={{ r: 1.5, fill: 'hsl(38,90%,55%)' }} connectNulls />);
  }
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

  return lines;
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
