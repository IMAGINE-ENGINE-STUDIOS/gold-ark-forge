import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useCryptoData } from '@/hooks/useCryptoData';
import { useMetalPrices } from '@/hooks/useMetalPrices';
import { useOilGasPrices } from '@/hooks/useOilGasData';
import { ALL_SYMBOLS, SYNTHETIC_PRICES, REAL_FEED_SYMBOLS } from '@/data/tradingSymbols';
import { buildTechnicalSnapshot } from '@/lib/technicalSignals';
import type { PaperPosition } from '@/hooks/usePaperTrading';

export type GeniusTimeline = 'short' | 'mid' | 'long';
export type GeniusStatus = 'idle' | 'scanning' | 'analyzing' | 'executing' | 'cooldown' | 'error' | 'goal-active';

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
    pnl?: number;
  }>;
  portfolioBefore: { cash: number; equity: number };
  portfolioAfter: { cash: number; equity: number };
}

export interface GeniusChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  suggestedTrade?: { action: string; ticker: string; qty: number; reason: string } | null;
}

export interface GeniusGoalPlan {
  feasible: boolean;
  plan: {
    summary: string;
    estimatedTimeHours: number;
    riskLevel: string;
    phases: Array<{ name: string; durationMinutes: number; targetPnl: number; assetFocus: string[]; approach: string }>;
    circuitBreaker: { maxLossPercent: number; maxConsecutiveLosses: number; pauseDurationMinutes: number };
  };
  initialTrades: GeniusTrade[];
  warning: string | null;
}

export interface GeniusGoal {
  type: 'hourly_target' | 'daily_target' | 'total_target' | 'percentage';
  amount: number;
  timeframeHours: number;
  description: string;
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
  submitOrder, positions, cash, equity, resolvePrice, getCandleHistory,
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

  // Chat state
  const [chatMessages, setChatMessages] = useState<GeniusChatMessage[]>([]);
  const [chatLoading, setChatLoading] = useState(false);

  // Goal state
  const [activeGoal, setActiveGoal] = useState<GeniusGoal | null>(null);
  const [goalPlan, setGoalPlan] = useState<GeniusGoalPlan | null>(null);
  const [goalAccepted, setGoalAccepted] = useState(false);
  const [goalStartEquity, setGoalStartEquity] = useState(0);
  const [goalPnl, setGoalPnl] = useState(0);

  // Circuit breaker: 20% max loss
  const [circuitBroken, setCircuitBroken] = useState(false);
  const consecutiveLossesRef = useRef(0);

