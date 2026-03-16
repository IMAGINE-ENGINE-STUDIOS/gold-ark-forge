import {
  computeADX,
  computeBollingerBands,
  computeCCI,
  computeEMA,
  computeMACD,
  computeMomentum,
  computeRSI,
  computeSMA,
  computeWilliamsR,
} from '@/components/trading/IndicatorOverlay';

export type TechnicalSignalLabel = 'Buy' | 'Sell' | 'Neutral';
export type TechnicalDirection = 'bullish' | 'bearish' | 'neutral';

export interface TechnicalSignalRow {
  name: string;
  value: number;
  signal: TechnicalSignalLabel;
}

export interface TechnicalDecision {
  direction: TechnicalDirection;
  confidence: number;
  setup: string;
  aligned: boolean;
  regime: 'trend' | 'range' | 'mixed';
}

export interface TechnicalSnapshot {
  oscillators: TechnicalSignalRow[];
  movingAverages: TechnicalSignalRow[];
  totalBuy: number;
  totalSell: number;
  totalNeutral: number;
  overallSignal: 'STRONG BUY' | 'BUY' | 'NEUTRAL' | 'SELL' | 'STRONG SELL';
  overallBias: number;
  score: number;
  currentPrice: number;
  decision: TechnicalDecision;
}

export interface TechnicalCandleInput {
  closes: number[];
  highs: number[];
  lows: number[];
}

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
const lastFinite = (values: number[], fallback: number) => {
  for (let i = values.length - 1; i >= 0; i--) {
    if (Number.isFinite(values[i])) return values[i];
  }
  return fallback;
};

const computeStochasticK = (highs: number[], lows: number[], closes: number[], period = 14) => {
  if (closes.length < period) return 50;
  const highSlice = highs.slice(-period);
  const lowSlice = lows.slice(-period);
  const close = closes[closes.length - 1];
  const highest = Math.max(...highSlice);
  const lowest = Math.min(...lowSlice);
  if (highest === lowest) return 50;
  return ((close - lowest) / (highest - lowest)) * 100;
};

const maSignal = (currentPrice: number, value: number): TechnicalSignalLabel => {
  const distance = Math.abs(currentPrice - value) / Math.max(currentPrice, 1);
  if (distance < 0.0005) return 'Neutral';
  return currentPrice > value ? 'Buy' : 'Sell';
};

const countSignals = (items: TechnicalSignalRow[]) => {
  const buy = items.filter((item) => item.signal === 'Buy').length;
  const sell = items.filter((item) => item.signal === 'Sell').length;
  return { buy, sell, neutral: items.length - buy - sell };
};

