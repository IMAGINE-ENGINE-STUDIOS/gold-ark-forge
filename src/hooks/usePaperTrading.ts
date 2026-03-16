import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface PaperPosition {
  id: string;
  symbol: string;
  side: 'buy' | 'sell';
  qty: number;
  entryPrice: number;
  currentPrice: number;
  openedAt: number;
  pnl: number;
  pnlPercent: number;
  botSource?: boolean;
}

export interface PaperOrder {
  id: string;
  symbol: string;
  side: 'buy' | 'sell';
  qty: number;
  type: 'market' | 'limit' | 'stop';
  price: number;
  limitPrice?: number;
  status: 'filled' | 'pending' | 'cancelled';
  filledAt: number;
  fees: number;
  botSource?: boolean;
  // Track entry/exit pairs for accurate win rate
  closedPnl?: number;
}

export interface FeeStructure {
  spreadBps: number;       // 5 = 0.05%
  commissionPerTrade: number; // flat $
  slippageBps: number;     // 2 = 0.02%
}

export interface PaperAccount {
  startingBalance: number;
  cash: number;
  equity: number;
  totalPnl: number;
  winRate: number;
  totalTrades: number;
  totalFees: number;
  realizedPnl: number;
  winCount: number;
  lossCount: number;
}

const DEFAULT_FEES: FeeStructure = { spreadBps: 5, commissionPerTrade: 1.50, slippageBps: 2 };
const STARTING_BALANCE = 100_000;

