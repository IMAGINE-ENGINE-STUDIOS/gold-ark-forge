import { useEffect, useMemo, useState } from 'react';
import { Activity, Search, X } from 'lucide-react';
import { FeedRouter } from '@/lib/feeds/router';
import { canonicalFeedSymbol } from '@/lib/feeds/tradingViewSymbols';
import { ALL_SYMBOLS, type WatchlistSymbol } from '@/data/tradingSymbols';
import type { Tick } from '@/lib/feeds/types';

/**
 * Per-symbol live-data status: LIVE / DELAYED / STALE / NO FEED,
 * with the provider name and the age of the last tick.
 *
 * Reads directly from FeedRouter (single source of truth) and re-renders
 * every 1s so the freshness column is always accurate.
 */

type StatusKind = 'live' | 'delayed' | 'stale' | 'missing';

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

function classify(tick: Tick | undefined, now: number): { kind: StatusKind; ageMs: number } {
  if (!tick) return { kind: 'missing', ageMs: 0 };
  const ageMs = Math.max(0, now - tick.ts);
  // Provider explicitly labelled delayed → always delayed regardless of age
  if (tick.source?.includes('delayed')) return { kind: 'delayed', ageMs };
  if (ageMs < 3_000) return { kind: 'live', ageMs };
  if (ageMs < 60_000) return { kind: 'delayed', ageMs };
  return { kind: 'stale', ageMs };
}

