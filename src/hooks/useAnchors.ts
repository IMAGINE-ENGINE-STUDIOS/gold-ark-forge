import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Anchor {
  anchor_id: string;
  merkle_root: string;
  commit_txid: string | null;
  status: string;
  commit_time: string | null;
  commit_height: number | null;
  leaf_count: number;
  created_at: string;
}

export interface AnchorLeafWithAnchor {
  anchor_leaf_id: string;
  anchor_id: string;
  event_id: string;
  leaf_index: number;
  leaf_hash: string;
  created_at: string;
  anchors: Anchor;
}

export const useAnchors = (limit = 10) => {
  return useQuery({
    queryKey: ['anchors', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('anchors')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data as Anchor[];
    },
  });
};

export const useAnchorForEvent = (eventId: string) => {
  return useQuery({
    queryKey: ['anchor-leaf', eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('anchor_leaves')
        .select('*, anchors!inner(*)')
        .eq('event_id', eventId)
        .maybeSingle();

      if (error) throw error;
      return data as unknown as AnchorLeafWithAnchor | null;
    },
    enabled: !!eventId,
  });
};
