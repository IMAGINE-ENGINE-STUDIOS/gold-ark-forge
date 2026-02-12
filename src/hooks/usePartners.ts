import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Partner {
  partner_id: string;
  legal_name: string;
  partner_type: 'vault' | 'dealer' | 'custodian' | 'arbiter';
  jurisdiction: string;
  api_base_url: string;
  mtls_spki_fingerprint: string | null;
  status: 'active' | 'suspended' | 'offboarded';
  created_at: string;
  updated_at: string;
}

export const usePartners = () => {
  return useQuery({
    queryKey: ['partners'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('partners')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Partner[];
    },
  });
};

export const useCreatePartner = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (partner: {
      legal_name: string;
      partner_type: 'vault' | 'dealer' | 'custodian' | 'arbiter';
      jurisdiction: string;
      api_base_url: string;
      mtls_spki_fingerprint?: string;
    }) => {
      const { data, error } = await supabase
        .from('partners')
        .insert(partner)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partners'] });
    },
  });
};

export const useUpdatePartnerStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ partnerId, status }: { partnerId: string; status: 'active' | 'suspended' | 'offboarded' }) => {
      const { error } = await supabase
        .from('partners')
        .update({ status })
        .eq('partner_id', partnerId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partners'] });
    },
  });
};
