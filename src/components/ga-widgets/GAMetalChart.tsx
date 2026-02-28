import { useMetalPrices } from '@/hooks/useMetalPrices';
import { useSimulatedStream } from '@/hooks/useWebSocketPrices';
import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { BarChart3, MoreHorizontal } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import LivePulse from './LivePulse';

type MetalKey = 'gold' | 'silver' | 'platinum';

const metalConfig: Record<MetalKey, { label: string; symbol: string; color: string; gradient: string }> = {
  gold: { label: 'GOLD', symbol: 'XAU/USD', color: 'hsl(43, 72%, 50%)', gradient: 'goldGrad' },
  silver: { label: 'SILVER', symbol: 'XAG/USD', color: 'hsl(210, 6%, 67%)', gradient: 'silverGrad' },
  platinum: { label: 'PLATINUM', symbol: 'XPT/USD', color: 'hsl(210, 4%, 76%)', gradient: 'platGrad' },
};

const timeframes = ['RT', '1H', '4H', '1D', '1W', '1M'] as const;
type Timeframe = typeof timeframes[number];

interface TFConfig {
  points: number;
  intervalMs: number;
  noiseScale: number;
  labelFn: (d: Date) => string;
}

const tfConfigs: Record<Exclude<Timeframe, 'RT'>, TFConfig> = {
  '1H': { points: 12, intervalMs: 5 * 60 * 1000, noiseScale: 0.001, labelFn: (d) => d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) },
  '4H': { points: 48, intervalMs: 5 * 60 * 1000, noiseScale: 0.002, labelFn: (d) => d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) },
  '1D': { points: 96, intervalMs: 15 * 60 * 1000, noiseScale: 0.003, labelFn: (d) => d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) },
  '1W': { points: 84, intervalMs: 2 * 60 * 60 * 1000, noiseScale: 0.008, labelFn: (d) => d.toLocaleDateString('en-US', { weekday: 'short', hour: '2-digit' }) },
  '1M': { points: 120, intervalMs: 6 * 60 * 60 * 1000, noiseScale: 0.015, labelFn: (d) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) },
};

