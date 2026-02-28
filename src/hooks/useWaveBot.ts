import { useState, useCallback, useEffect, useRef, useMemo } from 'react';

// ─── Types ───────────────────────────────────────────────

export interface WaveBotConfig {
  enabled: boolean;
  budget: number;
  intervalSec: number;
  entryThreshold: number;
  maxPositions: number;
  maxHoldSec: number;
  // Tunable WAVE parameters
  waveDrift: number;
  waveAmplitude: number;
  waveDamping: number;
  cycleSensitivity: number;
}

export interface WaveTradeRecord {
  id: string;
  symbol: string;
  side: 'buy' | 'sell';
  predictedDirection: 'bullish' | 'bearish';
  forecastBias: number;
  entryPrice: number;
  forecastPrice: number;
  exitPrice?: number;
  currentPrice?: number;
  correct?: boolean;
  openedAt: number;
  closedAt?: number;
  pnl?: number;
  positionId?: string;
}

export interface WaveBotStats {
  totalTrades: number;
  closedTrades: number;
  correctTrades: number;
  accuracy: number;
  totalPnl: number;
  activeSince: number | null;
}

const DEFAULT_CONFIG: WaveBotConfig = {
  enabled: false,
  budget: 25000,
  intervalSec: 80,
  entryThreshold: 0.15,
  maxPositions: 500,
  maxHoldSec: 320,
  waveDrift: 0.08,
  waveAmplitude: 0.3,
  waveDamping: 0.5,
  cycleSensitivity: 0.3,
};

const SETTINGS_KEY = 'ga_wave_bot_v1';
const TRADES_KEY = 'ga_wave_trades_v1';

function loadConfig(): WaveBotConfig {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) return { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
  } catch { /* ignore */ }
  return { ...DEFAULT_CONFIG };
}

function saveConfig(c: WaveBotConfig) {
  try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(c)); } catch { /* */ }
}

