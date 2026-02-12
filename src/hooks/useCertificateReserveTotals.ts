import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ReserveTotals {
  gold_oz: number;
  silver_oz: number;
  platinum_oz: number;
  cert_count: number;
}

export const useCertificateReserveTotals = () => {
  return useQuery({
    queryKey: ['certificate-reserve-totals'],
    queryFn: async (): Promise<ReserveTotals> => {
      const { data, error } = await supabase
        .from('certificates')
        .select('metadata_json')
        .eq('status', 'active');

      if (error) throw error;

      const totals: ReserveTotals = { gold_oz: 0, silver_oz: 0, platinum_oz: 0, cert_count: 0 };

      for (const cert of data || []) {
        const meta = cert.metadata_json as { metal_type?: string; weight_oz?: number };
        const weight = Number(meta?.weight_oz || 0);
        totals.cert_count++;
        switch (meta?.metal_type) {
          case 'gold': totals.gold_oz += weight; break;
          case 'silver': totals.silver_oz += weight; break;
          case 'platinum': totals.platinum_oz += weight; break;
        }
      }

      return totals;
    },
  });
};
