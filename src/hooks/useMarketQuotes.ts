import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ALL_SYMBOLS } from '@/data/tradingSymbols';
import { quoteIdFor } from '@/lib/priceSource';

export interface MarketQuote {
  id: string;
  last: number;
  prevClose: number | null;
  change24h: number | null;
  ts: string;
  source: string;
}

export type QuoteMap = Record<string, MarketQuote>;

const MAX_SYMBOLS = 400;
const BATCH = 100;

const fetchBatch = async (symbols: string[]): Promise<QuoteMap> => {
  const { data, error } = await supabase.functions.invoke('market-quotes', {
    body: { symbols },
  });
  if (error) throw error;
  return (data?.quotes ?? {}) as QuoteMap;
};

const fetchQuotes = async (symbols: string[]): Promise<QuoteMap> => {
  if (symbols.length === 0) return {};
  const chunks: string[][] = [];
  for (let i = 0; i < symbols.length; i += BATCH) chunks.push(symbols.slice(i, i + BATCH));
  const results = await Promise.all(chunks.map(fetchBatch));
  return Object.assign({}, ...results) as QuoteMap;
};

/**
 * Live quotes for any list of provider quote ids (see `quoteIdFor`).
 * Backed by the `market-quotes` edge function (Yahoo / gold-api / Coinbase)
 * which also persists last-known-good ticks to the database.
 */
export const useMarketQuotes = (symbols: (string | null | undefined)[], intervalMs = 15000) => {
  const list = useMemo(
    () => Array.from(new Set(symbols.filter((s): s is string => !!s))).slice(0, MAX_SYMBOLS).sort(),
    [symbols],
  );

  const query = useQuery({
    queryKey: ['market-quotes', list],
    queryFn: () => fetchQuotes(list),
    enabled: list.length > 0,
    refetchInterval: intervalMs,
    staleTime: intervalMs / 2,
    placeholderData: (prev) => prev,
  });

  return {
    quotes: (query.data ?? {}) as QuoteMap,
    isLoading: query.isLoading,
    error: query.error,
  };
};

/** Convenience single-symbol variant. */
export const useMarketQuote = (symbol: string | null, intervalMs = 15000) => {
  const { quotes, isLoading } = useMarketQuotes([symbol], intervalMs);
  const q = symbol ? quotes[symbol] : undefined;
  return { quote: q ?? null, price: q?.last ?? null, change: q?.change24h ?? null, isLoading };
};

/** Live quotes keyed by our internal catalog key (no synthetic fallback). */
export const useSymbolQuotes = (keys: string[], intervalMs = 30000) => {
  const ids = useMemo(
    () =>
      keys.map((k) => {
        const sym = ALL_SYMBOLS.find((s) => s.key === k);
        return sym ? quoteIdFor(sym) : null;
      }),
    [keys],
  );
  const { quotes, isLoading } = useMarketQuotes(ids, intervalMs);
  const byKey = useMemo(() => {
    const map: Record<string, { p: number; c: number; source: string }> = {};
    keys.forEach((k, i) => {
      const id = ids[i];
      const q = id ? quotes[id] : undefined;
      if (q && q.last > 0) map[k] = { p: q.last, c: q.change24h ?? 0, source: q.source };
    });
    return map;
  }, [keys, ids, quotes]);
  return { byKey, isLoading };
};
