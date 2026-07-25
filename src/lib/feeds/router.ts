/**
 * FeedRouter — one bus for all live ticks.
 *
 * Adapters push ticks in; components subscribe by symbol.
 * Multiple sources can push the same symbol; the router keeps the freshest
 * tick per (symbol, source), exposes NBBO, and tracks per-source health.
 *
 * Zero synthetic data: adapters that fail simply stop pushing.
 */
import type { AssetClass, FeedHealth, Tick, TickListener } from './types';

type SymbolListeners = Set<TickListener>;

const SOURCE_PRIORITY: Record<string, number> = {
  'binance-ws': 100,
  'coinbase-ws': 96,
  tradingview: 86,
  'gold-api': 82,
  yahoo: 68,
  realtime: 64,
  treasury: 58,
  fred: 52,
  'tradingview-delayed': 36,
};

function freshnessRank(tick: Tick, now = Date.now()): number {
  const age = now - tick.ts;
  if (age < 10_000) return 2;
  if (age < 60_000) return 1;
  return 0;
}

function sourcePriority(source: string): number {
  return SOURCE_PRIORITY[source] ?? 50;
}

function chooseBestTick(ticks: Iterable<Tick>, now = Date.now()): Tick | undefined {
  let best: Tick | undefined;
  for (const tick of ticks) {
    if (!Number.isFinite(tick.last) || tick.last <= 0) continue;
    if (!best) {
      best = tick;
      continue;
    }
    const tickFreshness = freshnessRank(tick, now);
    const bestFreshness = freshnessRank(best, now);
    if (tickFreshness !== bestFreshness) {
      if (tickFreshness > bestFreshness) best = tick;
      continue;
    }
    const tickPriority = sourcePriority(tick.source);
    const bestPriority = sourcePriority(best.source);
    if (tickPriority !== bestPriority) {
      if (tickPriority > bestPriority) best = tick;
      continue;
    }
    if (tick.ts > best.ts) best = tick;
  }
  if (!best) return undefined;
  return now - best.ts > 5000 ? { ...best, stale: true } : best;
}

class FeedRouterImpl {
  private latestBySymbol = new Map<string, Map<string, Tick>>(); // symbol -> source -> tick
  private listeners = new Map<string, SymbolListeners>();        // symbol -> listeners
  private wildcards = new Set<TickListener>();
  private health = new Map<string, FeedHealth>();
  private startedSources = new Set<string>();

  publish(tick: Tick) {
    tick.ts = tick.ts || Date.now();
    let bySource = this.latestBySymbol.get(tick.symbol);
    if (!bySource) {
      bySource = new Map();
      this.latestBySymbol.set(tick.symbol, bySource);
    }
    bySource.set(tick.source, tick);

    this.health.set(tick.source, {
      source: tick.source,
      ok: true,
      latencyMs: tick.latencyMs ?? 0,
      lastTickAt: tick.ts,
    });

    const subs = this.listeners.get(tick.symbol);
    if (subs) for (const fn of subs) fn(tick);
    for (const fn of this.wildcards) fn(tick);
  }

  /** Latest tick — best available source, not merely the newest poll. */
  latest(symbol: string): Tick | undefined {
    const bySource = this.latestBySymbol.get(symbol);
    if (!bySource || bySource.size === 0) return undefined;
    return chooseBestTick(bySource.values());
  }

  /** Best tick across multiple canonical spellings for the same instrument. */
  latestOf(symbols: Iterable<string>): Tick | undefined {
    const candidates: Tick[] = [];
    for (const symbol of symbols) {
      const bySource = this.latestBySymbol.get(symbol);
      if (!bySource) continue;
      candidates.push(...bySource.values());
    }
    return chooseBestTick(candidates);
  }

  /** NBBO across sources for a given symbol. */
  nbbo(symbol: string): { bid?: number; ask?: number; bidSrc?: string; askSrc?: string } {
    const bySource = this.latestBySymbol.get(symbol);
    if (!bySource) return {};
    let bestBid = -Infinity, bestAsk = Infinity;
    let bidSrc = '', askSrc = '';
    for (const t of bySource.values()) {
      if (t.bid && t.bid > bestBid) { bestBid = t.bid; bidSrc = t.source; }
      if (t.ask && t.ask < bestAsk) { bestAsk = t.ask; askSrc = t.source; }
    }
    return {
      bid: bestBid === -Infinity ? undefined : bestBid,
      ask: bestAsk === Infinity ? undefined : bestAsk,
      bidSrc: bidSrc || undefined,
      askSrc: askSrc || undefined,
    };
  }

  subscribe(symbol: string, fn: TickListener): () => void {
    let subs = this.listeners.get(symbol);
    if (!subs) { subs = new Set(); this.listeners.set(symbol, subs); }
    subs.add(fn);
    const t = this.latest(symbol);
    if (t) queueMicrotask(() => fn(t));
    return () => subs!.delete(fn);
  }

  subscribeAll(fn: TickListener): () => void {
    this.wildcards.add(fn);
    return () => this.wildcards.delete(fn);
  }

  getHealth(): FeedHealth[] {
    const now = Date.now();
    return Array.from(this.health.values()).map(h => ({
      ...h,
      ok: now - h.lastTickAt < 10_000,
    }));
  }

  /** Register a source starter to run at most once. */
  ensureSource(name: string, start: () => void) {
    if (this.startedSources.has(name)) return;
    this.startedSources.add(name);
    try { start(); } catch (e) { console.error(`[FeedRouter] source ${name} failed:`, e); }
  }
}

export const FeedRouter = new FeedRouterImpl();

/** Route a Gold Arrow symbol to its asset class (best-effort). */
export function classifySymbol(symbol: string): AssetClass {
  const s = symbol.toUpperCase();
  if (s.startsWith('XAU') || s.startsWith('XAG') || s.startsWith('XPT') || s.startsWith('XPD')) return 'metals';
  if (s.includes('/') && (s.endsWith('/USDT') || s.endsWith('/USD') || s.startsWith('BTC') || s.startsWith('ETH'))) {
    return 'crypto';
  }
  if (s === 'WTI' || s === 'BRENT' || s === 'NG' || s === 'HH') return 'energy';
  if (/^[A-Z]{3}\/[A-Z]{3}$/.test(s)) return 'fx';
  return 'stocks';
}