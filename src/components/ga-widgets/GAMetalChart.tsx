import { useMetalPrices } from '@/hooks/useMetalPrices';
import { useState, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { BarChart3 } from 'lucide-react';

type MetalKey = 'gold' | 'silver' | 'platinum';

const metalConfig: Record<MetalKey, { label: string; symbol: string; color: string; gradient: string }> = {
  gold: { label: 'GOLD', symbol: 'XAU/USD', color: 'hsl(43, 72%, 50%)', gradient: 'goldGrad' },
  silver: { label: 'SILVER', symbol: 'XAG/USD', color: 'hsl(210, 6%, 67%)', gradient: 'silverGrad' },
  platinum: { label: 'PLATINUM', symbol: 'XPT/USD', color: 'hsl(210, 4%, 76%)', gradient: 'platGrad' },
};

const timeframes = ['1H', '4H', '1D', '1W', '1M'] as const;

// Generate synthetic OHLC-like data for the chart
const generateChartData = (price: number, change: number, points: number) => {
  const data = [];
  const startPrice = price / (1 + change / 100);
  const now = Date.now();
  const interval = (24 * 60 * 60 * 1000) / points;

  for (let i = 0; i < points; i++) {
    const progress = i / (points - 1);
    const trend = startPrice + (price - startPrice) * progress;
    const noise = Math.sin(i * 2.3) * price * 0.004 + Math.cos(i * 1.1) * price * 0.003;
    const volatility = Math.sin(i * 0.5) * price * 0.002;
    const value = trend + noise + volatility;
    const time = new Date(now - (points - i) * interval);

    data.push({
      time: time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      value: parseFloat(value.toFixed(2)),
      high: parseFloat((value + Math.abs(noise) * 0.5).toFixed(2)),
      low: parseFloat((value - Math.abs(noise) * 0.5).toFixed(2)),
    });
  }
  return data;
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-navy-dark border border-gold/30 rounded px-3 py-2 shadow-lg">
      <p className="text-[10px] text-marble/50 font-mono mb-1">{label}</p>
      <p className="text-sm font-display text-gold-light font-semibold">
        ${payload[0].value.toLocaleString('en-US', { minimumFractionDigits: 2 })}
      </p>
      {payload[0].payload.high && (
        <div className="flex gap-3 mt-1 text-[10px] text-marble/40">
          <span>H: ${payload[0].payload.high}</span>
          <span>L: ${payload[0].payload.low}</span>
        </div>
      )}
    </div>
  );
};

const GAMetalChart = () => {
  const { data: prices, isLoading } = useMetalPrices();
  const [activeMetal, setActiveMetal] = useState<MetalKey>('gold');
  const [activeTimeframe, setActiveTimeframe] = useState<typeof timeframes[number]>('1D');

  const feed = prices?.[activeMetal];
  const price = feed?.price_usd ?? 0;
  const change = feed?.change_24h ?? 0;
  const config = metalConfig[activeMetal];

  const pointsMap: Record<string, number> = { '1H': 12, '4H': 48, '1D': 96, '1W': 168, '1M': 120 };
  const chartData = useMemo(
    () => generateChartData(price, change, pointsMap[activeTimeframe]),
    [price, change, activeTimeframe]
  );

  return (
    <div className="relative rounded-sm bg-gradient-to-br from-navy via-navy to-navy-light border border-gold/30 overflow-hidden">
      <div className="ornate-corner ornate-corner-tl" />
      <div className="ornate-corner ornate-corner-tr" />
      <div className="ornate-corner ornate-corner-bl" />
      <div className="ornate-corner ornate-corner-br" />

      <div className="p-6 md:p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <BarChart3 className="w-5 h-5 text-gold" />
            <h3 className="font-display text-lg tracking-[0.1em] text-gold-light">PRICE CHART</h3>
          </div>
          <div className="flex items-center gap-4">
            <span className="font-display text-2xl text-marble font-semibold">
              {isLoading ? '...' : `$${price.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
            </span>
            <span className={`text-sm font-medium px-2 py-0.5 rounded ${
              change > 0 ? 'text-emerald-400 bg-emerald-400/10' : 'text-red-400 bg-red-400/10'
            }`}>
              {change > 0 ? '+' : ''}{change.toFixed(2)}%
            </span>
          </div>
        </div>

        {/* Metal & Timeframe selectors */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex gap-1">
            {(Object.keys(metalConfig) as MetalKey[]).map((m) => (
              <button
                key={m}
                onClick={() => setActiveMetal(m)}
                className={`px-4 py-1.5 text-xs font-display tracking-[0.15em] rounded transition-all ${
                  activeMetal === m
                    ? 'bg-gold/20 text-gold border border-gold/40'
                    : 'text-marble/40 hover:text-marble/70 border border-transparent'
                }`}
              >
                {metalConfig[m].label}
              </button>
            ))}
          </div>
          <div className="flex gap-1">
            {timeframes.map((tf) => (
              <button
                key={tf}
                onClick={() => setActiveTimeframe(tf)}
                className={`px-3 py-1 text-[10px] font-mono tracking-wider rounded transition-all ${
                  activeTimeframe === tf
                    ? 'bg-navy-light text-marble border border-marble/20'
                    : 'text-marble/30 hover:text-marble/60 border border-transparent'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>

        {/* Chart */}
        <div className="h-80">
          {isLoading ? (
            <div className="h-full bg-navy-light/30 rounded animate-pulse" />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 5, right: 5, left: 10, bottom: 5 }}>
                <defs>
                  <linearGradient id={config.gradient} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={config.color} stopOpacity={0.25} />
                    <stop offset="100%" stopColor={config.color} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(213, 28%, 24%)" />
                <XAxis
                  dataKey="time"
                  tick={{ fontSize: 10, fill: 'hsl(210, 6%, 67%)' }}
                  axisLine={{ stroke: 'hsl(213, 28%, 24%)' }}
                  tickLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  domain={['auto', 'auto']}
                  tick={{ fontSize: 10, fill: 'hsl(210, 6%, 67%)' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `$${v.toLocaleString()}`}
                  width={75}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke={config.color}
                  strokeWidth={2}
                  fill={`url(#${config.gradient})`}
                  dot={false}
                  activeDot={{ r: 4, fill: config.color, stroke: 'hsl(213, 32%, 16%)', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Footer info */}
        <div className="mt-4 flex items-center justify-between text-[10px] text-marble/30">
          <span className="font-display tracking-[0.15em]">{config.symbol}</span>
          <span className="font-mono">
            Updated {feed?.updated_at ? new Date(feed.updated_at).toLocaleTimeString() : '--:--'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default GAMetalChart;
