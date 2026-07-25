/**
 * useTreasuryData — real U.S. Treasury FiscalData (no API key, no auth).
 * Fetched via the `stream-treasury` edge function (5-min server cache).
 * Refreshed every 60s on the client because Treasury publishes daily.
 */
import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { FeedRouter } from '@/lib/feeds/router';

export interface AvgRate { security: string; rate: number; date: string }
export interface DebtPoint { date: string; totalDebt: number }
export interface FxQuote { rate: number; date: string; currency: string }

export interface TreasuryData {
  source: string;
  fetched_at: string;
  avg_interest_rates: { as_of: string | null; rates: AvgRate[] };
  public_debt: {
    latest: number | null;
    latest_date: string | null;
    change_30d_pct: number | null;
    series: DebtPoint[];
  };
  fx: Record<string, FxQuote>;
  cached?: boolean;
}

export const useTreasuryData = () => {
  const q = useQuery<TreasuryData | null>({
    queryKey: ['treasury-fiscaldata'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('stream-treasury', { body: {} });
      if (error) throw error;
      if (!data || (data as any).error) return null;
      return data as TreasuryData;
    },
    refetchInterval: 60_000,
    staleTime: 30_000,
    retry: 1,
  });

  // Register health with FeedRouter so the FeedStatusBadge lists "US Treasury".
  useEffect(() => {
    const tbill = q.data?.avg_interest_rates.rates.find(r => r.security === 'Treasury Bills')?.rate;
    if (tbill != null) {
      FeedRouter.publish({
        symbol: 'US/TBILL',
        assetClass: 'bond',
        last: tbill,
        ts: Date.now(),
        source: 'treasury',
        latencyMs: 0,
      });
    }
  }, [q.data]);

  return q;
};

/** Convenience selector — the average yield on a given security type. */
export const useTreasuryRate = (
  security: 'Treasury Bills' | 'Treasury Notes' | 'Treasury Bonds' | 'Treasury Inflation-Protected Securities' | 'Treasury Floating Rate Notes',
) => {
  const { data } = useTreasuryData();
  const row = data?.avg_interest_rates.rates.find(r => r.security === security);
  return row?.rate ?? null;
};