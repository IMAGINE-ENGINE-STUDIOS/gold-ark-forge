import SymbolLogo from '@/components/trading/SymbolLogo';
import type { PaperOrder } from '@/hooks/usePaperTrading';

export default function OrdersPanel({ orders }: { orders: PaperOrder[] }) {
  if (!orders.length) {
    return <p className="px-1 text-[13px] text-muted-foreground">No orders yet. Fills from lanes and manual trades are logged here.</p>;
  }
  const list = [...orders].sort((a, b) => b.filledAt - a.filledAt).slice(0, 80);
  return (
    <ul className="h-full space-y-1.5 overflow-y-auto pr-1">
      {list.map((o) => (
        <li key={o.id} className="rounded-lg border border-border/50 bg-background/40 p-2">
          <div className="flex items-center gap-2">
            <SymbolLogo symbol={o.symbol} size={16} />
            <span className="truncate text-[13px] text-foreground">{o.symbol}</span>
            <span className={`rounded px-1.5 py-0.5 text-[11px] ${o.side === 'buy' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-rose-500/15 text-rose-400'}`}>
              {o.side.toUpperCase()}
            </span>
            <span className="ml-auto text-[12px] text-muted-foreground">{o.botSource ? 'Pipeline' : 'Manual'}</span>
          </div>
          <div className="mt-1 flex items-center justify-between text-[12px] text-muted-foreground">
            <span className="tabular-nums">{o.qty.toFixed(4)} @ {o.price.toFixed(4)}</span>
            <span className="tabular-nums">fee ${o.fees.toFixed(2)}</span>
            {o.closedPnl !== undefined && (
              <span className={`tabular-nums ${o.closedPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {o.closedPnl >= 0 ? '+' : ''}${o.closedPnl.toFixed(2)}
              </span>
            )}
            <span>{new Date(o.filledAt).toLocaleTimeString()}</span>
          </div>
        </li>
      ))}
    </ul>
  );
}
