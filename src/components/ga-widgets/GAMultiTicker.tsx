import { useCryptoData, CryptoAsset } from '@/hooks/useCryptoData';
import { useMetalPrices } from '@/hooks/useMetalPrices';
import { useWebSocketPrices } from '@/hooks/useWebSocketPrices';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useEffect, useState, useMemo } from 'react';
import LivePulse from './LivePulse';

interface TickerItem {
  symbol: string;
  label: string;
  price: number;
  change: number;
  color: string;
}

const CRYPTO_WS_KEYS = ['bitcoin', 'ethereum', 'solana', 'xrp', 'cardano', 'dogecoin', 'bnb'];

const GAMultiTicker = () => {
  const { data: prices } = useMetalPrices();
  const { data: crypto } = useCryptoData(10);
  const wsPrices = useWebSocketPrices(CRYPTO_WS_KEYS);
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setOffset((p) => p - 0.5), 16);
    return () => clearInterval(interval);
  }, []);

  const items: TickerItem[] = useMemo(() => {
    const arr: TickerItem[] = [];
    if (prices?.gold) arr.push({ symbol: 'XAU', label: 'Gold', price: prices.gold.price_usd, change: prices.gold.change_24h ?? 0, color: 'bg-gold' });
    if (prices?.silver) arr.push({ symbol: 'XAG', label: 'Silver', price: prices.silver.price_usd, change: prices.silver.change_24h ?? 0, color: 'bg-silver' });
    if (prices?.platinum) arr.push({ symbol: 'XPT', label: 'Platinum', price: prices.platinum.price_usd, change: prices.platinum.change_24h ?? 0, color: 'bg-platinum' });
    if (crypto) {
      crypto.slice(0, 7).forEach((c) => {
        const wsKey = CRYPTO_WS_KEYS.find(k => k === c.id || (k === 'bnb' && c.id === 'binancecoin'));
        const ws = wsKey ? wsPrices[wsKey] : undefined;
        arr.push({
          symbol: c.symbol.toUpperCase(),
          label: c.name,
          price: ws?.price ?? c.current_price,
          change: ws?.change24h ?? c.price_change_percentage_24h ?? 0,
          color: 'bg-gold/50',
        });
      });
    }
    return arr;
  }, [prices, crypto, wsPrices]);

  if (items.length === 0) {
    return (
      <div className="h-14 bg-navy-dark border-y border-gold/20 flex items-center justify-center">
        <div className="flex gap-2 items-center text-gold/50 text-sm font-display tracking-widest">
          <LivePulse />
          LOADING MARKET DATA...
        </div>
      </div>
    );
  }

  const tripled = [...items, ...items, ...items];
  const itemWidth = 280;

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
            <div className={`w-2.5 h-2.5 rounded-full ${item.color} flex-shrink-0`} />
            <span className="font-display text-[10px] tracking-[0.2em] text-marble/50 w-10">{item.symbol}</span>
            <span className="font-display text-sm text-marble font-semibold">
              ${item.price < 1 ? item.price.toFixed(4) : item.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
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

export default GAMultiTicker;
