import { useEffect, useMemo, useRef, useState } from 'react';
import { Search, ChevronDown, X } from 'lucide-react';
import { WATCHLIST_CATEGORIES, type WatchlistSymbol } from '@/data/tradingSymbols';

// ────────────────────────────────────────────────────────────
// SHARED SYMBOL PICKER — single source of truth for symbol
// selection across SWAP / AUTOMATION / MARKETPLACE.
// Superior styling: gold-lined, category-grouped, live search,
// keyboard-navigable dropdown, compact by default.
// ────────────────────────────────────────────────────────────

export interface SymbolPickerProps {
  value: string;                                  // ticker
  onChange: (ticker: string, sym: WatchlistSymbol) => void;
  categories?: Array<'metals' | 'crypto' | 'energy' | 'stocks' | 'fx' | 'indices' | 'commodities' | 'bonds' | 'etf' | 'stablecoin'>;
  label?: string;
  size?: 'xs' | 'sm';
  className?: string;
  disabled?: boolean;
}

const ALL: WatchlistSymbol[] = WATCHLIST_CATEGORIES.flatMap(c => c.items);
const BY_TICKER = new Map(ALL.map(s => [s.ticker, s]));

export function findSymbol(ticker: string): WatchlistSymbol | undefined {
  return BY_TICKER.get(ticker);
}

export default function SymbolPicker({ value, onChange, categories, label, size = 'sm', className = '', disabled }: SymbolPickerProps) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const ref = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  useEffect(() => { if (open) inputRef.current?.focus(); }, [open]);

  const groups = useMemo(() => {
    const src = categories?.length
      ? WATCHLIST_CATEGORIES.filter(g => g.items.some(i => categories.includes(i.cat as any)))
      : WATCHLIST_CATEGORIES;
    if (!q.trim()) return src.map(g => ({ ...g, items: categories?.length ? g.items.filter(i => categories.includes(i.cat as any)) : g.items }));
    const needle = q.trim().toLowerCase();
    return src
      .map(g => ({
        ...g,
        items: g.items.filter(i =>
          categories?.length ? categories.includes(i.cat as any) : true
        ).filter(i =>
          i.label.toLowerCase().includes(needle) ||
          i.ticker.toLowerCase().includes(needle) ||
          i.key.toLowerCase().includes(needle)
        ),
      }))
      .filter(g => g.items.length > 0);
  }, [q, categories]);

  const selected = BY_TICKER.get(value);
  const tSize = size === 'xs' ? 'text-[9px]' : 'text-[10px]';

  return (
    <div ref={ref} className={`relative ${className}`}>
      {label && (
        <div className="text-[8px] font-display tracking-[0.15em] text-marble/40 mb-1">{label}</div>
      )}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(o => !o)}
        className={`w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded border transition-all
          ${open ? 'border-gold/50 bg-gradient-to-br from-gold/10 to-transparent shadow-lg shadow-gold/10'
                 : 'border-gold/20 bg-navy-dark/60 hover:border-gold/35 hover:bg-navy-dark/80'}
          disabled:opacity-40 disabled:cursor-not-allowed`}
      >
        <span className={`font-mono ${tSize} text-gold-light tracking-wider truncate`}>
          {selected ? selected.label : value || '— select —'}
        </span>
        <span className="flex items-center gap-1.5">
          {selected && (
            <span className="text-[8px] font-mono text-marble/40 uppercase tracking-wider">{selected.ticker}</span>
          )}
          <ChevronDown className={`w-3 h-3 text-gold/60 transition-transform ${open ? 'rotate-180' : ''}`} />
        </span>
      </button>

      {open && (
        <div className="absolute z-50 top-full mt-1 left-0 right-0 w-full min-w-[240px] rounded-lg border border-gold/30 bg-navy-dark/95 backdrop-blur-xl shadow-2xl shadow-gold/10 overflow-hidden">
          <div className="flex items-center gap-1.5 px-2 py-1.5 border-b border-gold/15 bg-navy-light/40">
            <Search className="w-3 h-3 text-gold/60 shrink-0" />
            <input
              ref={inputRef}
              value={q}
              onChange={e => setQ(e.target.value)}
              placeholder="search symbol, ticker, name…"
              className="flex-1 bg-transparent text-[10px] font-mono text-marble/80 placeholder:text-marble/25 outline-none"
            />
            {q && (
              <button onClick={() => setQ('')} className="text-marble/40 hover:text-gold p-0.5">
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
          <div className="max-h-72 overflow-y-auto py-1">
            {groups.length === 0 && (
              <div className="px-3 py-6 text-center text-[9px] font-mono text-marble/30">no matches</div>
            )}
            {groups.map(g => (
              <div key={g.label} className="mb-1">
                <div className="sticky top-0 z-[1] px-2.5 py-0.5 text-[7px] font-display tracking-[0.2em] text-gold/50 bg-navy-dark/95 border-b border-gold/5">
                  {g.label}
                </div>
                {g.items.slice(0, 60).map(i => {
                  const isActive = i.ticker === value;
                  return (
                    <button
                      key={i.ticker}
                      onClick={() => { onChange(i.ticker, i); setOpen(false); setQ(''); }}
                      className={`w-full flex items-center justify-between gap-2 px-2.5 py-1 transition-colors ${
                        isActive ? 'bg-gold/15 text-gold' : 'text-marble/70 hover:bg-gold/5 hover:text-gold-light'
                      }`}
                    >
                      <span className="font-mono text-[10px] tracking-wider truncate text-left">{i.label}</span>
                      <span className="font-mono text-[8px] text-marble/40 uppercase tracking-wider shrink-0">{i.ticker}</span>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
          <div className="px-2 py-1 border-t border-gold/10 bg-navy-light/40 text-[7px] font-mono text-marble/30 tracking-wider">
            {ALL.length} instruments · {WATCHLIST_CATEGORIES.length} categories
          </div>
        </div>
      )}
    </div>
  );
}