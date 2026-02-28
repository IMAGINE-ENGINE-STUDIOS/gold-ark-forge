import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import {
  computeSMA, computeEMA, computeRSI, computeStochRSI, computeMACD,
  computeATR, computeBollingerBands, computeParabolicSAR, computeIchimoku,
  computeCCI, computeMomentum, computeOBV, computeMFI, computeAwesomeOscillator,
  computeAlligator, computeStdDev, computeForceIndex, computeADLine, computeCMF,
  computeDonchian, computeKeltner,
} from '@/components/trading/IndicatorOverlay';

// ─── Types ───────────────────────────────────────────────

export type StrategyPreset = 'conservative' | 'balanced' | 'aggressive' | 'wave_first';

export interface BotConfig {
  enabled: boolean;
  strategy: StrategyPreset;
  scanIntervalSec: number;
  maxPositions: number;
  riskPerTradePct: number;
  stopLossAtrMult: number;
  takeProfitAtrMult: number;
}

export interface SignalBreakdown {
  trend: number;
  momentum: number;
  volatility: number;
  volume: number;
  wave: number;
  composite: number;
}

export interface BotDecision {
  id: string;
  timestamp: number;
  symbol: string;
  signal: SignalBreakdown;
  action: 'BUY' | 'SELL' | 'HOLD' | 'EXIT';
  reason: string;
  executed: boolean;
  qty?: number;
  price?: number;
}

export interface BotStats {
  totalDecisions: number;
  totalExecutions: number;
  botPnl: number;
  activeSince: number | null;
}

// ─── Strategy Presets ────────────────────────────────────

const STRATEGY_CONFIGS: Record<StrategyPreset, {
  entryThreshold: number;
  weakEntryThreshold: number;
  exitThreshold: number;
  positionSizeMult: number;
  weights: { trend: number; momentum: number; volatility: number; volume: number; wave: number };
}> = {
  conservative: {
    entryThreshold: 0.65,
    weakEntryThreshold: 999, // never weak-enter
    exitThreshold: -0.3,
    positionSizeMult: 0.5,
    weights: { trend: 0.30, momentum: 0.25, volatility: 0.15, volume: 0.15, wave: 0.15 },
  },
  balanced: {
    entryThreshold: 0.55,
    weakEntryThreshold: 0.25,
    exitThreshold: -0.25,
    positionSizeMult: 1.0,
    weights: { trend: 0.30, momentum: 0.25, volatility: 0.15, volume: 0.15, wave: 0.15 },
  },
  aggressive: {
    entryThreshold: 0.35,
    weakEntryThreshold: 0.15,
    exitThreshold: -0.15,
    positionSizeMult: 1.5,
    weights: { trend: 0.30, momentum: 0.25, volatility: 0.15, volume: 0.15, wave: 0.15 },
  },
  wave_first: {
    entryThreshold: 0.50,
    weakEntryThreshold: 0.20,
    exitThreshold: -0.20,
    positionSizeMult: 1.0,
    weights: { trend: 0.18, momentum: 0.15, volatility: 0.12, volume: 0.15, wave: 0.40 },
  },
};

// ─── Signal Computation ──────────────────────────────────

