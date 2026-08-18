import { useMemo, useState } from 'react';
import { Search, ArrowUpRight, ArrowDownRight, Activity } from 'lucide-react';
import { usePipeline, usePipelinePrice } from '@/components/pipeline/PipelineProvider';
import SymbolLogo from '@/components/trading/SymbolLogo';
import type { WatchlistSymbol } from '@/data/tradingSymbols';

const money = (n: number) =>
  n.toLocaleString(undefined, { maximumFractionDigits: n < 1 ? 6 : 2 });

const Row = ({ sym, active, onPick }: { sym: WatchlistSymbol; active: boolean; onPick: (s: WatchlistSymbol) => void }) => {
  const { price, change } = usePipelinePrice(active ? sym.ticker : null);
  return (
    <button
      onClick={() => onPick(sym)}
      className={`flex w-full items-center gap-2 rounded-md border px-2 py-1.5 text-left transition-colors ${
        active ? 'border-gold/70 bg-gold/10' : 'border-cyan-300/15 bg-cyan-300/[0.03] hover:border-gold/40'
      }`}
    >
      <SymbolLogo symbolKey={sym.key} category={sym.cat} ticker={sym.ticker} size={14} />
      <span className="min-w-0 flex-1 truncate font-mono text-[9px] tracking-widest text-cyan-100">{sym.label}</span>
      {active && price > 0 && (
        <span className={`font-mono text-[9px] ${(change ?? 0) >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
          {money(price)}
        </span>
      )}
    </button>
  );
};

export default function HoloSwap() {
  const { symbols, paper, liveCount, subscribedCount } = usePipeline();
  const [q, setQ] = useState('');
  const [sel, setSel] = useState<WatchlistSymbol>(
    () => symbols.find((s) => s.key === 'gold') ?? symbols[0],
  );
  const [amount, setAmount] = useState('1000');
  const [msg, setMsg] = useState<string | null>(null);

  const { price, change } = usePipelinePrice(sel?.ticker);

  const list = useMemo(() => {
    const term = q.trim().toLowerCase();
    return symbols
      .filter((s) => !term || s.label.toLowerCase().includes(term) || s.ticker.toLowerCase().includes(term))
      .slice(0, 40);
  }, [symbols, q]);

  const usd = Number(amount) || 0;
  const qty = price > 0 ? usd / price : 0;

  const trade = (side: 'buy' | 'sell') => {
    if (!sel) return;
    if (price <= 0) return setMsg('NO LIVE FEED — TRANSMISSION BLOCKED');
    if (qty <= 0) return setMsg('ENTER AN AMOUNT');
    try {
      paper.submitOrder({ symbol: sel.ticker, side, qty, type: 'market', price });
      setMsg(`${side.toUpperCase()} ${qty.toFixed(6)} ${sel.ticker} @ ${money(price)}`);
    } catch (e) {
      setMsg(e instanceof Error ? e.message.toUpperCase() : 'ORDER REJECTED');
    }
  };

  const panel = 'rounded-xl border border-gold/25 bg-[#04121f]/80 p-3 shadow-[0_0_40px_rgba(212,175,55,0.12)] backdrop-blur-sm';

  return (
    <div className="flex w-full flex-wrap justify-center gap-3 font-mono text-cyan-100">
      {/* Asset column */}
      <section className={`${panel} flex w-[280px] max-w-full flex-col gap-2`}>
        <header className="flex items-center gap-2 text-[9px] tracking-[0.24em] text-gold-light">
          <Activity className="h-3 w-3" /> ASSET LATTICE
        </header>
        <div className="relative">
          <Search className="pointer-events-none absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-cyan-200/50" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="SCAN CATALOG…"
            className="w-full rounded-md border border-cyan-300/25 bg-transparent py-1.5 pl-7 pr-2 text-[9px] tracking-widest outline-none placeholder:text-cyan-200/40 focus:border-gold/60"
          />
        </div>
        <div className="flex max-h-[260px] flex-col gap-1 overflow-y-auto pr-1">
          {list.map((s) => (
            <Row key={`${s.cat}-${s.key}`} sym={s} active={sel?.key === s.key} onPick={setSel} />
          ))}
        </div>
      </section>

      {/* Swap core */}
      <section className={`${panel} flex w-[320px] max-w-full flex-col gap-3`}>
        <header className="flex items-center justify-between text-[9px] tracking-[0.24em] text-gold-light">
          <span>SWAP CORE</span>
          <span className="text-emerald-300">{liveCount}/{subscribedCount} FEEDS</span>
        </header>

        <div className="flex items-center gap-2 rounded-lg border border-gold/30 bg-gold/[0.06] px-3 py-2">
          {sel && <SymbolLogo symbolKey={sel.key} category={sel.cat} ticker={sel.ticker} size={22} />}
          <div className="min-w-0 flex-1">
            <p className="truncate text-[10px] tracking-[0.18em] text-gold-light">{sel?.label}</p>
            <p className="text-[8px] tracking-widest text-cyan-200/60">{sel?.ticker}</p>
          </div>
          <div className="text-right">
            <p className="text-[15px] text-white">{price > 0 ? money(price) : 'NO FEED'}</p>
            {change !== null && price > 0 && (
              <p className={`text-[9px] ${change >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
                {change >= 0 ? '+' : ''}{change.toFixed(2)}%
              </p>
            )}
          </div>
        </div>

        <label className="flex flex-col gap-1">
          <span className="text-[8px] tracking-[0.24em] text-cyan-200/70">AMOUNT (USD)</span>
          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ''))}
            inputMode="decimal"
            className="rounded-md border border-cyan-300/25 bg-transparent px-2 py-2 text-[13px] tracking-widest text-white outline-none focus:border-gold/60"
          />
        </label>
        <p className="text-[8px] tracking-widest text-cyan-200/60">
          ≈ {qty > 0 ? qty.toFixed(6) : '—'} {sel?.ticker} UNITS
        </p>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => trade('buy')}
            className="flex items-center justify-center gap-1 rounded-md border border-emerald-300/50 bg-emerald-400/10 py-2 text-[10px] tracking-[0.2em] text-emerald-200 hover:bg-emerald-400/20"
          >
            <ArrowUpRight className="h-3 w-3" /> BUY
          </button>
          <button
            onClick={() => trade('sell')}
            className="flex items-center justify-center gap-1 rounded-md border border-rose-300/50 bg-rose-400/10 py-2 text-[10px] tracking-[0.2em] text-rose-200 hover:bg-rose-400/20"
          >
            <ArrowDownRight className="h-3 w-3" /> SELL
          </button>
        </div>
        {msg && <p className="text-[8px] leading-relaxed tracking-widest text-gold-light">{msg}</p>}
      </section>

      {/* Book */}
      <section className={`${panel} flex w-[300px] max-w-full flex-col gap-2`}>
        <header className="text-[9px] tracking-[0.24em] text-gold-light">HOLO BOOK</header>
        <div className="grid grid-cols-2 gap-2 text-[8px] tracking-widest text-cyan-200/70">
          <div className="rounded-md border border-cyan-300/15 px-2 py-1.5">
            EQUITY<p className="text-[11px] text-white">${money(paper.account.equity)}</p>
          </div>
          <div className="rounded-md border border-cyan-300/15 px-2 py-1.5">
            CASH<p className="text-[11px] text-white">${money(paper.account.cash)}</p>
          </div>
        </div>
        <div className="flex max-h-[220px] flex-col gap-1 overflow-y-auto pr-1">
          {paper.positions.length === 0 && (
            <p className="py-6 text-center text-[8px] tracking-widest text-cyan-200/40">NO OPEN TRANSMISSIONS</p>
          )}
          {paper.positions.map((p) => (
            <div key={p.id} className="flex items-center justify-between rounded-md border border-cyan-300/15 px-2 py-1.5">
              <span className="text-[9px] tracking-widest text-cyan-100">{p.symbol}</span>
              <span className="text-[8px] text-cyan-200/60">{p.side.toUpperCase()} {p.qty.toFixed(4)}</span>
              <span className={`text-[9px] ${(p.pnl ?? 0) >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
                {(p.pnl ?? 0) >= 0 ? '+' : ''}{money(p.pnl ?? 0)}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}