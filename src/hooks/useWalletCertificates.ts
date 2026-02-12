import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useMetalPrices } from './useMetalPrices';
import type { CertificateWithPartner, CertificateMetadata, MetalType } from './useCertificates';

export interface HoldingsSummary {
  totalGoldOz: number;
  totalSilverOz: number;
  totalPlatinumOz: number;
  totalValue: number;
  certificateCount: number;
}

/** Resolve an EVM address to a wallets.wallet_id, or null if not registered. */
export const useWalletId = (evmAddress: string | null) => {
  return useQuery({
    queryKey: ['wallet-id', evmAddress],
    queryFn: async () => {
      if (!evmAddress) return null;
      const { data, error } = await supabase
        .from('wallets')
        .select('wallet_id')
        .eq('address', evmAddress.toLowerCase())
        .eq('wallet_type', 'evm')
        .maybeSingle();

      if (error) throw error;
      return data?.wallet_id ?? null;
    },
    enabled: !!evmAddress,
  });
};

/** Fetch all certificates owned by a wallet_id, joined with partner info. */
export const useWalletCertificates = (walletId: string | null) => {
  return useQuery({
    queryKey: ['wallet-certificates', walletId],
    queryFn: async () => {
      if (!walletId) return [];
      const { data, error } = await supabase
        .from('certificates')
        .select('*, partners!inner(legal_name, jurisdiction, partner_type)')
        .eq('owner_wallet_id', walletId)
        .order('issued_at', { ascending: false });

      if (error) throw error;
      return (data ?? []) as unknown as CertificateWithPartner[];
    },
    enabled: !!walletId,
  });
};

/** Compute a holdings summary from certificate data + live prices. */
export const useWalletHoldingsSummary = (
  certificates: CertificateWithPartner[] | undefined
) => {
  const { data: prices, isLoading: pricesLoading } = useMetalPrices();

  const summary: HoldingsSummary = {
    totalGoldOz: 0,
    totalSilverOz: 0,
    totalPlatinumOz: 0,
    totalValue: 0,
    certificateCount: 0,
  };

  if (certificates) {
    certificates.forEach((cert) => {
      const meta = cert.metadata_json as CertificateMetadata;
      if (!meta?.weight_oz || !meta?.metal_type) return;
      const weight = Number(meta.weight_oz);
      summary.certificateCount += 1;

      switch (meta.metal_type) {
        case 'gold':
          summary.totalGoldOz += weight;
          break;
        case 'silver':
          summary.totalSilverOz += weight;
          break;
        case 'platinum':
          summary.totalPlatinumOz += weight;
          break;
      }
    });

    if (prices) {
      summary.totalValue =
        summary.totalGoldOz * (prices.gold?.price_usd ?? 0) +
        summary.totalSilverOz * (prices.silver?.price_usd ?? 0) +
        summary.totalPlatinumOz * (prices.platinum?.price_usd ?? 0);
    }
  }

  return { summary, isLoading: pricesLoading };
};
