import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface PartnerSite {
  site_id: string;
  partner_id: string;
  site_name: string;
  region: string;
  address_text: string | null;
  status: string;
  created_at: string;
}

export const usePartnerSites = (partnerId?: string) => {
  return useQuery({
    queryKey: ['partner-sites', partnerId],
    queryFn: async () => {
      let query = supabase
        .from('partner_sites')
        .select('*')
        .order('created_at', { ascending: false });

      if (partnerId) {
        query = query.eq('partner_id', partnerId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as PartnerSite[];
    },
  });
};

export const useCreateSite = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (site: {
      partner_id: string;
      site_name: string;
      region: string;
      address_text?: string;
    }) => {
      const { data, error } = await supabase
        .from('partner_sites')
        .insert(site)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partner-sites'] });
    },
  });
};
