import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useCryptoData } from '@/hooks/useCryptoData';
import { useMetalPrices } from '@/hooks/useMetalPrices';
import { useOilGasPrices } from '@/hooks/useOilGasData';
import { ALL_SYMBOLS, SYNTHETIC_PRICES, REAL_FEED_SYMBOLS } from '@/data/tradingSymbols';
import { buildTechnicalSnapshot } from '@/lib/technicalSignals';
import type { PaperPosition } from '@/hooks/usePaperTrading';

export type GeniusTimeline = 'short' | 'mid' | 'long';
export type GeniusStatus = 'idle' | 'scanning' | 'analyzing' | 'executing' | 'cooldown' | 'error';

export interface GeniusTrade {
  ticker: string;
  action: 'BUY' | 'SELL';
  qty: number;
  reason: string;
  entryPrice: number;
  targetPrice: number;
  stopLoss: number;
  holdMinutes: number;
  confidence: number;
}

export interface GeniusAnalysis {
  strategy: string;
  confidence: number;
  trades: GeniusTrade[];
  marketRegime: string;
  riskAssessment: string;
}

export interface GeniusCycleLog {
  id: string;
  timestamp: number;
  timeline: GeniusTimeline;
  analysis: GeniusAnalysis;
  executedTrades: Array<{
    ticker: string;
    action: string;
    qty: number;
    price: number;
    success: boolean;
    error?: string;
  }>;
  portfolioBefore: { cash: number; equity: number };
  portfolioAfter: { cash: number; equity: number };
}

interface UseGeniusTraderProps {
  submitOrder: (params: {
    symbol: string;
    side: 'buy' | 'sell';
    qty: number;
    type: 'market';
    price: number;
    botSource?: boolean;
  }) => any;
  positions: PaperPosition[];
  cash: number;
  equity: number;
  resolvePrice: (ticker: string) => number;
  getCandleHistory: (ticker: string) => number[] | null;
}

