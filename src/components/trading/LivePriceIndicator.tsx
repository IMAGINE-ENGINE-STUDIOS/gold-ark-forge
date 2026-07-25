import { useEffect, useState } from 'react';
import { resolveSymbolPrice } from '@/lib/priceResolution';

/**
 * LivePriceIndicator — reusable live price readout.
 * Polls the live price for `ticker` every `intervalMs` and renders a
 * gold-themed pill with a pulsing status dot.
 *
 * Priority for price source:
 *   1. `getPriceByTicker` prop (widget-scoped resolver)
 *   2. global `resolveSymbolPrice` fallback
 *
 * Drop into any widget:
 *   <LivePriceIndicator ticker={sym} />
 *   <LivePriceIndicator ticker={sym} compact />
 *   <LivePriceIndicator ticker={sym} onPrice={(p) => ...} />
 */
export interface LivePriceIndicatorProps {
  ticker: string | null | undefined;
  getPriceByTicker?: (t: string) => number;
  intervalMs?: number;
  compact?: boolean;
  showLabel?: boolean;
  className?: string;
  onPrice?: (price: number) => void;
  emptyText?: string;
}

function resolve(ticker: string, getPriceByTicker?: (t: string) => number): number {
  if (getPriceByTicker) {
    const p = getPriceByTicker(ticker);
    if (p && p > 0) return p;
  }
  try {
    const p = resolveSymbolPrice(ticker);
    return typeof p === 'number' && p > 0 ? p : 0;
  } catch {
    return 0;
  }
}

export function LivePriceIndicator({
  ticker,
  getPriceByTicker,
  intervalMs = 1000,
  compact = false,
  showLabel = true,
  className = '',
  onPrice,
  emptyText = 'NO SYMBOL CONTEXT',
}: LivePriceIndicatorProps) {
  const [price, setPrice] = useState<number>(() => (ticker ? resolve(ticker, getPriceByTicker) : 0));

  useEffect(() => {
    if (!ticker) return;
    const tick = () => {
      const p = resolve(ticker, getPriceByTicker);
      setPrice(p);
      if (p > 0 && onPrice) onPrice(p);
    };
    tick();
    const id = setInterval(tick, intervalMs);
    return () => clearInterval(id);
  }, [ticker, getPriceByTicker, intervalMs, onPrice]);

  if (!ticker) {
    return (
      <div className={`flex items-center justify-between rounded border border-amber-500/30 bg-amber-500/5 px-2 py-1.5 ${className}`}>
        <span className="text-[9px] font-mono tracking-wider text-amber-400/80">{emptyText}</span>
        {!compact && (
          <span className="text-[9px] font-mono text-amber-400/60">Add a SYMBOL earlier in chain</span>
        )}
      </div>
    );
  }

  const live = price > 0;
  const formatted = live
    ? `$${price.toLocaleString('en-US', { maximumFractionDigits: price < 10 ? 4 : 2 })}`
    : '—';

  if (compact) {
    return (
      <span className={`inline-flex items-center gap-1 font-mono text-[10px] text-gold-light ${className}`}>
        <span className={`h-1.5 w-1.5 rounded-full ${live ? 'bg-emerald-400 animate-pulse' : 'bg-gold/40'}`} />
        {formatted}
      </span>
    );
  }

  return (
    <div className={`flex items-center justify-between rounded border border-gold/30 bg-gold/5 px-2 py-1.5 ${className}`}>
      <div className="flex items-center gap-1.5">
        <span className={`h-1.5 w-1.5 rounded-full ${live ? 'bg-emerald-400 animate-pulse' : 'bg-gold/40'}`} />
        {showLabel && (
          <span className="text-[9px] font-mono tracking-wider text-gold/70">LIVE · {ticker}</span>
        )}
      </div>
      <span className="text-[11px] font-mono font-semibold text-gold-light">{formatted}</span>
    </div>
  );
}

export default LivePriceIndicator;