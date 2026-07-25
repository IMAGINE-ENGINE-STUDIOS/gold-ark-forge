/**
 * useHistoricalBars — fetches historic price bars for any non-crypto symbol
 * via the stream-yahoo edge function. Cached 60s server-side. Used by
 * GALiveChart to bootstrap real historical data for metals, energy, stocks,
 * FX, indices — matching what CoinGecko sparklines provide for crypto.
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// Symbol map: our internal keys → Yahoo tickers.
// Only add here what has a free Yahoo history endpoint.
export const YAHOO_HISTORY_MAP: Record<string, string> = {
  // Metals (futures)
  gold: 'GC=F', silver: 'SI=F', platinum: 'PL=F', palladium: 'PA=F',
  copper: 'HG=F',
  // Energy
  oil: 'CL=F', brent: 'BZ=F', natgas: 'NG=F', rbob: 'RB=F',
  gasoline: 'RB=F', heating: 'HO=F',
  // Indices
  sp500: '^GSPC', nasdaq: '^IXIC', dow: '^DJI', russell: '^RUT', vix: '^VIX',
  // FX
  eurusd: 'EURUSD=X', gbpusd: 'GBPUSD=X', usdjpy: 'JPY=X',
  audusd: 'AUDUSD=X', usdchf: 'CHF=X', usdcad: 'CAD=X',
  // Popular equities
  apple: 'AAPL', microsoft: 'MSFT', google: 'GOOGL', amazon: 'AMZN',
  meta: 'META', nvidia: 'NVDA', tesla: 'TSLA', netflix: 'NFLX',
};

type Bars = { closes: number[]; highs: number[]; lows: number[] };

export function useHistoricalBars(symbolKey: string, enabled = true) {
  const yahoo = YAHOO_HISTORY_MAP[symbolKey];
  return useQuery({
    queryKey: ['yh-bars', yahoo],
    enabled: !!yahoo && enabled,
    staleTime: 60_000,
    refetchInterval: 300_000,
    retry: 1,
    queryFn: async (): Promise<Bars | null> => {
      if (!yahoo) return null;
      const { data, error } = await supabase.functions.invoke('stream-yahoo', {
        body: { history: true, symbols: [yahoo], range: '1mo', interval: '1h' },
      });
      if (error) throw error;
      const b = (data?.bars ?? {})[yahoo];
      if (!b?.closes?.length) return null;
      return b as Bars;
    },
  });
}