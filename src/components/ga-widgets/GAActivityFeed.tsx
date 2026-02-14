import { useAnchoredEvents } from '@/hooks/useAnchoredEvents';
import { Anchor, FileCheck2, ArrowRightLeft, Lock, AlertTriangle, Link2 } from 'lucide-react';

const eventIcons: Record<string, any> = {
  issued: FileCheck2,
  transfer: ArrowRightLeft,
  frozen: Lock,
  revoked: AlertTriangle,
};

const eventColors: Record<string, string> = {
  issued: 'text-emerald-400 bg-emerald-400/10',
  transfer: 'text-blue-400 bg-blue-400/10',
  frozen: 'text-amber-400 bg-amber-400/10',
  revoked: 'text-red-400 bg-red-400/10',
};

const anchorStatusColors: Record<string, string> = {
  pending: 'text-amber-400',
  broadcast: 'text-blue-400',
  confirmed: 'text-emerald-400',
  reorged: 'text-red-400',
  abandoned: 'text-marble/30',
};

const GAActivityFeed = () => {
  const { data: events, isLoading } = useAnchoredEvents(20);

  return (
    <div className="relative rounded-sm bg-gradient-to-br from-navy via-navy to-navy-light border border-gold/30 overflow-hidden">
      <div className="ornate-corner ornate-corner-tl" />
      <div className="ornate-corner ornate-corner-tr" />
      <div className="ornate-corner ornate-corner-bl" />
      <div className="ornate-corner ornate-corner-br" />

      <div className="p-6 md:p-8">
        <div className="flex items-center gap-3 mb-6">
          <Anchor className="w-5 h-5 text-gold" />
          <h3 className="font-display text-lg tracking-[0.1em] text-gold-light">ANCHORED ACTIVITY</h3>
          {events && (
            <span className="ml-auto text-[10px] tracking-widest text-marble/40 font-display">
              {events.length} EVENTS
            </span>
          )}
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-12 bg-navy-light/50 rounded animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-[11px] top-0 bottom-0 w-px bg-gold/10" />

            <div className="space-y-1">
              {events?.map((evt) => {
                const Icon = eventIcons[evt.event_type] || FileCheck2;
                const color = eventColors[evt.event_type] || eventColors.issued;
                const anchorColor = anchorStatusColors[evt.anchor_status] || anchorStatusColors.pending;

                return (
                  <div key={evt.anchor_leaf_id} className="flex items-start gap-3 p-2 rounded hover:bg-navy-light/20 transition-colors relative">
                    {/* Timeline dot */}
                    <div className={`w-[22px] h-[22px] rounded-full flex items-center justify-center flex-shrink-0 ${color} z-10`}>
                      <Icon className="w-3 h-3" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs text-marble/70 font-medium">{evt.event_type.toUpperCase()}</span>
                        <span className="font-mono text-[10px] text-marble/30 truncate">cert:{evt.cert_id.slice(0, 8)}</span>
                      </div>
                      <div className="flex items-center gap-3 text-[10px] text-marble/40">
                        <span className={`flex items-center gap-1 ${anchorColor}`}>
                          <Anchor className="w-2.5 h-2.5" />
                          {evt.anchor_status}
                        </span>
                        <span className="font-mono">leaf #{evt.leaf_index}</span>
                        {evt.commit_txid && (
                          <span className="flex items-center gap-1 text-emerald-400/70">
                            <Link2 className="w-2.5 h-2.5" />
                            <span className="truncate max-w-[100px]">{evt.commit_txid}</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Timestamp */}
                    <span className="text-[10px] text-marble/30 font-mono flex-shrink-0">
                      {new Date(evt.event_created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                );
              })}
              {(!events || events.length === 0) && (
                <div className="text-center py-8 text-marble/30 text-sm font-display tracking-widest">
                  NO ANCHORED EVENTS
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GAActivityFeed;
