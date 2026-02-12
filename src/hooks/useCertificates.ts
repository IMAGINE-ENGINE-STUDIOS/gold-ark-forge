import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type MetalType = 'gold' | 'silver' | 'platinum';
export type CertStatus = 'active' | 'frozen' | 'revoked' | 'redeemed';

export interface CertificateMetadata {
  metal_type: MetalType;
  serial_number: string;
  refiner_stamp?: string;
  fineness: number;
  weight_oz: number;
  jurisdiction: string;
}

export interface CertificateWithPartner {
  cert_id: string;
  partner_id: string;
  owner_wallet_id: string;
  cert_version: number;
  status: CertStatus;
  metadata_json: CertificateMetadata;
  partner_sig: string;
  partner_sig_alg: string;
  issued_at: string;
  updated_at: string;
  partners: {
    legal_name: string;
    jurisdiction: string;
    partner_type: string;
  };
}

export interface CertificateEvent {
  event_id: string;
  cert_id: string;
  event_type: string;
  partner_id: string | null;
  actor_wallet_id: string | null;
  partner_sig: string | null;
  event_payload: Record<string, unknown>;
  created_at: string;
}

interface UseCertificatesOptions {
  metalType?: MetalType;
  status?: CertStatus;
  limit?: number;
}

export const useCertificates = (options: UseCertificatesOptions = {}) => {
  const { metalType, status, limit = 50 } = options;

  return useQuery({
    queryKey: ['certificates', metalType, status, limit],
    queryFn: async () => {
      let query = supabase
        .from('certificates')
        .select('*, partners!inner(legal_name, jurisdiction, partner_type)')
        .order('issued_at', { ascending: false })
        .limit(limit);

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;
      if (error) throw error;

      let results = data as unknown as CertificateWithPartner[];

      // Filter by metal_type from metadata_json
      if (metalType) {
        results = results.filter(
          (c) => (c.metadata_json as any)?.metal_type === metalType
        );
      }

      return results;
    },
  });
};

export const useCertificate = (certId: string) => {
  return useQuery({
    queryKey: ['certificate', certId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('certificates')
        .select('*, partners!inner(legal_name, jurisdiction, partner_type, status)')
        .eq('cert_id', certId)
        .maybeSingle();

      if (error) throw error;
      return data as unknown as CertificateWithPartner | null;
    },
    enabled: !!certId,
  });
};

export const useCertificateEvents = (certId: string) => {
  return useQuery({
    queryKey: ['certificate-events', certId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('certificate_events')
        .select('*')
        .eq('cert_id', certId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as CertificateEvent[];
    },
    enabled: !!certId,
  });
};