function loadTrades(): WaveTradeRecord[] {
  try {
    const raw = localStorage.getItem(TRADES_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return [];
}

function saveTrades(t: WaveTradeRecord[]) {
  try { localStorage.setItem(TRADES_KEY, JSON.stringify(t.slice(0, 1000))); } catch { /* */ }
}

// ─── WAVE Bias Computation (tunable) ─────────────────────

function computeWaveBias(
  prices: number[],
  config: WaveBotConfig,
): { bias: number; forecastPrice: number; atr: number } {
  if (prices.length < 20) return { bias: 0, forecastPrice: prices[prices.length - 1] || 0, atr: 0 };

  const len = prices.length;
  const current = prices[len - 1];

  const sma5 = prices.slice(-5).reduce((a, b) => a + b, 0) / 5;
  const sma20 = prices.slice(-20).reduce((a, b) => a + b, 0) / Math.min(20, len);

  let atrSum = 0;
  for (let i = Math.max(1, len - 14); i < len; i++) {
    atrSum += Math.abs(prices[i] - prices[i - 1]);
  }
  const atr = atrSum / Math.min(13, len - 1) || current * 0.005;

  let gains = 0, losses = 0;
  const rsiPeriod = Math.min(14, len - 1);
  for (let i = len - rsiPeriod; i < len; i++) {
    const diff = prices[i] - prices[i - 1];
    if (diff > 0) gains += diff;
    else losses -= diff;
  }
  const avgGain = gains / rsiPeriod;
  const avgLoss = losses / rsiPeriod || 0.001;
  const rs = avgGain / avgLoss;
  const rsi = 100 - (100 / (1 + rs));

  const recentN = Math.min(len, 40);
  const recentSlice = prices.slice(-recentN);
  const mean = recentSlice.reduce((a, b) => a + b, 0) / recentSlice.length;
  let crossings = 0;
  for (let i = 1; i < recentSlice.length; i++) {
    if ((recentSlice[i - 1] - mean) * (recentSlice[i] - mean) < 0) crossings++;
  }
  const cycleFreq = crossings > 0
    ? (Math.PI * crossings) / recentN
    : Math.PI * config.cycleSensitivity;

  const momSlice = prices.slice(-5);
  const momentum = momSlice.length >= 2
    ? (momSlice[momSlice.length - 1] - momSlice[0]) / (momSlice.length - 1)
    : 0;

  const rsiSignal = rsi < 30 ? 0.6 : rsi > 70 ? -0.6 : (50 - rsi) / 100;
  const maSignal = (sma5 - sma20) / atr * 0.5;

  const rawBias = rsiSignal + maSignal;
  const bias = Math.max(-1, Math.min(1, rawBias));

  const driftPerStep = bias * atr * config.waveDrift;
  const waveAmp = atr * config.waveAmplitude;
  const phaseOffset = momentum > 0 ? 0 : Math.PI;
  const decay = Math.exp(-config.waveDamping * 0.1);

  const forecastPrice = current + driftPerStep + waveAmp * decay * Math.sin(cycleFreq + phaseOffset) + momentum * 0.3 * decay;

  return { bias, forecastPrice, atr };
}

// ─── Main Hook ───────────────────────────────────────────

interface UseWaveBotParams {
  watchlistSymbols: string[];
  resolvePrice: (ticker: string) => number;
  getCandleHistory: (ticker: string) => number[] | null;
  submitOrder: (params: { symbol: string; side: 'buy' | 'sell'; qty: number; type: 'market'; price: number; botSource?: boolean }) => any;
  closePosition: (posId: string, price: number, botSource?: boolean) => void;
  positions: Array<{ id: string; symbol: string; side: 'buy' | 'sell'; qty: number; entryPrice: number; currentPrice: number; pnl: number; botSource?: boolean }>;
  equity: number;
  cash: number;
}

export function useWaveBot(params: UseWaveBotParams) {
  const {
    watchlistSymbols, resolvePrice, getCandleHistory,
    submitOrder, closePosition, positions, equity, cash,
  } = params;

  const [config, setConfig] = useState<WaveBotConfig>(loadConfig);
  const [trades, setTrades] = useState<WaveTradeRecord[]>(loadTrades);
  const scanRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const positionsRef = useRef(positions);
  const cashRef = useRef(cash);
  const equityRef = useRef(equity);
  const configRef = useRef(config);
  const tradesRef = useRef(trades);
  useEffect(() => { positionsRef.current = positions; }, [positions]);
  useEffect(() => { cashRef.current = cash; }, [cash]);
  useEffect(() => { equityRef.current = equity; }, [equity]);
  useEffect(() => { configRef.current = config; }, [config]);
  useEffect(() => { tradesRef.current = trades; }, [trades]);

  const updateConfig = useCallback((patch: Partial<WaveBotConfig>) => {
    setConfig(prev => {
      const next = { ...prev, ...patch };
      saveConfig(next);
      return next;
    });
  }, []);

  // Close a trade and record accuracy
  const closeTrade = useCallback((trade: WaveTradeRecord, exitPrice: number, pos: { id: string; qty: number } | undefined) => {
    const qty = pos?.qty ?? 1;
    const pnl = trade.side === 'buy'
      ? (exitPrice - trade.entryPrice) * qty
      : (trade.entryPrice - exitPrice) * qty;
    const correct = trade.predictedDirection === 'bullish'
      ? exitPrice > trade.entryPrice
      : exitPrice < trade.entryPrice;

    if (pos) {
      closePosition(pos.id, exitPrice, true);
    }

    setTrades(prev => {
      const updated = prev.map(t => t.id === trade.id ? {
        ...t, exitPrice, correct, closedAt: Date.now(), pnl,
      } : t);
      saveTrades(updated);
      return updated;
    });
  }, [closePosition]);

  // Main scan loop
  const scan = useCallback(() => {
    const cfg = configRef.current;
    if (!cfg.enabled) return;

    const currentPositions = positionsRef.current;
    const botPositions = currentPositions.filter(p => p.botSource);
    const now = Date.now();

    // ── Phase 1: Update current prices on open trades ──
    setTrades(prev => {
      let changed = false;
      const updated = prev.map(t => {
        if (t.closedAt) return t;
        const price = resolvePrice(t.symbol);
        if (price > 0 && price !== t.currentPrice) {
          changed = true;
          return { ...t, currentPrice: price };
        }
        return t;
      });
      if (changed) { saveTrades(updated); return updated; }
      return prev;
    });

    // ── Phase 2: Check exits on open trades ──
    const openTrades = tradesRef.current.filter(t => !t.closedAt);

    for (const trade of openTrades) {
      const pos = botPositions.find(p => p.id === trade.positionId);
      const price = resolvePrice(trade.symbol);
      if (price <= 0) continue;

      // Position was closed externally
      if (trade.positionId && !pos) {
        closeTrade(trade, price, undefined);
        continue;
      }

      const history = getCandleHistory(trade.symbol);
      const atr = history && history.length >= 20
        ? computeWaveBias(history, cfg).atr
        : Math.abs(trade.forecastPrice - trade.entryPrice) || trade.entryPrice * 0.005;

      const timeHeld = (now - trade.openedAt) / 1000;
      const priceMove = trade.side === 'buy' ? price - trade.entryPrice : trade.entryPrice - price;
      const tpDistance = atr * 1.2;
      const slDistance = atr * 0.8;

      let shouldClose = false;

      // Time-based exit
      if (timeHeld >= cfg.maxHoldSec) shouldClose = true;

      // Take-profit
      if (priceMove >= tpDistance) shouldClose = true;

      // Stop-loss
      if (priceMove <= -slDistance) shouldClose = true;

      // Bias reversal (relaxed threshold)
      if (history && history.length >= 20) {
        const { bias } = computeWaveBias(history, cfg);
        const reversed = trade.side === 'buy' ? bias < -cfg.entryThreshold * 0.3 : bias > cfg.entryThreshold * 0.3;
        if (reversed) shouldClose = true;
      }

      if (shouldClose && pos) {
        closeTrade(trade, price, pos);
      }
    }

    // ── Phase 3: Open new positions ──
    const refreshedBotPositions = positionsRef.current.filter(p => p.botSource);
    if (refreshedBotPositions.length >= cfg.maxPositions) return;

    const openTradeSymbols = new Set(
      tradesRef.current.filter(t => !t.closedAt).map(t => t.symbol)
    );

    const budgetUsed = refreshedBotPositions.reduce((s, p) => s + p.currentPrice * p.qty, 0);
    const budgetFree = Math.max(0, cfg.budget - budgetUsed);
    if (budgetFree < 100) return;

    for (const ticker of watchlistSymbols) {
      if (openTradeSymbols.has(ticker)) continue;
      if (refreshedBotPositions.length >= cfg.maxPositions) break;

      const price = resolvePrice(ticker);
      if (price <= 0) continue;

      const history = getCandleHistory(ticker);
      if (!history || history.length < 20) continue;

      const { bias, forecastPrice } = computeWaveBias(history, cfg);
      if (Math.abs(bias) < cfg.entryThreshold) continue;

      const side: 'buy' | 'sell' = bias > 0 ? 'buy' : 'sell';
      const predictedDirection: 'bullish' | 'bearish' = bias > 0 ? 'bullish' : 'bearish';

      const allocationPerTrade = budgetFree / Math.max(1, cfg.maxPositions - refreshedBotPositions.length);
      let qty = allocationPerTrade / price;
      if (price >= 100) qty = parseFloat(qty.toFixed(4));
      else if (price >= 10) qty = parseFloat(qty.toFixed(2));
      else qty = parseFloat(qty.toFixed(4));
      if (qty <= 0) continue;

      try {
        submitOrder({ symbol: ticker, side, qty, type: 'market', price, botSource: true });

        const newTrade: WaveTradeRecord = {
          id: crypto.randomUUID(),
          symbol: ticker,
          side,
          predictedDirection,
          forecastBias: parseFloat(bias.toFixed(3)),
          entryPrice: price,
          forecastPrice: parseFloat(forecastPrice.toFixed(price < 10 ? 4 : 2)),
          currentPrice: price,
          openedAt: Date.now(),
          positionId: undefined,
        };

        setTrades(prev => {
          const updated = [newTrade, ...prev].slice(0, 1000);
          saveTrades(updated);
          return updated;
        });

        // Match position
        setTimeout(() => {
          const pos = positionsRef.current.find(
            p => p.symbol === ticker && p.botSource && !tradesRef.current.some(t => t.positionId === p.id)
          );
          if (pos) {
            setTrades(prev => {
              const updated = prev.map(t => t.id === newTrade.id ? { ...t, positionId: pos.id } : t);
              saveTrades(updated);
              return updated;
            });
          }
        }, 100);
      } catch (err) {
        console.warn('[WaveBot] Order failed:', ticker, err);
      }
    }
  }, [watchlistSymbols, resolvePrice, getCandleHistory, submitOrder, closeTrade]);

  // Start/stop scan interval
  useEffect(() => {
    if (scanRef.current) {
      clearInterval(scanRef.current);
      scanRef.current = null;
    }

    if (config.enabled) {
      scan();
      scanRef.current = setInterval(scan, config.intervalSec * 1000);
    }

    return () => {
      if (scanRef.current) clearInterval(scanRef.current);
    };
  }, [config.enabled, config.intervalSec, scan]);

  // Stats
  const stats = useMemo<WaveBotStats>(() => {
    const closed = trades.filter(t => t.closedAt);
    const correct = closed.filter(t => t.correct);
    const totalPnl = closed.reduce((s, t) => s + (t.pnl ?? 0), 0);
    return {
      totalTrades: trades.length,
      closedTrades: closed.length,
      correctTrades: correct.length,
      accuracy: closed.length > 0 ? (correct.length / closed.length) * 100 : 0,
      totalPnl,
      activeSince: config.enabled ? (trades[trades.length - 1]?.openedAt ?? Date.now()) : null,
    };
  }, [trades, config.enabled]);

  const botPositions = useMemo(() => positions.filter(p => p.botSource), [positions]);

  const killAll = useCallback(() => {
    const bots = positionsRef.current.filter(p => p.botSource);
    for (const pos of bots) {
      const price = resolvePrice(pos.symbol);
      if (price > 0) closePosition(pos.id, price, true);
    }
  }, [resolvePrice, closePosition]);

  const clearHistory = useCallback(() => {
    setTrades([]);
    saveTrades([]);
  }, []);

  return {
    config,
    updateConfig,
    trades,
    stats,
    botPositions,
    killAll,
    clearHistory,
  };
}
