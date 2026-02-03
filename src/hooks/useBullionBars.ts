import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type MetalType = 'gold' | 'silver' | 'platinum';
export type CustodyStatus = 'free' | 'pledged' | 'redeemed';

export interface BullionBar {
  id: string;
  serial_number: string;
  metal_type: MetalType;
  weight_oz: number;
  purity: number;
  vault_id: string;
  jurisdiction: string;
  custody_status: CustodyStatus;
  price_per_oz: number | null;
  last_verified_at: string | null;
  created_at: string;
}

interface UseBullionBarsOptions {
  metalType?: MetalType;
  custodyStatus?: CustodyStatus;
  limit?: number;
}

export const useBullionBars = (options: UseBullionBarsOptions = {}) => {
  const { metalType, custodyStatus, limit = 50 } = options;

  return useQuery({
    queryKey: ['bullion-bars', metalType, custodyStatus, limit],
    queryFn: async () => {
      let query = supabase
        .from('bullion_bars')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (metalType) {
        query = query.eq('metal_type', metalType);
      }

      if (custodyStatus) {
        query = query.eq('custody_status', custodyStatus);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as BullionBar[];
    },
  });
};

export const useBullionBar = (id: string) => {
  return useQuery({
    queryKey: ['bullion-bar', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bullion_bars')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      return data as BullionBar | null;
    },
    enabled: !!id,
  });
};