  const { data: cryptoData } = useCryptoData(50);
  const { data: metalPrices } = useMetalPrices();
  const { data: oilPrices } = useOilGasPrices();

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);
  const runningRef = useRef(false);

  // Compute real P&L from executed trades in logs
  useEffect(() => {
    let pnl = 0;
    let wins = 0;
    let losses = 0;
    for (const log of logs) {
      for (const t of log.executedTrades) {
        if (t.pnl !== undefined) {
          pnl += t.pnl;
          if (t.pnl >= 0) wins++; else losses++;
        } else if (t.success) wins++;
      }
    }
    setTotalPnl(pnl);
    setWinCount(wins);
    setLossCount(losses);
  }, [logs]);

  // Track goal P&L
  useEffect(() => {
    if (activeGoal && goalAccepted && goalStartEquity > 0) {
      setGoalPnl(equity - goalStartEquity);
    }
  }, [equity, activeGoal, goalAccepted, goalStartEquity]);

  // Build market snapshot
  const buildMarketSnapshot = useCallback(() => {
    const assets: Array<any> = [];
    for (const sym of REAL_FEED_SYMBOLS) {
      let price = 0, change24h = 0, volume: number | undefined, sparkline: number[] | undefined;
      if (sym.cat === 'metals') {
        const mk = ({ gold: 'gold', silver: 'silver', platinum: 'platinum' } as any)[sym.key];
        if (mk && metalPrices?.[mk]) { price = metalPrices[mk].price_usd; change24h = metalPrices[mk].change_24h ?? 0; }
      } else if (sym.cat === 'crypto') {
        const coin = cryptoData?.find(c => c.id === sym.key || c.symbol === sym.key);
        if (coin) { price = coin.current_price; change24h = coin.price_change_percentage_24h; volume = coin.total_volume; sparkline = coin.sparkline_in_7d?.price; }
      } else if (sym.cat === 'energy') {
        const feed = oilPrices?.find(p => p.symbol === sym.ticker);
        if (feed) { price = feed.price; change24h = feed.change; }
      }
      if (price <= 0) continue;
      let technicals: any;
      const candleHistory = getCandleHistory(sym.ticker);
      if (candleHistory && candleHistory.length >= 30) {
        const highs = candleHistory.map((c, i) => Math.max(c, candleHistory[Math.max(0, i - 1)] ?? c));
        const lows = candleHistory.map((c, i) => Math.min(c, candleHistory[Math.max(0, i - 1)] ?? c));
        const snapshot = buildTechnicalSnapshot({ closes: candleHistory, highs, lows });
        if (snapshot) {
          technicals = { rsi: snapshot.oscillators.find(o => o.name === 'RSI (14)')?.value ?? 50, macdSignal: snapshot.oscillators.find(o => o.name === 'MACD Level')?.signal ?? 'Neutral', smaSignal: snapshot.movingAverages.find(o => o.name === 'SMA (20)')?.signal ?? 'Neutral', adx: snapshot.oscillators.find(o => o.name === 'ADX (14)')?.value ?? 18, overallBias: snapshot.overallBias, overallSignal: snapshot.overallSignal, regime: snapshot.decision.regime };
        }
      }
      assets.push({ key: sym.key, ticker: sym.ticker, cat: sym.cat, label: sym.label, price, change24h, volume, sparkline: sparkline?.slice(-24), technicals });
    }
    return assets;
  }, [cryptoData, metalPrices, oilPrices, getCandleHistory]);

  const getPortfolioSnapshot = useCallback(() => ({
    cash, equity,
    positions: positions.map(p => ({ symbol: p.symbol, side: p.side, qty: p.qty, entryPrice: p.entryPrice, currentPrice: p.currentPrice, pnl: p.pnl })),
  }), [cash, equity, positions]);

  const getPerformanceContext = useCallback(() => ({
    totalPnl, winRate: winCount + lossCount > 0 ? (winCount / (winCount + lossCount)) * 100 : 0,
    totalTrades: winCount + lossCount, currentStreak: consecutiveLossesRef.current,
    goalProgress: activeGoal ? goalPnl / activeGoal.amount * 100 : undefined,
  }), [totalPnl, winCount, lossCount, goalPnl, activeGoal]);

  // 20% circuit breaker check
  const checkCircuitBreaker = useCallback(() => {
    if (!activeGoal || !goalAccepted) return false;
    const maxLoss = goalStartEquity * 0.20;
    if (goalPnl < -maxLoss) {
      setCircuitBroken(true);
      setEnabled(false);
      setError(`CIRCUIT BREAKER: Lost $${Math.abs(goalPnl).toFixed(2)} (>${20}% of starting equity). Auto-stopped.`);
      return true;
    }
    if (consecutiveLossesRef.current >= (goalPlan?.plan.circuitBreaker.maxConsecutiveLosses || 5)) {
      setCircuitBroken(true);
      setEnabled(false);
      setError(`CIRCUIT BREAKER: ${consecutiveLossesRef.current} consecutive losses. Auto-stopped.`);
      return true;
    }
    return false;
  }, [activeGoal, goalAccepted, goalStartEquity, goalPnl, goalPlan]);

  // ─── Strategy Cycle ───
  const runCycle = useCallback(async () => {
    if (runningRef.current || !mountedRef.current) return;
    if (checkCircuitBreaker()) return;
    runningRef.current = true;
    setError(null);

    try {
      setStatus('scanning');
      const assets = buildMarketSnapshot();
      if (assets.length < 3) { setError('Insufficient market data'); setStatus('error'); runningRef.current = false; return; }

      setStatus('analyzing');
      const { data, error: fnError } = await supabase.functions.invoke('genius-strategy', {
        body: {
          mode: 'strategy', timeline, assets,
          portfolio: getPortfolioSnapshot(),
          riskTolerance,
          performanceContext: getPerformanceContext(),
        },
      });

      if (fnError || !data?.success) { setError(data?.error || fnError?.message || 'Analysis failed'); setStatus('error'); runningRef.current = false; return; }

      const analysis: GeniusAnalysis = data.analysis;
      setLastAnalysis(analysis);

      const executed: GeniusCycleLog['executedTrades'] = [];
      if (autoExecute && analysis.trades?.length > 0) {
        setStatus('executing');
        for (const trade of analysis.trades) {
          const livePrice = resolvePrice(trade.ticker);
          if (livePrice <= 0) { executed.push({ ticker: trade.ticker, action: trade.action, qty: trade.qty, price: 0, success: false, error: 'No live price' }); continue; }
          const priceDivergence = Math.abs(livePrice - trade.entryPrice) / trade.entryPrice;
          if (priceDivergence > 0.02) { executed.push({ ticker: trade.ticker, action: trade.action, qty: trade.qty, price: livePrice, success: false, error: `Price moved ${(priceDivergence * 100).toFixed(1)}%` }); continue; }
          try {
            submitOrder({ symbol: trade.ticker, side: trade.action.toLowerCase() as 'buy' | 'sell', qty: trade.qty, type: 'market', price: livePrice, botSource: true });
            executed.push({ ticker: trade.ticker, action: trade.action, qty: trade.qty, price: livePrice, success: true });
            consecutiveLossesRef.current = 0;
          } catch (orderErr) {
            executed.push({ ticker: trade.ticker, action: trade.action, qty: trade.qty, price: livePrice, success: false, error: orderErr instanceof Error ? orderErr.message : 'Order failed' });
            consecutiveLossesRef.current++;
          }
        }
      }

      const log: GeniusCycleLog = {
        id: crypto.randomUUID(), timestamp: Date.now(), timeline, analysis, executedTrades: executed,
        portfolioBefore: { cash, equity }, portfolioAfter: { cash, equity },
      };
      setLogs(prev => [log, ...prev].slice(0, 50));
      setCycleCount(c => c + 1);

      // Check if goal achieved
      if (activeGoal && goalAccepted && goalPnl >= activeGoal.amount) {
        setEnabled(false);
        setStatus('idle');
        setError(null);
        setChatMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'assistant', content: `🎯 GOAL ACHIEVED! Target of $${activeGoal.amount.toFixed(2)} reached. Current P&L: $${goalPnl.toFixed(2)}. Auto-stopped.`, timestamp: Date.now(), suggestedTrade: null }]);
      } else {
        setStatus('cooldown');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Cycle failed');
      setStatus('error');
    } finally {
      runningRef.current = false;
    }
  }, [buildMarketSnapshot, cash, equity, positions, timeline, riskTolerance, autoExecute, submitOrder, resolvePrice, getPortfolioSnapshot, getPerformanceContext, checkCircuitBreaker, activeGoal, goalAccepted, goalPnl]);

  // Auto-cycle timer
  useEffect(() => {
    if (!enabled) { if (timerRef.current) clearTimeout(timerRef.current); if (status !== 'error') setStatus('idle'); return; }
    const intervalMs = { short: 60_000, mid: 300_000, long: 900_000 }[timeline];
    const cycle = async () => { await runCycle(); if (mountedRef.current && enabled) timerRef.current = setTimeout(cycle, intervalMs); };
    cycle();
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [enabled, timeline, runCycle]);

  useEffect(() => { mountedRef.current = true; return () => { mountedRef.current = false; if (timerRef.current) clearTimeout(timerRef.current); }; }, []);

  // ─── Chat ───
  const sendChat = useCallback(async (message: string) => {
    if (!message.trim() || chatLoading) return;
    const userMsg: GeniusChatMessage = { id: crypto.randomUUID(), role: 'user', content: message, timestamp: Date.now() };
    setChatMessages(prev => [...prev, userMsg]);
    setChatLoading(true);

    try {
      const assets = buildMarketSnapshot();
      const { data, error: fnError } = await supabase.functions.invoke('genius-strategy', {
        body: {
          mode: 'chat', chatMessage: message,
          chatHistory: chatMessages.slice(-20).map(m => ({ role: m.role, content: m.content })),
          assets, portfolio: getPortfolioSnapshot(),
          performanceContext: getPerformanceContext(),
        },
      });

      if (fnError || !data?.success) throw new Error(data?.error || fnError?.message || 'Chat failed');

      const assistantMsg: GeniusChatMessage = {
        id: crypto.randomUUID(), role: 'assistant', content: data.reply, timestamp: Date.now(),
        suggestedTrade: data.suggestedTrade,
      };
      setChatMessages(prev => [...prev, assistantMsg]);

      // If user asked to buy/sell and AI suggested a trade, execute it
      if (data.suggestedTrade && autoExecute) {
        const t = data.suggestedTrade;
        const livePrice = resolvePrice(t.ticker);
        if (livePrice > 0) {
          submitOrder({ symbol: t.ticker, side: t.action.toLowerCase() as 'buy' | 'sell', qty: t.qty, type: 'market', price: livePrice, botSource: true });
        }
      }
    } catch (err) {
      setChatMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'assistant', content: `Error: ${err instanceof Error ? err.message : 'Failed'}`, timestamp: Date.now() }]);
    } finally {
      setChatLoading(false);
    }
  }, [chatMessages, chatLoading, buildMarketSnapshot, getPortfolioSnapshot, getPerformanceContext, autoExecute, submitOrder, resolvePrice]);

  // ─── Goal ───
  const submitGoal = useCallback(async (goal: GeniusGoal) => {
    setActiveGoal(goal);
    setGoalPlan(null);
    setGoalAccepted(false);
    setCircuitBroken(false);
    setChatLoading(true);

    try {
      const assets = buildMarketSnapshot();
      const { data, error: fnError } = await supabase.functions.invoke('genius-strategy', {
        body: {
          mode: 'goal', goal, assets,
          portfolio: getPortfolioSnapshot(),
          riskTolerance,
          performanceContext: getPerformanceContext(),
        },
      });

      if (fnError || !data?.success) throw new Error(data?.error || fnError?.message || 'Goal planning failed');
      setGoalPlan(data.plan);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Goal planning failed');
    } finally {
      setChatLoading(false);
    }
  }, [buildMarketSnapshot, getPortfolioSnapshot, riskTolerance, getPerformanceContext]);

  const acceptGoal = useCallback(() => {
    if (!goalPlan) return;
    setGoalAccepted(true);
    setGoalStartEquity(equity);
    setGoalPnl(0);
    setEnabled(true);
    // NEVER auto-execute — user must approve each trade
    setAutoExecute(false);
    setStatus('goal-active');

    // Present initial trades as suggestions but don't execute them
    if (goalPlan.initialTrades?.length > 0) {
      const tradeList = goalPlan.initialTrades.map(t => `${t.action} ${t.qty} ${t.ticker} @ $${t.entryPrice.toFixed(2)} — ${t.reason}`).join('\n');
      setChatMessages(prev => [...prev, {
        id: crypto.randomUUID(), role: 'assistant',
        content: `📋 **Goal plan ready.** Here are the suggested initial trades:\n\n${tradeList}\n\nUse the EXECUTE buttons below each trade suggestion, or approve trades manually in the TRADE tab.`,
        timestamp: Date.now(), suggestedTrade: goalPlan.initialTrades.length === 1 ? { action: goalPlan.initialTrades[0].action, ticker: goalPlan.initialTrades[0].ticker, qty: goalPlan.initialTrades[0].qty, reason: goalPlan.initialTrades[0].reason } : null,
      }]);
    }
  }, [goalPlan, equity]);

  const cancelGoal = useCallback(() => {
    setActiveGoal(null);
    setGoalPlan(null);
    setGoalAccepted(false);
    setCircuitBroken(false);
    setEnabled(false);
    setStatus('idle');
  }, []);

  const executeTrade = useCallback((trade: { action: string; ticker: string; qty: number }) => {
    const livePrice = resolvePrice(trade.ticker);
    if (livePrice <= 0) return;
    submitOrder({ symbol: trade.ticker, side: trade.action.toLowerCase() as 'buy' | 'sell', qty: trade.qty, type: 'market', price: livePrice, botSource: true });
  }, [submitOrder, resolvePrice]);

  const runManual = useCallback(async () => { if (!runningRef.current) await runCycle(); }, [runCycle]);
  const clearLogs = useCallback(() => { setLogs([]); setCycleCount(0); setTotalPnl(0); setLastAnalysis(null); consecutiveLossesRef.current = 0; }, []);
  const clearChat = useCallback(() => setChatMessages([]), []);

  return {
    enabled, setEnabled, timeline, setTimeline, riskTolerance, setRiskTolerance,
    autoExecute, setAutoExecute, status, lastAnalysis, logs, error,
    cycleCount, winCount, lossCount, totalPnl, runManual, clearLogs,
    // Chat
    chatMessages, chatLoading, sendChat, clearChat,
    // Goal
    activeGoal, goalPlan, goalAccepted, goalPnl, goalStartEquity,
    submitGoal, acceptGoal, cancelGoal, circuitBroken,
    // Trade execution from chat
    executeTrade,
    // Positions for dashboard
    positions,
  };
};
