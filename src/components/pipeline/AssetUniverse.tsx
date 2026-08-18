import { useMemo, useState } from 'react';
import { Search, Radar } from 'lucide-react';
import { usePipeline, usePipelinePrice } from './PipelineProvider';
import SymbolLogo from '@/components/trading/SymbolLogo';
import type { WatchlistSymbol } from '@/data/tradingSymbols';

const PAGE = 60;

const fmt = (n: number) =>
  n >= 1000 ? n.toLocaleString(undefined, { maximumFractionDigits: 2 })
            : n.toLocaleString(undefined, { maximumFractionDigits: n < 1 ? 6 : 4 });

const AssetTile = ({ sym, onPick, active }: { sym: WatchlistSymbol; onPick: (s: WatchlistSymbol) => void; active: boolean }) => {
  const { price, change } = usePipelinePrice(sym.ticker);
  const up = (change ?? 0) >= 0;
  return (
    <button
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('application/x-workflow-kind', 'symbol');
        e.dataTransfer.setData(
          'application/x-workflow-symbol',
          JSON.stringify({ label: sym.label, ticker: sym.ticker }),
        );
        e.dataTransfer.effectAllowed = 'copy';
      }}
      onClick={() => onPick(sym)}
      className={`alien-panel alien-lift alien-scan group relative overflow-hidden px-2.5 py-2 text-left ${
        active ? 'ring-1 ring-gold/60' : ''
      }`}
    >
      <div className="relative z-10 flex items-center justify-between gap-2">
        <span className="flex min-w-0 items-center gap-1.5">
          <SymbolLogo symbolKey={sym.key} category={sym.cat} ticker={sym.ticker} size={14} className="shrink-0" />
          <span className="truncate font-display text-[10px] tracking-[0.12em] text-gold-light">{sym.label}</span>
        </span>
        <span className="shrink-0 font-mono text-[7px] uppercase tracking-widest text-muted-foreground">{sym.cat}</span>
      </div>
      <div className="relative z-10 mt-1 flex items-end justify-between gap-2">
        <span className={`font-mono text-[11px] ${price > 0 ? 'text-foreground' : 'text-muted-foreground/60'}`}>
          {price > 0 ? fmt(price) : 'NO FEED'}
        </span>
        {change !== null && price > 0 && (
          <span className={`font-mono text-[8px] ${up ? 'text-emerald-400' : 'text-rose-400'}`}>
            {up ? '+' : ''}{change.toFixed(2)}%
          </span>
        )}
      </div>
      <span className="pointer-events-none absolute -right-6 -top-6 h-12 w-12 rounded-full bg-gold/10 blur-xl transition-opacity group-hover:opacity-100 opacity-0" />
    </button>
  );
};

export default function AssetUniverse({ onPick }: { onPick?: (s: WatchlistSymbol) => void }) {
  const { symbols, subscribedCount, liveCount } = usePipeline();
  const [q, setQ] = useState('');
  const [cat, setCat] = useState<string>('all');
  const [limit, setLimit] = useState(PAGE);
  const [active, setActive] = useState<string | null>(null);

  const cats = useMemo(
    () => ['all', ...Array.from(new Set(symbols.map((s) => s.cat))).sort()],
    [symbols],
  );

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return symbols.filter(
      (s) =>
        (cat === 'all' || s.cat === cat) &&
        (!term ||
          s.label.toLowerCase().includes(term) ||
          s.ticker.toLowerCase().includes(term) ||
          s.key.toLowerCase().includes(term)),
    );
  }, [symbols, q, cat]);

  const shown = filtered.slice(0, limit);

  const pick = (s: WatchlistSymbol) => {
    setActive(s.ticker);
    onPick?.(s);
  };

  return (
    <section className="alien-panel alien-scan relative z-10 p-3 sm:p-4">
      <header className="relative z-10 mb-3 flex flex-wrap items-center gap-2">
        <Radar className="h-3.5 w-3.5 text-gold-light" />
        <h2 className="font-display text-[11px] tracking-[0.22em] text-gold-light">ASSET UNIVERSE</h2>
        <span className="alien-chip px-2 py-0.5 font-mono text-[8px] tracking-widest text-muted-foreground">
          {filtered.length} / {symbols.length} INSTRUMENTS
        </span>
        <span className="alien-chip px-2 py-0.5 font-mono text-[8px] tracking-widest text-emerald-400">
          {liveCount} LIVE · {subscribedCount} FEEDS
        </span>
        <div className="ml-auto relative w-full sm:w-56">
          <Search className="pointer-events-none absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => { setQ(e.target.value); setLimit(PAGE); }}
            placeholder="SEARCH ANY ASSET…"
            className="w-full rounded-full border border-gold/25 bg-background/70 py-1.5 pl-7 pr-3 font-mono text-[10px] tracking-widest text-foreground outline-none placeholder:text-muted-foreground/60 focus:border-gold/60"
          />
        </div>
      </header>

      <div className="relative z-10 mb-3 flex flex-wrap gap-1.5">
        {cats.map((c) => (
          <button
            key={c}
            onClick={() => { setCat(c); setLimit(PAGE); }}
            className={`alien-chip px-2.5 py-1 font-mono text-[8px] uppercase tracking-[0.18em] transition-colors ${
              cat === c ? 'text-gold-light' : 'text-muted-foreground hover:text-gold-light'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="relative z-10 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
        {shown.map((s) => (
          <AssetTile key={`${s.cat}-${s.key}-${s.ticker}`} sym={s} onPick={pick} active={active === s.ticker} />
        ))}
      </div>

      {shown.length === 0 && (
        <p className="relative z-10 py-6 text-center font-mono text-[10px] tracking-widest text-muted-foreground">
          NO INSTRUMENT MATCHES “{q}”
        </p>
      )}

      {limit < filtered.length && (
        <div className="relative z-10 mt-3 flex justify-center">
          <button
            onClick={() => setLimit((l) => l + PAGE)}
            className="alien-chip px-4 py-1.5 font-mono text-[9px] tracking-[0.2em] text-gold-light hover:text-gold"
          >
            LOAD {Math.min(PAGE, filtered.length - limit)} MORE
          </button>
        </div>
      )}
    </section>
  );
}