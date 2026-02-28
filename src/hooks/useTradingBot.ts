import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import {
  computeSMA, computeEMA, computeRSI, computeStochRSI, computeMACD,
  computeATR, computeBollingerBands, computeParabolicSAR, computeIchimoku,
  computeCCI, computeMomentum, computeOBV, computeMFI, computeAwesomeOscillator,
  computeAlligator, computeStdDev, computeForceIndex, computeADLine, computeCMF,
  computeDonchian, computeKeltner,
} from '@/components/trading/IndicatorOverlay';
import { REAL_FEED_SYMBOLS } from '@/data/tradingSymbols';

// ─── Types ───────────────────────────────────────────────

export type StrategyPreset = 'conservative' | 'balanced' | 'aggressive' | 'wave_first' | 'micro';
export type BotMode = 'auto' | 'ask';

export interface BotConfig {
  enabled: boolean;
  strategy: StrategyPreset;
  mode: BotMode;
  scanIntervalSec: number;
  maxPositions: number;
  riskPerTradePct: number;
  stopLossAtrMult: number;
  takeProfitAtrMult: number;
  botBudget: number;
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
  estimatedFees?: number;
  status?: 'pending' | 'approved' | 'rejected' | 'executed';
}

export interface BotStats {
  totalDecisions: number;
  totalExecutions: number;
  botPnl: number;
  activeSince: number | null;
  realizedPnl: number;
  unrealizedPnl: number;
  totalFees: number;
  winCount: number;
  lossCount: number;
  scannedSymbols: number;
  tradableSymbols: number;
  budgetDrawdownPct: number;
  budgetMaxLoss: number;
  budgetLossUsed: number;
  budgetHalted: boolean;
  consecutiveWins: number;
  consecutiveLosses: number;
  avgWin: number;
  avgLoss: number;
  profitFactor: number;
  sharpeEstimate: number;
}

// ─── Strategy Presets ────────────────────────────────────

const STRATEGY_CONFIGS: Record<StrategyPreset, {
  entryThreshold: number;
  weakEntryThreshold: number;
  exitThreshold: number;
  positionSizeMult: number;
  weights: { trend: number; momentum: number; volatility: number; volume: number; wave: number };
  description: string;
}> = {
  conservative: {
    entryThreshold: 0.65,
    weakEntryThreshold: 999,
    exitThreshold: -0.3,
    positionSizeMult: 0.5,
    weights: { trend: 0.30, momentum: 0.25, volatility: 0.15, volume: 0.15, wave: 0.15 },
    description: 'Only trades on strong confirmed signals. Tight stops, small positions. Best for capital preservation.',
  },
  balanced: {
    entryThreshold: 0.55,
    weakEntryThreshold: 0.25,
    exitThreshold: -0.25,
    positionSizeMult: 1.0,
    weights: { trend: 0.30, momentum: 0.25, volatility: 0.15, volume: 0.15, wave: 0.15 },
    description: 'Default strategy. Moderate entry thresholds with standard risk sizing.',
  },
  aggressive: {
    entryThreshold: 0.35,
    weakEntryThreshold: 0.15,
    exitThreshold: -0.15,
    positionSizeMult: 1.5,
    weights: { trend: 0.30, momentum: 0.25, volatility: 0.15, volume: 0.15, wave: 0.15 },
    description: 'Trades on weaker signals with larger positions. Higher risk, higher potential.',
  },
  wave_first: {
    entryThreshold: 0.50,
    weakEntryThreshold: 0.20,
    exitThreshold: -0.20,
    positionSizeMult: 1.0,
    weights: { trend: 0.18, momentum: 0.15, volatility: 0.12, volume: 0.15, wave: 0.40 },
    description: 'Heavily weights the WAVE forecast engine (40%). Best when forecast is accurate.',
  },
  micro: {
    entryThreshold: 0.40,
    weakEntryThreshold: 0.20,
    exitThreshold: -0.10,
    positionSizeMult: 0.25,
    weights: { trend: 0.25, momentum: 0.30, volatility: 0.15, volume: 0.15, wave: 0.15 },
    description: 'Micro-transactions: many small trades for incremental gains. Low risk per trade, high frequency. Exits quickly on reversal.',
  },
};

