import { useEffect, useRef, useState } from 'react';
import { Area, AreaChart, ResponsiveContainer } from 'recharts';
import { Minus, TrendingDown, TrendingUp } from 'lucide-react';
import { useSimulatedStream } from '@/hooks/useWebSocketPrices';
import LivePulse from '@/components/ga-widgets/LivePulse';

interface MarketplaceSpotWidgetProps {
  symbolKey: string;
  label: string;
  basePrice: number;
  baseChange: number;
  accentColor?: string;
  compact?: boolean;
  wsPrice?: number;
  wsChange?: number;
  isWsLive?: boolean;
}

const MAX_SPARK_POINTS = 24;

const formatPrice = (value: number) => {
  if (!Number.isFinite(value) || value <= 0) return '—';
  if (value < 0.01) return `$${value.toFixed(6)}`;
  if (value < 1) return `$${value.toFixed(4)}`;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: value >= 1000 ? 2 : value < 10 ? 4 : 2,
    maximumFractionDigits: value >= 1000 ? 2 : value < 10 ? 4 : 2,
  }).format(value);
};

const MarketplaceSpotWidget = ({
  symbolKey,
  label,
  basePrice,
  baseChange,
  accentColor = 'hsl(var(--primary))',
  compact = false,
  wsPrice,
  wsChange,
  isWsLive = false,
}: MarketplaceSpotWidgetProps) => {
  const { price: streamedPrice } = useSimulatedStream(basePrice, baseChange, symbolKey);
  const livePrice = isWsLive && wsPrice && wsPrice > 0 ? wsPrice : streamedPrice;
  const liveChange = isWsLive && typeof wsChange === 'number' ? wsChange : baseChange;
  const [sparkData, setSparkData] = useState<{ v: number }[]>([]);
  const prevBaseRef = useRef(0);

  useEffect(() => {
    if (basePrice <= 0 || basePrice === prevBaseRef.current) return;
    prevBaseRef.current = basePrice;

    const start = basePrice / (1 + baseChange / 100);
    const seed = Array.from({ length: compact ? 14 : 18 }, (_, index) => {
      const progress = index / (compact ? 13 : 17);
      const noise = (Math.sin(index * 1.35) * 0.002 + Math.cos(index * 0.75) * 0.0015) * basePrice;
      return { v: start + (basePrice - start) * progress + noise };
    });

    setSparkData(seed);
  }, [basePrice, baseChange, compact]);

  useEffect(() => {
    if (livePrice <= 0) return;
    setSparkData(prev => [...prev.slice(-MAX_SPARK_POINTS + 1), { v: livePrice }]);
  }, [livePrice]);

  const isPositive = liveChange > 0;
  const isNegative = liveChange < 0;
  const priceClass = compact ? 'text-base md:text-lg' : 'text-2xl md:text-3xl';
  const badgeClass = isPositive
    ? 'text-emerald-400 bg-emerald-400/10'
    : isNegative
      ? 'text-red-400 bg-red-400/10'
      : 'text-marble/60 bg-marble/10';

  return (
    <div className="rounded-sm border border-gold/10 bg-background/5 p-3 shadow-card">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: accentColor }} />
            <span className="truncate font-display text-[10px] tracking-[0.22em] text-marble/55">{label}</span>
          </div>
          <div className={`mt-1 font-display font-semibold tracking-[0.03em] text-marble ${priceClass}`}>
            {formatPrice(livePrice)}
          </div>
        </div>

        <div className="flex flex-col items-end gap-1">
          <LivePulse connected={isWsLive || livePrice > 0} label={isWsLive ? 'WS' : 'LIVE'} />
          <div className={`inline-flex items-center gap-1 rounded-sm px-2 py-0.5 text-[10px] font-medium ${badgeClass}`}>
            {isPositive ? (
              <TrendingUp className="h-3 w-3" />
            ) : isNegative ? (
              <TrendingDown className="h-3 w-3" />
            ) : (
              <Minus className="h-3 w-3" />
            )}
            {liveChange >= 0 ? '+' : ''}
            {liveChange.toFixed(2)}%
          </div>
        </div>
      </div>

      {sparkData.length > 2 && (
        <div className={compact ? 'mt-2 h-10 -mx-1' : 'mt-3 h-14 -mx-1'}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={sparkData}>
              <defs>
                <linearGradient id={`marketplace-spot-${symbolKey}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={accentColor} stopOpacity={0.32} />
                  <stop offset="100%" stopColor={accentColor} stopOpacity={0.04} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="v"
                stroke={accentColor}
                strokeWidth={1.7}
                fill={`url(#marketplace-spot-${symbolKey})`}
                dot={false}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default MarketplaceSpotWidget;
