import { useOilGasPrices } from '@/hooks/useOilGasData';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import { useMemo } from 'react';

const generateSparkline = (price: number, change: number) => {
  const points = 24;
  const startPrice = price / (1 + change / 100);
  return Array.from({ length: points }, (_, i) => {
    const progress = i / (points - 1);
    const noise = (Math.sin(i * 1.5) * 0.004 + Math.cos(i * 0.7) * 0.003) * price;
    return { v: startPrice + (price - startPrice) * progress + noise };
  });
};

const OGPriceCards = () => {
  const { data: prices, isLoading } = useOilGasPrices();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-48 rounded-sm bg-navy-dark/60 border border-gold/15 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {(prices ?? []).map((p) => (
        <PriceCard key={p.symbol} {...p} />
      ))}
    </div>
  );
};

const PriceCard = ({ symbol, name, price, change, unit, color }: { symbol: string; name: string; price: number; change: number; unit: string; color: string }) => {
  const sparkData = useMemo(() => generateSparkline(price, change), [price, change]);

  return (
    <div className="relative rounded-sm overflow-hidden bg-gradient-to-br from-navy via-navy to-navy-light border border-gold/20 group transition-all duration-300 hover:border-gold/50">
      <div className="ornate-corner ornate-corner-tl" />
      <div className="ornate-corner ornate-corner-tr" />
      <div className="ornate-corner ornate-corner-bl" />
      <div className="ornate-corner ornate-corner-br" />

      <div className="relative z-10 p-6">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
            <span className="font-display text-[10px] tracking-[0.25em] text-marble/50">{symbol}</span>
          </div>
          <div className={`flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded ${
            change > 0 ? 'text-emerald-400 bg-emerald-400/10' : 'text-red-400 bg-red-400/10'
          }`}>
            {change > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {change > 0 ? '+' : ''}{change.toFixed(2)}%
          </div>
        </div>

        <h3 className="font-display text-lg tracking-[0.15em] text-gold-light mb-1">{name}</h3>

        <div className="flex items-baseline gap-2">
          <span className="font-display text-3xl text-marble font-semibold tracking-tight">
            ${price < 10 ? price.toFixed(3) : price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <span className="text-[10px] text-marble/30 font-display tracking-wider">{unit}</span>
        </div>

        <div className="mt-3 h-16 -mx-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={sparkData}>
              <defs>
                <linearGradient id={`og-grad-${symbol}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area type="monotone" dataKey="v" stroke={color} strokeWidth={2} fill={`url(#og-grad-${symbol})`} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default OGPriceCards;