export { STRATEGY_CONFIGS };

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

  const smaCrossNow = latestSma20 - latestSma50;
  const smaCrossPrev = prevSma20 - prevSma50;
  const smaCrossSignal = smaCrossNow > 0 ? (smaCrossPrev <= 0 ? 1 : 0.5) : (smaCrossPrev >= 0 ? -1 : -0.5);
  const emaSignal = clamp((last - latestEma20) / (last * 0.01), -1, 1);

  const senkouA = ichimoku.senkouA[ichimoku.senkouA.length - 1] || last;
  const senkouB = ichimoku.senkouB[ichimoku.senkouB.length - 1] || last;
  const cloudTop = Math.max(senkouA, senkouB);
  const cloudBot = Math.min(senkouA, senkouB);
  const cloudRange = cloudTop - cloudBot || 1;
  const ichSignal = last > cloudTop ? clamp((last - cloudTop) / cloudRange, 0, 1) :
    last < cloudBot ? clamp((last - cloudBot) / cloudRange, -1, 0) : 0;

  const aJaw = alligator.jaw[alligator.jaw.length - 1] || last;
  const aTeeth = alligator.teeth[alligator.teeth.length - 1] || last;
  const aLips = alligator.lips[alligator.lips.length - 1] || last;
  const alligatorSignal = (aLips > aTeeth && aTeeth > aJaw) ? 0.7 :
    (aLips < aTeeth && aTeeth < aJaw) ? -0.7 : 0;

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
  const bollSignal = clamp((0.5 - bollPos) * 2, -1, 1);

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
  const atrSignal = atrNormalized > 0.03 ? -0.3 : atrNormalized < 0.005 ? 0.3 : 0;

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

  const obvSlice = obv.slice(-10);
  const obvSlope = obvSlice.length >= 2 ? (obvSlice[obvSlice.length - 1] - obvSlice[0]) / (obvSlice.length - 1) : 0;
  const obvSignal = clamp(obvSlope / 1000, -1, 1);

  const latestMfi = mfi[mfi.length - 1] ?? 50;
  const mfiSignal = latestMfi < 20 ? 0.8 : latestMfi > 80 ? -0.8 : (latestMfi - 50) / 62.5;

  const latestCmf = cmf[cmf.length - 1] ?? 0;
  const cmfSignal = clamp(latestCmf * 5, -1, 1);

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
  const stopDistance = atr * stopMultiplier;
  const riskAmount = equity * (riskPct / 100);
  const kellyQty = riskAmount / stopDistance;
  const maxQtyByExposure = (equity * maxExposurePct) / price;
  const qty = Math.min(kellyQty * sizeMult, maxQtyByExposure);
  return Math.max(0, price < 10 ? parseFloat(qty.toFixed(4)) : Math.floor(qty));
}

// ─── Bot Settings Persistence ────────────────────────────

const BOT_SETTINGS_KEY = 'ga_bot_settings_v2';

function loadBotConfig(): BotConfig {
  try {
    const raw = localStorage.getItem(BOT_SETTINGS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<BotConfig>;
      const normalized: BotConfig = {
        enabled: Boolean(parsed.enabled),
        strategy: parsed.strategy ?? 'micro',
        // Force legacy ASK configs to AUTO so bot actually trades by default
        mode: 'auto',
        scanIntervalSec: parsed.scanIntervalSec ?? 10,
        maxPositions: parsed.maxPositions ?? 8,
        riskPerTradePct: parsed.riskPerTradePct ?? 1,
        stopLossAtrMult: parsed.stopLossAtrMult ?? 1.0,
        takeProfitAtrMult: parsed.takeProfitAtrMult ?? 1.5,
        botBudget: parsed.botBudget ?? 25000,
      };
      return normalized;
    }
  } catch { /* ignore */ }
  return {
    enabled: false,
    strategy: 'micro',
    mode: 'auto',
    scanIntervalSec: 10,
    maxPositions: 8,
    riskPerTradePct: 1,
    stopLossAtrMult: 1.0,
    takeProfitAtrMult: 1.5,
    botBudget: 25000,
  };
}

