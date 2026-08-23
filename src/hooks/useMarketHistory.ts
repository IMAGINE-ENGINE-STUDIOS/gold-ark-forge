import { useCallback, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ALL_SYMBOLS } from '@/data/tradingSymbols';
import { quoteIdFor } from '@/lib/priceSource';

/**
 * Real historical closes for pipeline simulation.
 *
 * `prime(tickers)` pulls genuine traded closes (1-minute over the last session
 * by default) from the `market-history` edge function and caches them per
 * ticker. `getHistory(ticker)` returns that real series — never a synthetic or
 * interpolated one. A ticker with no public history simply returns [].
 */

const SYMBOL_BY_TICKER = (() => {
  const map = new Map<string, (typeof ALL_SYMBOLS)[number]>();
  ALL_SYMBOLS.forEach((s) => {
    if (!map.has(s.ticker)) map.set(s.ticker, s);
    map.set(s.key, s);
  });
  return map;
})();

export const quoteIdForTicker = (ticker: string): string | null => {
  const sym = SYMBOL_BY_TICKER.get(ticker);
  return sym ? quoteIdFor(sym) : null;
};

const STALE_MS = 5 * 60 * 1000;

export function useMarketHistory() {
  const store = useRef<Map<string, { closes: number[]; at: number }>>(new Map());
  const [version, setVersion] = useState(0);

  const prime = useCallback(async (tickers: string[], opts?: { interval?: '1m' | '5m' | '1d'; range?: string; points?: number }) => {
    const wanted = Array.from(new Set(tickers.filter(Boolean)));
    const idByTicker = new Map<string, string>();
    wanted.forEach((t) => {
      const cached = store.current.get(t);
      if (cached && Date.now() - cached.at < STALE_MS) return;
      const id = quoteIdForTicker(t);
      if (id) idByTicker.set(t, id);
    });
    if (!idByTicker.size) return;

    const ids = Array.from(new Set(idByTicker.values()));
    try {
      const { data, error } = await supabase.functions.invoke('market-history', {
        body: { symbols: ids, interval: opts?.interval ?? '1m', range: opts?.range, points: opts?.points ?? 300 },
      });
      if (error) throw error;
      const series = (data?.series ?? {}) as Record<string, number[]>;
      let changed = false;
      idByTicker.forEach((id, ticker) => {
        const closes = series[id];
        if (Array.isArray(closes) && closes.length >= 5) {
          store.current.set(ticker, { closes, at: Date.now() });
          changed = true;
        }
      });
      if (changed) setVersion((v) => v + 1);
    } catch (e) {
      console.error('[useMarketHistory] prime failed', e);
    }
  }, []);

  const getHistory = useCallback((ticker: string): number[] => store.current.get(ticker)?.closes ?? [], []);

  return { prime, getHistory, version };
}

export default useMarketHistory;