const generateChartData = (price: number, change: number, tf: Exclude<Timeframe, 'RT'>) => {
  const cfg = tfConfigs[tf];
  const data = [];
  const startPrice = price / (1 + change / 100);
  const now = Date.now();

  for (let i = 0; i < cfg.points; i++) {
    const progress = i / (cfg.points - 1);
    const trend = startPrice + (price - startPrice) * progress;
    const noise = Math.sin(i * 2.3 + progress * 5) * price * cfg.noiseScale + Math.cos(i * 1.1) * price * cfg.noiseScale * 0.7;
    const volatility = Math.sin(i * 0.5 + progress * 3) * price * cfg.noiseScale * 0.5;
    const value = trend + noise + volatility;
    const time = new Date(now - (cfg.points - i) * cfg.intervalMs);

    data.push({
      time: cfg.labelFn(time),
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

// ─── RT Candle Engine ─────────────────────────────────────
const MAX_RT_CANDLES = 60;
const RT_INTERVAL = 5000; // 5-second candles

interface RTCandle {
  time: string;
  value: number;
  high: number;
  low: number;
}

const useRealtimeCandles = (basePrice: number, metal: MetalKey, active: boolean) => {
  const [candles, setCandles] = useState<RTCandle[]>([]);
  const candleRef = useRef<RTCandle | null>(null);
  const { price: livePrice } = useSimulatedStream(basePrice, 0, metal);

  // Reset candles when metal changes
  useEffect(() => {
    setCandles([]);
    candleRef.current = null;
  }, [metal]);

  useEffect(() => {
    if (!active || basePrice === 0) return;

    const tick = () => {
      const now = new Date();
      const timeLabel = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const price = livePrice || basePrice;

      setCandles(prev => {
        const updated = [...prev];
        const last = updated[updated.length - 1];

        if (last && candleRef.current) {
          // Update last candle in-place
          const c = { ...last };
          c.value = price;
          c.high = Math.max(c.high, price);
          c.low = Math.min(c.low, price);
          updated[updated.length - 1] = c;
          return updated;
        }
        return prev;
      });
    };

    // Create new candle every RT_INTERVAL
    const candleTimer = setInterval(() => {
      const now = new Date();
      const timeLabel = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const price = livePrice || basePrice;
      const newCandle: RTCandle = { time: timeLabel, value: price, high: price, low: price };
      candleRef.current = newCandle;
      setCandles(prev => [...prev.slice(-MAX_RT_CANDLES + 1), newCandle]);
    }, RT_INTERVAL);

    // Tick every 800ms to update current candle
    const tickTimer = setInterval(tick, 800);

    // Seed initial candle immediately
    if (candles.length === 0) {
      const now = new Date();
      const seed: RTCandle = {
        time: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        value: basePrice, high: basePrice, low: basePrice,
      };
      candleRef.current = seed;
      setCandles([seed]);
    }

    return () => {
      clearInterval(candleTimer);
      clearInterval(tickTimer);
    };
  }, [active, basePrice, metal, livePrice]);

  return candles;
};

const GAMetalChart = () => {
  const { data: prices, isLoading } = useMetalPrices();
  const [activeMetal, setActiveMetal] = useState<MetalKey>('gold');
  const [activeTimeframe, setActiveTimeframe] = useState<Timeframe>('RT');
  const [tfMenuOpen, setTfMenuOpen] = useState(false);
  const tfMenuRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  const feed = prices?.[activeMetal];
  const basePrice = feed?.price_usd ?? 0;
  const change = feed?.change_24h ?? 0;
  const config = metalConfig[activeMetal];

  const isRT = activeTimeframe === 'RT';
  const { price: livePrice } = useSimulatedStream(basePrice, change, activeMetal);
  const displayPrice = isRT ? livePrice : basePrice;

  const rtCandles = useRealtimeCandles(basePrice, activeMetal, isRT);

  const chartData = useMemo(
    () => isRT ? rtCandles : generateChartData(basePrice, change, activeTimeframe as Exclude<Timeframe, 'RT'>),
    [isRT, rtCandles, basePrice, change, activeTimeframe]
  );

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
            <h3 className="font-display text-lg tracking-[0.1em] text-gold-light">PRICE CHART</h3>
            <LivePulse label={isRT ? 'STREAMING' : 'LIVE'} />
          </div>
          <div className="flex items-center gap-4">
            <span className="font-display text-2xl text-marble font-semibold">
              {isLoading ? '...' : `$${displayPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
            </span>
            <span className={`text-sm font-medium px-2 py-0.5 rounded ${
              change > 0 ? 'text-emerald-400 bg-emerald-400/10' : 'text-red-400 bg-red-400/10'
            }`}>
              {change > 0 ? '+' : ''}{change.toFixed(2)}%
            </span>
          </div>
        </div>

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
          {isMobile ? (
            <div className="relative" ref={tfMenuRef}>
              <button
                onClick={() => setTfMenuOpen(!tfMenuOpen)}
                className={`px-3 py-1 text-[10px] font-mono tracking-wider rounded transition-all flex items-center gap-1 ${
                  activeTimeframe === 'RT'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                    : 'bg-navy-light text-marble border border-marble/20'
                }`}
              >
                {activeTimeframe}
                <MoreHorizontal className="w-3 h-3" />
              </button>
              {tfMenuOpen && (
                <div className="absolute right-0 top-full mt-1 z-[60] bg-navy-dark border border-gold/30 rounded-lg shadow-xl overflow-hidden min-w-[90px]">
                  {timeframes.map((tf) => (
                    <button
                      key={tf}
                      onClick={() => { setActiveTimeframe(tf); setTfMenuOpen(false); }}
                      className={`w-full px-3 py-2 text-left text-[10px] font-mono tracking-wider transition-colors ${
                        activeTimeframe === tf
                          ? tf === 'RT' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-gold/10 text-gold'
                          : 'text-marble/50 hover:bg-gold/5 hover:text-marble'
                      }`}
                    >
                      {tf} {tf === 'RT' && '●'}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="flex gap-1">
              {timeframes.map((tf) => (
                <button
                  key={tf}
                  onClick={() => setActiveTimeframe(tf)}
                  className={`px-3 py-1 text-[10px] font-mono tracking-wider rounded transition-all ${
                    activeTimeframe === tf
                      ? tf === 'RT'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                        : 'bg-navy-light text-marble border border-marble/20'
                      : 'text-marble/30 hover:text-marble/60 border border-transparent'
                  }`}
                >
                  {tf}
                </button>
              ))}
            </div>
          )}
        </div>

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
                  stroke={isRT ? 'hsl(145, 70%, 45%)' : config.color}
                  strokeWidth={isRT ? 2.5 : 2}
                  fill={`url(#${config.gradient})`}
                  dot={false}
                  activeDot={{ r: 4, fill: config.color, stroke: 'hsl(213, 32%, 16%)', strokeWidth: 2 }}
                  isAnimationActive={!isRT}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="mt-4 flex items-center justify-between text-[10px] text-marble/30">
          <span className="font-display tracking-[0.15em]">
            {config.symbol} · {activeTimeframe}
            {isRT && <span className="text-emerald-400/60 ml-2">● 5s candles · live stream</span>}
          </span>
          <span className="font-mono">
            Updated {feed?.updated_at ? new Date(feed.updated_at).toLocaleTimeString() : '--:--'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default GAMetalChart;
