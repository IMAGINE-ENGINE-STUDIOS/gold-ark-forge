import { useOilGasPrices } from '@/hooks/useOilGasData';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useEffect, useState, useMemo } from 'react';
import LivePulse from '@/components/ga-widgets/LivePulse';

const OGMultiTicker = () => {
  const { data: prices } = useOilGasPrices();
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setOffset((p) => p - 0.5), 16);
    return () => clearInterval(interval);
  }, []);

  const items = useMemo(() => prices ?? [], [prices]);

  if (items.length === 0) {
    return (
      <div className="h-14 bg-navy-dark border-y border-gold/20 flex items-center justify-center">
        <div className="flex gap-2 items-center text-gold/50 text-sm font-display tracking-widest">
          <LivePulse />
          LOADING ENERGY DATA...
        </div>
      </div>
    );
  }

  const tripled = [...items, ...items, ...items];
  const itemWidth = 300;

  return (
    <div className="h-14 bg-navy-dark border-y border-gold/20 overflow-hidden relative">
      <div className="absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-navy-dark to-transparent z-10" />
      <div className="absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-navy-dark to-transparent z-10" />
      <div className="absolute top-1 right-4 z-20"><LivePulse label="LIVE" /></div>

      <div
        className="flex items-center h-full gap-0 whitespace-nowrap transition-none"
        style={{ transform: `translateX(${offset % (items.length * itemWidth)}px)` }}
      >
        {tripled.map((item, i) => (
          <div key={i} className="flex items-center gap-3 px-5 h-full border-r border-gold/10" style={{ minWidth: itemWidth }}>
            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
            <span className="font-display text-[10px] tracking-[0.2em] text-marble/50 w-8">{item.symbol}</span>
            <span className="font-display text-sm text-marble font-semibold">
              ${item.price < 10 ? item.price.toFixed(3) : item.price.toFixed(2)}
            </span>
            <span className="text-[9px] text-marble/30">{item.unit}</span>
            <div className={`flex items-center gap-0.5 text-[11px] font-medium ${
              item.change > 0 ? 'text-emerald-400' : item.change < 0 ? 'text-red-400' : 'text-marble/40'
            }`}>
              {item.change > 0 ? <TrendingUp className="w-3 h-3" /> : item.change < 0 ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
              {item.change > 0 ? '+' : ''}{item.change.toFixed(2)}%
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OGMultiTicker;
