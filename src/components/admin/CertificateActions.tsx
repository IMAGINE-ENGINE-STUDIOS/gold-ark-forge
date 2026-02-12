import { useState } from 'react';
import { useCertificates, type CertificateWithPartner, type CertificateMetadata } from '@/hooks/useCertificates';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { FileCheck, MoreVertical } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import CertificateIssueForm from './CertificateIssueForm';

const statusColors: Record<string, string> = {
  active: 'text-green-400 border-green-400',
  frozen: 'text-blue-400 border-blue-400',
  revoked: 'text-red-400 border-red-400',
  redeemed: 'text-marble/50 border-marble/30',
};

const metalColors: Record<string, string> = {
  gold: 'bg-gold/20 text-gold border-gold',
  silver: 'bg-silver/20 text-silver border-silver',
  platinum: 'bg-platinum/20 text-platinum border-platinum',
};

const CertificateActions = () => {
  const { data: certificates, isLoading } = useCertificates({ limit: 100 });
  const queryClient = useQueryClient();
  const [issueOpen, setIssueOpen] = useState(false);

  const handleAction = async (certId: string, partnerId: string, action: 'freeze' | 'unfreeze' | 'revoke') => {
    try {
      const { data, error } = await supabase.functions.invoke('certificate-registry', {
        body: { action, cert_id: certId, partner_id: partnerId },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast({ title: `Certificate ${action}d successfully` });
      queryClient.invalidateQueries({ queryKey: ['certificates'] });
      queryClient.invalidateQueries({ queryKey: ['certificate-reserve-totals'] });
    } catch (err) {
      toast({ title: 'Error', description: (err as Error).message, variant: 'destructive' });
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-display text-2xl text-gold flex items-center gap-2">
          <FileCheck size={24} />
          Certificates
        </h2>
        <button
          onClick={() => setIssueOpen(true)}
          className="bg-gold/20 text-gold border border-gold/40 px-4 py-2 text-sm font-display hover:bg-gold/30 transition-colors"
        >
          + Issue Certificate
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full bg-gold/10" />
          ))}
        </div>
      ) : certificates && certificates.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-gold/30">
                {['Serial', 'Metal', 'Weight', 'Partner', 'Owner', 'Status', ''].map((h) => (
                  <th key={h} className="text-left py-3 px-4 text-gold font-display text-sm uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {certificates.map((cert) => {
                const meta = cert.metadata_json as CertificateMetadata;
                return (
                  <tr key={cert.cert_id} className="border-b border-gold/10 hover:bg-gold/5 transition-colors">
                    <td className="py-3 px-4 font-mono text-xs text-marble">{meta?.serial_number}</td>
                    <td className="py-3 px-4">
                      <Badge className={`border font-display text-xs uppercase ${metalColors[meta?.metal_type] || ''}`}>
                        {meta?.metal_type}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-marble font-display">{meta?.weight_oz} oz</td>
                    <td className="py-3 px-4 text-marble/70 text-sm">{cert.partners?.legal_name}</td>
                    <td className="py-3 px-4 font-mono text-xs text-marble/50">
                      {cert.owner_wallet_id.slice(0, 8)}...
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant="outline" className={statusColors[cert.status] || ''}>
                        {cert.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <DropdownMenu>
                        <DropdownMenuTrigger className="text-marble/50 hover:text-gold">
                          <MoreVertical size={16} />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="bg-navy-light border-gold/30">
                          {cert.status === 'active' && (
                            <DropdownMenuItem
                              onClick={() => handleAction(cert.cert_id, cert.partner_id, 'freeze')}
                              className="text-blue-400 focus:text-blue-400 focus:bg-blue-400/10"
                            >
                              Freeze
                            </DropdownMenuItem>
                          )}
                          {cert.status === 'frozen' && (
                            <DropdownMenuItem
                              onClick={() => handleAction(cert.cert_id, cert.partner_id, 'unfreeze')}
                              className="text-green-400 focus:text-green-400 focus:bg-green-400/10"
                            >
                              Unfreeze
                            </DropdownMenuItem>
                          )}
                          {['active', 'frozen'].includes(cert.status) && (
                            <DropdownMenuItem
                              onClick={() => handleAction(cert.cert_id, cert.partner_id, 'revoke')}
                              className="text-red-400 focus:text-red-400 focus:bg-red-400/10"
                            >
                              Revoke
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-12 text-marble/40">
          <FileCheck size={32} className="mx-auto mb-3 opacity-40" />
          <p className="font-display">No certificates issued yet.</p>
        </div>
      )}

      <CertificateIssueForm open={issueOpen} onOpenChange={setIssueOpen} />
    </div>
  );
};

export default CertificateActions;