export function computeCompositeSignal(
  closes: number[],
  highs: number[],
  lows: number[],
  waveBias: number,
  weights: { trend: number; momentum: number; volatility: number; volume: number; wave: number },
): SignalBreakdown {
  if (closes.length < 52) {
    return { trend: 0, momentum: 0, volatility: 0, volume: 0, wave: waveBias, composite: waveBias * weights.wave };
  }

  const last = closes[closes.length - 1];

  // ── TREND GROUP ──
  const sma20 = computeSMA(closes, 20);
  const sma50 = computeSMA(closes, 50);
  const ema20 = computeEMA(closes, 20);
  const ichimoku = computeIchimoku(highs, lows);
  const alligator = computeAlligator(highs, lows);
  const sar = computeParabolicSAR(highs, lows);

  const latestSma20 = sma20[sma20.length - 1] || last;
  const latestSma50 = sma50[sma50.length - 1] || last;
  const latestEma20 = ema20[ema20.length - 1] || last;
  const prevSma20 = sma20[sma20.length - 2] || latestSma20;
  const prevSma50 = sma50[sma50.length - 2] || latestSma50;

  // SMA cross signal
  const smaCrossNow = latestSma20 - latestSma50;
  const smaCrossPrev = prevSma20 - prevSma50;
  const smaCrossSignal = smaCrossNow > 0 ? (smaCrossPrev <= 0 ? 1 : 0.5) : (smaCrossPrev >= 0 ? -1 : -0.5);

  // Price above/below EMA
  const emaSignal = clamp((last - latestEma20) / (last * 0.01), -1, 1);

  // Ichimoku: price vs cloud
  const senkouA = ichimoku.senkouA[ichimoku.senkouA.length - 1] || last;
  const senkouB = ichimoku.senkouB[ichimoku.senkouB.length - 1] || last;
  const cloudTop = Math.max(senkouA, senkouB);
  const cloudBot = Math.min(senkouA, senkouB);
  const cloudRange = cloudTop - cloudBot || 1;
  const ichSignal = last > cloudTop ? clamp((last - cloudTop) / cloudRange, 0, 1) :
    last < cloudBot ? clamp((last - cloudBot) / cloudRange, -1, 0) : 0;

  // Alligator: lips > teeth > jaw = bullish
  const aJaw = alligator.jaw[alligator.jaw.length - 1] || last;
  const aTeeth = alligator.teeth[alligator.teeth.length - 1] || last;
  const aLips = alligator.lips[alligator.lips.length - 1] || last;
  const alligatorSignal = (aLips > aTeeth && aTeeth > aJaw) ? 0.7 :
    (aLips < aTeeth && aTeeth < aJaw) ? -0.7 : 0;

  // SAR
  const latestSar = sar[sar.length - 1] || last;
  const sarSignal = last > latestSar ? 0.5 : -0.5;

  const trendScore = clamp(
    (smaCrossSignal * 0.25 + emaSignal * 0.2 + ichSignal * 0.2 + alligatorSignal * 0.2 + sarSignal * 0.15),
    -1, 1
  );

  // ── MOMENTUM GROUP ──
  const rsi = computeRSI(closes);
  const stochRsi = computeStochRSI(closes);
  const macd = computeMACD(closes);
  const cci = computeCCI(highs, lows, closes);
  const mom = computeMomentum(closes);
  const ao = computeAwesomeOscillator(highs, lows);

  const latestRsi = rsi[rsi.length - 1] ?? 50;
  const rsiSignal = latestRsi < 30 ? clamp((30 - latestRsi) / 20, 0, 1) :
    latestRsi > 70 ? clamp((70 - latestRsi) / 20, -1, 0) :
    (latestRsi - 50) / 50;

  const latestStochRsi = stochRsi[stochRsi.length - 1] ?? 50;
  const stochSignal = latestStochRsi < 20 ? 0.8 : latestStochRsi > 80 ? -0.8 : (latestStochRsi - 50) / 62.5;

  const macdVal = macd.macd[macd.macd.length - 1] ?? 0;
  const macdSig = macd.signal[macd.signal.length - 1] ?? 0;
  const macdHist = macd.histogram[macd.histogram.length - 1] ?? 0;
  const atr14 = computeATR(highs, lows, closes);
  const latestAtr = atr14[atr14.length - 1] || last * 0.01;
  const macdSignal2 = clamp((macdVal - macdSig) / latestAtr, -1, 1) * 0.6 + (macdHist > 0 ? 0.2 : -0.2);

  const latestCci = cci[cci.length - 1] ?? 0;
  const cciSignal = clamp(latestCci / 200, -1, 1);

  const latestMom = mom[mom.length - 1] ?? 0;
  const momSignal = clamp(latestMom / latestAtr, -1, 1);

  const latestAo = ao[ao.length - 1] ?? 0;
  const aoSignal = clamp(latestAo / latestAtr, -1, 1);

  const momentumScore = clamp(
    (rsiSignal * 0.2 + stochSignal * 0.15 + macdSignal2 * 0.25 + cciSignal * 0.15 + momSignal * 0.1 + aoSignal * 0.15),
    -1, 1
  );

  // ── VOLATILITY GROUP ──
  const boll = computeBollingerBands(closes);
  const stdDev = computeStdDev(closes);
  const donchian = computeDonchian(highs, lows);
  const keltner = computeKeltner(highs, lows, closes);

  const bollUpper = boll.upper[boll.upper.length - 1] || last;
  const bollLower = boll.lower[boll.lower.length - 1] || last;
  const bollRange = bollUpper - bollLower || 1;
  const bollPos = (last - bollLower) / bollRange;
  const bollSignal = clamp((0.5 - bollPos) * 2, -1, 1); // Mean reversion

  const donchUpper = donchian.upper[donchian.upper.length - 1] || last;
  const donchLower = donchian.lower[donchian.lower.length - 1] || last;
  const donchBreakUp = last >= donchUpper ? 0.8 : 0;
  const donchBreakDn = last <= donchLower ? -0.8 : 0;
  const donchSignal = donchBreakUp + donchBreakDn;

  const keltUpper = keltner.upper[keltner.upper.length - 1] || last;
  const keltLower = keltner.lower[keltner.lower.length - 1] || last;
  const keltRange = keltUpper - keltLower || 1;
  const keltSignal = clamp((0.5 - (last - keltLower) / keltRange) * 2, -1, 1);

  const atrNormalized = latestAtr / last;
  const atrSignal = atrNormalized > 0.03 ? -0.3 : atrNormalized < 0.005 ? 0.3 : 0; // High vol = caution

  const volatilityScore = clamp(
    (bollSignal * 0.3 + donchSignal * 0.25 + keltSignal * 0.2 + atrSignal * 0.25),
    -1, 1
  );

  // ── VOLUME GROUP ──
  const obv = computeOBV(closes);
  const mfi = computeMFI(highs, lows, closes);
  const cmf = computeCMF(highs, lows, closes);
  const adLine = computeADLine(highs, lows, closes);
  const forceIdx = computeForceIndex(closes);

  // OBV trend (slope of last 10)
  const obvSlice = obv.slice(-10);
  const obvSlope = obvSlice.length >= 2 ? (obvSlice[obvSlice.length - 1] - obvSlice[0]) / (obvSlice.length - 1) : 0;
  const obvSignal = clamp(obvSlope / 1000, -1, 1);

  const latestMfi = mfi[mfi.length - 1] ?? 50;
  const mfiSignal = latestMfi < 20 ? 0.8 : latestMfi > 80 ? -0.8 : (latestMfi - 50) / 62.5;

  const latestCmf = cmf[cmf.length - 1] ?? 0;
  const cmfSignal = clamp(latestCmf * 5, -1, 1);

  // A/D Line trend
  const adSlice = adLine.slice(-10);
  const adSlope = adSlice.length >= 2 ? (adSlice[adSlice.length - 1] - adSlice[0]) / (adSlice.length - 1) : 0;
  const adSignal = clamp(adSlope / 1000, -1, 1);

  const latestForce = forceIdx[forceIdx.length - 1] ?? 0;
  const forceSignal = clamp(latestForce / (latestAtr * 500), -1, 1);

  const volumeScore = clamp(
    (obvSignal * 0.25 + mfiSignal * 0.2 + cmfSignal * 0.2 + adSignal * 0.15 + forceSignal * 0.2),
    -1, 1
  );

  // ── COMPOSITE ──
  const waveScore = clamp(waveBias, -1, 1);
  const composite = clamp(
    trendScore * weights.trend +
    momentumScore * weights.momentum +
    volatilityScore * weights.volatility +
    volumeScore * weights.volume +
    waveScore * weights.wave,
    -1, 1
  );

  return {
    trend: round2(trendScore),
    momentum: round2(momentumScore),
    volatility: round2(volatilityScore),
    volume: round2(volumeScore),
    wave: round2(waveScore),
    composite: round2(composite),
  };
}

