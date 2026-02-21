import { useMemo } from 'react';
import { BarChart3 } from 'lucide-react';
import WidgetShell from './WidgetShell';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const GAPerformanceDashboard = () => {
  const stats = useMemo(() => {
    const seed = (n: number) => {
      let s = n;
      return () => { s = (s * 1664525 + 1013904223) & 0xffffffff; return (s >>> 0) / 0xffffffff; };
    };
    const r = seed(42);
    const monthlyReturns = MONTHS.map(() => (r() - 0.4) * 12);
    const wins = monthlyReturns.filter(v => v > 0);
    const losses = monthlyReturns.filter(v => v < 0);
    const avgWin = wins.length ? wins.reduce((a,b) => a+b, 0) / wins.length : 0;
    const avgLoss = losses.length ? Math.abs(losses.reduce((a,b) => a+b, 0) / losses.length) : 1;
    const profitFactor = avgLoss > 0 ? (avgWin * wins.length) / (avgLoss * losses.length || 1) : 0;
    const mean = monthlyReturns.reduce((a,b) => a+b, 0) / monthlyReturns.length;
    const std = Math.sqrt(monthlyReturns.reduce((a,v) => a + (v - mean) ** 2, 0) / monthlyReturns.length);
    const downDev = Math.sqrt(monthlyReturns.filter(v => v < 0).reduce((a,v) => a + v ** 2, 0) / (monthlyReturns.length || 1));
    const sharpe = std > 0 ? (mean / std) * Math.sqrt(12) : 0;
    const sortino = downDev > 0 ? (mean / downDev) * Math.sqrt(12) : 0;
    let peak = 0, maxDD = 0, cum = 0;
    monthlyReturns.forEach(v => { cum += v; if (cum > peak) peak = cum; const dd = peak - cum; if (dd > maxDD) maxDD = dd; });
    const calmar = maxDD > 0 ? (mean * 12) / maxDD : 0;
    return { sharpe, sortino, maxDD, calmar, winRate: wins.length / monthlyReturns.length * 100, profitFactor, avgWin, avgLoss, monthlyReturns };
  }, []);

  return (
    <WidgetShell icon={BarChart3} title="PERFORMANCE DASHBOARD" badge="ANALYTICS">
      <div className="space-y-4">
        {/* Key Ratios */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: 'SHARPE', value: stats.sharpe.toFixed(2), color: stats.sharpe > 1 ? 'text-emerald-400' : 'text-marble/70' },
            { label: 'SORTINO', value: stats.sortino.toFixed(2), color: stats.sortino > 1.5 ? 'text-emerald-400' : 'text-marble/70' },
            { label: 'MAX DD', value: `${stats.maxDD.toFixed(1)}%`, color: 'text-red-400' },
            { label: 'CALMAR', value: stats.calmar.toFixed(2), color: stats.calmar > 1 ? 'text-emerald-400' : 'text-marble/70' },
          ].map(s => (
            <div key={s.label} className="bg-navy-light/30 rounded p-2 text-center border border-gold/5">
              <div className="text-[7px] text-marble/30 font-display tracking-wider">{s.label}</div>
              <div className={`text-sm font-mono ${s.color}`}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Win/Loss + Profit Factor */}
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <div className="flex justify-between text-[8px] font-mono mb-1">
              <span className="text-emerald-400">WIN {stats.winRate.toFixed(0)}%</span>
              <span className="text-red-400">LOSS {(100 - stats.winRate).toFixed(0)}%</span>
            </div>
            <div className="h-2 bg-red-400/20 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-400/60 rounded-full" style={{ width: `${stats.winRate}%` }} />
            </div>
          </div>
          <div className="text-center px-3">
            <div className="text-[7px] text-marble/30 font-display tracking-wider">PF</div>
            <div className={`text-sm font-mono ${stats.profitFactor > 1 ? 'text-emerald-400' : 'text-red-400'}`}>{stats.profitFactor.toFixed(2)}</div>
          </div>
        </div>

        {/* Avg Win vs Avg Loss */}
        <div className="flex gap-2">
          <div className="flex-1 bg-emerald-500/5 border border-emerald-500/10 rounded p-2 text-center">
            <div className="text-[7px] text-emerald-400/50 font-display tracking-wider">AVG WIN</div>
            <div className="text-xs font-mono text-emerald-400">+{stats.avgWin.toFixed(2)}%</div>
          </div>
          <div className="flex-1 bg-red-500/5 border border-red-500/10 rounded p-2 text-center">
            <div className="text-[7px] text-red-400/50 font-display tracking-wider">AVG LOSS</div>
            <div className="text-xs font-mono text-red-400">-{stats.avgLoss.toFixed(2)}%</div>
          </div>
        </div>

        {/* Monthly Returns Heatmap */}
        <div>
          <div className="text-[8px] font-display tracking-wider text-marble/30 mb-2">MONTHLY RETURNS</div>
          <div className="grid grid-cols-6 gap-1">
            {MONTHS.map((m, i) => {
              const v = stats.monthlyReturns[i];
              const intensity = Math.min(Math.abs(v) / 8, 1);
              const bg = v >= 0
                ? `rgba(52,211,153,${intensity * 0.4})`
                : `rgba(248,113,113,${intensity * 0.4})`;
              return (
                <div key={m} className="rounded p-1 text-center border border-gold/5" style={{ backgroundColor: bg }}>
                  <div className="text-[7px] text-marble/30">{m}</div>
                  <div className={`text-[9px] font-mono ${v >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {v >= 0 ? '+' : ''}{v.toFixed(1)}%
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </WidgetShell>
  );
};

export default GAPerformanceDashboard;
