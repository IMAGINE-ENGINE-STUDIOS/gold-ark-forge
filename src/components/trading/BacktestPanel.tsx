import { useState, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Play, BarChart3, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface BacktestResult {
  totalReturn: number;
  maxDrawdown: number;
  sharpeRatio: number;
  winRate: number;
  totalTrades: number;
  equityCurve: { day: number; equity: number }[];
  unavailable?: boolean;
}

type Strategy = 'sma_cross' | 'rsi_reversion' | 'bollinger_bounce' | 'momentum';

const STRATEGIES: { key: Strategy; label: string; desc: string }[] = [
  { key: 'sma_cross', label: 'SMA Crossover', desc: '20/50 SMA cross signals' },
  { key: 'rsi_reversion', label: 'RSI Mean Reversion', desc: 'Buy RSI<30, Sell RSI>70' },
  { key: 'bollinger_bounce', label: 'Bollinger Bounce', desc: 'Buy at lower band, sell at upper' },
  { key: 'momentum', label: 'Momentum', desc: 'Buy on 5-day positive momentum' },
];

const runBacktest = (strategy: Strategy, capital: number, days: number): BacktestResult => {
  return {
    totalReturn: 0,
    maxDrawdown: 0,
    sharpeRatio: 0,
    winRate: 0,
    totalTrades: 0,
    equityCurve: [{ day: 0, equity: Math.round(capital) }],
    unavailable: true,
  };
};

const BacktestPanel = () => {
  const [strategy, setStrategy] = useState<Strategy>('sma_cross');
  const [capital, setCapital] = useState('10000');
  const [days, setDays] = useState('180');
  const [result, setResult] = useState<BacktestResult | null>(null);
  const [running, setRunning] = useState(false);

  const handleRun = () => {
    setRunning(true);
    setTimeout(() => {
      setResult(runBacktest(strategy, parseFloat(capital) || 10000, parseInt(days) || 180));
      setRunning(false);
    }, 500);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <BarChart3 className="w-4 h-4 text-gold" />
        <span className="font-display text-sm tracking-wider text-gold-light">BACKTESTING ENGINE</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
        {/* Strategy selector */}
        <div>
          <label className="text-[8px] text-marble/30 font-display tracking-wider">STRATEGY</label>
          <select
            value={strategy}
            onChange={(e) => setStrategy(e.target.value as Strategy)}
            className="w-full bg-navy-light border border-gold/15 text-marble text-xs rounded px-2 py-2 font-mono mt-0.5"
          >
            {STRATEGIES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
          </select>
          <p className="text-[7px] text-marble/20 mt-0.5">{STRATEGIES.find(s => s.key === strategy)?.desc}</p>
        </div>

        <div>
          <label className="text-[8px] text-marble/30 font-display tracking-wider">INITIAL CAPITAL ($)</label>
          <Input type="number" value={capital} onChange={(e) => setCapital(e.target.value)} className="bg-navy-light border-gold/15 text-marble font-mono text-xs h-8 mt-0.5" />
        </div>

        <div>
          <label className="text-[8px] text-marble/30 font-display tracking-wider">PERIOD (DAYS)</label>
          <Input type="number" value={days} onChange={(e) => setDays(e.target.value)} className="bg-navy-light border-gold/15 text-marble font-mono text-xs h-8 mt-0.5" min="30" max="365" />
        </div>

        <div className="flex items-end">
          <Button
            onClick={handleRun}
            disabled={running}
            className="w-full bg-gold/20 text-gold border border-gold/30 font-display text-[10px] tracking-wider hover:bg-gold/30 h-8"
          >
            <Play className="w-3 h-3 mr-1" />
            {running ? 'RUNNING...' : 'RUN BACKTEST'}
          </Button>
        </div>
      </div>

      {result?.unavailable && (
        <div className="flex items-center justify-center h-24 text-amber-300/70 text-xs font-display tracking-wider border border-amber-400/15 rounded-lg bg-amber-400/5">
          HISTORICAL BACKTEST FEED UNAVAILABLE
        </div>
      )}

      {result && !result.unavailable && (
        <>
          {/* KPI cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
            {[
              { label: 'TOTAL RETURN', value: `${result.totalReturn >= 0 ? '+' : ''}${result.totalReturn.toFixed(2)}%`, color: result.totalReturn >= 0 ? 'text-emerald-400' : 'text-red-400', icon: result.totalReturn >= 0 ? TrendingUp : TrendingDown },
              { label: 'MAX DRAWDOWN', value: `-${result.maxDrawdown.toFixed(2)}%`, color: 'text-red-400', icon: AlertTriangle },
              { label: 'SHARPE RATIO', value: result.sharpeRatio.toFixed(2), color: result.sharpeRatio > 1 ? 'text-emerald-400' : 'text-marble/50', icon: BarChart3 },
              { label: 'WIN RATE', value: `${Math.min(result.winRate, 100).toFixed(1)}%`, color: result.winRate > 50 ? 'text-emerald-400' : 'text-red-400', icon: TrendingUp },
              { label: 'TOTAL TRADES', value: result.totalTrades.toString(), color: 'text-marble', icon: BarChart3 },
            ].map(kpi => (
              <div key={kpi.label} className="bg-navy-light/30 rounded p-2 border border-gold/5">
                <div className="flex items-center gap-1 mb-1">
                  <kpi.icon className="w-3 h-3 text-marble/25" />
                  <span className="text-[7px] text-marble/35 font-display tracking-wider">{kpi.label}</span>
                </div>
                <div className={`text-sm font-mono ${kpi.color}`}>{kpi.value}</div>
              </div>
            ))}
          </div>

          {/* Equity curve */}
          <div className="bg-navy-light/20 rounded-lg p-3 border border-gold/5">
            <div className="text-[9px] font-display tracking-wider text-marble/30 mb-2">EQUITY CURVE</div>
            <ResponsiveContainer width="100%" height={140}>
              <AreaChart data={result.equityCurve}>
                <defs>
                  <linearGradient id="btGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={result.totalReturn >= 0 ? 'hsl(145,60%,45%)' : 'hsl(0,70%,50%)'} stopOpacity={0.3} />
                    <stop offset="100%" stopColor={result.totalReturn >= 0 ? 'hsl(145,60%,45%)' : 'hsl(0,70%,50%)'} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(213,28%,24%)" />
                <XAxis dataKey="day" tick={{ fontSize: 8, fill: 'hsl(40,25%,96%,0.2)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 8, fill: 'hsl(40,25%,96%,0.2)' }} axisLine={false} tickLine={false} width={50} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
                <Tooltip contentStyle={{ background: 'hsl(213,32%,16%)', border: '1px solid hsl(43,72%,50%,0.3)', fontSize: 10 }} />
                <Area type="monotone" dataKey="equity" stroke={result.totalReturn >= 0 ? 'hsl(145,60%,45%)' : 'hsl(0,70%,50%)'} fill="url(#btGrad)" strokeWidth={1.5} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </>
      )}

      {!result && (
        <div className="flex items-center justify-center h-24 text-marble/20 text-xs font-display tracking-wider border border-gold/5 rounded-lg">
          SELECT A STRATEGY AND RUN BACKTEST
        </div>
      )}
    </div>
  );
};

export default BacktestPanel;
