import { useMetalPrices } from '@/hooks/useMetalPrices';
import { useCryptoData } from '@/hooks/useCryptoData';
import { useWebSocketPrices } from '@/hooks/useWebSocketPrices';
import { useState, useMemo, useEffect, useRef } from 'react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import { LineChart as LineIcon } from 'lucide-react';
import LivePulse from './LivePulse';

type AssetMode = 'metals' | 'crypto';

const CRYPTO_WS_KEYS = ['bitcoin', 'ethereum', 'solana', 'xrp', 'cardano', 'dogecoin'];
const MAX_SPARK = 30;

// Live sparkline sub-component for metals
const LiveMetalMiniChart = ({ metalType, basePrice, change }: { metalType: string; basePrice: number; change: number }) => {
  const price = basePrice;
  const [data, setData] = useState<{ v: number }[]>([]);
  const seeded = useRef(false);

  useEffect(() => {
    if (basePrice > 0 && !seeded.current) {
      const start = basePrice / (1 + change / 100);
      setData(Array.from({ length: 20 }, (_, i) => {
        const progress = i / 19;
        const noise = Math.sin(i * 1.5) * basePrice * 0.003 + Math.cos(i * 0.8) * basePrice * 0.002;
        return { v: start + (basePrice - start) * progress + noise };
      }));
      seeded.current = true;
    }
  }, [basePrice, change]);

  useEffect(() => {
    if (price > 0 && seeded.current) {
      setData(prev => [...prev.slice(-MAX_SPARK + 1), { v: price }]);
    }
  }, [price]);

  const color = metalType === 'gold' ? 'hsl(43, 72%, 50%)' : metalType === 'silver' ? 'hsl(210, 6%, 67%)' : 'hsl(210, 4%, 76%)';
  const symbol = metalType === 'gold' ? 'XAU' : metalType === 'silver' ? 'XAG' : 'XPT';

  return (
    <div className="rounded-sm bg-navy-dark/60 border border-gold/15 p-4 hover:border-gold/30 transition-all">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
          <span className="font-display text-xs tracking-[0.15em] text-marble/60">{symbol}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-medium ${change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {change >= 0 ? '+' : ''}{change.toFixed(2)}%
          </span>
          <LivePulse />
        </div>
      </div>
      <div className="font-display text-lg text-marble font-semibold mb-2">
        ${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </div>
      <div className="h-16 -mx-1">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id={`mini-${metalType}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.3} />
                <stop offset="100%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area type="monotone" dataKey="v" stroke={color} strokeWidth={1.5} fill={`url(#mini-${metalType})`} dot={false} isAnimationActive={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

const GAMiniCharts = () => {
  const { data: prices, isLoading: loadingMetals } = useMetalPrices();
  const { data: crypto, isLoading: loadingCrypto } = useCryptoData(10);
  const wsPrices = useWebSocketPrices(CRYPTO_WS_KEYS);
  const [mode, setMode] = useState<AssetMode>('metals');

  // Live crypto sparklines
  const [cryptoSparks, setCryptoSparks] = useState<Record<string, { v: number }[]>>({});
  const prevWs = useRef<Record<string, number>>({});

  // Seed crypto sparklines
  useEffect(() => {
    if (!crypto) return;
    const seeds: Record<string, { v: number }[]> = {};
    crypto.slice(0, 6).forEach(c => {
      if (!cryptoSparks[c.id]) {
        seeds[c.id] = (c.sparkline_in_7d?.price ?? []).slice(-20).map(v => ({ v }));
      }
    });
    if (Object.keys(seeds).length > 0) {
      setCryptoSparks(prev => ({ ...prev, ...seeds }));
    }
  }, [crypto]);

  // Append WS ticks
  useEffect(() => {
    const updates: Record<string, { v: number }[]> = {};
    let changed = false;
    CRYPTO_WS_KEYS.forEach(key => {
      const ws = wsPrices[key];
      if (ws && ws.price > 0 && ws.price !== prevWs.current[key]) {
        prevWs.current[key] = ws.price;
        const coinId = key === 'xrp' ? 'ripple' : key;
        const coin = crypto?.find(c => c.id === coinId || c.id === key);
        const id = coin?.id ?? key;
        updates[id] = [...(cryptoSparks[id] ?? []).slice(-MAX_SPARK + 1), { v: ws.price }];
        changed = true;
      }
    });
    if (changed) setCryptoSparks(prev => ({ ...prev, ...updates }));
  }, [wsPrices]);

  const cryptoCharts = useMemo(() => {
    if (!crypto) return [];
    return crypto.slice(0, 6).map((c) => {
      const wsKey = CRYPTO_WS_KEYS.find(k => k === c.id || (k === 'xrp' && c.id === 'ripple'));
      const ws = wsKey ? wsPrices[wsKey] : undefined;
      const livePrice = ws?.price ?? c.current_price;
      const liveChange = ws?.change24h ?? c.price_change_percentage_24h ?? 0;
      const data = cryptoSparks[c.id] ?? (c.sparkline_in_7d?.price ?? []).slice(-24).map((v) => ({ v }));
      const color = liveChange >= 0 ? 'hsl(145, 70%, 45%)' : 'hsl(0, 70%, 55%)';
      return { id: c.id, symbol: c.symbol.toUpperCase(), name: c.name, price: livePrice, change: liveChange, data, color, image: c.image, hasWs: !!ws };
    });
  }, [crypto, wsPrices, cryptoSparks]);

  const isLoading = mode === 'metals' ? loadingMetals : loadingCrypto;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <LineIcon className="w-4 h-4 text-gold" />
          <span className="font-display text-xs tracking-[0.15em] text-marble/50">COMPACT CHARTS</span>
          <LivePulse label="STREAMING" />
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
      ) : mode === 'metals' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(['gold', 'silver', 'platinum'] as const).map(m => {
            const feed = prices?.[m];
            if (!feed) return null;
            return <LiveMetalMiniChart key={m} metalType={m} basePrice={feed.price_usd} change={feed.change_24h ?? 0} />;
          })}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {cryptoCharts.map((chart) => (
            <div key={chart.id} className="rounded-sm bg-navy-dark/60 border border-gold/15 p-4 hover:border-gold/30 transition-all">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {chart.image && <img src={chart.image} alt={chart.name} className="w-4 h-4 rounded-full" />}
                  <span className="font-display text-xs tracking-[0.15em] text-marble/60">{chart.symbol}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-medium ${chart.change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {chart.change >= 0 ? '+' : ''}{chart.change.toFixed(2)}%
                  </span>
                  <LivePulse connected={chart.hasWs} />
                </div>
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
                    <Area type="monotone" dataKey="v" stroke={chart.color} strokeWidth={1.5} fill={`url(#mini-${chart.id})`} dot={false} isAnimationActive={false} />
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
