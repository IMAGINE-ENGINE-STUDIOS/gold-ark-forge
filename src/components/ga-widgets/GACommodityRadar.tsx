import { useState, useMemo } from 'react';
import { Crosshair, TrendingUp, TrendingDown, Fuel, Gem } from 'lucide-react';
import { useMetalPrices } from '@/hooks/useMetalPrices';
import { useOilGasPrices } from '@/hooks/useOilGasData';
import { useCryptoData } from '@/hooks/useCryptoData';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from 'recharts';
import LivePulse from './LivePulse';

const tooltipStyle = { background: 'hsl(213,32%,16%)', border: '1px solid hsl(43,72%,50%,0.3)', fontSize: 10 };

const TABS = ['ALL', 'METALS', 'ENERGY', 'CRYPTO'] as const;

const GACommodityRadar = () => {
  const [tab, setTab] = useState<typeof TABS[number]>('ALL');
  const { data: metals } = useMetalPrices();
  const { data: oil } = useOilGasPrices();
  const { data: crypto } = useCryptoData(10);

  const items = useMemo(() => {
    const list: { name: string; price: number; change: number; category: string; icon: string }[] = [];
    if (metals?.gold) list.push({ name: 'Gold', price: metals.gold.price_usd, change: metals.gold.change_24h ?? 0, category: 'METALS', icon: '🥇' });
    if (metals?.silver) list.push({ name: 'Silver', price: metals.silver.price_usd, change: metals.silver.change_24h ?? 0, category: 'METALS', icon: '🥈' });
    if (metals?.platinum) list.push({ name: 'Platinum', price: metals.platinum.price_usd, change: metals.platinum.change_24h ?? 0, category: 'METALS', icon: '⚪' });
    oil?.slice(0, 4).forEach(p => list.push({ name: p.name, price: p.price, change: p.change, category: 'ENERGY', icon: '🛢️' }));
    crypto?.slice(0, 5).filter(c => !['tether', 'usd-coin'].includes(c.id)).forEach(c =>
      list.push({ name: c.name, price: c.current_price, change: c.price_change_percentage_24h ?? 0, category: 'CRYPTO', icon: '' })
    );
    return list;
  }, [metals, oil, crypto]);

  const filtered = tab === 'ALL' ? items : items.filter(i => i.category === tab);
  const sorted = [...filtered].sort((a, b) => Math.abs(b.change) - Math.abs(a.change));

  const chartData = sorted.map(i => ({ name: i.name.length > 8 ? i.name.slice(0, 8) : i.name, change: i.change }));

  const strongest = sorted[0];
  const weakest = [...sorted].sort((a, b) => a.change - b.change)[0];

  return (
    <div className="relative rounded-sm bg-gradient-to-br from-navy via-navy to-navy-light border border-gold/30 overflow-hidden">
      <div className="ornate-corner ornate-corner-tl" />
      <div className="ornate-corner ornate-corner-tr" />
      <div className="ornate-corner ornate-corner-bl" />
      <div className="ornate-corner ornate-corner-br" />

      <div className="p-6 md:p-8">
        <div className="flex items-center gap-3 mb-4">
          <Crosshair className="w-5 h-5 text-gold" />
          <h3 className="font-display text-lg tracking-[0.1em] text-gold-light">COMMODITY RADAR</h3>
          <LivePulse label="LIVE" />
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-5">
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-1.5 rounded text-[9px] font-display tracking-[0.12em] transition-all ${
                tab === t ? 'bg-gold/15 text-gold border border-gold/30' : 'text-marble/30 border border-gold/5 hover:text-marble/50'
              }`}>{t}</button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Performance Bar Chart */}
          <div className="lg:col-span-2 bg-navy-light/10 rounded-lg p-4 border border-gold/5">
            <div className="text-[8px] font-display tracking-[0.2em] text-marble/30 mb-3">24H PERFORMANCE RANKING</div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(213,28%,24%)" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 8, fill: 'hsl(40,25%,96%,0.2)' }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 9, fill: 'hsl(40,25%,96%,0.4)' }} axisLine={false} tickLine={false} width={70} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v.toFixed(2)}%`, 'Change']} />
                <Bar dataKey="change" radius={[0, 4, 4, 0]}>
                  {chartData.map((d, i) => (
                    <Cell key={i} fill={d.change >= 0 ? 'hsl(145,60%,45%)' : 'hsl(0,60%,50%)'} opacity={0.7} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Signal Panel */}
          <div className="space-y-3">
            {/* Leaders & Laggards */}
            <div className="bg-navy-light/15 rounded-lg p-4 border border-gold/10">
              <div className="text-[8px] font-display tracking-[0.2em] text-marble/30 mb-3">LEADERS & LAGGARDS</div>
              {strongest && (
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-[10px] font-display text-marble/60">{strongest.name}</span>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400">+{strongest.change.toFixed(2)}%</span>
                </div>
              )}
              {weakest && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingDown className="w-3.5 h-3.5 text-red-400" />
                    <span className="text-[10px] font-display text-marble/60">{weakest.name}</span>
                  </div>
                  <span className="text-[10px] font-mono text-red-400">{weakest.change.toFixed(2)}%</span>
                </div>
              )}
            </div>

            {/* Commodity Grid */}
            <div className="bg-navy-light/15 rounded-lg p-4 border border-gold/10">
              <div className="text-[8px] font-display tracking-[0.2em] text-marble/30 mb-3">PRICE GRID</div>
              <div className="space-y-1.5 max-h-[160px] overflow-y-auto scrollbar-thin">
                {sorted.map(item => (
                  <div key={item.name} className="flex items-center justify-between py-1 border-b border-gold/5 last:border-0">
                    <span className="text-[9px] font-display tracking-wider text-marble/50">{item.name}</span>
                    <div className="text-right">
                      <span className="text-[10px] font-mono text-marble">${item.price < 10 ? item.price.toFixed(4) : item.price.toLocaleString('en-US', { maximumFractionDigits: 2 })}</span>
                      <span className={`text-[8px] font-mono ml-1.5 ${item.change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {item.change >= 0 ? '+' : ''}{item.change.toFixed(2)}%
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

export default GACommodityRadar;
