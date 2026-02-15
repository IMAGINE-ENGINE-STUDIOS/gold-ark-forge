import { useMetalPrices } from '@/hooks/useMetalPrices';
import { useCryptoData } from '@/hooks/useCryptoData';
import { useState, useMemo } from 'react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import { LineChart as LineIcon } from 'lucide-react';
import LivePulse from './LivePulse';

type AssetMode = 'metals' | 'crypto';

const GAMiniCharts = () => {
  const { data: prices, isLoading: loadingMetals } = useMetalPrices();
  const { data: crypto, isLoading: loadingCrypto } = useCryptoData(10);
  const [mode, setMode] = useState<AssetMode>('metals');

  const metalCharts = useMemo(() => {
    if (!prices) return [];
    return (['gold', 'silver', 'platinum'] as const).map((m) => {
      const feed = prices[m];
      if (!feed) return null;
      const price = feed.price_usd;
      const change = feed.change_24h ?? 0;
      const start = price / (1 + change / 100);
      const data = Array.from({ length: 24 }, (_, i) => {
        const progress = i / 23;
        const noise = Math.sin(i * 1.5) * price * 0.003 + Math.cos(i * 0.8) * price * 0.002;
        return { v: start + (price - start) * progress + noise };
      });
      const color = m === 'gold' ? 'hsl(43, 72%, 50%)' : m === 'silver' ? 'hsl(210, 6%, 67%)' : 'hsl(210, 4%, 76%)';
      return { id: m, symbol: m === 'gold' ? 'XAU' : m === 'silver' ? 'XAG' : 'XPT', name: m.charAt(0).toUpperCase() + m.slice(1), price, change, data, color };
    }).filter(Boolean);
  }, [prices]);

  const cryptoCharts = useMemo(() => {
    if (!crypto) return [];
    return crypto.slice(0, 6).map((c) => {
      const data = (c.sparkline_in_7d?.price ?? []).slice(-24).map((v) => ({ v }));
      const color = (c.price_change_percentage_24h ?? 0) >= 0 ? 'hsl(145, 70%, 45%)' : 'hsl(0, 70%, 55%)';
      return { id: c.id, symbol: c.symbol.toUpperCase(), name: c.name, price: c.current_price, change: c.price_change_percentage_24h ?? 0, data, color, image: c.image };
    });
  }, [crypto]);

  const charts = mode === 'metals' ? metalCharts : cryptoCharts;
  const isLoading = mode === 'metals' ? loadingMetals : loadingCrypto;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <LineIcon className="w-4 h-4 text-gold" />
          <span className="font-display text-xs tracking-[0.15em] text-marble/50">COMPACT CHARTS</span>
          <LivePulse label="LIVE" />
        </div>
        <div className="flex gap-1">
          {(['metals', 'crypto'] as AssetMode[]).map((m) => (
            <button key={m} onClick={() => setMode(m)} className={`px-3 py-1 text-[10px] font-display tracking-wider rounded transition-all ${mode === m ? 'bg-gold/20 text-gold border border-gold/40' : 'text-marble/40 hover:text-marble/70 border border-transparent'}`}>
              {m.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <div key={i} className="h-40 bg-navy-light/30 rounded-sm animate-pulse" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {charts.map((chart: any) => (
            <div key={chart.id} className="rounded-sm bg-navy-dark/60 border border-gold/15 p-4 hover:border-gold/30 transition-all">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {chart.image ? (
                    <img src={chart.image} alt={chart.name} className="w-4 h-4 rounded-full" />
                  ) : (
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: chart.color }} />
                  )}
                  <span className="font-display text-xs tracking-[0.15em] text-marble/60">{chart.symbol}</span>
                </div>
                <span className={`text-[10px] font-medium ${chart.change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {chart.change >= 0 ? '+' : ''}{chart.change.toFixed(2)}%
                </span>
              </div>
              <div className="font-display text-lg text-marble font-semibold mb-2">
                ${chart.price < 1 ? chart.price.toFixed(4) : chart.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="h-16 -mx-1">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chart.data}>
                    <defs>
                      <linearGradient id={`mini-${chart.id}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={chart.color} stopOpacity={0.3} />
                        <stop offset="100%" stopColor={chart.color} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <Area type="monotone" dataKey="v" stroke={chart.color} strokeWidth={1.5} fill={`url(#mini-${chart.id})`} dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default GAMiniCharts;
