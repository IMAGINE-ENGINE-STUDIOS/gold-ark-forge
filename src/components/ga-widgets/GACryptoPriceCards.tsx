import { useCryptoData } from '@/hooks/useCryptoData';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import LivePulse from './LivePulse';

const GACryptoPriceCards = () => {
  const { data: crypto, isLoading } = useCryptoData(10);
  const top4 = crypto?.slice(0, 4) ?? [];

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
      {top4.map((coin) => {
        const change = coin.price_change_percentage_24h ?? 0;
        const sparkData = (coin.sparkline_in_7d?.price ?? []).slice(-24).map((v) => ({ v }));
        const color = change >= 0 ? 'hsl(145, 70%, 45%)' : 'hsl(0, 70%, 55%)';

        return (
          <div key={coin.id} className="relative rounded-sm bg-gradient-to-br from-navy via-navy to-navy-light border border-gold/20 p-4 group hover:border-gold/40 transition-all overflow-hidden">
            <div className="ornate-corner ornate-corner-tl" />
            <div className="ornate-corner ornate-corner-tr" />

            <div className="flex items-center gap-2 mb-2">
              <img src={coin.image} alt={coin.name} className="w-5 h-5 rounded-full" />
              <span className="font-display text-[10px] tracking-[0.2em] text-marble/50">{coin.symbol.toUpperCase()}</span>
              <div className="ml-auto"><LivePulse /></div>
            </div>

            <div className="font-display text-xl text-marble font-semibold">
              ${coin.current_price < 1 ? coin.current_price.toFixed(4) : coin.current_price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>

            <div className={`flex items-center gap-1 text-xs font-medium mt-1 ${
              change >= 0 ? 'text-emerald-400' : 'text-red-400'
            }`}>
              {change >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {change >= 0 ? '+' : ''}{change.toFixed(2)}%
            </div>

            {sparkData.length > 0 && (
              <div className="h-10 mt-2 -mx-1">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={sparkData}>
                    <defs>
                      <linearGradient id={`cg-${coin.id}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={color} stopOpacity={0.3} />
                        <stop offset="100%" stopColor={color} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <Area type="monotone" dataKey="v" stroke={color} strokeWidth={1.5} fill={`url(#cg-${coin.id})`} dot={false} />
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
