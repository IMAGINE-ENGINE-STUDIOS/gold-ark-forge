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
}

type Strategy = 'sma_cross' | 'rsi_reversion' | 'bollinger_bounce' | 'momentum';

const STRATEGIES: { key: Strategy; label: string; desc: string }[] = [
  { key: 'sma_cross', label: 'SMA Crossover', desc: '20/50 SMA cross signals' },
  { key: 'rsi_reversion', label: 'RSI Mean Reversion', desc: 'Buy RSI<30, Sell RSI>70' },
  { key: 'bollinger_bounce', label: 'Bollinger Bounce', desc: 'Buy at lower band, sell at upper' },
  { key: 'momentum', label: 'Momentum', desc: 'Buy on 5-day positive momentum' },
];

const runBacktest = (strategy: Strategy, capital: number, days: number): BacktestResult => {
  const equity: number[] = [capital];
  let cash = capital;
  let position = 0;
  let price = 100;
  let wins = 0;
  let trades = 0;
  let maxEquity = capital;
  let maxDD = 0;
  const sma20: number[] = [];
  const sma50: number[] = [];
  const rsiHistory: number[] = [];
  const prices: number[] = [];

  for (let d = 0; d < days; d++) {
    const change = (Math.random() - 0.48) * 3;
    price = Math.max(price * (1 + change / 100), 1);
    prices.push(price);

    // Track SMAs
    sma20.push(prices.length >= 20 ? prices.slice(-20).reduce((a, b) => a + b, 0) / 20 : price);
    sma50.push(prices.length >= 50 ? prices.slice(-50).reduce((a, b) => a + b, 0) / 50 : price);

    // Simplified RSI
    const rsi = prices.length > 14
      ? 50 + (prices[prices.length - 1] - prices[prices.length - 14]) / prices[prices.length - 14] * 500
      : 50;
    rsiHistory.push(Math.max(0, Math.min(100, rsi)));

    let signal: 'buy' | 'sell' | 'hold' = 'hold';

    if (strategy === 'sma_cross' && d > 50) {
      if (sma20[d] > sma50[d] && sma20[d - 1] <= sma50[d - 1]) signal = 'buy';
      if (sma20[d] < sma50[d] && sma20[d - 1] >= sma50[d - 1]) signal = 'sell';
    } else if (strategy === 'rsi_reversion' && d > 14) {
      if (rsiHistory[d] < 30 && position === 0) signal = 'buy';
      if (rsiHistory[d] > 70 && position > 0) signal = 'sell';
    } else if (strategy === 'bollinger_bounce' && d > 20) {
      const mean = sma20[d];
      const std = Math.sqrt(prices.slice(-20).reduce((s, p) => s + (p - mean) ** 2, 0) / 20);
      if (price < mean - 2 * std && position === 0) signal = 'buy';
      if (price > mean + 2 * std && position > 0) signal = 'sell';
    } else if (strategy === 'momentum' && d > 5) {
      const mom = (price - prices[d - 5]) / prices[d - 5];
      if (mom > 0.02 && position === 0) signal = 'buy';
      if (mom < -0.01 && position > 0) signal = 'sell';
    }

    if (signal === 'buy' && cash > 0) {
      position = cash / price;
      cash = 0;
      trades++;
    } else if (signal === 'sell' && position > 0) {
      const proceeds = position * price;
      if (proceeds > (equity[equity.length - 1] - cash)) wins++;
      cash = proceeds;
      position = 0;
      trades++;
    }

    const totalEquity = cash + position * price;
    equity.push(totalEquity);
    maxEquity = Math.max(maxEquity, totalEquity);
    maxDD = Math.max(maxDD, (maxEquity - totalEquity) / maxEquity * 100);
  }

  const finalEquity = equity[equity.length - 1];
  const totalReturn = ((finalEquity - capital) / capital) * 100;
  const dailyReturns = equity.slice(1).map((e, i) => (e - equity[i]) / equity[i]);
  const avgReturn = dailyReturns.reduce((a, b) => a + b, 0) / dailyReturns.length;
  const stdReturn = Math.sqrt(dailyReturns.reduce((s, r) => s + (r - avgReturn) ** 2, 0) / dailyReturns.length);
  const sharpe = stdReturn > 0 ? (avgReturn / stdReturn) * Math.sqrt(252) : 0;

  return {
    totalReturn,
    maxDrawdown: maxDD,
    sharpeRatio: sharpe,
    winRate: trades > 0 ? (wins / Math.ceil(trades / 2)) * 100 : 0,
    totalTrades: trades,
    equityCurve: equity.map((eq, i) => ({ day: i, equity: Math.round(eq) })),
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

      {result && (
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
