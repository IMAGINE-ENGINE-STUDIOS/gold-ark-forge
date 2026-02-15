import { useState, useCallback, useMemo } from 'react';

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
}

export interface PaperAccount {
  startingBalance: number;
  cash: number;
  equity: number;
  totalPnl: number;
  winRate: number;
  totalTrades: number;
}

const STARTING_BALANCE = 100_000;

const loadState = () => {
  try {
    const raw = localStorage.getItem('ga_paper_trading');
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return null;
};

const saveState = (positions: PaperPosition[], orders: PaperOrder[], cash: number) => {
  try {
    localStorage.setItem('ga_paper_trading', JSON.stringify({ positions, orders, cash }));
  } catch { /* ignore */ }
};

export const usePaperTrading = () => {
  const saved = loadState();
  const [positions, setPositions] = useState<PaperPosition[]>(saved?.positions ?? []);
  const [orders, setOrders] = useState<PaperOrder[]>(saved?.orders ?? []);
  const [cash, setCash] = useState<number>(saved?.cash ?? STARTING_BALANCE);

  const persist = useCallback((p: PaperPosition[], o: PaperOrder[], c: number) => {
    saveState(p, o, c);
  }, []);

  const submitOrder = useCallback((params: {
    symbol: string;
    side: 'buy' | 'sell';
    qty: number;
    type: 'market' | 'limit' | 'stop';
    price: number;
    limitPrice?: number;
  }) => {
    const fillPrice = params.type === 'market' ? params.price : (params.limitPrice ?? params.price);
    const cost = fillPrice * params.qty;

    // Check buying power
    if (params.side === 'buy' && cost > cash) {
      throw new Error(`Insufficient funds: need $${cost.toFixed(2)}, have $${cash.toFixed(2)}`);
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
    };

    // Check if closing existing position
    const existingIdx = positions.findIndex(
      p => p.symbol === params.symbol && p.side !== params.side
    );

    let newPositions = [...positions];
    let newCash = cash;

    if (existingIdx >= 0) {
      const existing = newPositions[existingIdx];
      const closeQty = Math.min(existing.qty, params.qty);
      const pnl = params.side === 'sell'
        ? (fillPrice - existing.entryPrice) * closeQty
        : (existing.entryPrice - fillPrice) * closeQty;
      newCash += existing.entryPrice * closeQty + pnl;

      if (closeQty >= existing.qty) {
        newPositions.splice(existingIdx, 1);
      } else {
        newPositions[existingIdx] = { ...existing, qty: existing.qty - closeQty };
      }
    } else {
      // Open new position
      if (params.side === 'buy') {
        newCash -= cost;
      } else {
        newCash += cost; // Short sale proceeds
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
        });
      }
    }

    const newOrders = [order, ...orders].slice(0, 100);
    setPositions(newPositions);
    setOrders(newOrders);
    setCash(newCash);
    persist(newPositions, newOrders, newCash);

    return order;
  }, [positions, orders, cash, persist]);

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

  const closePosition = useCallback((positionId: string, currentPrice: number) => {
    const pos = positions.find(p => p.id === positionId);
    if (!pos) return;
    submitOrder({
      symbol: pos.symbol,
      side: pos.side === 'buy' ? 'sell' : 'buy',
      qty: pos.qty,
      type: 'market',
      price: currentPrice,
    });
  }, [positions, submitOrder]);

  const resetAccount = useCallback(() => {
    setPositions([]);
    setOrders([]);
    setCash(STARTING_BALANCE);
    localStorage.removeItem('ga_paper_trading');
  }, []);

  const account = useMemo<PaperAccount>(() => {
    const positionsValue = positions.reduce((s, p) => {
      return s + (p.side === 'buy' ? p.currentPrice * p.qty : (2 * p.entryPrice - p.currentPrice) * p.qty);
    }, 0);
    const equity = cash + positionsValue;
    const totalPnl = equity - STARTING_BALANCE;
    const filledOrders = orders.filter(o => o.status === 'filled');
    const wins = filledOrders.filter((o, i) => {
      if (i === 0) return false;
      return o.price > filledOrders[i - 1]?.price;
    }).length;
    const winRate = filledOrders.length > 1 ? (wins / (filledOrders.length - 1)) * 100 : 0;

    return {
      startingBalance: STARTING_BALANCE,
      cash,
      equity,
      totalPnl,
      winRate,
      totalTrades: filledOrders.length,
    };
  }, [positions, orders, cash]);

  return {
    positions,
    orders,
    account,
    submitOrder,
    updatePrices,
    closePosition,
    resetAccount,
    isPaper: true as const,
  };
};
