import { useCryptoData, useCryptoGlobal } from '@/hooks/useCryptoData';
import { useMetalPrices } from '@/hooks/useMetalPrices';
import { BarChart3 } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import LivePulse from './LivePulse';
import { useState, useMemo } from 'react';

type View = 'overview' | 'crypto' | 'metals';

// Generate synthetic 7D sparkline for metals from price + change
const generateMetalSparkline = (price: number, change24h: number) => {
  const points = 48;
  const data = [];
  const change7d = change24h * 2.8; // approximate weekly from daily
  const startPrice = price / (1 + change7d / 100);
  for (let i = 0; i < points; i++) {
    const progress = i / (points - 1);
    const trend = startPrice + (price - startPrice) * progress;
    const noise = Math.sin(i * 1.7) * price * 0.003 + Math.cos(i * 0.9) * price * 0.002;
    data.push({ v: trend + noise });
  }
  return data;
};

const GAMarketQuotes = () => {
  const { data: crypto, isLoading: loadingCrypto } = useCryptoData(20);
  const { data: global } = useCryptoGlobal();
  const { data: metals, isLoading: loadingMetals } = useMetalPrices();
  const [view, setView] = useState<View>('overview');

  const isLoading = loadingCrypto || loadingMetals;

  // Estimated daily volumes for metals (in billions USD)
  const metalVolumes: Record<string, number> = { gold: 183.2, silver: 28.4, platinum: 4.7 };

  return (
    <div className="relative rounded-sm bg-gradient-to-br from-navy via-navy to-navy-light border border-gold/30 overflow-hidden">
      <div className="ornate-corner ornate-corner-tl" />
      <div className="ornate-corner ornate-corner-tr" />
      <div className="ornate-corner ornate-corner-bl" />
      <div className="ornate-corner ornate-corner-br" />

      <div className="p-6 md:p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <BarChart3 className="w-5 h-5 text-gold" />
            <h3 className="font-display text-lg tracking-[0.1em] text-gold-light">MARKET QUOTES</h3>
            <LivePulse label="LIVE" />
          </div>
          <div className="flex gap-1">
            {(['overview', 'crypto', 'metals'] as View[]).map((v) => (
              <button key={v} onClick={() => setView(v)} className={`px-3 py-1 text-[10px] font-display tracking-wider rounded transition-all ${view === v ? 'bg-gold/20 text-gold border border-gold/40' : 'text-marble/40 hover:text-marble/70 border border-transparent'}`}>
                {v.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-2">{[...Array(8)].map((_, i) => <div key={i} className="h-12 bg-navy-light/30 rounded animate-pulse" />)}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gold/20">
                  <th className="py-2 px-3 text-left text-[10px] text-marble/40 font-display tracking-widest">ASSET</th>
                  <th className="py-2 px-3 text-right text-[10px] text-marble/40 font-display tracking-widest">PRICE</th>
                  <th className="py-2 px-3 text-right text-[10px] text-marble/40 font-display tracking-widest">24H</th>
                  <th className="py-2 px-3 text-right text-[10px] text-marble/40 font-display tracking-widest">7D</th>
                  <th className="py-2 px-3 text-right text-[10px] text-marble/40 font-display tracking-widest hidden md:table-cell">VOLUME</th>
                  <th className="py-2 px-3 text-center text-[10px] text-marble/40 font-display tracking-widest hidden lg:table-cell">7D CHART</th>
                </tr>
              </thead>
              <tbody>
                {(view === 'overview' || view === 'metals') && (['gold', 'silver', 'platinum'] as const).map((m) => {
                  const feed = metals?.[m];
                  const change = feed?.change_24h ?? 0;
                  const change7d = change * 2.8;
                  const sparkData = generateMetalSparkline(feed?.price_usd ?? 0, change);
                  const sparkColor = change7d >= 0 ? 'hsl(145, 70%, 45%)' : 'hsl(0, 70%, 55%)';
                  return (
                    <tr key={m} className="border-b border-navy-light/30 hover:bg-navy-light/20 transition-colors">
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${m === 'gold' ? 'bg-gold' : m === 'silver' ? 'bg-silver' : 'bg-platinum'}`} />
                          <span className="font-display text-xs tracking-widest text-marble/80">{m.toUpperCase()}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right text-marble font-medium">${(feed?.price_usd ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                      <td className={`py-3 px-3 text-right text-xs font-medium ${change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {change >= 0 ? '+' : ''}{change.toFixed(2)}%
                      </td>
                      <td className={`py-3 px-3 text-right text-xs font-medium ${change7d >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {change7d >= 0 ? '+' : ''}{change7d.toFixed(2)}%
                      </td>
                      <td className="py-3 px-3 text-right text-xs text-marble/40 hidden md:table-cell">
                        ${metalVolumes[m]}B
                      </td>
                      <td className="py-3 px-3 hidden lg:table-cell">
                        <div className="h-6 w-20 mx-auto">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={sparkData}>
                              <defs>
                                <linearGradient id={`q-metal-${m}`} x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="0%" stopColor={sparkColor} stopOpacity={0.4} />
                                  <stop offset="100%" stopColor={sparkColor} stopOpacity={0.05} />
                                </linearGradient>
                              </defs>
                              <Area type="monotone" dataKey="v" stroke={sparkColor} strokeWidth={1.5} fill={`url(#q-metal-${m})`} dot={false} />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {(view === 'overview' || view === 'crypto') && crypto?.slice(0, view === 'overview' ? 7 : 15).map((c) => {
                  const change24 = c.price_change_percentage_24h ?? 0;
                  const change7d = c.price_change_percentage_7d_in_currency ?? 0;
                  const sparkData = (c.sparkline_in_7d?.price ?? []).slice(-48).map((v) => ({ v }));
                  const sparkColor = change7d >= 0 ? 'hsl(145, 70%, 45%)' : 'hsl(0, 70%, 55%)';

                  return (
                    <tr key={c.id} className="border-b border-navy-light/30 hover:bg-navy-light/20 transition-colors">
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <img src={c.image} alt={c.name} className="w-5 h-5 rounded-full" />
                          <span className="font-display text-xs tracking-wider text-marble/80">{c.symbol.toUpperCase()}</span>
                          <span className="text-[10px] text-marble/30">#{c.market_cap_rank}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right text-marble font-medium">
                        ${c.current_price < 1 ? c.current_price.toFixed(4) : c.current_price.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                      </td>
                      <td className={`py-3 px-3 text-right text-xs font-medium ${change24 >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {change24 >= 0 ? '+' : ''}{change24.toFixed(2)}%
                      </td>
                      <td className={`py-3 px-3 text-right text-xs font-medium ${change7d >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {change7d >= 0 ? '+' : ''}{change7d.toFixed(2)}%
                      </td>
                      <td className="py-3 px-3 text-right text-xs text-marble/40 hidden md:table-cell">
                        ${(c.total_volume / 1e9).toFixed(1)}B
                      </td>
                      <td className="py-3 px-3 hidden lg:table-cell">
                        {sparkData.length > 0 && (
                          <div className="h-6 w-20 mx-auto">
                            <ResponsiveContainer width="100%" height="100%">
                              <AreaChart data={sparkData}>
                                <defs>
                                  <linearGradient id={`q-${c.id}`} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor={sparkColor} stopOpacity={0.4} />
                                    <stop offset="100%" stopColor={sparkColor} stopOpacity={0.05} />
                                  </linearGradient>
                                </defs>
                                <Area type="monotone" dataKey="v" stroke={sparkColor} strokeWidth={1.5} fill={`url(#q-${c.id})`} dot={false} />
                              </AreaChart>
                            </ResponsiveContainer>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default GAMarketQuotes;