const loadLocal = () => {
  try {
    const raw = localStorage.getItem('ga_paper_trading_v2');
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return null;
};

const saveLocal = (positions: PaperPosition[], orders: PaperOrder[], cash: number, totalFees: number, realizedPnl: number, winCount: number, lossCount: number) => {
  try {
    localStorage.setItem('ga_paper_trading_v2', JSON.stringify({ positions, orders, cash, totalFees, realizedPnl, winCount, lossCount }));
  } catch { /* ignore */ }
};

export const usePaperTrading = (userId?: string | null) => {
  const saved = loadLocal();
  const [positions, setPositions] = useState<PaperPosition[]>(saved?.positions ?? []);
  const [orders, setOrders] = useState<PaperOrder[]>(saved?.orders ?? []);
  const [cash, setCash] = useState<number>(saved?.cash ?? STARTING_BALANCE);
  const [totalFees, setTotalFees] = useState<number>(saved?.totalFees ?? 0);
  const [realizedPnl, setRealizedPnl] = useState<number>(saved?.realizedPnl ?? 0);
  const [winCount, setWinCount] = useState<number>(saved?.winCount ?? 0);
  const [lossCount, setLossCount] = useState<number>(saved?.lossCount ?? 0);
  const [feeConfig] = useState<FeeStructure>(DEFAULT_FEES);
  const [cloudLoaded, setCloudLoaded] = useState(false);
  const syncTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load from cloud on mount if authenticated
  useEffect(() => {
    if (!userId) { setCloudLoaded(true); return; }
    const load = async () => {
      try {
        const { data } = await supabase
          .from('paper_portfolios')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle();
        if (data) {
          const cloudPositions = (data.positions as any[]) ?? [];
          const cloudOrders = (data.orders as any[]) ?? [];
          const cloudCash = Number(data.cash) || STARTING_BALANCE;
          setPositions(cloudPositions);
          setOrders(cloudOrders);
          setCash(cloudCash);
          saveLocal(cloudPositions, cloudOrders, cloudCash, 0, 0, 0, 0);
        }
      } catch { /* fallback to local */ }
      setCloudLoaded(true);
    };
    load();
  }, [userId]);

  // Debounced cloud sync
  const syncToCloud = useCallback((p: PaperPosition[], o: PaperOrder[], c: number) => {
    if (!userId) return;
    if (syncTimer.current) clearTimeout(syncTimer.current);
    syncTimer.current = setTimeout(async () => {
      try {
        await supabase.from('paper_portfolios').upsert({
          user_id: userId,
          positions: p as any,
          orders: o as any,
          cash: c,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });
      } catch { /* silent */ }
    }, 2000);
  }, [userId]);

  const persist = useCallback((p: PaperPosition[], o: PaperOrder[], c: number, f: number, rPnl: number, wc: number, lc: number) => {
    saveLocal(p, o, c, f, rPnl, wc, lc);
    syncToCloud(p, o, c);
  }, [syncToCloud]);

  // Calculate fees for a trade
  const computeFees = useCallback((price: number, qty: number): { fees: number; slippageAdjustment: number } => {
    const notional = price * qty;
    const spreadCost = notional * feeConfig.spreadBps / 10000;
    const slippageCost = notional * feeConfig.slippageBps / 10000;
    const commission = feeConfig.commissionPerTrade;
    const fees = spreadCost + slippageCost + commission;
    const slippageAdjustment = price * feeConfig.slippageBps / 10000;
    return { fees, slippageAdjustment };
  }, [feeConfig]);

  const submitOrder = useCallback((params: {
    symbol: string;
    side: 'buy' | 'sell';
    qty: number;
    type: 'market' | 'limit' | 'stop';
    price: number;
    limitPrice?: number;
    botSource?: boolean;
  }) => {
    const basePrice = params.type === 'market' ? params.price : (params.limitPrice ?? params.price);
    const { fees, slippageAdjustment } = computeFees(basePrice, params.qty);

    // Adjust fill price by slippage: buy higher, sell lower
    const fillPrice = params.side === 'buy'
      ? basePrice + slippageAdjustment
      : basePrice - slippageAdjustment;

    const cost = fillPrice * params.qty + (params.side === 'buy' ? fees : 0);

    if (params.side === 'buy' && cost > cash) {
      throw new Error(`Insufficient funds: need $${cost.toFixed(2)}, have $${cash.toFixed(2)}`);
    }

    // CRITICAL: Block naked short selling — can only sell what you own
    if (params.side === 'sell') {
      const ownedPosition = positions.find(
        p => p.symbol === params.symbol && p.side === 'buy'
      );
      const ownedQty = ownedPosition?.qty ?? 0;
      if (ownedQty <= 0) {
        throw new Error(`Cannot sell ${params.symbol} — you don't own any`);
      }
      if (params.qty > ownedQty) {
        throw new Error(`Cannot sell ${params.qty} ${params.symbol} — you only own ${ownedQty}`);
      }
    }

    let closedPnl: number | undefined;

    const existingIdx = positions.findIndex(
      p => p.symbol === params.symbol && p.side !== params.side
    );

    let newPositions = [...positions];
    let newCash = cash;
    let newTotalFees = totalFees + fees;
    let newRealizedPnl = realizedPnl;
    let newWinCount = winCount;
    let newLossCount = lossCount;

    if (existingIdx >= 0) {
      const existing = newPositions[existingIdx];
      const closeQty = Math.min(existing.qty, params.qty);
      const pnl = params.side === 'sell'
        ? (fillPrice - existing.entryPrice) * closeQty
        : (existing.entryPrice - fillPrice) * closeQty;
      const netPnl = pnl - fees;
      closedPnl = netPnl;

      // Track wins/losses accurately
      if (netPnl >= 0) newWinCount++;
      else newLossCount++;
      newRealizedPnl += netPnl;

      // Return capital + P&L minus fees
      newCash += existing.entryPrice * closeQty + pnl - fees;

      if (closeQty >= existing.qty) {
        newPositions.splice(existingIdx, 1);
      } else {
        newPositions[existingIdx] = { ...existing, qty: existing.qty - closeQty };
      }
    } else {
      if (params.side === 'buy') {
        newCash -= (fillPrice * params.qty + fees);
      } else {
        newCash += (fillPrice * params.qty - fees);
      }

      const existingSame = newPositions.findIndex(
        p => p.symbol === params.symbol && p.side === params.side
      );

      if (existingSame >= 0) {
        const ex = newPositions[existingSame];
        const totalQty = ex.qty + params.qty;
        const avgPrice = (ex.entryPrice * ex.qty + fillPrice * params.qty) / totalQty;
        newPositions[existingSame] = { ...ex, qty: totalQty, entryPrice: avgPrice };
      } else {
        newPositions.push({
          id: crypto.randomUUID(),
          symbol: params.symbol,
          side: params.side,
          qty: params.qty,
          entryPrice: fillPrice,
          currentPrice: fillPrice,
          openedAt: Date.now(),
          pnl: 0,
          pnlPercent: 0,
          botSource: params.botSource,
        });
      }
    }

    const order: PaperOrder = {
      id: crypto.randomUUID(),
      symbol: params.symbol,
      side: params.side,
      qty: params.qty,
      type: params.type,
      price: fillPrice,
      limitPrice: params.limitPrice,
      status: 'filled',
      filledAt: Date.now(),
      fees,
      botSource: params.botSource,
      closedPnl,
    };

    const newOrders = [order, ...orders].slice(0, 200);
    setPositions(newPositions);
    setOrders(newOrders);
    setCash(newCash);
    setTotalFees(newTotalFees);
    setRealizedPnl(newRealizedPnl);
    setWinCount(newWinCount);
    setLossCount(newLossCount);
    persist(newPositions, newOrders, newCash, newTotalFees, newRealizedPnl, newWinCount, newLossCount);

    return order;
  }, [positions, orders, cash, totalFees, realizedPnl, winCount, lossCount, persist, computeFees]);

  const updatePrices = useCallback((priceMap: Record<string, number>) => {
    setPositions(prev => prev.map(p => {
      const currentPrice = priceMap[p.symbol] ?? p.currentPrice;
      const pnl = p.side === 'buy'
        ? (currentPrice - p.entryPrice) * p.qty
        : (p.entryPrice - currentPrice) * p.qty;
      const pnlPercent = p.entryPrice > 0 ? (pnl / (p.entryPrice * p.qty)) * 100 : 0;
      return { ...p, currentPrice, pnl, pnlPercent };
    }));
  }, []);

  const closePosition = useCallback((positionId: string, currentPrice: number, botSource?: boolean) => {
    const pos = positions.find(p => p.id === positionId);
    if (!pos) return;
    submitOrder({
      symbol: pos.symbol,
      side: pos.side === 'buy' ? 'sell' : 'buy',
      qty: pos.qty,
      type: 'market',
      price: currentPrice,
      botSource,
    });
  }, [positions, submitOrder]);

  const resetAccount = useCallback(async () => {
    setPositions([]);
    setOrders([]);
    setCash(STARTING_BALANCE);
    setTotalFees(0);
    setRealizedPnl(0);
    setWinCount(0);
    setLossCount(0);
    localStorage.removeItem('ga_paper_trading_v2');
    localStorage.removeItem('ga_paper_trading');
    if (userId) {
      try {
        await supabase.from('paper_portfolios').upsert({
          user_id: userId,
          positions: [] as any,
          orders: [] as any,
          cash: STARTING_BALANCE,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });
      } catch { /* silent */ }
    }
  }, [userId]);

  const account = useMemo<PaperAccount>(() => {
    const positionsValue = positions.reduce((s, p) => {
      return s + (p.side === 'buy' ? p.currentPrice * p.qty : (2 * p.entryPrice - p.currentPrice) * p.qty);
    }, 0);
    const equity = cash + positionsValue;
    const totalPnl = equity - STARTING_BALANCE;
    const totalClosedTrades = winCount + lossCount;
    const accurateWinRate = totalClosedTrades > 0 ? (winCount / totalClosedTrades) * 100 : 0;

    return {
      startingBalance: STARTING_BALANCE,
      cash,
      equity,
      totalPnl,
      winRate: accurateWinRate,
      totalTrades: orders.filter(o => o.status === 'filled').length,
      totalFees,
      realizedPnl,
      winCount,
      lossCount,
    };
  }, [positions, orders, cash, totalFees, realizedPnl, winCount, lossCount]);

  return {
    positions,
    orders,
    account,
    submitOrder,
    updatePrices,
    closePosition,
    resetAccount,
    isPaper: true as const,
    cloudLoaded,
    feeConfig,
  };
};