export function buildTechnicalSnapshot(input: TechnicalCandleInput): TechnicalSnapshot | null {
  const closes = input.closes.filter((value) => Number.isFinite(value));
  if (closes.length < 30) return null;

  const highs = input.highs.length === closes.length
    ? input.highs
    : closes.map((close, index) => Math.max(close, closes[Math.max(0, index - 1)] ?? close, closes[Math.max(0, index - 2)] ?? close));
  const lows = input.lows.length === closes.length
    ? input.lows
    : closes.map((close, index) => Math.min(close, closes[Math.max(0, index - 1)] ?? close, closes[Math.max(0, index - 2)] ?? close));

  const currentPrice = closes[closes.length - 1];
  const rsi = lastFinite(computeRSI(closes, 14), 50);
  const stochastic = computeStochasticK(highs, lows, closes, 14);
  const cci = lastFinite(computeCCI(highs, lows, closes, 20), 0);
  const adxPack = computeADX(highs, lows, closes, 14);
  const adx = lastFinite(adxPack.adx, 18);
  const plusDI = lastFinite(adxPack.plusDI, 0);
  const minusDI = lastFinite(adxPack.minusDI, 0);
  const momentum = lastFinite(computeMomentum(closes, 10), 0);
  const macdPack = computeMACD(closes);
  const macdLevel = lastFinite(macdPack.macd, 0) - lastFinite(macdPack.signal, 0);
  const williams = lastFinite(computeWilliamsR(highs, lows, closes, 14), -50);
  const boll = computeBollingerBands(closes, 20, 2);
  const bollUpper = lastFinite(boll.upper, currentPrice);
  const bollLower = lastFinite(boll.lower, currentPrice);
  const bollMiddle = lastFinite(boll.middle, currentPrice);
  const ultimate = clamp(rsi * 0.4 + stochastic * 0.35 + (williams + 100) * 0.25, 0, 100);

  const ema10 = lastFinite(computeEMA(closes, 10), currentPrice);
  const sma10 = lastFinite(computeSMA(closes, 10), currentPrice);
  const ema20 = lastFinite(computeEMA(closes, 20), currentPrice);
  const sma20 = lastFinite(computeSMA(closes, 20), currentPrice);
  const ema50 = lastFinite(computeEMA(closes, 50), currentPrice);
  const sma50 = lastFinite(computeSMA(closes, 50), currentPrice);
  const ema100 = lastFinite(computeEMA(closes, 100), currentPrice);
  const sma200 = lastFinite(computeSMA(closes, 200), currentPrice);

  const oscillators: TechnicalSignalRow[] = [
    { name: 'RSI (14)', value: rsi, signal: rsi < 30 ? 'Buy' : rsi > 70 ? 'Sell' : 'Neutral' },
    { name: 'Stochastic %K', value: stochastic, signal: stochastic < 20 ? 'Buy' : stochastic > 80 ? 'Sell' : 'Neutral' },
    { name: 'CCI (20)', value: cci, signal: cci < -100 ? 'Buy' : cci > 100 ? 'Sell' : 'Neutral' },
    { name: 'ADX (14)', value: adx, signal: adx < 20 ? 'Neutral' : plusDI > minusDI ? 'Buy' : 'Sell' },
    { name: 'Momentum (10)', value: momentum, signal: momentum > 0 ? 'Buy' : momentum < 0 ? 'Sell' : 'Neutral' },
    { name: 'MACD Level', value: macdLevel, signal: macdLevel > 0 ? 'Buy' : macdLevel < 0 ? 'Sell' : 'Neutral' },
    { name: 'Williams %R', value: williams, signal: williams < -80 ? 'Buy' : williams > -20 ? 'Sell' : 'Neutral' },
    { name: 'Ultimate Osc.', value: ultimate, signal: ultimate > 55 ? 'Buy' : ultimate < 45 ? 'Sell' : 'Neutral' },
  ];

  const movingAverages: TechnicalSignalRow[] = [
    { name: 'EMA (10)', value: ema10, signal: maSignal(currentPrice, ema10) },
    { name: 'SMA (10)', value: sma10, signal: maSignal(currentPrice, sma10) },
    { name: 'EMA (20)', value: ema20, signal: maSignal(currentPrice, ema20) },
    { name: 'SMA (20)', value: sma20, signal: maSignal(currentPrice, sma20) },
    { name: 'EMA (50)', value: ema50, signal: maSignal(currentPrice, ema50) },
    { name: 'SMA (50)', value: sma50, signal: maSignal(currentPrice, sma50) },
    { name: 'EMA (100)', value: ema100, signal: maSignal(currentPrice, ema100) },
    { name: 'SMA (200)', value: sma200, signal: maSignal(currentPrice, sma200) },
  ];

  const oscCount = countSignals(oscillators);
  const maCount = countSignals(movingAverages);
  const totalBuy = oscCount.buy + maCount.buy;
  const totalSell = oscCount.sell + maCount.sell;
  const totalNeutral = oscCount.neutral + maCount.neutral;
  const total = totalBuy + totalSell + totalNeutral;
  const overallBias = total > 0 ? (totalBuy - totalSell) / total : 0;
  const score = overallBias * 90;

  const overallSignal = totalBuy >= totalSell + 5 ? 'STRONG BUY'
    : totalBuy > totalSell ? 'BUY'
    : totalSell >= totalBuy + 5 ? 'STRONG SELL'
    : totalSell > totalBuy ? 'SELL'
    : 'NEUTRAL';

  const trendBull = currentPrice > ema20 && ema20 > sma50 && sma50 > sma200;
  const trendBear = currentPrice < ema20 && ema20 < sma50 && sma50 < sma200;
  const momentumBull = macdLevel > 0 && rsi >= 52 && momentum > 0;
  const momentumBear = macdLevel < 0 && rsi <= 48 && momentum < 0;
  const lowerBandTouch = currentPrice <= bollLower + (bollUpper - bollLower) * 0.18;
  const upperBandTouch = currentPrice >= bollUpper - (bollUpper - bollLower) * 0.18;
  const rangeBull = adx < 18 && lowerBandTouch && rsi <= 35 && stochastic <= 25 && williams <= -75;
  const rangeBear = adx < 18 && upperBandTouch && rsi >= 65 && stochastic >= 75 && williams >= -25;

  let direction: TechnicalDirection = 'neutral';
  let confidence = 0.5;
  let setup = 'NO CLEAN SETUP';
  let regime: TechnicalDecision['regime'] = 'mixed';

  if (adx >= 22 && trendBull && momentumBull) {
    direction = 'bullish';
    confidence = clamp(0.72 + Math.min((adx - 22) / 100, 0.12) + Math.max(overallBias, 0) * 0.08, 0.72, 0.94);
    setup = 'TREND FOLLOW LONG';
    regime = 'trend';
  } else if (adx >= 22 && trendBear && momentumBear) {
    direction = 'bearish';
    confidence = clamp(0.72 + Math.min((adx - 22) / 100, 0.12) + Math.max(-overallBias, 0) * 0.08, 0.72, 0.94);
    setup = 'TREND FOLLOW SHORT';
    regime = 'trend';
  } else if (rangeBull) {
    direction = 'bullish';
    confidence = clamp(0.64 + Math.max(0, (35 - rsi) / 100) + Math.max(0, (25 - stochastic) / 200), 0.64, 0.84);
    setup = 'RANGE REVERSAL LONG';
    regime = 'range';
  } else if (rangeBear) {
    direction = 'bearish';
    confidence = clamp(0.64 + Math.max(0, (rsi - 65) / 100) + Math.max(0, (stochastic - 75) / 200), 0.64, 0.84);
    setup = 'RANGE REVERSAL SHORT';
    regime = 'range';
  }

  return {
    oscillators,
    movingAverages,
    totalBuy,
    totalSell,
    totalNeutral,
    overallSignal,
    overallBias,
    score,
    currentPrice,
    decision: {
      direction,
      confidence,
      setup,
      aligned: direction !== 'neutral',
      regime,
    },
  };
}
