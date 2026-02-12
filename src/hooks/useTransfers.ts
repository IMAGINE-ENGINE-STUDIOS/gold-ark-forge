import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface TransferWithCert {
  transfer_id: string;
  cert_id: string;
  seller_wallet_id: string;
  buyer_wallet_id: string;
  status: string;
  terms_json: Record<string, unknown>;
  psbt_base64: string | null;
  btc_txid: string | null;
  created_at: string;
  updated_at: string;
  certificates: {
    cert_id: string;
    status: string;
    metadata_json: Record<string, unknown>;
    owner_wallet_id: string;
    partners: {
      legal_name: string;
    };
  };
}

/**
 * Fetch transfers where the given wallet_id is either seller or buyer.
 * Because Supabase .or() works on the same table, we do two queries and merge.
 */
export const useWalletTransfers = (walletId: string | null) => {
  return useQuery({
    queryKey: ['wallet-transfers', walletId],
    queryFn: async () => {
      if (!walletId) return [];

      const selectStr =
        '*, certificates!inner(cert_id, status, metadata_json, owner_wallet_id, partners!inner(legal_name))';

      // Fetch as seller
      const { data: asSeller, error: e1 } = await supabase
        .from('transfers')
        .select(selectStr)
        .eq('seller_wallet_id', walletId)
        .order('created_at', { ascending: false });

      if (e1) throw e1;

      // Fetch as buyer
      const { data: asBuyer, error: e2 } = await supabase
        .from('transfers')
        .select(selectStr)
        .eq('buyer_wallet_id', walletId)
        .order('created_at', { ascending: false });

      if (e2) throw e2;

      // Merge and deduplicate
      const map = new Map<string, TransferWithCert>();
      [...(asSeller ?? []), ...(asBuyer ?? [])].forEach((t) => {
        map.set(t.transfer_id, t as unknown as TransferWithCert);
      });

      return Array.from(map.values()).sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    },
    enabled: !!walletId,
  });
};

export const useTransfer = (transferId: string) => {
  return useQuery({
    queryKey: ['transfer', transferId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transfers')
        .select(
          '*, certificates!inner(cert_id, status, metadata_json, owner_wallet_id, partners!inner(legal_name))'
        )
        .eq('transfer_id', transferId)
        .maybeSingle();

      if (error) throw error;
      return data as unknown as TransferWithCert | null;
    },
    enabled: !!transferId,
  });
};
