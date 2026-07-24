import { useMetalPrices } from '@/hooks/useMetalPrices';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import { useState, useEffect, useRef } from 'react';
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

  const livePrice = basePrice;

  const [sparkData, setSparkData] = useState<{ v: number }[]>([]);
  const prevBasePrice = useRef(0);

  useEffect(() => {
    if (basePrice > 0 && basePrice !== prevBasePrice.current) {
      prevBasePrice.current = basePrice;
      setSparkData(prev => [...prev.slice(-MAX_SPARK_POINTS + 1), { v: basePrice }]);
    }
  }, [basePrice]);

  useEffect(() => {
    if (livePrice > 0) {
      setSparkData(prev => [...prev.slice(-MAX_SPARK_POINTS + 1), { v: livePrice }]);
    }
  }, [livePrice]);

  if (isLoading) {
    return (
      <div className={`relative rounded-sm p-3 ${config.bgClass} border ${config.frameClass} h-20 animate-pulse`}>
        <div className="h-3 w-16 bg-gold/10 rounded mb-2" />
        <div className="h-4 w-20 bg-gold/10 rounded" />
      </div>
    );
  }

  return (
    <div className={`relative rounded-sm overflow-hidden ${config.bgClass} border ${config.frameClass} group transition-all duration-300 hover:border-gold/60`}>
      <div className="relative z-10 flex items-center gap-3 p-3">
        {/* Left: info */}
        <div className="flex-shrink-0 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <div className={`w-2 h-2 rounded-full ${config.dotColor}`} />
            <span className="font-display text-[8px] tracking-[0.2em] text-marble/50">{config.symbol}</span>
            <LivePulse label="LIVE" />
          </div>
          <span className="font-display text-[10px] tracking-[0.12em] text-gold-light">{config.label}</span>
          <div className="font-display text-sm text-marble font-semibold tracking-tight">
            ${livePrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className={`flex items-center gap-0.5 text-[9px] font-medium mt-0.5 ${
            change > 0 ? 'text-emerald-400' : 'text-red-400'
          }`}>
            {change > 0 ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
            {change > 0 ? '+' : ''}{change.toFixed(2)}%
          </div>
        </div>

        {/* Right: sparkline */}
        <div className="flex-1 h-12 min-w-0">
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
      </div>
    </div>
  );
};

const GAPriceCards = () => (
  <div className="grid grid-cols-3 gap-3">
    <GAPriceCard metalType="gold" />
    <GAPriceCard metalType="silver" />
    <GAPriceCard metalType="platinum" />
  </div>
);

export { GAPriceCard };
export default GAPriceCards;
