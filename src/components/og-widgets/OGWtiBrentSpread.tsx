import { useState, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { ArrowLeftRight, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import WidgetShell from '@/components/ga-widgets/WidgetShell';
import AnimatedNumber from '@/components/ga-widgets/AnimatedNumber';
import { useWtiBrentSpreadHistory } from '@/hooks/useOilGasData';

const RANGES = [
  { label: '7D', days: 7 },
  { label: '14D', days: 14 },
  { label: '30D', days: 30 },
] as const;

const OGWtiBrentSpread = () => {
  const { data, refetch } = useWtiBrentSpreadHistory();
  const [range, setRange] = useState<7 | 14 | 30>(30);

  const filtered = useMemo(() => {
    if (!data) return [];
    return data.slice(-range);
  }, [data, range]);

  const stats = useMemo(() => {
    if (!filtered.length) return { current: 0, high: 0, low: 0, avg: 0, trend: 'flat' as const };
    const spreads = filtered.map((d) => d.spread);
    const current = spreads[spreads.length - 1];
    const high = Math.max(...spreads);
    const low = Math.min(...spreads);
    const avg = Math.round((spreads.reduce((a, b) => a + b, 0) / spreads.length) * 100) / 100;
    // Trend: compare last 3 vs previous 3
    const recent = spreads.slice(-3);
    const prior = spreads.slice(-6, -3);
    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const priorAvg = prior.length ? prior.reduce((a, b) => a + b, 0) / prior.length : recentAvg;
    const diff = recentAvg - priorAvg;
    const trend = diff > 0.15 ? ('widening' as const) : diff < -0.15 ? ('narrowing' as const) : ('flat' as const);
    return { current, high, low, avg, trend };
  }, [filtered]);

  const TrendIcon = stats.trend === 'widening' ? TrendingUp : stats.trend === 'narrowing' ? TrendingDown : Minus;
  const trendColor = stats.trend === 'widening' ? 'text-red-400' : stats.trend === 'narrowing' ? 'text-emerald-400' : 'text-marble/40';
  const trendLabel = stats.trend === 'widening' ? 'WIDENING' : stats.trend === 'narrowing' ? 'NARROWING' : 'STABLE';

  return (
    <WidgetShell icon={ArrowLeftRight} title="WTI-BRENT SPREAD" badge="LIVE" onRefresh={() => refetch()}>
      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div>
          <p className="text-[10px] font-display tracking-widest text-marble/30 mb-1">CURRENT</p>
          <AnimatedNumber value={stats.current} prefix="$" decimals={2} className="text-xl font-mono text-marble" />
        </div>
        <div>
          <p className="text-[10px] font-display tracking-widest text-marble/30 mb-1">{range}D HIGH</p>
          <AnimatedNumber value={stats.high} prefix="$" decimals={2} className="text-xl font-mono text-marble/70" />
        </div>
        <div>
          <p className="text-[10px] font-display tracking-widest text-marble/30 mb-1">{range}D LOW</p>
          <AnimatedNumber value={stats.low} prefix="$" decimals={2} className="text-xl font-mono text-marble/70" />
        </div>
        <div>
          <p className="text-[10px] font-display tracking-widest text-marble/30 mb-1">{range}D AVG</p>
          <AnimatedNumber value={stats.avg} prefix="$" decimals={2} className="text-xl font-mono text-marble/70" />
        </div>
        <div className="flex items-center gap-2">
          <TrendIcon className={`w-5 h-5 ${trendColor}`} />
          <div>
            <p className="text-[10px] font-display tracking-widest text-marble/30">TREND</p>
            <p className={`text-sm font-display tracking-wider ${trendColor}`}>{trendLabel}</p>
          </div>
        </div>
      </div>

      {/* Range selector */}
      <div className="flex items-center gap-2 mb-4">
        {RANGES.map((r) => (
          <button
            key={r.days}
            onClick={() => setRange(r.days as 7 | 14 | 30)}
            className={`px-3 py-1 rounded text-[10px] font-display tracking-widest transition-all border ${
              range === r.days
                ? 'bg-gold/20 border-gold/50 text-gold'
                : 'border-gold/10 text-marble/30 hover:text-marble/60 hover:border-gold/30'
            }`}
          >
            {r.label}
          </button>
        ))}
        <span className="ml-auto text-[10px] text-marble/20 font-mono">
          {filtered.length} pts · WTI − Brent
        </span>
      </div>

      {/* Chart */}
      <div className="h-64 md:h-80">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={filtered} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="spreadGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(210, 60%, 50%)" stopOpacity={0.4} />
                <stop offset="100%" stopColor="hsl(210, 60%, 50%)" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="date"
              tick={{ fill: 'hsl(39, 20%, 60%)', fontSize: 10, fontFamily: 'monospace' }}
              tickFormatter={(v: string) => v.slice(5)}
              axisLine={{ stroke: 'hsla(43, 72%, 50%, 0.1)' }}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: 'hsl(39, 20%, 60%)', fontSize: 10, fontFamily: 'monospace' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v: number) => `$${v.toFixed(1)}`}
              domain={['auto', 'auto']}
            />
            <ReferenceLine y={stats.avg} stroke="hsla(43, 72%, 50%, 0.25)" strokeDasharray="4 4" />
            <ReferenceLine y={0} stroke="hsla(0, 0%, 70%, 0.15)" />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.[0]) return null;
                const d = payload[0].payload;
                return (
                  <div className="bg-navy-dark/95 border border-gold/20 rounded px-4 py-3 shadow-xl backdrop-blur-sm">
                    <p className="text-[10px] font-display tracking-widest text-gold/60 mb-2">{d.date}</p>
                    <div className="space-y-1 text-xs font-mono">
                      <p className="text-marble/70">WTI: <span className="text-marble">${d.wti}</span></p>
                      <p className="text-marble/70">Brent: <span className="text-marble">${d.brent}</span></p>
                      <p className="text-marble/70 border-t border-gold/10 pt-1 mt-1">
                        Spread: <span className={d.spread >= 0 ? 'text-emerald-400' : 'text-red-400'}>${d.spread}</span>
                      </p>
                    </div>
                  </div>
                );
              }}
            />
            <Area
              type="monotone"
              dataKey="spread"
              stroke="hsl(210, 60%, 50%)"
              strokeWidth={2}
              fill="url(#spreadGrad)"
              dot={false}
              activeDot={{ r: 5, fill: 'hsl(210, 60%, 50%)', stroke: 'hsl(43, 72%, 50%)', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </WidgetShell>
  );
};

export default OGWtiBrentSpread;
