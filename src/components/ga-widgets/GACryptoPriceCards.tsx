import { useCryptoData } from '@/hooks/useCryptoData';
import { useWebSocketPrices } from '@/hooks/useWebSocketPrices';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import { useMemo, useState, useEffect, useRef } from 'react';
import LivePulse from './LivePulse';

const CRYPTO_KEYS = ['bitcoin', 'ethereum', 'solana', 'xrp'];
const MAX_SPARK = 30;

const GACryptoPriceCards = () => {
  const { data: crypto, isLoading } = useCryptoData(10);
  const wsPrices = useWebSocketPrices(CRYPTO_KEYS);
  const top4 = crypto?.slice(0, 4) ?? [];

  // Live sparkline accumulators keyed by coin id
  const [sparklines, setSparklines] = useState<Record<string, { v: number }[]>>({});
  const prevPricesRef = useRef<Record<string, number>>({});

  // Seed sparklines from CoinGecko data
  useEffect(() => {
    if (!crypto) return;
    const seeds: Record<string, { v: number }[]> = {};
    crypto.slice(0, 4).forEach(coin => {
      if (!sparklines[coin.id] || sparklines[coin.id].length === 0) {
        seeds[coin.id] = (coin.sparkline_in_7d?.price ?? []).slice(-20).map(v => ({ v }));
      }
    });
    if (Object.keys(seeds).length > 0) {
      setSparklines(prev => ({ ...prev, ...seeds }));
    }
  }, [crypto]);

  // Append WebSocket ticks to sparklines
  useEffect(() => {
    const updated: Record<string, { v: number }[]> = {};
    let hasUpdate = false;

    CRYPTO_KEYS.forEach(key => {
      const ws = wsPrices[key];
      if (ws && ws.price > 0 && ws.price !== prevPricesRef.current[key]) {
        prevPricesRef.current[key] = ws.price;
        // Map ws key to CoinGecko id
        const coinId = key === 'xrp' ? 'ripple' : key;
        const matchedCoin = top4.find(c => c.id === coinId || c.id === key);
        const id = matchedCoin?.id ?? key;
        updated[id] = [...(sparklines[id] ?? []).slice(-MAX_SPARK + 1), { v: ws.price }];
        hasUpdate = true;
      }
    });

    if (hasUpdate) {
      setSparklines(prev => ({ ...prev, ...updated }));
    }
  }, [wsPrices]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-32 bg-navy-light/30 border border-gold/10 rounded-sm animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {top4.map((coin, idx) => {
        const change = coin.price_change_percentage_24h ?? 0;
        const wsKey = CRYPTO_KEYS[idx];
        const wsData = wsPrices[wsKey];
        const livePrice = wsData?.price ?? coin.current_price;
        const liveChange = wsData?.change24h ?? change;
        const sparkData = sparklines[coin.id] ?? (coin.sparkline_in_7d?.price ?? []).slice(-24).map((v) => ({ v }));
        const color = liveChange >= 0 ? 'hsl(145, 70%, 45%)' : 'hsl(0, 70%, 55%)';

        return (
          <div key={coin.id} className="relative rounded-sm bg-gradient-to-br from-navy via-navy to-navy-light border border-gold/20 p-4 group hover:border-gold/40 transition-all overflow-hidden">
            <div className="ornate-corner ornate-corner-tl" />
            <div className="ornate-corner ornate-corner-tr" />

            <div className="flex items-center gap-2 mb-2">
              <img src={coin.image} alt={coin.name} className="w-5 h-5 rounded-full" />
              <span className="font-display text-[10px] tracking-[0.2em] text-marble/50">{coin.symbol.toUpperCase()}</span>
              <div className="ml-auto">
                <LivePulse connected={!!wsData} label={wsData ? 'LIVE' : ''} />
              </div>
            </div>

            <div className="font-display text-xl text-marble font-semibold">
              ${livePrice < 1 ? livePrice.toFixed(4) : livePrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>

            <div className={`flex items-center gap-1 text-xs font-medium mt-1 ${
              liveChange >= 0 ? 'text-emerald-400' : 'text-red-400'
            }`}>
              {liveChange >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {liveChange >= 0 ? '+' : ''}{liveChange.toFixed(2)}%
            </div>

            {sparkData.length > 0 && (
              <div className="h-12 mt-2 -mx-1">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={sparkData}>
                    <defs>
                      <linearGradient id={`cg-${coin.id}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={color} stopOpacity={0.5} />
                        <stop offset="100%" stopColor={color} stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                    <Area type="monotone" dataKey="v" stroke={color} strokeWidth={2} fill={`url(#cg-${coin.id})`} dot={false} isAnimationActive={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default GACryptoPriceCards;
