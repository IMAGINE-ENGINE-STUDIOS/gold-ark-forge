import { useMemo } from 'react';
import { PieChart as PieIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { useMetalPrices } from '@/hooks/useMetalPrices';
import { useCryptoData } from '@/hooks/useCryptoData';
import { useOilGasPrices } from '@/hooks/useOilGasData';
import LivePulse from './LivePulse';

const tooltipStyle = { background: 'hsl(213,32%,16%)', border: '1px solid hsl(43,72%,50%,0.3)', fontSize: 10 };

const MODEL_PORTFOLIOS = [
  { name: 'CONSERVATIVE', allocations: { 'Gold': 40, 'Silver': 10, 'BTC': 5, 'Bonds': 30, 'Oil': 5, 'Cash': 10 } },
  { name: 'BALANCED', allocations: { 'Gold': 25, 'Silver': 8, 'BTC': 15, 'ETH': 7, 'Oil': 10, 'Stocks': 25, 'Cash': 10 } },
  { name: 'AGGRESSIVE', allocations: { 'Gold': 10, 'BTC': 30, 'ETH': 15, 'SOL': 10, 'Oil': 10, 'Stocks': 20, 'Cash': 5 } },
];

const COLORS = [
  'hsl(43, 72%, 50%)', 'hsl(210, 50%, 60%)', 'hsl(38, 92%, 50%)', 'hsl(145, 60%, 45%)',
  'hsl(25, 80%, 50%)', 'hsl(270, 50%, 55%)', 'hsl(0, 0%, 60%)', 'hsl(180, 50%, 45%)',
];

const GAPortfolioAllocator = () => {
  const { data: metals } = useMetalPrices();
  const { data: crypto } = useCryptoData(10);
  const { data: oil } = useOilGasPrices();

  const prices = useMemo(() => {
    const map: Record<string, { price: number; change: number }> = {};
    if (metals?.gold) map['Gold'] = { price: metals.gold.price_usd, change: metals.gold.change_24h ?? 0 };
    if (metals?.silver) map['Silver'] = { price: metals.silver.price_usd, change: metals.silver.change_24h ?? 0 };
    const btc = crypto?.find(c => c.id === 'bitcoin');
    if (btc) map['BTC'] = { price: btc.current_price, change: btc.price_change_percentage_24h ?? 0 };
    const eth = crypto?.find(c => c.id === 'ethereum');
    if (eth) map['ETH'] = { price: eth.current_price, change: eth.price_change_percentage_24h ?? 0 };
    const sol = crypto?.find(c => c.id === 'solana');
    if (sol) map['SOL'] = { price: sol.current_price, change: sol.price_change_percentage_24h ?? 0 };
    const wti = oil?.find(p => p.symbol === 'CL');
    if (wti) map['Oil'] = { price: wti.price, change: wti.change };
    map['Cash'] = { price: 1, change: 0 };
    return map;
  }, [metals, crypto, oil]);

  const portfolioPerformance = (allocs: Record<string, number>) => {
    let weightedReturn = 0;
    Object.entries(allocs).forEach(([asset, weight]) => {
      const p = prices[asset];
      if (p) weightedReturn += (weight / 100) * p.change;
    });
    return Math.round(weightedReturn * 100) / 100;
  };

  return (
    <div className="relative rounded-sm bg-gradient-to-br from-navy via-navy to-navy-light border border-gold/30 overflow-hidden">
      <div className="ornate-corner ornate-corner-tl" />
      <div className="ornate-corner ornate-corner-tr" />
      <div className="ornate-corner ornate-corner-bl" />
      <div className="ornate-corner ornate-corner-br" />

      <div className="p-6 md:p-8">
        <div className="flex items-center gap-3 mb-6">
          <PieIcon className="w-5 h-5 text-gold" />
          <h3 className="font-display text-lg tracking-[0.1em] text-gold-light">PORTFOLIO ALLOCATOR</h3>
          <LivePulse label="LIVE" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {MODEL_PORTFOLIOS.map((portfolio, pi) => {
            const perf = portfolioPerformance(portfolio.allocations);
            const chartData = Object.entries(portfolio.allocations).map(([name, value]) => ({ name, value }));
            return (
              <div key={portfolio.name} className="bg-navy-light/10 rounded-lg p-4 border border-gold/5 hover:border-gold/15 transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-display tracking-[0.15em] text-gold/80">{portfolio.name}</span>
                  <span className={`text-[10px] font-mono flex items-center gap-0.5 ${perf >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {perf >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {perf >= 0 ? '+' : ''}{perf.toFixed(2)}% 24H
                  </span>
                </div>

                {/* Pie Chart */}
                <ResponsiveContainer width="100%" height={140}>
                  <PieChart>
                    <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%"
                      innerRadius={35} outerRadius={60} paddingAngle={2} strokeWidth={0}>
                      {chartData.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} opacity={0.8} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v}%`, 'Weight']} />
                  </PieChart>
                </ResponsiveContainer>

                {/* Allocation Legend */}
                <div className="space-y-1 mt-2">
                  {chartData.map((item, i) => {
                    const asset = prices[item.name];
                    return (
                      <div key={item.name} className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                          <span className="text-[8px] font-display tracking-wider text-marble/50">{item.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[8px] font-mono text-marble/40">{item.value}%</span>
                          {asset && asset.change !== 0 && (
                            <span className={`text-[7px] font-mono ${asset.change >= 0 ? 'text-emerald-400/60' : 'text-red-400/60'}`}>
                              {asset.change >= 0 ? '+' : ''}{asset.change.toFixed(1)}%
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default GAPortfolioAllocator;