// ─── Risk Management ─────────────────────────────────────

function calculatePositionSize(
  equity: number,
  price: number,
  riskPct: number,
  atr: number,
  stopMultiplier: number,
  sizeMult: number,
  maxExposurePct: number,
): number {
  if (price <= 0 || equity <= 0 || atr <= 0) return 0;

  // Kelly-inspired sizing capped by risk percent
  const stopDistance = atr * stopMultiplier;
  const riskAmount = equity * (riskPct / 100);
  const kellyQty = riskAmount / stopDistance;

  // Max exposure limit
  const maxQtyByExposure = (equity * maxExposurePct) / price;

  const qty = Math.min(kellyQty * sizeMult, maxQtyByExposure);
  return Math.max(0, price < 10 ? parseFloat(qty.toFixed(4)) : Math.floor(qty));
}

// ─── Bot Settings Persistence ────────────────────────────

const BOT_SETTINGS_KEY = 'ga_bot_settings';

function loadBotConfig(): BotConfig {
  try {
    const raw = localStorage.getItem(BOT_SETTINGS_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return {
    enabled: false,
    strategy: 'balanced',
    scanIntervalSec: 10,
    maxPositions: 5,
    riskPerTradePct: 3,
    stopLossAtrMult: 1.5,
    takeProfitAtrMult: 2.5,
  };
}

function saveBotConfig(config: BotConfig) {
  try {
    localStorage.setItem(BOT_SETTINGS_KEY, JSON.stringify(config));
  } catch { /* ignore */ }
}

// ─── Main Hook ───────────────────────────────────────────

interface UseTradingBotParams {
  watchlistSymbols: string[];
  resolvePrice: (ticker: string) => number;
  getCandleData: (ticker: string) => { closes: number[]; highs: number[]; lows: number[] } | null;
  getWaveBias: (ticker: string) => number;
  submitOrder: (params: { symbol: string; side: 'buy' | 'sell'; qty: number; type: 'market'; price: number }) => void;
  closePosition: (posId: string, price: number) => void;
  positions: Array<{ id: string; symbol: string; side: 'buy' | 'sell'; qty: number; entryPrice: number; currentPrice: number; pnl: number }>;
  equity: number;
  cash: number;
  peakEquity: number;
}

export function useTradingBot(params: UseTradingBotParams) {
  const {
    watchlistSymbols, resolvePrice, getCandleData, getWaveBias,
    submitOrder, closePosition, positions, equity, cash, peakEquity,
  } = params;

  const [config, setConfig] = useState<BotConfig>(loadBotConfig);
  const [activityLog, setActivityLog] = useState<BotDecision[]>([]);
  const [stats, setStats] = useState<BotStats>({ totalDecisions: 0, totalExecutions: 0, botPnl: 0, activeSince: null });
  const cooldowns = useRef<Record<string, number>>({});
  const scanRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const strategyConfig = useMemo(() => STRATEGY_CONFIGS[config.strategy], [config.strategy]);

  // Persist config changes
  const updateConfig = useCallback((patch: Partial<BotConfig>) => {
    setConfig(prev => {
      const next = { ...prev, ...patch };
      saveBotConfig(next);
      return next;
    });
  }, []);

  // Kill switch: close all positions
  const killAll = useCallback(() => {
    positions.forEach(pos => {
      const price = resolvePrice(pos.symbol);
      if (price > 0) closePosition(pos.id, price);
    });
    updateConfig({ enabled: false });
  }, [positions, resolvePrice, closePosition, updateConfig]);

  // Core scan function
  const scan = useCallback(() => {
    if (!config.enabled) return;

    // Drawdown circuit breaker
    const drawdownPct = peakEquity > 0 ? ((equity - peakEquity) / peakEquity) * 100 : 0;
    if (drawdownPct < -10) {
      const decision: BotDecision = {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        symbol: '*',
        signal: { trend: 0, momentum: 0, volatility: 0, volume: 0, wave: 0, composite: 0 },
        action: 'HOLD',
        reason: `CIRCUIT BREAKER: Drawdown ${drawdownPct.toFixed(1)}% exceeds -10% limit`,
        executed: false,
      };
      addDecision(decision);
      updateConfig({ enabled: false });
      return;
    }

    const now = Date.now();
    const openSymbols = new Set(positions.map(p => p.symbol));

    for (const ticker of watchlistSymbols) {
      const price = resolvePrice(ticker);
      if (price <= 0) continue;

      const candleData = getCandleData(ticker);
      if (!candleData || candleData.closes.length < 30) continue;

      const waveBias = getWaveBias(ticker);
      const signal = computeCompositeSignal(
        candleData.closes, candleData.highs, candleData.lows,
        waveBias, strategyConfig.weights
      );

      // Check cooldown
      const lastTrade = cooldowns.current[ticker] || 0;
      const coolingDown = (now - lastTrade) < 30_000;

      // Existing position? Check for exit
      const existingPos = positions.find(p => p.symbol === ticker);
      if (existingPos) {
        const exitThreshold = strategyConfig.exitThreshold;
        const shouldExit = existingPos.side === 'buy' ? signal.composite < exitThreshold : signal.composite > -exitThreshold;

        if (shouldExit && !coolingDown) {
          const decision: BotDecision = {
            id: crypto.randomUUID(),
            timestamp: now,
            symbol: ticker,
            signal,
            action: 'EXIT',
            reason: `Exit signal: composite=${signal.composite.toFixed(2)} vs threshold=${exitThreshold}`,
            executed: true,
            qty: existingPos.qty,
            price,
          };
          try {
            closePosition(existingPos.id, price);
            cooldowns.current[ticker] = now;
            addDecision(decision);
            setStats(prev => ({ ...prev, totalExecutions: prev.totalExecutions + 1 }));
          } catch {
            decision.executed = false;
            decision.reason += ' (execution failed)';
            addDecision(decision);
          }
        }
        continue; // Don't open opposite on same symbol
      }

      // No position — check for entry
      if (positions.length >= config.maxPositions) continue;
      if (coolingDown) continue;

      const absScore = Math.abs(signal.composite);
      const isStrongEntry = absScore >= strategyConfig.entryThreshold;
      const isWeakEntry = absScore >= strategyConfig.weakEntryThreshold && absScore < strategyConfig.entryThreshold;

      if (!isStrongEntry && !isWeakEntry) {
        // Log HOLD decisions periodically (every 3rd scan)
        continue;
      }

      const side: 'buy' | 'sell' = signal.composite > 0 ? 'buy' : 'sell';
      const atrArr = computeATR(candleData.highs, candleData.lows, candleData.closes);
      const atr = atrArr[atrArr.length - 1] || price * 0.01;
      const sizeMult = isWeakEntry ? strategyConfig.positionSizeMult * 0.5 : strategyConfig.positionSizeMult;

      // Total exposure check
      const totalExposure = positions.reduce((s, p) => s + p.currentPrice * p.qty, 0);
      const maxTotalExposure = equity * 0.80;
      if (totalExposure >= maxTotalExposure) continue;

      const qty = calculatePositionSize(
        equity, price, config.riskPerTradePct, atr,
        config.stopLossAtrMult, sizeMult, 0.25
      );

      if (qty <= 0 || price * qty > cash) continue;

      const decision: BotDecision = {
        id: crypto.randomUUID(),
        timestamp: now,
        symbol: ticker,
        signal,
        action: side === 'buy' ? 'BUY' : 'SELL',
        reason: `${isStrongEntry ? 'Strong' : 'Weak'} ${side} signal: composite=${signal.composite.toFixed(2)}`,
        executed: true,
        qty,
        price,
      };

      try {
        submitOrder({ symbol: ticker, side, qty, type: 'market', price });
        cooldowns.current[ticker] = now;
        addDecision(decision);
        setStats(prev => ({ ...prev, totalExecutions: prev.totalExecutions + 1 }));
      } catch {
        decision.executed = false;
        decision.reason += ' (execution failed)';
        addDecision(decision);
      }
    }
  }, [
    config.enabled, config.maxPositions, config.riskPerTradePct, config.stopLossAtrMult, config.takeProfitAtrMult,
    watchlistSymbols, resolvePrice, getCandleData, getWaveBias,
    submitOrder, closePosition, positions, equity, cash, peakEquity,
    strategyConfig, updateConfig,
  ]);

  function addDecision(d: BotDecision) {
    setActivityLog(prev => [d, ...prev].slice(0, 50));
    setStats(prev => ({ ...prev, totalDecisions: prev.totalDecisions + 1 }));
  }

  // Scan loop
  useEffect(() => {
    if (scanRef.current) clearInterval(scanRef.current);
    if (!config.enabled) return;

    setStats(prev => ({ ...prev, activeSince: prev.activeSince || Date.now() }));
    scanRef.current = setInterval(scan, config.scanIntervalSec * 1000);
    // Run immediately on enable
    scan();

    return () => {
      if (scanRef.current) clearInterval(scanRef.current);
    };
  }, [config.enabled, config.scanIntervalSec, scan]);

  // Reset active since when disabled
  useEffect(() => {
    if (!config.enabled) {
      setStats(prev => ({ ...prev, activeSince: null }));
    }
  }, [config.enabled]);

  return {
    config,
    updateConfig,
    activityLog,
    stats,
    killAll,
    scan, // manual trigger
  };
}

// ─── Utilities ───────────────────────────────────────────

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

function round2(v: number) {
  return Math.round(v * 100) / 100;
}
