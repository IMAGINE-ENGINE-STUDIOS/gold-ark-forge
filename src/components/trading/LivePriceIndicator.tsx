import { useEffect, useMemo, useState } from 'react';
import { ALL_SYMBOLS } from '@/data/tradingSymbols';
import { quoteIdFor } from '@/lib/priceSource';
import { useMarketQuote } from '@/hooks/useMarketQuotes';

/**
 * LivePriceIndicator — reusable live price readout.
 * Polls the live price for `ticker` every `intervalMs` and renders a
 * gold-themed pill with a pulsing status dot.
 *
 * Priority for price source:
 *   1. `getPriceByTicker` prop (widget-scoped resolver, usually a WS feed)
 *   2. the unified `market-quotes` service (Yahoo / gold-api / Coinbase)
 *   3. "NO FEED" — never a synthetic number
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
  if (!getPriceByTicker) return 0;
  try {
    const p = getPriceByTicker(ticker);
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

  const quoteId = useMemo(() => {
    if (!ticker) return null;
    const sym = ALL_SYMBOLS.find((s) => s.ticker === ticker || s.key === ticker);
    return sym ? quoteIdFor(sym) : null;
  }, [ticker]);
  const { price: servicePrice } = useMarketQuote(quoteId, 10000);

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

  const effective = price > 0 ? price : servicePrice ?? 0;
  const live = effective > 0;
  const sourceTag = price > 0 ? 'LIVE' : servicePrice ? 'FEED' : 'NO FEED';
  const formatted = live
    ? `$${effective.toLocaleString('en-US', { maximumFractionDigits: effective < 10 ? 4 : 2 })}`
    : 'NO FEED';

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
          <span className="text-[9px] font-mono tracking-wider text-gold/70">{sourceTag} · {ticker}</span>
        )}
      </div>
      <span className="text-[11px] font-mono font-semibold text-gold-light">{formatted}</span>
    </div>
  );
}

export default LivePriceIndicator;