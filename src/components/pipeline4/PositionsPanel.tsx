import SymbolLogo from '@/components/trading/SymbolLogo';
import { XCircle } from 'lucide-react';
import type { PaperPosition } from '@/hooks/usePaperTrading';

export default function PositionsPanel({
  positions, getPrice, onClose, onCloseAll, onFocus,
}: {
  positions: PaperPosition[];
  getPrice: (t: string) => number;
  onClose: (id: string, price: number) => void;
  onCloseAll: () => void;
  onFocus?: (ticker: string) => void;
}) {
  if (!positions.length) {
    return (
      <p className="px-1 text-[13px] text-muted-foreground">
        No open positions. Run a lane or use the Trade tab and every fill shows up here with live P&L.
      </p>
    );
  }

  const total = positions.reduce((s, p) => s + (p.pnl || 0), 0);

  return (
    <div className="flex h-full flex-col">
      <div className="mb-2 flex items-center justify-between">
        <span className={`text-[13px] font-semibold ${total >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
          {total >= 0 ? '+' : ''}${total.toFixed(2)} open
        </span>
        <button onClick={onCloseAll} className="rounded-md border border-destructive/50 px-2 py-1 text-[12px] text-destructive hover:bg-destructive/10">
          Close all
        </button>
      </div>
      <ul className="min-h-0 flex-1 space-y-1.5 overflow-y-auto pr-1">
        {positions.map((p) => {
          const live = getPrice(p.symbol) || p.currentPrice;
          const pnl = p.side === 'buy' ? (live - p.entryPrice) * p.qty : (p.entryPrice - live) * p.qty;
          const pct = p.entryPrice > 0 ? (pnl / (p.entryPrice * p.qty)) * 100 : 0;
          return (
            <li key={p.id} className="rounded-lg border border-border/50 bg-background/40 p-2">
              <div className="flex items-center gap-2">
                <SymbolLogo symbol={p.symbol} size={18} />
                <button onClick={() => onFocus?.(p.symbol)} className="truncate text-[13px] font-medium text-foreground hover:text-primary">
                  {p.symbol}
                </button>
                <span className={`rounded px-1.5 py-0.5 text-[11px] ${p.side === 'buy' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-rose-500/15 text-rose-400'}`}>
                  {p.side.toUpperCase()}
                </span>
                <span className={`ml-auto text-[13px] font-semibold tabular-nums ${pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {pnl >= 0 ? '+' : ''}${pnl.toFixed(2)}
                </span>
              </div>
              <div className="mt-1 flex items-center justify-between text-[12px] text-muted-foreground">
                <span className="tabular-nums">{p.qty.toFixed(4)} @ {p.entryPrice.toFixed(4)}</span>
                <span className="tabular-nums">live {live > 0 ? live.toFixed(4) : '—'}</span>
                <span className={`tabular-nums ${pct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{pct >= 0 ? '+' : ''}{pct.toFixed(2)}%</span>
              </div>
              <button
                onClick={() => live > 0 && onClose(p.id, live)}
                disabled={!(live > 0)}
                className="mt-1.5 flex w-full items-center justify-center gap-1.5 rounded-md border border-border/60 py-1 text-[12px] text-foreground hover:border-destructive/60 hover:text-destructive disabled:opacity-40"
              >
                <XCircle className="h-3.5 w-3.5" /> Close at market
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
