import { useState, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { BarChart3, TrendingUp, TrendingDown } from 'lucide-react';
import LivePulse from '@/components/ga-widgets/LivePulse';
import { useMetalPrices } from '@/hooks/useMetalPrices';
import { useCryptoData } from '@/hooks/useCryptoData';
import { useOilGasPrices } from '@/hooks/useOilGasData';

interface Props {
  symbolKey: string;
  category: string;
  label: string;
}

const timeframes = ['1H', '4H', '1D', '1W', '1M'] as const;
type Timeframe = (typeof timeframes)[number];

interface TFConfig {
  points: number;
  intervalMs: number;
  noiseScale: number;
  labelFn: (d: Date) => string;
}

const tfConfigs: Record<Timeframe, TFConfig> = {
  '1H': { points: 12, intervalMs: 5 * 60_000, noiseScale: 0.001, labelFn: (d) => d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) },
  '4H': { points: 48, intervalMs: 5 * 60_000, noiseScale: 0.002, labelFn: (d) => d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) },
  '1D': { points: 96, intervalMs: 15 * 60_000, noiseScale: 0.003, labelFn: (d) => d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) },
  '1W': { points: 84, intervalMs: 2 * 3_600_000, noiseScale: 0.008, labelFn: (d) => d.toLocaleDateString('en-US', { weekday: 'short', hour: '2-digit' }) },
  '1M': { points: 120, intervalMs: 6 * 3_600_000, noiseScale: 0.015, labelFn: (d) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) },
};

const CATEGORY_COLORS: Record<string, string> = {
  metals: 'hsl(43, 72%, 50%)',
  crypto: 'hsl(38, 92%, 50%)',
  energy: 'hsl(25, 95%, 53%)',
  stocks: 'hsl(217, 91%, 60%)',
  bonds: 'hsl(210, 6%, 67%)',
};

