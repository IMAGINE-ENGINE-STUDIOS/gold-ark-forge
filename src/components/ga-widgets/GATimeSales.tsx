import { useState, useEffect, useRef, useMemo } from 'react';
import { Clock, ArrowUp, ArrowDown } from 'lucide-react';
import WidgetShell from './WidgetShell';

interface Trade {
  id: string;
  time: string;
  price: number;
  size: number;
  side: 'buy' | 'sell';
}

interface Props {
  symbol?: string;
  price?: number;
}

const GATimeSales = ({ symbol = 'BTC', price = 0 }: Props) => {
  const [trades, setTrades] = useState<Trade[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastPriceRef = useRef(price);
  const decimals = price < 10 ? 4 : 2;

  // Record observed live price ticks only; size is unavailable without tape feed.
  useEffect(() => {
    if (price <= 0) return;
    const prevPrice = lastPriceRef.current;
    lastPriceRef.current = price;
    if (prevPrice <= 0) return;

    const side: 'buy' | 'sell' = price >= prevPrice ? 'buy' : 'sell';
    const now = new Date();
    const trade: Trade = {
      id: `${now.getTime()}-${price}`,
      time: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }),
      price,
      size: 0,
      side,
    };

    setTrades(prev => [trade, ...prev].slice(0, 100));
  }, [price]);

  // Auto-scroll to top
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [trades.length]);

  const stats = useMemo(() => {
    const buys = trades.filter(t => t.side === 'buy');
    const sells = trades.filter(t => t.side === 'sell');
    const buyVol = buys.reduce((s, t) => s + t.size, 0);
    const sellVol = sells.reduce((s, t) => s + t.size, 0);
    const total = buyVol + sellVol;
    return {
      buyPct: total > 0 ? (buyVol / total) * 100 : 50,
      sellPct: total > 0 ? (sellVol / total) * 100 : 50,
      buyCount: buys.length,
      sellCount: sells.length,
    };
  }, [trades]);

  return (
    <WidgetShell icon={Clock} title="TIME & SALES" badge={symbol}>
      {/* Buy/Sell Pressure Bar */}
      <div className="mb-3">
        <div className="flex justify-between text-[8px] font-mono mb-1">
          <span className="text-emerald-400/70">BUYERS {stats.buyPct.toFixed(0)}%</span>
          <span className="text-red-400/70">SELLERS {stats.sellPct.toFixed(0)}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-navy-light/50 overflow-hidden flex">
          <div className="h-full bg-emerald-500/60 transition-all duration-500" style={{ width: `${stats.buyPct}%` }} />
          <div className="h-full bg-red-500/60 transition-all duration-500" style={{ width: `${stats.sellPct}%` }} />
        </div>
      </div>

      {/* Header */}
      <div className="grid grid-cols-4 gap-1 text-[7px] font-display tracking-[0.15em] text-marble/25 border-b border-gold/10 pb-1 mb-1">
        <span>TIME</span>
        <span className="text-right">PRICE</span>
        <span className="text-right">SIZE</span>
        <span className="text-right">SIDE</span>
      </div>

      {/* Tape */}
      <div ref={scrollRef} className="max-h-[240px] overflow-y-auto overflow-x-hidden space-y-px watchlist-scroll">
        {trades.length === 0 && (
          <div className="text-center py-8 text-marble/20 text-[10px] font-display">
            Waiting for price data...
          </div>
        )}
        {trades.map((trade) => (
          <div
            key={trade.id}
            className={`grid grid-cols-4 gap-1 text-[10px] font-mono py-0.5 px-1 rounded transition-colors ${
              trade.side === 'buy'
                ? 'bg-emerald-500/5 hover:bg-emerald-500/10'
                : 'bg-red-500/5 hover:bg-red-500/10'
            }`}
          >
            <span className="text-marble/30">{trade.time}</span>
            <span className={`text-right font-semibold ${trade.side === 'buy' ? 'text-emerald-400' : 'text-red-400'}`}>
              {trade.price.toFixed(decimals)}
            </span>
            <span className="text-right text-marble/30">—</span>
            <span className="text-right flex items-center justify-end gap-0.5">
              {trade.side === 'buy' ? (
                <ArrowUp className="w-2.5 h-2.5 text-emerald-400" />
              ) : (
                <ArrowDown className="w-2.5 h-2.5 text-red-400" />
              )}
              <span className={trade.side === 'buy' ? 'text-emerald-400/60' : 'text-red-400/60'}>
                {trade.side === 'buy' ? 'ASK' : 'BID'}
              </span>
            </span>
          </div>
        ))}
      </div>

      {/* Footer Stats */}
      <div className="mt-2 pt-2 border-t border-gold/10 flex justify-between text-[8px] font-mono text-marble/20">
        <span>{trades.length} prints</span>
        <span>{stats.buyCount} buys · {stats.sellCount} sells</span>
      </div>
    </WidgetShell>
  );
};

export default GATimeSales;
