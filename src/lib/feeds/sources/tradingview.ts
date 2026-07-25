import { supabase } from '@/integrations/supabase/client';
import { FeedRouter } from '../router';
import type { AssetClass } from '../types';

interface TrackedTradingViewSymbol {
  symbol: string;
  assetClass: AssetClass;
  tvSymbols: string[];
}

const tracked = new Map<string, { symbol: string; assetClass: AssetClass }>();
let started = false;
let cursor = 0;

const CHUNK_SIZE = 180;
const POLL_MS = 1000;

async function tick() {
  const tvSymbols = Array.from(tracked.keys());
  if (!tvSymbols.length) return;

  const chunk = tvSymbols.length <= CHUNK_SIZE
    ? tvSymbols
    : Array.from({ length: CHUNK_SIZE }, (_, i) => tvSymbols[(cursor + i) % tvSymbols.length]).filter(Boolean);
  cursor = (cursor + CHUNK_SIZE) % tvSymbols.length;

  const t0 = Date.now();
  try {
    const { data, error } = await supabase.functions.invoke('stream-tradingview', {
      body: { symbols: chunk },
    });
    if (error || !Array.isArray(data?.quotes)) return;
    const latency = Date.now() - t0;
    for (const q of data.quotes as Array<{
      tvSymbol: string;
      price: number;
      bid?: number;
      ask?: number;
      change_pct?: number;
      volume?: number;
      update_mode?: string;
    }>) {
      const link = tracked.get(q.tvSymbol);
      if (!link || !Number.isFinite(q.price) || q.price <= 0) continue;
      FeedRouter.publish({
        symbol: link.symbol,
        assetClass: link.assetClass,
        last: q.price,
        bid: Number.isFinite(q.bid) ? q.bid : undefined,
        ask: Number.isFinite(q.ask) ? q.ask : undefined,
        change24h: Number.isFinite(q.change_pct) ? q.change_pct : undefined,
        volume24h: Number.isFinite(q.volume) ? q.volume : undefined,
        ts: Date.now(),
        source: q.update_mode?.includes('delayed') ? 'tradingview-delayed' : 'tradingview',
        latencyMs: latency,
      });
    }
  } catch {
    // No synthetic fallback. If TradingView blocks or misses a symbol, the UI shows NO FEED.
  }
}

export function startTradingView(symbols: TrackedTradingViewSymbol[]) {
  for (const item of symbols) {
    for (const tvSymbol of item.tvSymbols) {
      tracked.set(tvSymbol, { symbol: item.symbol, assetClass: item.assetClass });
    }
  }
  if (started || typeof window === 'undefined') return;
  started = true;
  tick();
  window.setInterval(tick, POLL_MS);
}