import { useFeedHealth } from '@/hooks/useMarketFeed';
import { Activity } from 'lucide-react';

/**
 * Compact live-source health badge. Shows online sources + median latency.
 * Drop into any header for real-time visibility into the unified feed layer.
 */
export function FeedStatusBadge({ className = '' }: { className?: string }) {
  const health = useFeedHealth(1000);
  const online = health.filter(h => h.ok);
  const total = health.length;
  const medLat = (() => {
    const arr = online.map(h => h.latencyMs).filter(n => n > 0).sort((a, b) => a - b);
    if (!arr.length) return 0;
    return arr[Math.floor(arr.length / 2)];
  })();
  const color = online.length === total && total > 0 ? 'text-emerald-400' : online.length > 0 ? 'text-amber-400' : 'text-rose-400';
  const dot = online.length === total && total > 0 ? 'bg-emerald-400' : online.length > 0 ? 'bg-amber-400' : 'bg-rose-400';
  return (
    <div className={`inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-black/30 px-2 py-0.5 text-[10px] font-medium backdrop-blur ${color} ${className}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${dot} animate-pulse`} />
      <Activity className="h-2.5 w-2.5" />
      <span className="tabular-nums">
        {online.length}/{total} · {medLat}ms
      </span>
      <span className="opacity-60">FEEDS</span>
    </div>
  );
}