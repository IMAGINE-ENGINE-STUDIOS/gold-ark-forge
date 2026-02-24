import { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

interface DrawdownChartProps {
  equityCurve: Array<{ day: string; value: number }>;
}

const chartTooltipStyle = { background: 'hsl(213,32%,16%)', border: '1px solid hsl(43,72%,50%,0.3)', fontSize: 10 };

export default function DrawdownChart({ equityCurve }: DrawdownChartProps) {
  const drawdownData = useMemo(() => {
    if (equityCurve.length < 2) return [];
    let peak = equityCurve[0].value;
    return equityCurve.map(pt => {
      if (pt.value > peak) peak = pt.value;
      const dd = peak > 0 ? ((pt.value - peak) / peak) * 100 : 0;
      return { day: pt.day, drawdown: parseFloat(dd.toFixed(2)) };
    });
  }, [equityCurve]);

  const maxDD = useMemo(() => {
    if (drawdownData.length === 0) return 0;
    return Math.min(...drawdownData.map(d => d.drawdown));
  }, [drawdownData]);

  if (drawdownData.length < 2) return null;

  return (
    <div className="bg-navy-light/30 rounded-lg p-3 border border-gold/5">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[9px] font-display tracking-wider text-marble/25">DRAWDOWN (UNDERWATER)</span>
        <span className="text-[9px] font-mono text-red-400">{maxDD.toFixed(2)}% max</span>
      </div>
      <div className="h-24">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={drawdownData}>
            <defs>
              <linearGradient id="ddGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(0,84%,60%)" stopOpacity={0.3} />
                <stop offset="100%" stopColor="hsl(0,84%,60%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(43,72%,50%,0.05)" />
            <XAxis dataKey="day" tick={{ fontSize: 7, fill: 'hsl(40,25%,96%,0.15)' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 7, fill: 'hsl(40,25%,96%,0.15)' }} axisLine={false} tickLine={false} width={35} domain={['dataMin', 0]} tickFormatter={v => `${v}%`} />
            <Tooltip contentStyle={chartTooltipStyle} formatter={(v: number) => [`${v.toFixed(2)}%`, 'Drawdown']} />
            <Area type="monotone" dataKey="drawdown" stroke="hsl(0,84%,60%)" strokeWidth={1} fill="url(#ddGrad)" dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
