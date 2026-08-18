import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { ALL_SYMBOLS, WATCHLIST_CATEGORIES, type WatchlistSymbol } from '@/data/tradingSymbols';
import { quoteIdFor } from '@/lib/priceSource';
import { useMarketQuotes } from '@/hooks/useMarketQuotes';
import { usePaperTrading } from '@/hooks/usePaperTrading';
import { useAuth } from '@/hooks/useAuth';

/**
 * PipelineProvider — the runtime substrate for the PIPELINE automation tool.
 *
 * Responsibilities:
 *  - exposes the FULL swap asset catalog (every symbol, every category)
 *  - dynamic live-quote subscription: any component can `subscribe(ticker)`
 *    and the provider batches those into the unified market-quotes service
 *  - a single `resolvePriceForTicker` resolver (real feeds only, never synthetic)
 *  - the shared paper-trading account the workflow engine executes against
 */

export interface PipelineContextValue {
  symbols: WatchlistSymbol[];
  categories: typeof WATCHLIST_CATEGORIES;
  paper: ReturnType<typeof usePaperTrading>;
  resolvePriceForTicker: (ticker: string) => number;
  changeForTicker: (ticker: string) => number | null;
  subscribe: (ticker: string | null | undefined) => void;
  unsubscribe: (ticker: string | null | undefined) => void;
  liveCount: number;
  subscribedCount: number;
}

const PipelineContext = createContext<PipelineContextValue | null>(null);

export const usePipeline = (): PipelineContextValue => {
  const ctx = useContext(PipelineContext);
  if (!ctx) throw new Error('usePipeline must be used inside <PipelineProvider>');
  return ctx;
};

/** Subscribe to a ticker for the lifetime of the calling component. */
export const usePipelinePrice = (ticker: string | null | undefined) => {
  const { subscribe, unsubscribe, resolvePriceForTicker, changeForTicker } = usePipeline();
  useEffect(() => {
    if (!ticker) return;
    subscribe(ticker);
    return () => unsubscribe(ticker);
  }, [ticker, subscribe, unsubscribe]);
  return {
    price: ticker ? resolvePriceForTicker(ticker) : 0,
    change: ticker ? changeForTicker(ticker) : null,
  };
};

export const PipelineProvider = ({
  children,
  seedTickers = [],
  intervalMs = 10000,
}: {
  children: React.ReactNode;
  seedTickers?: string[];
  intervalMs?: number;
}) => {
  const { user } = useAuth();
  const paper = usePaperTrading(user?.id);

  // Reference-counted ticker subscriptions
  const counts = useRef<Map<string, number>>(new Map());
  const [tickers, setTickers] = useState<string[]>(() => Array.from(new Set(seedTickers)));

  const flush = useCallback(() => {
    setTickers(Array.from(counts.current.keys()).sort());
  }, []);

  const subscribe = useCallback((t: string | null | undefined) => {
    if (!t) return;
    counts.current.set(t, (counts.current.get(t) ?? 0) + 1);
    flush();
  }, [flush]);

  const unsubscribe = useCallback((t: string | null | undefined) => {
    if (!t) return;
    const n = (counts.current.get(t) ?? 0) - 1;
    if (n > 0) counts.current.set(t, n);
    else counts.current.delete(t);
    flush();
  }, [flush]);

  // Seed + everything currently held in the paper book stays subscribed
  const activeTickers = useMemo(() => {
    const set = new Set<string>([...seedTickers, ...tickers]);
    paper.positions.forEach((p) => set.add(p.symbol));
    return Array.from(set);
  }, [tickers, paper.positions, seedTickers]);

  const symbolByTicker = useMemo(() => {
    const map = new Map<string, WatchlistSymbol>();
    ALL_SYMBOLS.forEach((s) => {
      if (!map.has(s.ticker)) map.set(s.ticker, s);
      map.set(s.key, s);
    });
    return map;
  }, []);

  const quoteIds = useMemo(() => {
    const ids = new Set<string>();
    activeTickers.forEach((t) => {
      const sym = symbolByTicker.get(t);
      const id = sym ? quoteIdFor(sym) : null;
      if (id) ids.add(id);
    });
    return Array.from(ids);
  }, [activeTickers, symbolByTicker]);

  const { quotes } = useMarketQuotes(quoteIds, intervalMs);

  const resolvePriceForTicker = useCallback((ticker: string): number => {
    const sym = symbolByTicker.get(ticker);
    if (!sym) return 0;
    const id = quoteIdFor(sym);
    const q = id ? quotes[id] : undefined;
    return q && q.last > 0 ? q.last : 0;
  }, [quotes, symbolByTicker]);

  const changeForTicker = useCallback((ticker: string): number | null => {
    const sym = symbolByTicker.get(ticker);
    if (!sym) return null;
    const id = quoteIdFor(sym);
    const q = id ? quotes[id] : undefined;
    return q && typeof q.change24h === 'number' ? q.change24h : null;
  }, [quotes, symbolByTicker]);

  const value = useMemo<PipelineContextValue>(() => ({
    symbols: ALL_SYMBOLS,
    categories: WATCHLIST_CATEGORIES,
    paper,
    resolvePriceForTicker,
    changeForTicker,
    subscribe,
    unsubscribe,
    liveCount: Object.values(quotes).filter((q) => q.last > 0).length,
    subscribedCount: quoteIds.length,
  }), [paper, resolvePriceForTicker, changeForTicker, subscribe, unsubscribe, quotes, quoteIds.length]);

  return <PipelineContext.Provider value={value}>{children}</PipelineContext.Provider>;
};

export default PipelineProvider;