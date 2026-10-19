import { useCallback, useMemo, useEffect, useRef, useState, useSyncExternalStore } from 'react';
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

const DEFAULT_FEES: FeeStructure = { spreadBps: 5, commissionPerTrade: 0, slippageBps: 2 }; // commission $0 — matches her broker (Alpaca charges none); spread + slippage are the real friction
const STARTING_BALANCE = 100_000;

const deriveStatsFromOrders = (orders: PaperOrder[]) => {
  let totalFees = 0, realizedPnl = 0, winCount = 0, lossCount = 0;
  for (const o of orders) {
    totalFees += o.fees || 0;
    if (o.closedPnl !== undefined) {
      realizedPnl += o.closedPnl;
      if (o.closedPnl >= 0) winCount++; else lossCount++;
    }
  }
  return { totalFees, realizedPnl, winCount, lossCount };
};

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

/* ─────────────────────── ONE shared paper account ───────────────────────
   The paper account is a module-level singleton: Pipeline V4, the Swap
   (Trading Bridge) and every panel read and write the SAME in-memory
   book, so a position opened by a pipeline run is instantly the Swap's
   position and vice versa — no page can overwrite the other's trades
   with a stale copy. localStorage + the cloud portfolio remain the
   persistence layers; the store is the single writer to both.
   ─────────────────────────────────────────────────────────────────────── */

export interface PaperState {
  positions: PaperPosition[];
  orders: PaperOrder[];
  cash: number;
  totalFees: number;
  realizedPnl: number;
  winCount: number;
  lossCount: number;
}

const blankState = (): PaperState => {
  const saved = loadLocal();
  return {
    positions: saved?.positions ?? [],
    orders: saved?.orders ?? [],
    cash: saved?.cash ?? STARTING_BALANCE,
    totalFees: saved?.totalFees ?? 0,
    realizedPnl: saved?.realizedPnl ?? 0,
    winCount: saved?.winCount ?? 0,
    lossCount: saved?.lossCount ?? 0,
  };
};

let paperState: PaperState = blankState();
const paperListeners = new Set<() => void>();

const notifyPaper = (persist = true) => {
  if (persist) {
    saveLocal(paperState.positions, paperState.orders, paperState.cash, paperState.totalFees, paperState.realizedPnl, paperState.winCount, paperState.lossCount);
  }
  paperListeners.forEach((l) => l());
};

export const paperStore = {
  get: (): PaperState => paperState,
  set: (next: PaperState, persist = true) => { paperState = next; notifyPaper(persist); },
  subscribe: (fn: () => void) => {
    paperListeners.add(fn);
    return () => { paperListeners.delete(fn); };
  },
};

/* Cross-tab coherence: another tab's trades reload this tab's book. */
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === 'ga_paper_trading_v2') {
      paperState = blankState();
      notifyPaper(false);
    }
  });
}

/* Cloud sync (debounced) + one-time cloud load, shared across consumers. */
let activeUserId: string | null = null;
let cloudLoadStarted = false;
let syncTimer: ReturnType<typeof setTimeout> | null = null;

const syncToCloud = () => {
  if (!activeUserId) return;
  if (syncTimer) clearTimeout(syncTimer);
  syncTimer = setTimeout(async () => {
    try {
      await supabase.from('paper_portfolios').upsert({
        user_id: activeUserId,
        positions: paperState.positions as any,
        orders: paperState.orders as any,
        cash: paperState.cash,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });
    } catch { /* silent */ }
  }, 2000);
};


