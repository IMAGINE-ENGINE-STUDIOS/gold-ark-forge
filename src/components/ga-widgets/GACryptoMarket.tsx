import { useEffect, useState, useCallback } from 'react';
import { TrendingUp, TrendingDown, Layers } from 'lucide-react';
import WidgetShell from './WidgetShell';

interface CoinData {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  market_cap: number;
  total_volume: number;
  price_change_percentage_24h: number;
  price_change_percentage_7d_in_currency: number;
  sparkline_in_7d: { price: number[] };
  market_cap_rank: number;
}

const formatNum = (n: number) => {
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  return `$${n.toLocaleString()}`;
};

const Sparkline = ({ data, positive }: { data: number[]; positive: boolean }) => {
  if (!data || data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const w = 100;
  const h = 28;
  const points = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * h}`).join(' ');
  const gradientId = `spark-${Math.random().toString(36).slice(2, 8)}`;
  const fillPoints = `0,${h} ${points} ${w},${h}`;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-7" preserveAspectRatio="none">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={positive ? 'hsl(43,72%,50%)' : 'hsl(0,60%,50%)'} stopOpacity="0.3" />
          <stop offset="100%" stopColor={positive ? 'hsl(43,72%,50%)' : 'hsl(0,60%,50%)'} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon fill={`url(#${gradientId})`} points={fillPoints} />
      <polyline fill="none" stroke={positive ? 'hsl(43,72%,50%)' : 'hsl(0,60%,50%)'} strokeWidth="1.5" points={points} />
    </svg>
  );
};

const GACryptoMarket = () => {
  const [coins, setCoins] = useState<CoinData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCoins = useCallback(async () => {
    try {
      const res = await fetch(
        'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=15&page=1&sparkline=true&price_change_percentage=7d'
      );
      if (!res.ok) throw new Error('CoinGecko rate limited');
      const data = await res.json();
      setCoins(data);
    } catch (e) {
      console.error('CoinGecko fetch error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCoins();
    const interval = setInterval(fetchCoins, 120_000);
    return () => clearInterval(interval);
  }, [fetchCoins]);

  return (
    <WidgetShell icon={Layers} title="CRYPTO MARKET" source="coingecko.com" onRefresh={fetchCoins}>
      {loading ? (
        <div className="space-y-2">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-12 bg-navy-light/20 rounded skeleton-shimmer" style={{ animationDelay: `${i * 0.06}s` }} />
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto -mx-6 md:-mx-8">
          <table className="w-full text-xs min-w-[640px]">
            <thead>
              <tr className="border-b border-gold/10 text-marble/35 font-display tracking-[0.15em]">
                <th className="text-left px-4 py-3">#</th>
                <th className="text-left px-4 py-3">ASSET</th>
                <th className="text-right px-4 py-3">PRICE</th>
                <th className="text-right px-4 py-3">24H</th>
                <th className="text-right px-4 py-3 hidden md:table-cell">7D</th>
                <th className="text-right px-4 py-3 hidden lg:table-cell">MARKET CAP</th>
                <th className="text-right px-4 py-3 hidden lg:table-cell">VOLUME</th>
                <th className="px-4 py-3 w-24 hidden md:table-cell">7D CHART</th>
              </tr>
            </thead>
            <tbody>
              {coins.map((coin) => {
                const pos24 = coin.price_change_percentage_24h >= 0;
                const pos7d = (coin.price_change_percentage_7d_in_currency ?? 0) >= 0;
                return (
                  <tr key={coin.id} className="border-b border-gold/5 hover:bg-gold/[0.03] transition-colors duration-300">
                    <td className="px-4 py-3 text-marble/25 font-mono">{coin.market_cap_rank}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-gold-light font-display tracking-wider uppercase">{coin.symbol}</span>
                        <span className="text-marble/25 hidden sm:inline">{coin.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-marble">
                      ${coin.current_price < 1 ? coin.current_price.toFixed(4) : coin.current_price.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                    </td>
                    <td className={`px-4 py-3 text-right font-mono ${pos24 ? 'text-emerald-400' : 'text-red-400'}`}>
                      <div className="flex items-center justify-end gap-1">
                        {pos24 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {Math.abs(coin.price_change_percentage_24h).toFixed(2)}%
                      </div>
                    </td>
                    <td className={`px-4 py-3 text-right font-mono hidden md:table-cell ${pos7d ? 'text-emerald-400' : 'text-red-400'}`}>
                      {coin.price_change_percentage_7d_in_currency != null
                        ? `${Math.abs(coin.price_change_percentage_7d_in_currency).toFixed(2)}%`
                        : '—'}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-marble/50 hidden lg:table-cell">{formatNum(coin.market_cap)}</td>
                    <td className="px-4 py-3 text-right font-mono text-marble/35 hidden lg:table-cell">{formatNum(coin.total_volume)}</td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <Sparkline data={coin.sparkline_in_7d?.price} positive={pos7d} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </WidgetShell>
  );
};

export default GACryptoMarket;
