import { useMemo } from 'react';
import SymbolLogo from '@/components/trading/SymbolLogo';
import { ALL_SYMBOLS } from '@/data/tradingSymbols';

/** Resolves a plain ticker to the catalog entry so the branded logo can render. */
export default function TickerLogo({ ticker, size = 18, className = '' }: { ticker: string; size?: number; className?: string }) {
  const sym = useMemo(() => ALL_SYMBOLS.find((s) => s.ticker === ticker || s.key === ticker), [ticker]);
  return (
    <SymbolLogo
      symbolKey={sym?.key ?? ticker}
      category={sym?.cat}
      ticker={sym?.ticker ?? ticker}
      size={size}
      className={className}
    />
  );
}
