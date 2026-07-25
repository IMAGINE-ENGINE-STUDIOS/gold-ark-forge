import { useFeedHealth } from '@/hooks/useMarketFeed';
import { useState } from 'react';
import { Activity } from 'lucide-react';

const SOURCE_LABEL: Record<string, string> = {
  binance: 'Binance WS',
  'binance-ws': 'Binance WS',
  coinbase: 'Coinbase',
  'coinbase-ws': 'Coinbase WS',
  metals: 'Gold-API',
  'gold-api': 'Gold-API',
  yahoo: 'Yahoo',
  realtime: 'Cloud Bus',
  fred: 'FRED',
  treasury: 'US Treasury',
  tradingview: 'TradingView',
  'tradingview-delayed': 'TradingView (delayed)',
};

/**
 * Compact live-source health badge. Shows online sources + median latency.
 * Drop into any header for real-time visibility into the unified feed layer.
 */
export function FeedStatusBadge({ className = '' }: { className?: string }) {
  const health = useFeedHealth(1000);
  const [open, setOpen] = useState(false);
  const online = health.filter(h => h.ok);
  const total = health.length;
  const medLat = (() => {
    const arr = online.map(h => h.latencyMs).filter(n => n > 0).sort((a, b) => a - b);
    if (!arr.length) return 0;
    return arr[Math.floor(arr.length / 2)];
  })();
  const color = online.length === total && total > 0 ? 'text-emerald-400' : online.length > 0 ? 'text-amber-400' : 'text-rose-400';
  const dot = online.length === total && total > 0 ? 'bg-emerald-400' : online.length > 0 ? 'bg-amber-400' : 'bg-rose-400';
  const now = Date.now();

  return (
    <div className={`relative inline-block ${className}`}>
      <button
        onClick={() => setOpen(o => !o)}
        onMouseEnter={() => setOpen(true)}
        className={`inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-black/30 px-2 py-0.5 text-[10px] font-medium backdrop-blur ${color}`}
      >
        <span className={`h-1.5 w-1.5 rounded-full ${dot} animate-pulse`} />
        <Activity className="h-2.5 w-2.5" />
        <span className="tabular-nums">{online.length}/{total} · {medLat}ms</span>
        <span className="opacity-60">FEEDS</span>
      </button>
      {open && (
        <div
          onMouseLeave={() => setOpen(false)}
          className="absolute right-0 top-full mt-1 z-50 min-w-[220px] rounded-md border border-white/10 bg-black/90 backdrop-blur-md shadow-2xl p-2 space-y-1"
        >
          <div className="text-[9px] font-mono uppercase tracking-wider text-marble/50 px-1 pb-1 border-b border-white/5">
            Live data sources
          </div>
          {health.length === 0 && (
            <div className="text-[10px] font-mono text-marble/40 p-2">Bootstrapping feeds…</div>
          )}
          {health.map(h => {
            const age = Math.max(0, Math.floor((now - h.lastTickAt) / 1000));
            const label = SOURCE_LABEL[h.source] ?? h.source;
            return (
              <div key={h.source} className="flex items-center justify-between gap-3 text-[10px] font-mono px-1">
                <div className="flex items-center gap-1.5">
                  <span className={`h-1.5 w-1.5 rounded-full ${h.ok ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                  <span className="text-marble/80">{label}</span>
                </div>
                <span className="text-marble/50 tabular-nums">
                  {h.ok ? `${age}s ago` : 'offline'}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}