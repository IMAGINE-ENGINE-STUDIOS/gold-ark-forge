import { useMetalPrices } from '@/hooks/useMetalPrices';
import { useSimulatedStream } from '@/hooks/useWebSocketPrices';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import { useMemo, useState, useEffect, useRef } from 'react';
import LivePulse from './LivePulse';

const metalConfig = {
  gold: {
    label: 'GOLD', symbol: 'XAU/USD',
    gradient: 'from-gold-dark via-gold to-gold-shine',
    dotColor: 'bg-gold', chartColor: 'hsl(43, 72%, 50%)',
    frameClass: 'border-gold/40',
    bgClass: 'bg-gradient-to-br from-navy via-navy to-navy-light',
  },
  silver: {
    label: 'SILVER', symbol: 'XAG/USD',
    gradient: 'from-silver-dark via-silver to-silver-shine',
    dotColor: 'bg-silver', chartColor: 'hsl(210, 6%, 67%)',
    frameClass: 'border-silver/40',
    bgClass: 'bg-gradient-to-br from-navy via-navy to-navy-light',
  },
  platinum: {
    label: 'PLATINUM', symbol: 'XPT/USD',
    gradient: 'from-platinum-dark via-platinum to-platinum-shine',
    dotColor: 'bg-platinum', chartColor: 'hsl(210, 4%, 76%)',
    frameClass: 'border-platinum/40',
    bgClass: 'bg-gradient-to-br from-navy via-navy to-navy-light',
  },
};

const MAX_SPARK_POINTS = 30;

const GAPriceCard = ({ metalType }: { metalType: 'gold' | 'silver' | 'platinum' }) => {
  const { data: prices, isLoading } = useMetalPrices();
  const config = metalConfig[metalType];

  const feed = prices?.[metalType];
  const basePrice = feed?.price_usd ?? 0;
  const change = feed?.change_24h ?? 0;

  // Live-streaming price
  const { price: livePrice } = useSimulatedStream(basePrice, change, metalType);

  // Live sparkline that accumulates ticks
  const [sparkData, setSparkData] = useState<{ v: number }[]>([]);
  const prevBasePrice = useRef(0);

  // Reset sparkline when base price changes (different data load)
  useEffect(() => {
    if (basePrice > 0 && basePrice !== prevBasePrice.current) {
      prevBasePrice.current = basePrice;
      // Seed with synthetic history
      const start = basePrice / (1 + change / 100);
      const seed = Array.from({ length: 20 }, (_, i) => {
        const progress = i / 19;
        const noise = (Math.sin(i * 1.5) * 0.003 + Math.cos(i * 0.8) * 0.002) * basePrice;
        return { v: start + (basePrice - start) * progress + noise };
      });
      setSparkData(seed);
    }
  }, [basePrice, change]);

  // Append live ticks
  useEffect(() => {
    if (livePrice > 0) {
      setSparkData(prev => [...prev.slice(-MAX_SPARK_POINTS + 1), { v: livePrice }]);
    }
  }, [livePrice]);

  if (isLoading) {
    return (
      <div className={`relative rounded-sm p-6 ${config.bgClass} border ${config.frameClass} h-48 animate-pulse`}>
        <div className="h-4 w-24 bg-gold/10 rounded mb-3" />
        <div className="h-8 w-32 bg-gold/10 rounded" />
      </div>
    );
  }

  return (
    <div className={`relative rounded-sm overflow-hidden ${config.bgClass} border ${config.frameClass} group transition-all duration-300 hover:border-gold/60`}>
      <div className="ornate-corner ornate-corner-tl" />
      <div className="ornate-corner ornate-corner-tr" />
      <div className="ornate-corner ornate-corner-bl" />
      <div className="ornate-corner ornate-corner-br" />

      <div className="relative z-10 p-6">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <div className={`w-2.5 h-2.5 rounded-full ${config.dotColor}`} />
            <span className="font-display text-[10px] tracking-[0.25em] text-marble/50">{config.symbol}</span>
            <LivePulse label="LIVE" />
          </div>
          <div className={`flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded ${
            change > 0 ? 'text-emerald-400 bg-emerald-400/10' : 'text-red-400 bg-red-400/10'
          }`}>
            {change > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {change > 0 ? '+' : ''}{change.toFixed(2)}%
          </div>
        </div>

        <h3 className="font-display text-lg tracking-[0.15em] text-gold-light mb-1">{config.label}</h3>

        <div className="font-display text-xl md:text-2xl text-marble font-semibold tracking-tight truncate">
          ${livePrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>

        {/* Live Sparkline */}
        <div className="mt-3 h-16 -mx-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={sparkData}>
              <defs>
                <linearGradient id={`grad-${metalType}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={config.chartColor} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={config.chartColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="v"
                stroke={config.chartColor}
                strokeWidth={1.5}
                fill={`url(#grad-${metalType})`}
                dot={false}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <p className="text-[10px] text-marble/30 mt-2 font-mono flex items-center gap-1.5">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Streaming live
        </p>
      </div>
    </div>
  );
};

const GAPriceCards = () => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
    <GAPriceCard metalType="gold" />
    <GAPriceCard metalType="silver" />
    <GAPriceCard metalType="platinum" />
  </div>
);

export { GAPriceCard };
export default GAPriceCards;
