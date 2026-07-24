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
      // Invoke the live edge function directly so we always get the latest
      // spot price (gold-api.com, free, no key). It also upserts price_feeds
      // in the background for other consumers.
      const { data, error } = await supabase.functions.invoke('fetch-metal-prices', { body: {} });
      if (error) throw error;

      const now = data?.updated_at ?? new Date().toISOString();
      const p = data?.prices ?? {};
      const priceMap: Record<string, PriceFeed> = {};
      (['gold', 'silver', 'platinum'] as const).forEach((metal) => {
        const row = p[metal];
        if (!row || typeof row.price_usd !== 'number' || row.price_usd <= 0) return;
        priceMap[metal] = {
          id: metal,
          metal_type: metal,
          price_usd: row.price_usd,
          change_24h: row.change_24h ?? 0,
          updated_at: now,
        };
      });
      return priceMap;
    },
    refetchInterval: 5000,  // Live tick every 5s
    staleTime: 2500,
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
