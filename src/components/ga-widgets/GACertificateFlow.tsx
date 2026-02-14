import { useCertificates } from '@/hooks/useCertificates';
import { FileCheck2, ArrowRightLeft, Lock, XCircle } from 'lucide-react';

const statusIcons: Record<string, any> = {
  active: FileCheck2,
  frozen: Lock,
  revoked: XCircle,
  redeemed: ArrowRightLeft,
};

const statusColors: Record<string, string> = {
  active: 'text-emerald-400 bg-emerald-400/10',
  frozen: 'text-blue-400 bg-blue-400/10',
  revoked: 'text-red-400 bg-red-400/10',
  redeemed: 'text-marble/50 bg-marble/10',
};

const metalDot: Record<string, string> = {
  gold: 'bg-gold',
  silver: 'bg-silver',
  platinum: 'bg-platinum',
};

const GACertificateFlow = () => {
  const { data: certs, isLoading } = useCertificates({ limit: 15 });

  return (
    <div className="relative rounded-sm bg-gradient-to-br from-navy via-navy to-navy-light border border-gold/30 overflow-hidden">
      <div className="ornate-corner ornate-corner-tl" />
      <div className="ornate-corner ornate-corner-tr" />
      <div className="ornate-corner ornate-corner-bl" />
      <div className="ornate-corner ornate-corner-br" />

      <div className="p-6 md:p-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <FileCheck2 className="w-5 h-5 text-gold" />
          <h3 className="font-display text-lg tracking-[0.1em] text-gold-light">CERTIFICATE REGISTRY</h3>
          {certs && (
            <span className="ml-auto text-[10px] tracking-widest text-marble/40 font-display">
              {certs.length} CERTIFICATES
            </span>
          )}
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-navy-light/50 rounded animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {certs?.map((cert) => {
              const meta = cert.metadata_json;
              const metalType = meta?.metal_type ?? 'gold';
              const StatusIcon = statusIcons[cert.status] || FileCheck2;
              const statusColor = statusColors[cert.status] || statusColors.active;

              return (
                <div
                  key={cert.cert_id}
                  className="flex items-center gap-4 p-3 rounded bg-navy-light/20 hover:bg-navy-light/40 border border-transparent hover:border-gold/10 transition-all"
                >
                  {/* Metal indicator */}
                  <div className={`w-2.5 h-8 rounded-full flex-shrink-0 ${metalDot[metalType] || 'bg-gold'}`} />

                  {/* Main info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-mono text-xs text-marble/60 truncate">
                        {cert.cert_id.slice(0, 8)}…
                      </span>
                      <span className="font-display text-[10px] tracking-[0.15em] text-marble/40">
                        v{cert.cert_version}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-[10px] text-marble/40">
                      <span>{meta?.weight_oz ?? '?'} oz {metalType.toUpperCase()}</span>
                      <span>·</span>
                      <span>{cert.partners?.legal_name ?? 'Unknown'}</span>
                      <span>·</span>
                      <span>{meta?.jurisdiction ?? '—'}</span>
                    </div>
                  </div>

                  {/* Status badge */}
                  <div className={`flex items-center gap-1 text-[10px] px-2 py-1 rounded flex-shrink-0 ${statusColor}`}>
                    <StatusIcon className="w-3 h-3" />
                    {cert.status.toUpperCase()}
                  </div>

                  {/* Time */}
                  <div className="text-[10px] text-marble/30 font-mono flex-shrink-0 w-20 text-right">
                    {new Date(cert.issued_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                </div>
              );
            })}
            {(!certs || certs.length === 0) && (
              <div className="text-center py-8 text-marble/30 text-sm font-display tracking-widest">
                NO CERTIFICATES ISSUED
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default GACertificateFlow;
