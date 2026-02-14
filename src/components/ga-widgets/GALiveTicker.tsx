import { useMetalPrices } from '@/hooks/useMetalPrices';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useEffect, useState } from 'react';

const metals = ['gold', 'silver', 'platinum'] as const;
const metalLabels: Record<string, string> = { gold: 'GOLD', silver: 'SILVER', platinum: 'PLATINUM' };
const metalSymbols: Record<string, string> = { gold: 'XAU', silver: 'XAG', platinum: 'XPT' };

const GALiveTicker = () => {
  const { data: prices, isLoading } = useMetalPrices();
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setOffset((prev) => prev - 1);
    }, 30);
    return () => clearInterval(interval);
  }, []);

  if (isLoading || !prices) {
    return (
      <div className="h-14 bg-navy-dark border-y border-gold/20 flex items-center justify-center">
        <div className="flex gap-2 items-center text-gold/50 text-sm font-display tracking-widest">
          <div className="w-2 h-2 rounded-full bg-gold/50 animate-pulse" />
          LOADING MARKET DATA...
        </div>
      </div>
    );
  }

  const items = metals.map((m) => {
    const p = prices[m];
    const change = p?.change_24h ?? 0;
    return { metal: m, label: metalLabels[m], symbol: metalSymbols[m], price: p?.price_usd ?? 0, change };
  });

  // Triple the items for seamless loop
  const tripled = [...items, ...items, ...items];

  return (
    <div className="h-14 bg-navy-dark border-y border-gold/20 overflow-hidden relative">
      {/* Gradient edges */}
      <div className="absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-navy-dark to-transparent z-10" />
      <div className="absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-navy-dark to-transparent z-10" />

      <div
        className="flex items-center h-full gap-12 whitespace-nowrap"
        style={{ transform: `translateX(${offset % (items.length * 320)}px)` }}
      >
        {tripled.map((item, i) => (
          <div key={i} className="flex items-center gap-4 px-4">
            {/* Metal icon dot */}
            <div className={`w-3 h-3 rounded-full ${
              item.metal === 'gold' ? 'bg-gold' : item.metal === 'silver' ? 'bg-silver' : 'bg-platinum'
            }`} />
            
            <div className="flex items-center gap-2">
              <span className="font-display text-xs tracking-[0.2em] text-marble/60">{item.symbol}</span>
              <span className="font-display text-sm text-gold-light font-semibold">
                ${item.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </div>

            <div className={`flex items-center gap-1 text-xs font-medium ${
              item.change > 0 ? 'text-emerald-400' : item.change < 0 ? 'text-red-400' : 'text-marble/50'
            }`}>
              {item.change > 0 ? <TrendingUp className="w-3 h-3" /> : item.change < 0 ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
              {item.change > 0 ? '+' : ''}{item.change.toFixed(2)}%
            </div>

            {/* Separator */}
            <div className="w-px h-6 bg-gold/20 ml-4" />
          </div>
        ))}
      </div>
    </div>
  );
};

export default GALiveTicker;
