import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface PriceFeed {
  id: string;
  metal_type: 'gold' | 'silver' | 'platinum';
  price_usd: number;
  change_24h: number | null;
  updated_at: string;
}

export const useMetalPrices = () => {
  return useQuery({
    queryKey: ['metal-prices'],
    queryFn: async () => {
      // Refresh the structured backend feed, then read the app-wide source of truth.
      // UI widgets must consume price_feeds so chart, trade deck, Eagle View and
      // marketplace stay synchronized from the same structured live rows.
      await supabase.functions.invoke('fetch-metal-prices', { body: {} }).catch(() => null);

      const { data, error } = await supabase
        .from('price_feeds')
        .select('*')
        .order('metal_type', { ascending: true });

      if (error) throw error;

      const priceMap: Record<string, PriceFeed> = {};
      (data ?? []).forEach((row) => {
        if (!row.metal_type || typeof row.price_usd !== 'number' || row.price_usd <= 0) return;
        priceMap[row.metal_type] = row as PriceFeed;
      });
      return priceMap;
    },
    refetchInterval: 1000,
    staleTime: 500,
    retry: 1,
  });
};

export const useMetalPrice = (metalType: 'gold' | 'silver' | 'platinum') => {
  const { data: prices, isLoading, error } = useMetalPrices();

  return {
    price: prices?.[metalType]?.price_usd ?? null,
    change24h: prices?.[metalType]?.change_24h ?? null,
    updatedAt: prices?.[metalType]?.updated_at ?? null,
    isLoading,
    error,
  };
};