function saveBotConfig(config: BotConfig) {
  try {
    localStorage.setItem(BOT_SETTINGS_KEY, JSON.stringify(config));
  } catch { /* ignore */ }
}

// ─── Real-feed symbol tickers ────────────────────────────
const REAL_FEED_TICKERS = new Set(REAL_FEED_SYMBOLS.map(s => s.ticker));

// ─── Main Hook ───────────────────────────────────────────

interface UseTradingBotParams {
  watchlistSymbols: string[];
  resolvePrice: (ticker: string) => number;
  getCandleData: (ticker: string) => { closes: number[]; highs: number[]; lows: number[] } | null;
  getWaveBias: (ticker: string) => number;
  submitOrder: (params: { symbol: string; side: 'buy' | 'sell'; qty: number; type: 'market'; price: number; botSource?: boolean }) => void;
  closePosition: (posId: string, price: number, botSource?: boolean) => void;
  positions: Array<{ id: string; symbol: string; side: 'buy' | 'sell'; qty: number; entryPrice: number; currentPrice: number; pnl: number; botSource?: boolean }>;
  equity: number;
  cash: number;
  peakEquity: number;
  totalFees: number;
}

export function useTradingBot(params: UseTradingBotParams) {
  const {
    watchlistSymbols, resolvePrice, getCandleData, getWaveBias,
    submitOrder, closePosition, positions, equity, cash, peakEquity, totalFees,
  } = params;

  const [config, setConfig] = useState<BotConfig>(loadBotConfig);
  const [activityLog, setActivityLog] = useState<BotDecision[]>([]);
  const [pendingProposals, setPendingProposals] = useState<BotDecision[]>([]);
  const cooldowns = useRef<Record<string, number>>({});
  const scanRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const strategyConfig = useMemo(() => STRATEGY_CONFIGS[config.strategy], [config.strategy]);

  // Only scan symbols with real live feeds
  const tradableSymbols = useMemo(() => 
    watchlistSymbols.filter(t => REAL_FEED_TICKERS.has(t)),
    [watchlistSymbols]
  );

  // Bot-specific stats
  const stats = useMemo<BotStats>(() => {
    const botPositions = positions.filter(p => p.botSource);
    const unrealizedPnl = botPositions.reduce((s, p) => s + p.pnl, 0);
    const executedLog = activityLog.filter(d => d.executed);
    const exits = executedLog.filter(d => d.action === 'EXIT');
    let realizedPnl = 0;
    let winCount = 0;
    let lossCount = 0;
    const winAmounts: number[] = [];
    const lossAmounts: number[] = [];
    let consecutiveWins = 0;
    let consecutiveLosses = 0;
    let currentStreak = 0;

    exits.forEach(e => {
      const entry = activityLog.find(a => a.symbol === e.symbol && (a.action === 'BUY' || a.action === 'SELL') && a.executed && a.timestamp < e.timestamp);
      if (entry && entry.price && e.price && entry.qty) {
        const direction = entry.action === 'BUY' ? 1 : -1;
        const tradePnl = (e.price - entry.price) * direction * entry.qty;
        realizedPnl += tradePnl;
        if (tradePnl >= 0) {
          winCount++;
          winAmounts.push(tradePnl);
          if (currentStreak >= 0) currentStreak++; else currentStreak = 1;
        } else {
          lossCount++;
          lossAmounts.push(Math.abs(tradePnl));
          if (currentStreak <= 0) currentStreak--; else currentStreak = -1;
        }
      }
    });

    consecutiveWins = currentStreak > 0 ? currentStreak : 0;
    consecutiveLosses = currentStreak < 0 ? Math.abs(currentStreak) : 0;

    const avgWin = winAmounts.length > 0 ? winAmounts.reduce((a, b) => a + b, 0) / winAmounts.length : 0;
    const avgLoss = lossAmounts.length > 0 ? lossAmounts.reduce((a, b) => a + b, 0) / lossAmounts.length : 0;
    const grossWins = winAmounts.reduce((a, b) => a + b, 0);
    const grossLosses = lossAmounts.reduce((a, b) => a + b, 0);
    const profitFactor = grossLosses > 0 ? grossWins / grossLosses : grossWins > 0 ? Infinity : 0;

    // Sharpe estimate from trade returns
    const allReturns = [...winAmounts, ...lossAmounts.map(l => -l)];
    const meanReturn = allReturns.length > 0 ? allReturns.reduce((a, b) => a + b, 0) / allReturns.length : 0;
    const variance = allReturns.length > 1 ? allReturns.reduce((s, r) => s + (r - meanReturn) ** 2, 0) / (allReturns.length - 1) : 0;
    const stdDev = Math.sqrt(variance);
    const sharpeEstimate = stdDev > 0 ? (meanReturn / stdDev) * Math.sqrt(252) : 0;

    // Budget-based drawdown (10% hard limit)
    const totalBotPnl = unrealizedPnl + realizedPnl;
    const budgetMaxLoss = config.botBudget * 0.10; // 10% of budget
    const budgetLossUsed = totalBotPnl < 0 ? Math.abs(totalBotPnl) : 0;
    const budgetDrawdownPct = config.botBudget > 0 ? (budgetLossUsed / config.botBudget) * 100 : 0;
    const budgetHalted = budgetLossUsed >= budgetMaxLoss;

    return {
      totalDecisions: activityLog.length,
      totalExecutions: executedLog.length,
      botPnl: totalBotPnl,
      activeSince: config.enabled ? (activityLog.length > 0 ? activityLog[activityLog.length - 1]?.timestamp : Date.now()) : null,
      realizedPnl,
      unrealizedPnl,
      totalFees,
      winCount,
      lossCount,
      scannedSymbols: tradableSymbols.length,
      tradableSymbols: tradableSymbols.length,
      budgetDrawdownPct,
      budgetMaxLoss,
      budgetLossUsed,
      budgetHalted,
      consecutiveWins,
      consecutiveLosses,
      avgWin,
      avgLoss,
      profitFactor,
      sharpeEstimate,
    };
  }, [activityLog, positions, config.enabled, config.botBudget, totalFees, tradableSymbols]);

  // Persist config changes
  const updateConfig = useCallback((patch: Partial<BotConfig>) => {
    setConfig(prev => {
      const next = { ...prev, ...patch };
      saveBotConfig(next);
      return next;
    });
  }, []);

  // Kill switch: close all bot positions
  const killAll = useCallback(() => {
    positions.filter(p => p.botSource).forEach(pos => {
      const price = resolvePrice(pos.symbol);
      if (price > 0) closePosition(pos.id, price, true);
    });
    updateConfig({ enabled: false });
  }, [positions, resolvePrice, closePosition, updateConfig]);

  // Approve a pending proposal
  const approveProposal = useCallback((proposalId: string) => {
    const proposal = pendingProposals.find(p => p.id === proposalId);
    if (!proposal) return;

    const currentPrice = resolvePrice(proposal.symbol);
    if (currentPrice <= 0) return;

    try {
      if (proposal.action === 'EXIT') {
        const pos = positions.find(p => p.symbol === proposal.symbol && p.botSource);
        if (pos) closePosition(pos.id, currentPrice, true);
      } else {
        submitOrder({
          symbol: proposal.symbol,
          side: proposal.action === 'BUY' ? 'buy' : 'sell',
          qty: proposal.qty || 0,
          type: 'market',
          price: currentPrice,
          botSource: true,
        });
      }
      proposal.executed = true;
      proposal.status = 'approved';
      proposal.price = currentPrice;
      setActivityLog(prev => [proposal, ...prev].slice(0, 100));
    } catch { /* ignore */ }

    setPendingProposals(prev => prev.filter(p => p.id !== proposalId));
  }, [pendingProposals, resolvePrice, positions, closePosition, submitOrder]);

  // Reject a pending proposal
  const rejectProposal = useCallback((proposalId: string) => {
    const proposal = pendingProposals.find(p => p.id === proposalId);
    if (!proposal) return;
    proposal.status = 'rejected';
    proposal.reason += ' — rejected by user';
    proposal.executed = false;
    setActivityLog(prev => [proposal, ...prev].slice(0, 100));
    setPendingProposals(prev => prev.filter(p => p.id !== proposalId));
  }, [pendingProposals]);

  // Execute or propose a decision
  const executeOrPropose = useCallback((decision: BotDecision, executeFn: () => void) => {
    if (config.mode === 'ask') {
      decision.status = 'pending';
      decision.executed = false;
      setPendingProposals(prev => [decision, ...prev].slice(0, 20));
    } else {
      try {
        executeFn();
        decision.executed = true;
        decision.status = 'executed';
        setActivityLog(prev => [decision, ...prev].slice(0, 100));
      } catch {
        decision.executed = false;
        decision.reason += ' (execution failed)';
        setActivityLog(prev => [decision, ...prev].slice(0, 100));
      }
    }
  }, [config.mode]);

  // Core scan function — ONLY scans real-feed symbols
  const scan = useCallback(() => {
    if (!config.enabled) return;

    const now = Date.now();

    // ─── BUDGET-BASED 10% DRAWDOWN CIRCUIT BREAKER ───
    // Bot CANNOT lose more than 10% of botBudget. Hard stop.
    const botPositions = positions.filter(p => p.botSource);
    const unrealizedPnl = botPositions.reduce((s, p) => s + p.pnl, 0);
    const executedExits = activityLog.filter(d => d.executed && d.action === 'EXIT');
    let sessionRealizedPnl = 0;
    executedExits.forEach(e => {
      const entry = activityLog.find(a => a.symbol === e.symbol && (a.action === 'BUY' || a.action === 'SELL') && a.executed && a.timestamp < e.timestamp);
      if (entry?.price && e.price && entry.qty) {
        sessionRealizedPnl += (e.price - entry.price) * (entry.action === 'BUY' ? 1 : -1) * entry.qty;
      }
    });
    const totalBotPnl = unrealizedPnl + sessionRealizedPnl;
    const budgetMaxLoss = config.botBudget * 0.10;

    if (totalBotPnl <= -budgetMaxLoss) {
      // EMERGENCY: close all bot positions and halt
      botPositions.forEach(pos => {
        const price = resolvePrice(pos.symbol);
        if (price > 0) closePosition(pos.id, price, true);
      });
      const decision: BotDecision = {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        symbol: '*',
        signal: { trend: 0, momentum: 0, volatility: 0, volume: 0, wave: 0, composite: 0 },
        action: 'HOLD',
        reason: `🚨 BUDGET PROTECTION: Lost $${Math.abs(totalBotPnl).toFixed(2)} (${((Math.abs(totalBotPnl) / config.botBudget) * 100).toFixed(1)}% of $${config.botBudget.toLocaleString()} budget). 10% max loss reached. Bot halted — adjust budget to resume.`,
        executed: false,
      };
      setActivityLog(prev => [decision, ...prev].slice(0, 100));
      updateConfig({ enabled: false });
      return;
    }

    // Additional safety: if approaching 8% loss, reduce position sizes by 50%
    const isNearLimit = totalBotPnl <= -(config.botBudget * 0.08);
    const drawdownSizeMult = isNearLimit ? 0.5 : 1.0;

    // ─── CONSECUTIVE LOSS COOLDOWN ───
    // After 3 consecutive losses, pause for 2 scan intervals
    const recentExits = activityLog.filter(d => d.executed && d.action === 'EXIT').slice(0, 5);
    let recentConsecLosses = 0;
    for (const e of recentExits) {
      const entry = activityLog.find(a => a.symbol === e.symbol && (a.action === 'BUY' || a.action === 'SELL') && a.executed && a.timestamp < e.timestamp);
      if (entry?.price && e.price && entry.qty) {
        const pnl = (e.price - entry.price) * (entry.action === 'BUY' ? 1 : -1) * entry.qty;
        if (pnl < 0) recentConsecLosses++; else break;
      } else break;
    }
    if (recentConsecLosses >= 3) {
      const lastExit = recentExits[0];
      if (lastExit && (now - lastExit.timestamp) < config.scanIntervalSec * 2000) {
        return; // Cool down after losing streak
      }
    }

    const botPositionSymbols = new Set(botPositions.map(p => p.symbol));
    const isMicro = config.strategy === 'micro';
    const cooldownMs = isMicro ? 15_000 : 30_000;

    // ONLY scan tradable (real-feed) symbols
    for (const ticker of tradableSymbols) {
      const price = resolvePrice(ticker);
      if (price <= 0) continue; // Skip symbols with no live price

      const candleData = getCandleData(ticker);
      if (!candleData || candleData.closes.length < 30) continue; // Need real data

      const waveBias = getWaveBias(ticker);
      const signal = computeCompositeSignal(
        candleData.closes, candleData.highs, candleData.lows,
        waveBias, strategyConfig.weights
      );

      const lastTrade = cooldowns.current[ticker] || 0;
      const coolingDown = (now - lastTrade) < cooldownMs;

      // Existing bot position? Check for exit
      const existingPos = positions.find(p => p.symbol === ticker && p.botSource);
      if (existingPos) {
        const exitThreshold = strategyConfig.exitThreshold;
        const shouldExit = existingPos.side === 'buy' ? signal.composite < exitThreshold : signal.composite > -exitThreshold;

        // For micro strategy, also exit on profit target (ATR-based)
        const atrArr = computeATR(candleData.highs, candleData.lows, candleData.closes);
        const atr = atrArr[atrArr.length - 1] || price * 0.01;
        const profitTarget = atr * config.takeProfitAtrMult;
        const stopLoss = atr * config.stopLossAtrMult;
        const currentPnl = existingPos.side === 'buy' 
          ? (price - existingPos.entryPrice) * existingPos.qty
          : (existingPos.entryPrice - price) * existingPos.qty;
        const priceDiff = Math.abs(price - existingPos.entryPrice);
        const hitTP = priceDiff >= profitTarget;
        const hitSL = priceDiff >= stopLoss && currentPnl < 0;

        if ((shouldExit || hitTP || hitSL) && !coolingDown) {
          const reason = hitTP 
            ? `✅ Take profit hit: +$${currentPnl.toFixed(2)} (${priceDiff.toFixed(2)} >= TP ${profitTarget.toFixed(2)})`
            : hitSL 
            ? `🛑 Stop loss hit: -$${Math.abs(currentPnl).toFixed(2)} (${priceDiff.toFixed(2)} >= SL ${stopLoss.toFixed(2)})`
            : `Exit signal: composite ${signal.composite.toFixed(2)} crossed threshold ${exitThreshold}`;

          const decision: BotDecision = {
            id: crypto.randomUUID(),
            timestamp: now,
            symbol: ticker,
            signal,
            action: 'EXIT',
            reason: `${reason}. P&L: $${currentPnl.toFixed(2)}`,
            executed: false,
            qty: existingPos.qty,
            price,
          };

          executeOrPropose(decision, () => {
            closePosition(existingPos.id, price, true);
            cooldowns.current[ticker] = now;
          });
        }
        continue;
      }

      // No position — check for entry
      const botPositionCount = botPositions.length;
      if (botPositionCount >= config.maxPositions) continue;
      if (coolingDown) continue;

      const absScore = Math.abs(signal.composite);
      const isStrongEntry = absScore >= strategyConfig.entryThreshold;
      const isWeakEntry = absScore >= strategyConfig.weakEntryThreshold && absScore < strategyConfig.entryThreshold;

      if (!isStrongEntry && !isWeakEntry) continue;

      // ─── MULTI-TIMEFRAME CONFLUENCE ───
      // Compute signal on shorter window (last 30 bars) vs full window for confirmation
      const shortCloses = candleData.closes.slice(-30);
      const shortHighs = candleData.highs.slice(-30);
      const shortLows = candleData.lows.slice(-30);
      let confluenceBonus = 0;
      if (shortCloses.length >= 30) {
        const shortSignal = computeCompositeSignal(shortCloses, shortHighs, shortLows, waveBias, strategyConfig.weights);
        // Both timeframes agree on direction = stronger signal
        if (Math.sign(shortSignal.composite) === Math.sign(signal.composite)) {
          confluenceBonus = 0.1; // +10% confidence boost
        } else {
          confluenceBonus = -0.15; // Disagreement = penalty
        }
      }

      // ─── REGIME DETECTION ───
      // ADX-style: is market trending or ranging?
      const atrArr = computeATR(candleData.highs, candleData.lows, candleData.closes);
      const atr = atrArr[atrArr.length - 1] || price * 0.01;
      const recentCloses = candleData.closes.slice(-20);
      const priceRange = recentCloses.length > 0 ? Math.max(...recentCloses) - Math.min(...recentCloses) : 0;
      const atrNorm = atr / price;
      const isTrending = priceRange > atr * 3; // Price moved more than 3x ATR = trending
      const isHighVol = atrNorm > 0.025;

      // In ranging markets, require stronger signals
      const regimeAdjust = isTrending ? 0 : 0.05;
      const adjustedScore = absScore + confluenceBonus - regimeAdjust;

      if (adjustedScore < (isWeakEntry ? strategyConfig.weakEntryThreshold : strategyConfig.entryThreshold)) continue;

      // ─── MOMENTUM DIVERGENCE CHECK ───
      // If price making new highs but RSI declining = bearish divergence (skip buy)
      const rsiArr = computeRSI(candleData.closes);
      if (rsiArr.length >= 5 && recentCloses.length >= 5) {
        const priceUp = recentCloses[recentCloses.length - 1] > recentCloses[recentCloses.length - 5];
        const rsiDown = rsiArr[rsiArr.length - 1] < rsiArr[rsiArr.length - 5];
        const priceDown = recentCloses[recentCloses.length - 1] < recentCloses[recentCloses.length - 5];
        const rsiUp = rsiArr[rsiArr.length - 1] > rsiArr[rsiArr.length - 5];
        const bearishDiv = priceUp && rsiDown && signal.composite > 0;
        const bullishDiv = priceDown && rsiUp && signal.composite < 0;
        if (bearishDiv || bullishDiv) continue; // Skip divergent signals
      }

      const side: 'buy' | 'sell' = signal.composite > 0 ? 'buy' : 'sell';
      const sizeMult = isWeakEntry ? strategyConfig.positionSizeMult * 0.5 : strategyConfig.positionSizeMult;

      // ─── ADAPTIVE POSITION SIZING ───
      // Scale down after losses, scale up after wins
      const streakMult = recentConsecLosses >= 2 ? 0.5 : recentConsecLosses >= 1 ? 0.75 : 1.0;
      const volMult = isHighVol ? 0.7 : 1.0; // Reduce size in high-vol regimes

      const totalExposure = botPositions.reduce((s, p) => s + p.currentPrice * p.qty, 0);
      const maxTotalExposure = config.botBudget;
      if (totalExposure >= maxTotalExposure) continue;

      // Remaining budget constraint: don't risk more than remaining budget allows
      const remainingBudget = config.botBudget - totalExposure;
      const budgetForTrade = Math.min(remainingBudget, config.botBudget * (isMicro ? 0.10 : 0.25));

      const qty = calculatePositionSize(
        budgetForTrade, price, config.riskPerTradePct, atr,
        config.stopLossAtrMult, sizeMult * drawdownSizeMult * streakMult * volMult,
        isMicro ? 0.10 : 0.25
      );

      if (qty <= 0 || price * qty > cash) continue;

      // Estimate fees accurately
      const estimatedFees = (price * qty * 7 / 10000) + 1.50;

      // For micro, ensure potential profit exceeds fees
      if (isMicro) {
        const expectedMove = atr * 0.5;
        const potentialProfit = expectedMove * qty;
        if (potentialProfit < estimatedFees * 2) continue;
      }

      // ─── RISK-REWARD CHECK ───
      // Only enter if R:R >= 1.5
      const stopDist = atr * config.stopLossAtrMult;
      const targetDist = atr * config.takeProfitAtrMult;
      const riskReward = targetDist / (stopDist || 1);
      if (riskReward < 1.5) continue;

      const regimeLabel = isTrending ? 'TREND' : 'RANGE';
      const confluenceLabel = confluenceBonus > 0 ? '✓MTF' : confluenceBonus < 0 ? '✗MTF' : '';

      const decision: BotDecision = {
        id: crypto.randomUUID(),
        timestamp: now,
        symbol: ticker,
        signal,
        action: side === 'buy' ? 'BUY' : 'SELL',
        reason: `${isStrongEntry ? '🟢 Strong' : '🟡 Weak'} ${side} | composite ${signal.composite.toFixed(2)} | R:R ${riskReward.toFixed(1)} | ${regimeLabel} ${confluenceLabel} | Fees: $${estimatedFees.toFixed(2)}${isMicro ? ' [MICRO]' : ''}${isNearLimit ? ' ⚠️REDUCED SIZE' : ''}`,
        executed: false,
        qty,
        price,
        estimatedFees,
      };

      executeOrPropose(decision, () => {
        submitOrder({ symbol: ticker, side, qty, type: 'market', price, botSource: true });
        cooldowns.current[ticker] = now;
      });
    }
  }, [
    config.enabled, config.maxPositions, config.riskPerTradePct, config.stopLossAtrMult,
    config.takeProfitAtrMult, config.strategy, config.botBudget, config.scanIntervalSec,
    tradableSymbols, resolvePrice, getCandleData, getWaveBias,
    submitOrder, closePosition, positions, equity, cash, peakEquity,
    strategyConfig, updateConfig, executeOrPropose, activityLog,
  ]);

  // Scan loop
  useEffect(() => {
    if (scanRef.current) clearInterval(scanRef.current);
    if (!config.enabled) return;
    scanRef.current = setInterval(scan, config.scanIntervalSec * 1000);
    scan();
    return () => {
      if (scanRef.current) clearInterval(scanRef.current);
    };
  }, [config.enabled, config.scanIntervalSec, scan]);

  return {
    config,
    updateConfig,
    activityLog,
    pendingProposals,
    stats,
    killAll,
    scan,
    approveProposal,
    rejectProposal,
  };
}

// ─── Utilities ───────────────────────────────────────────

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

function round2(v: number) {
  return Math.round(v * 100) / 100;
}
