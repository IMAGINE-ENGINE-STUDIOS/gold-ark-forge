import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface VerifyResult {
  data: any;
  error: string | null;
  loading: boolean;
}

const callPublicVerify = async (action: string, params: Record<string, string> = {}) => {
  const { data, error } = await supabase.functions.invoke('public-verify', {
    body: { action, ...params },
  });
  if (error) throw error;
  return data;
};

export const usePublicVerify = () => {
  const [result, setResult] = useState<VerifyResult>({ data: null, error: null, loading: false });

  const verify = async (certId: string) => {
    setResult({ data: null, error: null, loading: true });
    try {
      const data = await callPublicVerify('verify', { cert_id: certId });
      setResult({ data, error: null, loading: false });
    } catch (e: any) {
      setResult({ data: null, error: e.message || 'Verification failed', loading: false });
    }
  };

  const history = async (certId: string) => {
    setResult({ data: null, error: null, loading: true });
    try {
      const data = await callPublicVerify('history', { cert_id: certId });
      setResult({ data, error: null, loading: false });
    } catch (e: any) {
      setResult({ data: null, error: e.message || 'Failed to fetch history', loading: false });
    }
  };

  const anchorProof = async (params: { cert_id?: string; event_id?: string }) => {
    setResult({ data: null, error: null, loading: true });
    try {
      const data = await callPublicVerify('anchor_proof', params as Record<string, string>);
      setResult({ data, error: null, loading: false });
    } catch (e: any) {
      setResult({ data: null, error: e.message || 'Failed to fetch anchor proof', loading: false });
    }
  };

  const reserveSnapshot = async (snapshotId?: string) => {
    setResult({ data: null, error: null, loading: true });
    try {
      const params = snapshotId ? { snapshot_id: snapshotId } : {};
      const data = await callPublicVerify('reserve_snapshot', params);
      setResult({ data, error: null, loading: false });
    } catch (e: any) {
      setResult({ data: null, error: e.message || 'Failed to fetch reserve snapshot', loading: false });
    }
  };

  return { ...result, verify, history, anchorProof, reserveSnapshot };
};
