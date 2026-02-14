import { usePartners } from '@/hooks/usePartners';
import { usePartnerSites } from '@/hooks/usePartnerSites';
import { Building2, MapPin, Globe, Shield } from 'lucide-react';

const typeColors: Record<string, string> = {
  vault: 'text-gold bg-gold/10',
  dealer: 'text-emerald-400 bg-emerald-400/10',
  custodian: 'text-blue-400 bg-blue-400/10',
  arbiter: 'text-purple-400 bg-purple-400/10',
};

const statusDot: Record<string, string> = {
  active: 'bg-emerald-400',
  suspended: 'bg-amber-400',
  offboarded: 'bg-red-400',
};

const GAPartnerNetwork = () => {
  const { data: partners, isLoading: loadingPartners } = usePartners();
  const { data: sites, isLoading: loadingSites } = usePartnerSites();

  const isLoading = loadingPartners || loadingSites;

  // Build a jurisdiction count
  const jurisdictions = partners?.reduce((acc, p) => {
    acc[p.jurisdiction] = (acc[p.jurisdiction] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) ?? {};

  return (
    <div className="relative rounded-sm bg-gradient-to-br from-navy via-navy to-navy-light border border-gold/30 overflow-hidden">
      <div className="ornate-corner ornate-corner-tl" />
      <div className="ornate-corner ornate-corner-tr" />
      <div className="ornate-corner ornate-corner-bl" />
      <div className="ornate-corner ornate-corner-br" />

      <div className="p-6 md:p-8">
        <div className="flex items-center gap-3 mb-6">
          <Building2 className="w-5 h-5 text-gold" />
          <h3 className="font-display text-lg tracking-[0.1em] text-gold-light">PARTNER NETWORK</h3>
          {partners && (
            <span className="ml-auto text-[10px] tracking-widest text-marble/40 font-display">
              {partners.length} PARTNERS · {sites?.length ?? 0} SITES
            </span>
          )}
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-16 bg-navy-light/50 rounded animate-pulse" />
            ))}
          </div>
        ) : (
          <>
            {/* Jurisdiction summary */}
            <div className="flex flex-wrap gap-2 mb-6">
              {Object.entries(jurisdictions).map(([jur, count]) => (
                <div key={jur} className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-navy-light/40 border border-gold/10">
                  <Globe className="w-3 h-3 text-gold/60" />
                  <span className="text-[10px] font-display tracking-[0.1em] text-marble/60">{jur}</span>
                  <span className="text-[10px] text-marble/30">({count})</span>
                </div>
              ))}
            </div>

            {/* Partner cards */}
            <div className="space-y-2">
              {partners?.map((p) => {
                const partnerSites = sites?.filter((s) => s.partner_id === p.partner_id) ?? [];
                const typeColor = typeColors[p.partner_type] || typeColors.vault;
                return (
                  <div key={p.partner_id} className="p-3 rounded bg-navy-light/20 hover:bg-navy-light/40 border border-transparent hover:border-gold/10 transition-all">
                    <div className="flex items-center gap-3">
                      {/* Status dot */}
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${statusDot[p.status] || statusDot.active}`} />

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-sm text-marble font-medium truncate">{p.legal_name}</span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded ${typeColor}`}>
                            {p.partner_type.toUpperCase()}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-[10px] text-marble/40">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-2.5 h-2.5" />
                            {p.jurisdiction}
                          </span>
                          {partnerSites.length > 0 && (
                            <span>{partnerSites.length} site{partnerSites.length > 1 ? 's' : ''}</span>
                          )}
                        </div>
                      </div>

                      {/* mTLS badge */}
                      {p.mtls_spki_fingerprint && (
                        <div className="flex items-center gap-1 text-[10px] text-emerald-400">
                          <Shield className="w-3 h-3" />
                          <span>mTLS</span>
                        </div>
                      )}
                    </div>

                    {/* Sites */}
                    {partnerSites.length > 0 && (
                      <div className="mt-2 ml-5 flex flex-wrap gap-1.5">
                        {partnerSites.map((s) => (
                          <span key={s.site_id} className="text-[10px] px-2 py-0.5 rounded bg-navy-dark/50 text-marble/40 border border-navy-light/50">
                            {s.site_name} · {s.region}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
              {(!partners || partners.length === 0) && (
                <div className="text-center py-8 text-marble/30 text-sm font-display tracking-widest">
                  NO PARTNERS REGISTERED
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default GAPartnerNetwork;
