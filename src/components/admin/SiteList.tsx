import { useState } from 'react';
import { usePartnerSites } from '@/hooks/usePartnerSites';
import { usePartners } from '@/hooks/usePartners';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { MapPin } from 'lucide-react';
import SiteForm from './SiteForm';

const SiteList = () => {
  const { data: sites, isLoading } = usePartnerSites();
  const { data: partners } = usePartners();
  const [formOpen, setFormOpen] = useState(false);

  const partnerName = (partnerId: string) =>
    partners?.find((p) => p.partner_id === partnerId)?.legal_name || partnerId.slice(0, 8);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-display text-2xl text-gold flex items-center gap-2">
          <MapPin size={24} />
          Partner Sites
        </h2>
        <button
          onClick={() => setFormOpen(true)}
          className="bg-gold/20 text-gold border border-gold/40 px-4 py-2 text-sm font-display hover:bg-gold/30 transition-colors"
        >
          + Add Site
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full bg-gold/10" />
          ))}
        </div>
      ) : sites && sites.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-gold/30">
                {['Site Name', 'Partner', 'Region', 'Address', 'Status'].map((h) => (
                  <th key={h} className="text-left py-3 px-4 text-gold font-display text-sm uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sites.map((s) => (
                <tr key={s.site_id} className="border-b border-gold/10 hover:bg-gold/5 transition-colors">
                  <td className="py-3 px-4 text-marble font-display">{s.site_name}</td>
                  <td className="py-3 px-4 text-marble/70">{partnerName(s.partner_id)}</td>
                  <td className="py-3 px-4 text-marble/70">{s.region}</td>
                  <td className="py-3 px-4 text-marble/50 text-sm max-w-[200px] truncate">
                    {s.address_text || '—'}
                  </td>
                  <td className="py-3 px-4">
                    <Badge
                      variant="outline"
                      className={s.status === 'active' ? 'text-green-400 border-green-400' : 'text-marble/50 border-marble/30'}
                    >
                      {s.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-12 text-marble/40">
          <MapPin size={32} className="mx-auto mb-3 opacity-40" />
          <p className="font-display">No sites registered yet.</p>
        </div>
      )}

      <SiteForm open={formOpen} onOpenChange={setFormOpen} />
    </div>
  );
};

export default SiteList;
