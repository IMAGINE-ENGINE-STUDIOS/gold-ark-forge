import { useMemo } from 'react';
import { Landmark, TrendingUp, TrendingDown } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useCryptoData } from '@/hooks/useCryptoData';
import LivePulse from './LivePulse';

const tooltipStyle = { background: 'hsl(213,32%,16%)', border: '1px solid hsl(43,72%,50%,0.3)', fontSize: 10 };

const YIELD_DATA = [
  { name: 'Aave V3', protocol: 'AAVE', chain: 'Ethereum', apy: 3.85, tvl: 12400, change: 0.12, type: 'LENDING' },
  { name: 'Compound V3', protocol: 'COMP', chain: 'Ethereum', apy: 4.22, tvl: 3200, change: -0.08, type: 'LENDING' },
  { name: 'Lido stETH', protocol: 'LIDO', chain: 'Ethereum', apy: 3.45, tvl: 29800, change: 0.02, type: 'STAKING' },
  { name: 'Rocket Pool', protocol: 'RPL', chain: 'Ethereum', apy: 3.12, tvl: 4500, change: -0.05, type: 'STAKING' },
  { name: 'Curve 3pool', protocol: 'CRV', chain: 'Ethereum', apy: 2.15, tvl: 2100, change: 0.03, type: 'DEX LP' },
  { name: 'Uniswap V3', protocol: 'UNI', chain: 'Ethereum', apy: 8.90, tvl: 5300, change: 1.20, type: 'DEX LP' },
  { name: 'Marinade', protocol: 'MNDE', chain: 'Solana', apy: 6.80, tvl: 1800, change: 0.35, type: 'STAKING' },
  { name: 'Raydium', protocol: 'RAY', chain: 'Solana', apy: 12.50, tvl: 850, change: -0.45, type: 'DEX LP' },
];

