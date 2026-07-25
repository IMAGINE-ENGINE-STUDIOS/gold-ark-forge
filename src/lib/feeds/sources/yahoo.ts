/**
 * Yahoo Finance adapter (via edge-function relay to bypass browser CORS).
 * Free official 1-minute data for stocks, ETFs, indices, and FX pairs.
 * Poll cadence: 3s per symbol batch.
 */
import { FeedRouter } from '../router';
import { supabase } from '@/integrations/supabase/client';
import type { AssetClass } from '../types';

let started = false;
const tracked = new Map<string, AssetClass>();

async function tick() {
  const symbols = Array.from(tracked.keys());
  if (!symbols.length) return;
  const t0 = Date.now();
  try {
    const { data, error } = await supabase.functions.invoke('stream-yahoo', {
      body: { symbols },
    });
    if (error || !data?.quotes) return;
    const latency = Date.now() - t0;
    for (const q of data.quotes as Array<{
      symbol: string; price: number; bid?: number; ask?: number;
      change_pct?: number; volume?: number;
    }>) {
      if (!Number.isFinite(q.price) || q.price <= 0) continue;
      FeedRouter.publish({
        symbol: q.symbol,
        assetClass: tracked.get(q.symbol) ?? 'stocks',
        last: q.price,
        bid: q.bid,
        ask: q.ask,
        change24h: q.change_pct,
        volume24h: q.volume,
        ts: Date.now(),
        source: 'yahoo',
        latencyMs: latency,
      });
    }
  } catch { /* silent */ }
}

export function startYahoo(symbols: Array<{ symbol: string; assetClass: AssetClass }>) {
  symbols.forEach(s => tracked.set(s.symbol, s.assetClass));
  if (started || typeof window === 'undefined') return;
  started = true;
  tick();
  window.setInterval(tick, 3000);
}