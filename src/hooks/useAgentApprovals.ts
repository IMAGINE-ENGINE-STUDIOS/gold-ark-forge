import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface AgentApproval {
  id: string;
  agent: string;
  proposal: {
    symbol: string;
    side: 'buy' | 'sell';
    sizeUsd: number;
    reason: string;
    stopPrice?: number | null;
    takeProfitPrice?: number | null;
  };
  reasoning: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'expired' | 'executed';
  expires_at: string;
  created_at: string;
}

export function useAgentApprovals() {
  const [items, setItems] = useState<AgentApproval[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('agent_approvals')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);
    setItems((data ?? []) as unknown as AgentApproval[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
    const ch = supabase
      .channel('agent_approvals_rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'agent_approvals' }, () => refresh())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [refresh]);

  const decide = useCallback(async (id: string, status: 'approved' | 'rejected') => {
    await supabase
      .from('agent_approvals')
      .update({ status, decided_at: new Date().toISOString() })
      .eq('id', id);
    refresh();
  }, [refresh]);

  const pending = items.filter(i =>
    i.status === 'pending' && new Date(i.expires_at).getTime() > Date.now(),
  );

  return { items, pending, loading, refresh, decide };
}