const GAYieldMonitor = () => {
  const { data: crypto } = useCryptoData(5);

  // Synthetic yield curve data
  const yieldCurve = useMemo(() => {
    return Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (29 - i));
      return {
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        lending: 3.5 + Math.sin(i / 4) * 0.5 + Math.random() * 0.2,
        staking: 3.2 + Math.sin(i / 5) * 0.3 + Math.random() * 0.15,
        lp: 7.0 + Math.sin(i / 3) * 2 + Math.random() * 0.5,
      };
    });
  }, []);

  const avgYield = YIELD_DATA.reduce((s, d) => s + d.apy, 0) / YIELD_DATA.length;
  const totalTvl = YIELD_DATA.reduce((s, d) => s + d.tvl, 0);

  return (
    <div className="relative rounded-sm bg-gradient-to-br from-navy via-navy to-navy-light border border-gold/30 overflow-hidden">
      <div className="ornate-corner ornate-corner-tl" />
      <div className="ornate-corner ornate-corner-tr" />
      <div className="ornate-corner ornate-corner-bl" />
      <div className="ornate-corner ornate-corner-br" />

      <div className="p-6 md:p-8">
        <div className="flex items-center gap-3 mb-6">
          <Landmark className="w-5 h-5 text-gold" />
          <h3 className="font-display text-lg tracking-[0.1em] text-gold-light">DeFi YIELD MONITOR</h3>
          <LivePulse label="LIVE" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Summary Stats */}
          <div className="space-y-3">
            <div className="bg-navy-light/15 rounded-lg p-4 border border-gold/10">
              <div className="text-[8px] font-display tracking-[0.2em] text-marble/30">AVG YIELD</div>
              <div className="text-3xl font-mono text-gold mt-1">{avgYield.toFixed(2)}%</div>
              <div className="text-[9px] text-marble/25">APY across {YIELD_DATA.length} protocols</div>
            </div>
            <div className="bg-navy-light/15 rounded-lg p-4 border border-gold/10">
              <div className="text-[8px] font-display tracking-[0.2em] text-marble/30">TOTAL TVL TRACKED</div>
              <div className="text-2xl font-mono text-marble mt-1">${(totalTvl / 1000).toFixed(1)}B</div>
            </div>
            <div className="bg-navy-light/15 rounded-lg p-4 border border-gold/10">
              <div className="text-[8px] font-display tracking-[0.2em] text-marble/30">BEST OPPORTUNITY</div>
              <div className="text-lg font-mono text-emerald-400 mt-1">{Math.max(...YIELD_DATA.map(d => d.apy)).toFixed(2)}%</div>
              <div className="text-[9px] text-marble/30">{YIELD_DATA.reduce((best, d) => d.apy > best.apy ? d : best).name}</div>
            </div>
          </div>

          {/* Yield Chart */}
          <div className="lg:col-span-2">
            <div className="bg-navy-light/10 rounded-lg p-4 border border-gold/5 mb-4">
              <div className="text-[8px] font-display tracking-[0.2em] text-marble/30 mb-3">30-DAY YIELD TRENDS</div>
              <ResponsiveContainer width="100%" height={160}>
                <AreaChart data={yieldCurve}>
                  <defs>
                    <linearGradient id="yieldLend" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(210,60%,50%)" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="hsl(210,60%,50%)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="yieldStake" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(145,60%,45%)" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="hsl(145,60%,45%)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="yieldLp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(43,72%,50%)" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="hsl(43,72%,50%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(213,28%,24%)" />
                  <XAxis dataKey="date" tick={{ fontSize: 7, fill: 'hsl(40,25%,96%,0.2)' }} axisLine={false} tickLine={false} interval={6} />
                  <YAxis tick={{ fontSize: 7, fill: 'hsl(40,25%,96%,0.2)' }} axisLine={false} tickLine={false} width={30} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Area type="monotone" dataKey="lp" stroke="hsl(43,72%,50%)" fill="url(#yieldLp)" strokeWidth={1.5} name="DEX LP" />
                  <Area type="monotone" dataKey="lending" stroke="hsl(210,60%,50%)" fill="url(#yieldLend)" strokeWidth={1.5} name="Lending" />
                  <Area type="monotone" dataKey="staking" stroke="hsl(145,60%,45%)" fill="url(#yieldStake)" strokeWidth={1.5} name="Staking" />
                </AreaChart>
              </ResponsiveContainer>
              <div className="flex gap-4 mt-2 justify-center">
                <span className="text-[8px] text-marble/30 flex items-center gap-1"><span className="w-2 h-0.5 bg-[hsl(43,72%,50%)] inline-block" /> DEX LP</span>
                <span className="text-[8px] text-marble/30 flex items-center gap-1"><span className="w-2 h-0.5 bg-[hsl(210,60%,50%)] inline-block" /> Lending</span>
                <span className="text-[8px] text-marble/30 flex items-center gap-1"><span className="w-2 h-0.5 bg-[hsl(145,60%,45%)] inline-block" /> Staking</span>
              </div>
            </div>

            {/* Protocol Table */}
            <div className="bg-navy-light/10 rounded-lg p-4 border border-gold/5">
              <div className="text-[8px] font-display tracking-[0.2em] text-marble/30 mb-3">TOP YIELD OPPORTUNITIES</div>
              <div className="space-y-1.5">
                {YIELD_DATA.sort((a, b) => b.apy - a.apy).map(d => (
                  <div key={d.name} className="flex items-center justify-between py-1.5 border-b border-gold/5 last:border-0">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-[9px] font-display tracking-wider text-marble/60 truncate">{d.name}</span>
                      <span className="text-[7px] px-1.5 py-0.5 rounded bg-navy-light/30 text-marble/30 font-display tracking-wider shrink-0">{d.type}</span>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-[8px] font-mono text-marble/30">${(d.tvl / 1000).toFixed(1)}B</span>
                      <span className="text-[10px] font-mono text-emerald-400">{d.apy.toFixed(2)}%</span>
                      <span className={`text-[8px] font-mono flex items-center gap-0.5 ${d.change >= 0 ? 'text-emerald-400/60' : 'text-red-400/60'}`}>
                        {d.change >= 0 ? '+' : ''}{d.change.toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GAYieldMonitor;
