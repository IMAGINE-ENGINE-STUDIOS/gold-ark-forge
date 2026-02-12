import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface AnchoredEvent {
  anchor_leaf_id: string;
  leaf_index: number;
  leaf_hash: string;
  event_id: string;
  event_type: string;
  cert_id: string;
  event_created_at: string;
  anchor_id: string;
  anchor_status: string;
  commit_txid: string | null;
}

export const useAnchoredEvents = (limit = 20) => {
  return useQuery({
    queryKey: ['anchored-events', limit],
    queryFn: async (): Promise<AnchoredEvent[]> => {
      const { data, error } = await supabase
        .from('anchor_leaves')
        .select(`
          anchor_leaf_id,
          leaf_index,
          leaf_hash,
          event_id,
          created_at,
          anchors!inner(anchor_id, status, commit_txid),
          certificate_events!inner(event_type, cert_id, created_at)
        `)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return (data || []).map((row: any) => ({
        anchor_leaf_id: row.anchor_leaf_id,
        leaf_index: row.leaf_index,
        leaf_hash: row.leaf_hash,
        event_id: row.event_id,
        event_type: row.certificate_events.event_type,
        cert_id: row.certificate_events.cert_id,
        event_created_at: row.certificate_events.created_at,
        anchor_id: row.anchors.anchor_id,
        anchor_status: row.anchors.status,
        commit_txid: row.anchors.commit_txid,
      }));
    },
  });
};
