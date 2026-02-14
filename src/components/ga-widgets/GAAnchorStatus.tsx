import { useAnchors } from '@/hooks/useAnchors';
import { Network, CheckCircle2, Clock, Radio, AlertTriangle, XCircle } from 'lucide-react';

const statusConfig: Record<string, { icon: any; color: string; label: string }> = {
  pending: { icon: Clock, color: 'text-amber-400 bg-amber-400/10', label: 'PENDING' },
  broadcast: { icon: Radio, color: 'text-blue-400 bg-blue-400/10', label: 'BROADCAST' },
  confirmed: { icon: CheckCircle2, color: 'text-emerald-400 bg-emerald-400/10', label: 'CONFIRMED' },
  reorged: { icon: AlertTriangle, color: 'text-red-400 bg-red-400/10', label: 'REORGED' },
  abandoned: { icon: XCircle, color: 'text-marble/30 bg-marble/5', label: 'ABANDONED' },
};

const GAAnchorStatus = () => {
  const { data: anchors, isLoading } = useAnchors(10);

  const confirmed = anchors?.filter((a) => a.status === 'confirmed').length ?? 0;
  const pending = anchors?.filter((a) => a.status === 'pending' || a.status === 'broadcast').length ?? 0;
  const totalLeaves = anchors?.reduce((s, a) => s + a.leaf_count, 0) ?? 0;

  return (
    <div className="relative rounded-sm bg-gradient-to-br from-navy via-navy to-navy-light border border-gold/30 overflow-hidden">
      <div className="ornate-corner ornate-corner-tl" />
      <div className="ornate-corner ornate-corner-tr" />
      <div className="ornate-corner ornate-corner-bl" />
      <div className="ornate-corner ornate-corner-br" />

      <div className="p-6 md:p-8">
        <div className="flex items-center gap-3 mb-6">
          <Network className="w-5 h-5 text-gold" />
          <h3 className="font-display text-lg tracking-[0.1em] text-gold-light">BITCOIN ANCHORS</h3>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: 'CONFIRMED', value: confirmed, color: 'text-emerald-400' },
            { label: 'PENDING', value: pending, color: 'text-amber-400' },
            { label: 'TOTAL LEAVES', value: totalLeaves, color: 'text-marble' },
          ].map((s) => (
            <div key={s.label} className="text-center p-3 rounded bg-navy-dark/50 border border-gold/10">
              <div className={`font-display text-2xl font-semibold ${s.color}`}>{s.value}</div>
              <div className="text-[10px] text-marble/30 tracking-widest mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {isLoading ? (
          <div className="space-y-2">{[...Array(5)].map((_, i) => <div key={i} className="h-14 bg-navy-light/50 rounded animate-pulse" />)}</div>
        ) : (
          <div className="space-y-2">
            {anchors?.map((anchor) => {
              const cfg = statusConfig[anchor.status] || statusConfig.pending;
              const StatusIcon = cfg.icon;
              return (
                <div key={anchor.anchor_id} className="flex items-center gap-3 p-3 rounded bg-navy-light/20 hover:bg-navy-light/40 border border-transparent hover:border-gold/10 transition-all">
                  {/* Status */}
                  <div className={`flex items-center gap-1 text-[10px] px-2 py-1 rounded flex-shrink-0 ${cfg.color}`}>
                    <StatusIcon className="w-3 h-3" />
                    {cfg.label}
                  </div>

                  {/* Merkle root */}
                  <div className="flex-1 min-w-0">
                    <div className="font-mono text-[10px] text-marble/40 truncate">
                      {anchor.merkle_root}
                    </div>
                    <div className="flex items-center gap-3 text-[10px] text-marble/30 mt-0.5">
                      <span>{anchor.leaf_count} leaves</span>
                      {anchor.commit_height && <span>block #{anchor.commit_height.toLocaleString()}</span>}
                      {anchor.commit_txid && (
                        <span className="text-emerald-400/60 truncate max-w-[120px]">tx:{anchor.commit_txid.slice(0, 16)}…</span>
                      )}
                    </div>
                  </div>

                  {/* Date */}
                  <span className="text-[10px] text-marble/30 font-mono flex-shrink-0">
                    {new Date(anchor.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                </div>
              );
            })}
            {(!anchors || anchors.length === 0) && (
              <div className="text-center py-8 text-marble/30 text-sm font-display tracking-widest">NO ANCHORS</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default GAAnchorStatus;