export const usePaperTrading = (userId?: string | null) => {
  const snap = useSyncExternalStore(paperStore.subscribe, paperStore.get, paperStore.get);
  const { positions, orders, cash, totalFees, realizedPnl, winCount, lossCount } = snap;
  const [feeConfig] = useState<FeeStructure>(DEFAULT_FEES);
  const [cloudLoaded, setCloudLoaded] = useState(cloudLoadStarted);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    if (userId) activeUserId = userId;
    if (!userId) { setCloudLoaded(true); return; }
    if (cloudLoadStarted) { setCloudLoaded(true); return; }
    cloudLoadStarted = true;
    (async () => {
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
          const stats = deriveStatsFromOrders(cloudOrders);
          paperStore.set({
            positions: cloudPositions, orders: cloudOrders, cash: cloudCash,
            totalFees: stats.totalFees, realizedPnl: stats.realizedPnl,
            winCount: stats.winCount, lossCount: stats.lossCount,
          });
        }
      } catch { /* fallback to local */ }
      if (mounted.current) setCloudLoaded(true);
    })();
    return () => { mounted.current = false; };
  }, [userId]);

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
    // Always trade against the freshest shared book — never a page's
    // possibly-stale snapshot.
    const cur = paperStore.get();
    const curPositions = cur.positions, curOrders = cur.orders, curCash = cur.cash;
    const basePrice = params.type === 'market' ? params.price : (params.limitPrice ?? params.price);
    const { fees, slippageAdjustment } = computeFees(basePrice, params.qty);

    // Adjust fill price by slippage: buy higher, sell lower
    const fillPrice = params.side === 'buy'
      ? basePrice + slippageAdjustment
      : basePrice - slippageAdjustment;

    const cost = fillPrice * params.qty + (params.side === 'buy' ? fees : 0);

    if (params.side === 'buy' && cost > curCash) {
      throw new Error(`Insufficient funds: need $${cost.toFixed(2)}, have $${curCash.toFixed(2)}`);
    }

    // CRITICAL: Block naked short selling — can only sell what you own
    if (params.side === 'sell') {
      const ownedPosition = curPositions.find(
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

    const existingIdx = curPositions.findIndex(
      p => p.symbol === params.symbol && p.side !== params.side
    );

    let newPositions = [...curPositions];
    let newCash = curCash;
    let newTotalFees = cur.totalFees + fees;
    let newRealizedPnl = cur.realizedPnl;
    let newWinCount = cur.winCount;
    let newLossCount = cur.lossCount;

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
      } else {
        // Sell without opposite position should never reach here due to guard above
        throw new Error(`Cannot sell ${params.symbol} — no position owned`);
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

    const newOrders = [order, ...curOrders].slice(0, 200);
    paperStore.set({
      positions: newPositions, orders: newOrders, cash: newCash,
      totalFees: newTotalFees, realizedPnl: newRealizedPnl,
      winCount: newWinCount, lossCount: newLossCount,
    });
    syncToCloud();

    return order;
  }, [computeFees]);

  const updatePrices = useCallback((priceMap: Record<string, number>) => {
    const cur = paperStore.get();
    const next = cur.positions.map(p => {
      const currentPrice = priceMap[p.symbol] ?? p.currentPrice;
      const pnl = p.side === 'buy'
        ? (currentPrice - p.entryPrice) * p.qty
        : (p.entryPrice - currentPrice) * p.qty;
      const pnlPercent = p.entryPrice > 0 ? (pnl / (p.entryPrice * p.qty)) * 100 : 0;
      return { ...p, currentPrice, pnl, pnlPercent };
    });
    // Price marks move constantly; don't write storage for them.
    paperStore.set({ ...cur, positions: next }, false);
  }, []);

  const closePosition = useCallback((positionId: string, currentPrice: number, botSource?: boolean) => {
    const pos = paperStore.get().positions.find(p => p.id === positionId);
    if (!pos) return;
    submitOrder({
      symbol: pos.symbol,
      side: pos.side === 'buy' ? 'sell' : 'buy',
      qty: pos.qty,
      type: 'market',
      price: currentPrice,
      botSource,
    });
  }, [submitOrder]);

  const resetAccount = useCallback(async () => {
    paperStore.set({
      positions: [], orders: [], cash: STARTING_BALANCE,
      totalFees: 0, realizedPnl: 0, winCount: 0, lossCount: 0,
    }, false);
    try {
      localStorage.removeItem('ga_paper_trading_v2');
      localStorage.removeItem('ga_paper_trading');
    } catch { /* ignore */ }
    if (activeUserId) {
      try {
        await supabase.from('paper_portfolios').upsert({
          user_id: activeUserId,
          positions: [] as any,
          orders: [] as any,
          cash: STARTING_BALANCE,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });
      } catch { /* silent */ }
    }
  }, []);

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