export const useGeniusTrader = ({
  submitOrder,
  positions,
  cash,
  equity,
  resolvePrice,
  getCandleHistory,
}: UseGeniusTraderProps) => {
  const [enabled, setEnabled] = useState(false);
  const [timeline, setTimeline] = useState<GeniusTimeline>('short');
  const [riskTolerance, setRiskTolerance] = useState(5);
  const [status, setStatus] = useState<GeniusStatus>('idle');
  const [lastAnalysis, setLastAnalysis] = useState<GeniusAnalysis | null>(null);
  const [logs, setLogs] = useState<GeniusCycleLog[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [cycleCount, setCycleCount] = useState(0);
  const [totalPnl, setTotalPnl] = useState(0);
  const [winCount, setWinCount] = useState(0);
  const [lossCount, setLossCount] = useState(0);
  const [autoExecute, setAutoExecute] = useState(false);

  const { data: cryptoData } = useCryptoData(50);
  const { data: metalPrices } = useMetalPrices();
  const { data: oilPrices } = useOilGasPrices();

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);
  const runningRef = useRef(false);

  // Build market snapshot for AI
  const buildMarketSnapshot = useCallback(() => {
    const assets: Array<{
      key: string;
      ticker: string;
      cat: string;
      label: string;
      price: number;
      change24h: number;
      volume?: number;
      sparkline?: number[];
      technicals?: any;
    }> = [];

    // Only use REAL feed symbols for actual trading recommendations
    for (const sym of REAL_FEED_SYMBOLS) {
      let price = 0;
      let change24h = 0;
      let volume: number | undefined;
      let sparkline: number[] | undefined;

      if (sym.cat === 'metals') {
        const metalMap: Record<string, string> = { gold: 'gold', silver: 'silver', platinum: 'platinum' };
        const mk = metalMap[sym.key];
        if (mk && metalPrices?.[mk]) {
          price = metalPrices[mk].price_usd;
          change24h = metalPrices[mk].change_24h ?? 0;
        }
      } else if (sym.cat === 'crypto') {
        const coin = cryptoData?.find(c => c.id === sym.key || c.symbol === sym.key);
        if (coin) {
          price = coin.current_price;
          change24h = coin.price_change_percentage_24h;
          volume = coin.total_volume;
          sparkline = coin.sparkline_in_7d?.price;
        }
      } else if (sym.cat === 'energy') {
        const feed = oilPrices?.find(p => p.symbol === sym.ticker);
        if (feed) {
          price = feed.price;
          change24h = feed.change;
        }
      }

      if (price <= 0) continue;

      // Build technicals from candle history
      let technicals: any;
      const candleHistory = getCandleHistory(sym.ticker);
      if (candleHistory && candleHistory.length >= 30) {
        const highs = candleHistory.map((c, i) => Math.max(c, candleHistory[Math.max(0, i - 1)] ?? c));
        const lows = candleHistory.map((c, i) => Math.min(c, candleHistory[Math.max(0, i - 1)] ?? c));
        const snapshot = buildTechnicalSnapshot({ closes: candleHistory, highs, lows });
        if (snapshot) {
          technicals = {
            rsi: snapshot.oscillators.find(o => o.name === 'RSI (14)')?.value ?? 50,
            macdSignal: snapshot.oscillators.find(o => o.name === 'MACD Level')?.signal ?? 'Neutral',
            smaSignal: snapshot.movingAverages.find(o => o.name === 'SMA (20)')?.signal ?? 'Neutral',
            adx: snapshot.oscillators.find(o => o.name === 'ADX (14)')?.value ?? 18,
            overallBias: snapshot.overallBias,
            overallSignal: snapshot.overallSignal,
            regime: snapshot.decision.regime,
          };
        }
      }

      assets.push({
        key: sym.key,
        ticker: sym.ticker,
        cat: sym.cat,
        label: sym.label,
        price,
        change24h,
        volume,
        sparkline: sparkline?.slice(-24),
        technicals,
      });
    }

    return assets;
  }, [cryptoData, metalPrices, oilPrices, getCandleHistory]);

  const runCycle = useCallback(async () => {
    if (runningRef.current || !mountedRef.current) return;
    runningRef.current = true;
    setError(null);

    try {
      // Phase 1: Scan market
      setStatus('scanning');
      const assets = buildMarketSnapshot();
      if (assets.length < 3) {
        setError('Insufficient market data — waiting for feeds');
        setStatus('error');
        runningRef.current = false;
        return;
      }

      // Phase 2: AI Analysis
      setStatus('analyzing');
      const portfolioSnapshot = {
        cash,
        equity,
        positions: positions.map(p => ({
          symbol: p.symbol,
          side: p.side,
          qty: p.qty,
          entryPrice: p.entryPrice,
          currentPrice: p.currentPrice,
          pnl: p.pnl,
        })),
      };

      const { data, error: fnError } = await supabase.functions.invoke('genius-strategy', {
        body: {
          timeline,
          assets,
          portfolio: portfolioSnapshot,
          riskTolerance,
        },
      });

      if (fnError || !data?.success) {
        const errMsg = data?.error || fnError?.message || 'Analysis failed';
        setError(errMsg);
        setStatus('error');
        runningRef.current = false;
        return;
      }

      const analysis: GeniusAnalysis = data.analysis;
      setLastAnalysis(analysis);

      // Phase 3: Execute trades (if auto-execute enabled)
      const executed: GeniusCycleLog['executedTrades'] = [];

      if (autoExecute && analysis.trades?.length > 0) {
        setStatus('executing');
        const portfolioBefore = { cash, equity };

        for (const trade of analysis.trades) {
          // Validate the trade
          const livePrice = resolvePrice(trade.ticker);
          if (livePrice <= 0) {
            executed.push({ ticker: trade.ticker, action: trade.action, qty: trade.qty, price: 0, success: false, error: 'No live price' });
            continue;
          }

          // Sanity check: don't execute if price diverged >2% from AI's entry
          const priceDivergence = Math.abs(livePrice - trade.entryPrice) / trade.entryPrice;
          if (priceDivergence > 0.02) {
            executed.push({ ticker: trade.ticker, action: trade.action, qty: trade.qty, price: livePrice, success: false, error: `Price moved ${(priceDivergence * 100).toFixed(1)}%` });
            continue;
          }

          try {
            submitOrder({
              symbol: trade.ticker,
              side: trade.action.toLowerCase() as 'buy' | 'sell',
              qty: trade.qty,
              type: 'market',
              price: livePrice,
              botSource: true,
            });
            executed.push({ ticker: trade.ticker, action: trade.action, qty: trade.qty, price: livePrice, success: true });
          } catch (orderErr) {
            executed.push({
              ticker: trade.ticker,
              action: trade.action,
              qty: trade.qty,
              price: livePrice,
              success: false,
              error: orderErr instanceof Error ? orderErr.message : 'Order failed',
            });
          }
        }

        // Track execution results
        const successCount = executed.filter(e => e.success).length;
        if (successCount > 0) setWinCount(w => w + successCount);
        const failCount = executed.filter(e => !e.success).length;
        if (failCount > 0) setLossCount(l => l + failCount);
      }

      // Log the cycle
      const log: GeniusCycleLog = {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        timeline,
        analysis,
        executedTrades: executed,
        portfolioBefore: { cash, equity },
        portfolioAfter: { cash, equity }, // Will update on next cycle
      };
      setLogs(prev => [log, ...prev].slice(0, 50));
      setCycleCount(c => c + 1);
      setStatus('cooldown');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Cycle failed');
      setStatus('error');
    } finally {
      runningRef.current = false;
    }
  }, [buildMarketSnapshot, cash, equity, positions, timeline, riskTolerance, autoExecute, submitOrder, resolvePrice]);

  // Auto-cycle timer
  useEffect(() => {
    if (!enabled) {
      if (timerRef.current) clearTimeout(timerRef.current);
      setStatus('idle');
      return;
    }

    const intervalMs = {
      short: 60_000,   // 1 minute cycles for scalping
      mid: 300_000,    // 5 minute cycles for swing
      long: 900_000,   // 15 minute cycles for position
    }[timeline];

    const cycle = async () => {
      await runCycle();
      if (mountedRef.current && enabled) {
        timerRef.current = setTimeout(cycle, intervalMs);
      }
    };

    // Start first cycle immediately
    cycle();

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [enabled, timeline, runCycle]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  // Manual trigger
  const runManual = useCallback(async () => {
    if (runningRef.current) return;
    await runCycle();
  }, [runCycle]);

  const clearLogs = useCallback(() => {
    setLogs([]);
    setCycleCount(0);
    setWinCount(0);
    setLossCount(0);
    setTotalPnl(0);
    setLastAnalysis(null);
  }, []);

  return {
    enabled,
    setEnabled,
    timeline,
    setTimeline,
    riskTolerance,
    setRiskTolerance,
    autoExecute,
    setAutoExecute,
    status,
    lastAnalysis,
    logs,
    error,
    cycleCount,
    winCount,
    lossCount,
    totalPnl,
    runManual,
    clearLogs,
  };
};
