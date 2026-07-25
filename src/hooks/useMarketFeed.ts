/**
 * Unified market feed hook — every widget in the app should pull real-time
 * prices from here. Backed by the FeedRouter, which merges direct browser
 * WebSockets (Binance/Coinbase), polled REST (gold-api, Yahoo via edge relay),
 * and Supabase Realtime broadcasts.
 *
 * Zero synthetic data: if a symbol has no live source, `tick` is `undefined`.
 */
import { useEffect, useState } from 'react';
import { FeedRouter } from '@/lib/feeds/router';
import { startBinance } from '@/lib/feeds/sources/binance';
import { startCoinbase } from '@/lib/feeds/sources/coinbase';
import { startMetals } from '@/lib/feeds/sources/metals';
import { startYahoo } from '@/lib/feeds/sources/yahoo';
import { startRealtimeBridge } from '@/lib/feeds/sources/realtimeBridge';
import type { AssetClass, FeedHealth, Tick } from '@/lib/feeds/types';

let bootstrapped = false;

export function bootstrapFeeds(opts?: {
  crypto?: string[];
  cryptoUsd?: string[];
  yahoo?: Array<{ symbol: string; assetClass: AssetClass }>;
  skipMetals?: boolean;
}) {
  if (bootstrapped) {
    if (opts?.yahoo?.length) startYahoo(opts.yahoo);
    return;
  }
  bootstrapped = true;
  FeedRouter.ensureSource('realtime', startRealtimeBridge);
  const cryptoDefaults = opts?.crypto ?? ['BTC/USDT', 'ETH/USDT', 'SOL/USDT', 'BNB/USDT', 'XRP/USDT'];
  FeedRouter.ensureSource('binance', () => startBinance(cryptoDefaults));
  const cbDefaults = opts?.cryptoUsd ?? ['BTC/USD', 'ETH/USD', 'SOL/USD'];
  FeedRouter.ensureSource('coinbase', () => startCoinbase(cbDefaults));
  if (!opts?.skipMetals) FeedRouter.ensureSource('metals', startMetals);
  if (opts?.yahoo?.length) FeedRouter.ensureSource('yahoo', () => startYahoo(opts.yahoo!));
  if (typeof window !== 'undefined') {
    // dev/debug access — read-only handle in the console: __feed.latest('BTC/USDT')
    (window as unknown as { __feed?: unknown }).__feed = FeedRouter;
  }
}

export function useMarketFeed(symbol: string | null | undefined) {
  const [tick, setTick] = useState<Tick | undefined>(() =>
    symbol ? FeedRouter.latest(symbol) : undefined,
  );
  useEffect(() => {
    if (!symbol) { setTick(undefined); return; }
    setTick(FeedRouter.latest(symbol));
    const unsub = FeedRouter.subscribe(symbol, (t) => setTick(t));
    return () => unsub();
  }, [symbol]);
  return tick;
}

export function useMarketFeedMany(symbols: string[]) {
  const [ticks, setTicks] = useState<Record<string, Tick>>(() => {
    const out: Record<string, Tick> = {};
    for (const s of symbols) {
      const t = FeedRouter.latest(s);
      if (t) out[s] = t;
    }
    return out;
  });
  useEffect(() => {
    const unsubs = symbols.map(s =>
      FeedRouter.subscribe(s, (t) => {
        setTicks(prev => (prev[s]?.ts === t.ts ? prev : { ...prev, [s]: t }));
      }),
    );
    return () => { unsubs.forEach(u => u()); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbols.join('|')]);
  return ticks;
}

export function useFeedHealth(intervalMs = 1000): FeedHealth[] {
  const [health, setHealth] = useState<FeedHealth[]>(() => FeedRouter.getHealth());
  useEffect(() => {
    const id = window.setInterval(() => setHealth(FeedRouter.getHealth()), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);
  return health;
}

export { FeedRouter };
export type { Tick, FeedHealth } from '@/lib/feeds/types';