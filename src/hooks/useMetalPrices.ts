import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface PriceFeed {
  id: string;
  metal_type: 'gold' | 'silver' | 'platinum';
  price_usd: number;
  change_24h: number | null;
  updated_at: string;
}

export const useMetalPrices = () => {
  const qc = useQueryClient();

  // Realtime push: refetch immediately when price_feeds changes
  useEffect(() => {
    const channel = supabase
      .channel('price_feeds-live')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'price_feeds' },
        () => qc.invalidateQueries({ queryKey: ['metal-prices'] }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [qc]);

  return useQuery({
    queryKey: ['metal-prices'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('price_feeds')
        .select('*');

      if (error) throw error;

      // Transform to a map for easier access
      const priceMap: Record<string, PriceFeed> = {};
      (data as PriceFeed[]).forEach((feed) => {
        priceMap[feed.metal_type] = feed;
      });

      return priceMap;
    },
    refetchInterval: 60000, // Refetch every minute
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