function fmtAge(ms: number): string {
  if (ms <= 0) return '—';
  if (ms < 1_000) return `${ms}ms`;
  const s = Math.floor(ms / 1_000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  return `${Math.floor(m / 60)}h`;
}

const PILL: Record<StatusKind, string> = {
  live: 'text-emerald-300 bg-emerald-500/10 border-emerald-400/30',
  delayed: 'text-amber-300 bg-amber-500/10 border-amber-400/30',
  stale: 'text-orange-300 bg-orange-500/10 border-orange-400/30',
  missing: 'text-rose-300 bg-rose-500/10 border-rose-400/30',
};
const DOT: Record<StatusKind, string> = {
  live: 'bg-emerald-400 animate-pulse',
  delayed: 'bg-amber-400',
  stale: 'bg-orange-400',
  missing: 'bg-rose-500',
};
const LABEL: Record<StatusKind, string> = {
  live: 'LIVE',
  delayed: 'DELAYED',
  stale: 'STALE',
  missing: 'NO FEED',
};

/** Read the best-known tick for a symbol trying multiple canonical spellings. */
function readTick(sym: WatchlistSymbol): Tick | undefined {
  const candidates = new Set<string>();
  candidates.add(canonicalFeedSymbol(sym));
  candidates.add(sym.ticker);
  if (sym.cat === 'crypto') {
    const base = sym.ticker.split('-')[0]?.toUpperCase() || sym.label.split('/')[0]?.toUpperCase();
    if (base) { candidates.add(`${base}/USDT`); candidates.add(`${base}/USD`); }
  }
  for (const c of candidates) {
    const t = FeedRouter.latest(c);
    if (t) return t;
  }
  return undefined;
}

export interface SymbolFeedStatusPanelProps {
  /** Symbols to inspect. Defaults to `ALL_SYMBOLS`. */
  symbols?: WatchlistSymbol[];
  /** Optional close handler for use inside a slide-over. */
  onClose?: () => void;
  className?: string;
  /** Refresh cadence for freshness column in ms. */
  intervalMs?: number;
}

export function SymbolFeedStatusPanel({
  symbols,
  onClose,
  className = '',
  intervalMs = 1000,
}: SymbolFeedStatusPanelProps) {
  const universe = symbols?.length ? symbols : ALL_SYMBOLS;
  const [now, setNow] = useState(() => Date.now());
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'all' | StatusKind>('all');

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), Math.max(250, intervalMs));
    return () => window.clearInterval(id);
  }, [intervalMs]);

  const rows = useMemo(() => {
    return universe.map((sym) => {
      const tick = readTick(sym);
      const { kind, ageMs } = classify(tick, now);
      return { sym, tick, kind, ageMs };
    });
  }, [universe, now]);

  const counts = useMemo(() => {
    const c: Record<StatusKind, number> = { live: 0, delayed: 0, stale: 0, missing: 0 };
    for (const r of rows) c[r.kind]++;
    return c;
  }, [rows]);

  const q = query.trim().toLowerCase();
  const visible = rows.filter((r) => {
    if (filter !== 'all' && r.kind !== filter) return false;
    if (!q) return true;
    return (
      r.sym.label.toLowerCase().includes(q) ||
      r.sym.ticker.toLowerCase().includes(q) ||
      r.sym.key.toLowerCase().includes(q) ||
      (r.tick?.source ?? '').toLowerCase().includes(q)
    );
  });

  return (
    <div className={`flex flex-col h-full min-h-0 bg-navy-dark/95 border border-gold/15 rounded-md ${className}`}>
      <div className="flex items-center justify-between px-3 py-2 border-b border-gold/10">
        <div className="flex items-center gap-2">
          <Activity className="h-3.5 w-3.5 text-gold" />
          <h3 className="font-display text-[11px] tracking-[0.16em] text-gold uppercase">Feed Status</h3>
          <span className="text-[9px] font-mono text-marble/40">· per-symbol</span>
        </div>
        {onClose && (
          <button onClick={onClose} aria-label="Close" className="text-marble/40 hover:text-marble">
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Summary chips */}
      <div className="px-3 py-2 flex flex-wrap gap-1.5 border-b border-gold/5">
        {(['all', 'live', 'delayed', 'stale', 'missing'] as const).map((k) => {
          const count = k === 'all' ? rows.length : counts[k];
          const active = filter === k;
          const base = k === 'all'
            ? 'text-marble/80 bg-marble/5 border-marble/20'
            : PILL[k];
          return (
            <button
              key={k}
              onClick={() => setFilter(k)}
              className={`text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 rounded border ${base} ${active ? 'ring-1 ring-gold/60' : 'opacity-70 hover:opacity-100'}`}
            >
              {k === 'all' ? 'ALL' : LABEL[k]} · {count}
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="px-3 py-2 border-b border-gold/5">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-marble/30" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter by symbol, ticker or provider…"
            className="w-full bg-navy-light/60 border border-gold/15 text-marble text-[11px] rounded pl-7 pr-2 py-1.5 font-mono placeholder:text-marble/25 focus:outline-none focus:border-gold/40"
          />
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        <table className="w-full text-[10px] font-mono">
          <thead className="sticky top-0 bg-navy-dark z-10 text-marble/40 uppercase tracking-wider text-[9px]">
            <tr>
              <th className="text-left px-3 py-1.5 font-normal">Symbol</th>
              <th className="text-right px-2 py-1.5 font-normal">Last</th>
              <th className="text-left  px-2 py-1.5 font-normal">Provider</th>
              <th className="text-right px-2 py-1.5 font-normal">Age</th>
              <th className="text-right px-3 py-1.5 font-normal">Status</th>
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 && (
              <tr><td colSpan={5} className="text-center text-marble/40 py-6">No symbols match.</td></tr>
            )}
            {visible.map(({ sym, tick, kind, ageMs }) => {
              const provider = tick ? (SOURCE_LABEL[tick.source] ?? tick.source) : '—';
              const last = tick && Number.isFinite(tick.last) && tick.last > 0
                ? tick.last.toLocaleString(undefined, { maximumFractionDigits: tick.last < 10 ? 6 : 2 })
                : '—';
              return (
                <tr key={`${sym.cat}:${sym.ticker}`} className="border-t border-white/5 hover:bg-white/[0.02]">
                  <td className="px-3 py-1.5">
                    <div className="flex items-center gap-1.5">
                      <span className={`h-1.5 w-1.5 rounded-full ${DOT[kind]}`} />
                      <span className="text-marble/90">{sym.label}</span>
                      <span className="text-marble/30">·</span>
                      <span className="text-marble/50">{sym.ticker}</span>
                    </div>
                  </td>
                  <td className="px-2 py-1.5 text-right text-marble/90 tabular-nums">{last}</td>
                  <td className="px-2 py-1.5 text-marble/60">{provider}</td>
                  <td className="px-2 py-1.5 text-right text-marble/60 tabular-nums">
                    {tick ? fmtAge(ageMs) : '—'}
                  </td>
                  <td className="px-3 py-1.5 text-right">
                    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded border text-[9px] tracking-wider ${PILL[kind]}`}>
                      {LABEL[kind]}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="px-3 py-1.5 border-t border-gold/10 text-[9px] font-mono text-marble/40 flex items-center justify-between">
        <span>Refreshed every {Math.max(250, intervalMs)}ms · reads FeedRouter directly</span>
        <span>{visible.length}/{rows.length} shown</span>
      </div>
    </div>
  );
}

export default SymbolFeedStatusPanel;