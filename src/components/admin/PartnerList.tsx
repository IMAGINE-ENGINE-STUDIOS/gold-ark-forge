import { useState } from 'react';
import { usePartners, useUpdatePartnerStatus, type Partner } from '@/hooks/usePartners';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Building2, MoreVertical } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from '@/hooks/use-toast';
import PartnerForm from './PartnerForm';

const statusColors: Record<string, string> = {
  active: 'text-green-400 border-green-400',
  suspended: 'text-yellow-400 border-yellow-400',
  offboarded: 'text-red-400 border-red-400',
};

const typeLabels: Record<string, string> = {
  vault: 'Vault Operator',
  dealer: 'Dealer',
  custodian: 'Custodian',
  arbiter: 'Arbiter',
};

const PartnerList = () => {
  const { data: partners, isLoading } = usePartners();
  const updateStatus = useUpdatePartnerStatus();
  const [formOpen, setFormOpen] = useState(false);

  const handleStatusChange = (partnerId: string, status: 'active' | 'suspended' | 'offboarded') => {
    updateStatus.mutate(
      { partnerId, status },
      {
        onSuccess: () => toast({ title: `Partner status updated to ${status}` }),
        onError: (err) => toast({ title: 'Error', description: (err as Error).message, variant: 'destructive' }),
      }
    );
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-display text-2xl text-gold flex items-center gap-2">
          <Building2 size={24} />
          Partners
        </h2>
        <button
          onClick={() => setFormOpen(true)}
          className="bg-gold/20 text-gold border border-gold/40 px-4 py-2 text-sm font-display hover:bg-gold/30 transition-colors"
        >
          + Onboard Partner
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full bg-gold/10" />
          ))}
        </div>
      ) : partners && partners.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-gold/30">
                {['Legal Name', 'Type', 'Jurisdiction', 'API URL', 'Status', ''].map((h) => (
                  <th key={h} className="text-left py-3 px-4 text-gold font-display text-sm uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {partners.map((p) => (
                <tr key={p.partner_id} className="border-b border-gold/10 hover:bg-gold/5 transition-colors">
                  <td className="py-3 px-4 text-marble font-display">{p.legal_name}</td>
                  <td className="py-3 px-4">
                    <Badge variant="outline" className="text-gold border-gold/40 font-display text-xs">
                      {typeLabels[p.partner_type] || p.partner_type}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-marble/70">{p.jurisdiction}</td>
                  <td className="py-3 px-4 font-mono text-xs text-marble/50 max-w-[200px] truncate">
                    {p.api_base_url}
                  </td>
                  <td className="py-3 px-4">
                    <Badge variant="outline" className={statusColors[p.status] || ''}>
                      {p.status}
                    </Badge>
                  </td>
                  <td className="py-3 px-4">
                    <DropdownMenu>
                      <DropdownMenuTrigger className="text-marble/50 hover:text-gold">
                        <MoreVertical size={16} />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="bg-navy-light border-gold/30">
                        {p.status !== 'active' && (
                          <DropdownMenuItem
                            onClick={() => handleStatusChange(p.partner_id, 'active')}
                            className="text-green-400 focus:text-green-400 focus:bg-green-400/10"
                          >
                            Activate
                          </DropdownMenuItem>
                        )}
                        {p.status !== 'suspended' && (
                          <DropdownMenuItem
                            onClick={() => handleStatusChange(p.partner_id, 'suspended')}
                            className="text-yellow-400 focus:text-yellow-400 focus:bg-yellow-400/10"
                          >
                            Suspend
                          </DropdownMenuItem>
                        )}
                        {p.status !== 'offboarded' && (
                          <DropdownMenuItem
                            onClick={() => handleStatusChange(p.partner_id, 'offboarded')}
                            className="text-red-400 focus:text-red-400 focus:bg-red-400/10"
                          >
                            Offboard
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-12 text-marble/40">
          <Building2 size={32} className="mx-auto mb-3 opacity-40" />
          <p className="font-display">No partners onboarded yet.</p>
        </div>
      )}

      <PartnerForm open={formOpen} onOpenChange={setFormOpen} />
    </div>
  );
};

export default PartnerList;