const generateChartData = (price: number, change: number, tf: Timeframe) => {
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

// Simple RSI / SMA indicators
const computeRSI = (prices: number[], period = 14): number => {
  if (prices.length < period + 1) return 50;
  const changes = prices.slice(-period - 1).map((p, i, a) => (i > 0 ? p - a[i - 1] : 0)).slice(1);
  const gains = changes.filter((c) => c > 0);
  const losses = changes.filter((c) => c < 0).map((c) => -c);
  const avgGain = gains.length ? gains.reduce((a, b) => a + b, 0) / period : 0;
  const avgLoss = losses.length ? losses.reduce((a, b) => a + b, 0) / period : 0;
  if (avgLoss === 0) return 100;
  return 100 - 100 / (1 + avgGain / avgLoss);
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

const METAL_MAP: Record<string, 'gold' | 'silver' | 'platinum'> = {
  gold: 'gold', silver: 'silver', platinum: 'platinum', copper: 'gold',
};

const OIL_SYMBOL_MAP: Record<string, string> = {
  oil: 'WTI', brent: 'BRENT', natgas: 'NG', rbob: 'RBOB',
};

const ProprietaryChart = ({ symbolKey, category, label }: Props) => {
  const [tf, setTf] = useState<Timeframe>('1D');

  const { data: metalPrices } = useMetalPrices();
  const { data: cryptoData } = useCryptoData(10);
  const { data: oilPrices } = useOilGasPrices();

  const { price, change } = useMemo(() => {
    if (category === 'metals') {
      const key = METAL_MAP[symbolKey];
      const feed = key ? metalPrices?.[key] : undefined;
      return { price: feed?.price_usd ?? 0, change: feed?.change_24h ?? 0 };
    }
    if (category === 'crypto') {
      const cryptoMap: Record<string, string> = { bitcoin: 'bitcoin', ethereum: 'ethereum', solana: 'solana' };
      const id = cryptoMap[symbolKey];
      const coin = cryptoData?.find((c) => c.id === id);
      return { price: coin?.current_price ?? 0, change: coin?.price_change_percentage_24h ?? 0 };
    }
    if (category === 'energy') {
      const sym = OIL_SYMBOL_MAP[symbolKey];
      const feed = oilPrices?.find((p) => p.symbol === sym);
      return { price: feed?.price ?? 0, change: feed?.change ?? 0 };
    }
    // stocks / bonds – use synthetic placeholder based on well-known ETFs
    const stockPrices: Record<string, { p: number; c: number }> = {
      sp500: { p: 5940, c: 0.35 }, nasdaq: { p: 520, c: 0.48 }, aapl: { p: 235, c: 0.22 },
      msft: { p: 445, c: 0.31 }, xom: { p: 115, c: -0.18 }, cvx: { p: 162, c: -0.12 },
      tlt: { p: 92, c: 0.08 }, ief: { p: 96, c: 0.05 }, shy: { p: 82, c: 0.02 },
      lqd: { p: 110, c: 0.06 }, hyg: { p: 78, c: -0.04 },
    };
    const sp = stockPrices[symbolKey] ?? { p: 100, c: 0 };
    return { price: sp.p, change: sp.c };
  }, [symbolKey, category, metalPrices, cryptoData, oilPrices]);

  const chartData = useMemo(() => generateChartData(price, change, tf), [price, change, tf]);
  const color = CATEGORY_COLORS[category] ?? 'hsl(43, 72%, 50%)';
  const gradientId = `prop-grad-${symbolKey}`;

  // Derived indicators
  const chartValues = chartData.map((d) => d.value);
  const rsi = computeRSI(chartValues);
  const sma20 = chartValues.length >= 20 ? chartValues.slice(-20).reduce((a, b) => a + b, 0) / 20 : price;
  const sma50 = chartValues.length >= 50 ? chartValues.slice(-50).reduce((a, b) => a + b, 0) / 50 : price;

  return (
    <div className="h-full flex flex-col bg-navy">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-gold/10 flex-shrink-0">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-gold" />
          <span className="font-display text-sm tracking-wider text-gold-light">{label}</span>
          <LivePulse label="LIVE" />
          <span className="font-display text-lg text-marble ml-2">
            ${price < 10 ? price.toFixed(3) : price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </span>
          <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${change >= 0 ? 'text-emerald-400 bg-emerald-400/10' : 'text-red-400 bg-red-400/10'}`}>
            {change >= 0 ? <TrendingUp className="w-3 h-3 inline mr-0.5" /> : <TrendingDown className="w-3 h-3 inline mr-0.5" />}
            {change >= 0 ? '+' : ''}{change.toFixed(2)}%
          </span>
        </div>
        <div className="flex items-center gap-3">
          {/* Indicators */}
          <div className="hidden lg:flex items-center gap-3 mr-2">
            <span className="text-[9px] font-mono text-marble/30">RSI <span className={rsi > 70 ? 'text-red-400' : rsi < 30 ? 'text-emerald-400' : 'text-marble/50'}>{rsi.toFixed(1)}</span></span>
            <span className="text-[9px] font-mono text-marble/30">SMA20 <span className={price > sma20 ? 'text-emerald-400' : 'text-red-400'}>${sma20.toFixed(2)}</span></span>
            <span className="text-[9px] font-mono text-marble/30">SMA50 <span className={price > sma50 ? 'text-emerald-400' : 'text-red-400'}>${sma50.toFixed(2)}</span></span>
          </div>
          {/* Timeframe selector */}
          <div className="flex gap-0.5">
            {timeframes.map((t) => (
              <button
                key={t}
                onClick={() => setTf(t)}
                className={`px-2 py-0.5 text-[9px] font-mono tracking-wider rounded transition-all ${
                  tf === t ? 'bg-gold/15 text-gold border border-gold/30' : 'text-marble/30 hover:text-marble/60 border border-transparent'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="flex-1 px-1 py-1">
        {price === 0 ? (
          <div className="h-full flex items-center justify-center text-marble/20 text-xs font-display tracking-wider">
            LOADING MARKET DATA...
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 5, right: 5, left: 10, bottom: 5 }}>
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity={0.25} />
                  <stop offset="100%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(213, 28%, 24%)" />
              <XAxis
                dataKey="time"
                tick={{ fontSize: 9, fill: 'hsl(40,25%,96%,0.2)' }}
                axisLine={{ stroke: 'hsl(213, 28%, 24%)' }}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                domain={['auto', 'auto']}
                tick={{ fontSize: 9, fill: 'hsl(40,25%,96%,0.2)' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `$${v.toLocaleString()}`}
                width={65}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="value" stroke={color} strokeWidth={2} fill={`url(#${gradientId})`} dot={false} activeDot={{ r: 4, fill: color, stroke: 'hsl(213, 32%, 16%)', strokeWidth: 2 }} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Bottom info bar */}
      <div className="flex items-center justify-between px-3 py-1 border-t border-gold/10 flex-shrink-0">
        <span className="text-[9px] font-display tracking-wider text-marble/20 uppercase">{category} · {tf}</span>
        <span className="text-[9px] font-mono text-marble/15">GOLD ARROW PROPRIETARY</span>
      </div>
    </div>
  );
};

export default ProprietaryChart;
