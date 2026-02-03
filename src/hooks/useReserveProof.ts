import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ReserveSnapshot {
  id: string;
  snapshot_id: string;
  merkle_root: string;
  total_gold_oz: number;
  total_silver_oz: number;
  total_platinum_oz: number;
  bar_count: number;
  bitcoin_txid: string | null;
  created_at: string;
}

export const useLatestReserveProof = () => {
  return useQuery({
    queryKey: ['reserve-proof-latest'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reserve_snapshots')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data as ReserveSnapshot | null;
    },
  });
};

export const useReserveHistory = (limit = 10) => {
  return useQuery({
    queryKey: ['reserve-history', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reserve_snapshots')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data as ReserveSnapshot[];
    },
  });
};

export const useAttestations = (barId?: string) => {
  return useQuery({
    queryKey: ['attestations', barId],
    queryFn: async () => {
      let query = supabase
        .from('attestations')
        .select('*')
        .order('created_at', { ascending: false });

      if (barId) {
        query = query.eq('bar_id', barId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data;
    },
  });
};
