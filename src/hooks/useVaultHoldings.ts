import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useWallet } from '@/contexts/WalletContext';

export type HoldingStatus = 'active' | 'pending_redemption' | 'redeemed';

export interface VaultHolding {
  id: string;
  wallet_address: string;
  bar_id: string;
  acquired_at: string;
  status: HoldingStatus;
  bullion_bar?: {
    id: string;
    serial_number: string;
    metal_type: string;
    weight_oz: number;
    purity: number;
    vault_id: string;
    jurisdiction: string;
    custody_status: string;
    price_per_oz: number | null;
    last_verified_at: string | null;
  };
}

export const useVaultHoldings = () => {
  const { address } = useWallet();

  return useQuery({
    queryKey: ['vault-holdings', address],
    queryFn: async () => {
      if (!address) return [];

      const { data, error } = await supabase
        .from('vault_holdings')
        .select(`
          *,
          bullion_bar:bullion_bars(*)
        `)
        .eq('wallet_address', address)
        .eq('status', 'active');

      if (error) throw error;
      return data as VaultHolding[];
    },
    enabled: !!address,
  });
};

export const useHoldingsSummary = () => {
  const { data: holdings, isLoading } = useVaultHoldings();

  const summary = {
    totalGoldOz: 0,
    totalSilverOz: 0,
    totalPlatinumOz: 0,
    totalValue: 0,
    barCount: 0,
  };

  if (holdings) {
    holdings.forEach((holding) => {
      if (holding.bullion_bar) {
        const weightOz = Number(holding.bullion_bar.weight_oz);
        const pricePerOz = Number(holding.bullion_bar.price_per_oz) || 0;

        switch (holding.bullion_bar.metal_type) {
          case 'gold':
            summary.totalGoldOz += weightOz;
            break;
          case 'silver':
            summary.totalSilverOz += weightOz;
            break;
          case 'platinum':
            summary.totalPlatinumOz += weightOz;
            break;
        }

        summary.totalValue += weightOz * pricePerOz;
        summary.barCount++;
      }
    });
  }

  return { summary, isLoading };
};
