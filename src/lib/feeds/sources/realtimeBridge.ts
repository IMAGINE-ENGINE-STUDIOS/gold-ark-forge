/**
 * Supabase Realtime bridge — pipes ticks written to `market_ticks`
 * into the FeedRouter so any backend-populated feed (edge function,
 * scheduled poller, external agent) shows up in the app instantly.
 */
import { FeedRouter } from '../router';
import type { AssetClass } from '../types';
import { supabase } from '@/integrations/supabase/client';

let started = false;

export function startRealtimeBridge() {
  if (started || typeof window === 'undefined') return;
  started = true;
  const channel = supabase
    .channel('market_ticks_stream')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'market_ticks' },
      (payload) => {
        const r = payload.new as Record<string, unknown> | null;
        if (!r || !r.symbol || !Number.isFinite(Number(r.last))) return;
        FeedRouter.publish({
          symbol: String(r.symbol),
          assetClass: (r.asset_class ?? 'stocks') as AssetClass,
          last: Number(r.last),
          bid: r.bid != null ? Number(r.bid) : undefined,
          ask: r.ask != null ? Number(r.ask) : undefined,
          change24h: r.change_24h != null ? Number(r.change_24h) : undefined,
          volume24h: r.volume_24h != null ? Number(r.volume_24h) : undefined,
          ts: r.ts ? new Date(String(r.ts)).getTime() : Date.now(),
          source: String(r.source ?? 'realtime'),
          latencyMs: r.latency_ms != null ? Number(r.latency_ms) : undefined,
        });
      },
    )
    .subscribe();

  window.addEventListener('beforeunload', () => {
    try { supabase.removeChannel(channel); } catch { /* noop */ }
  });
}