import { useState, useMemo } from 'react';
import { ArrowLeftRight } from 'lucide-react';
import { useMetalPrices } from '@/hooks/useMetalPrices';
import { useCryptoData } from '@/hooks/useCryptoData';
import { useOilGasPrices } from '@/hooks/useOilGasData';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import LivePulse from './LivePulse';

const PAIRS = [
  { label: 'GOLD vs BTC', keyA: 'gold', keyB: 'bitcoin', colorA: 'hsl(43, 72%, 50%)', colorB: 'hsl(38, 92%, 50%)' },
  { label: 'GOLD vs S&P', keyA: 'gold', keyB: 'sp500', colorA: 'hsl(43, 72%, 50%)', colorB: 'hsl(217, 91%, 60%)' },
  { label: 'OIL vs GOLD', keyA: 'oil', keyB: 'gold', colorA: 'hsl(25, 95%, 53%)', colorB: 'hsl(43, 72%, 50%)' },
] as const;

const GACrossAssetDashboard = () => {
  const [activePair, setActivePair] = useState(0);
  const { data: metals } = useMetalPrices();
  const { data: crypto } = useCryptoData(10);
  const { data: oil } = useOilGasPrices();

  const pair = PAIRS[activePair];

  const priceA = useMemo(() => {
    if (pair.keyA === 'gold') return metals?.gold?.price_usd ?? 2350;
    if (pair.keyA === 'oil') return oil?.find(p => p.symbol === 'CL')?.price ?? 71;
    return 100;
  }, [pair, metals, oil]);

  const priceB = useMemo(() => {
    if (pair.keyB === 'bitcoin') return crypto?.find(c => c.id === 'bitcoin')?.current_price ?? 97500;
    if (pair.keyB === 'gold') return metals?.gold?.price_usd ?? 2350;
    if (pair.keyB === 'sp500') return 5940;
    return 100;
  }, [pair, metals, crypto]);

  const ratio = priceB > 0 ? (priceA / priceB) : 0;

  // Generate synthetic historical correlation data
  const chartData = useMemo(() => {
    return Array.from({ length: 30 }, (_, i) => {
      const driftA = Math.sin(i / 4) * 0.02 + Math.sin(i / 7) * 0.01;
      const driftB = Math.sin(i / 5) * 0.015 + Math.cos(i / 3) * 0.01;
      return {
        day: `D-${29 - i}`,
        a: Math.round(priceA * (1 + driftA) * 100) / 100,
        b: Math.round(priceB * (1 + driftB) * 100) / 100,
      };
    });
  }, [priceA, priceB]);

  // Simulated correlation coefficient
  const correlation = useMemo(() => {
    const corrs = [0.32, -0.15, 0.68];
    return corrs[activePair];
  }, [activePair]);

  const tooltipStyle = { background: 'hsl(213,32%,16%)', border: '1px solid hsl(43,72%,50%,0.3)', fontSize: 10 };

  return (
    <div className="relative rounded-sm bg-gradient-to-br from-navy via-navy to-navy-light border border-gold/30 overflow-hidden">
      <div className="ornate-corner ornate-corner-tl" />
      <div className="ornate-corner ornate-corner-tr" />
      <div className="ornate-corner ornate-corner-bl" />
      <div className="ornate-corner ornate-corner-br" />

      <div className="p-6 md:p-8">
        <div className="flex items-center gap-3 mb-4">
          <ArrowLeftRight className="w-5 h-5 text-gold" />
          <h3 className="font-display text-lg tracking-[0.1em] text-gold-light">CROSS-ASSET CORRELATION</h3>
          <LivePulse label="LIVE" />
        </div>

        {/* Pair Tabs */}
        <div className="flex gap-1 mb-6">
          {PAIRS.map((p, i) => (
            <button key={p.label} onClick={() => setActivePair(i)}
              className={`px-4 py-1.5 rounded text-[9px] font-display tracking-[0.12em] transition-all ${
                activePair === i ? 'bg-gold/15 text-gold border border-gold/30' : 'text-marble/30 border border-gold/5 hover:text-marble/50'
              }`}>
              {p.label}
            </button>
          ))}
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-navy-light/20 rounded p-3 border border-gold/5 text-center">
            <div className="text-[8px] font-display tracking-wider text-marble/30">{pair.keyA.toUpperCase()}</div>
            <div className="text-sm font-mono text-marble">${priceA.toLocaleString()}</div>
          </div>
          <div className="bg-navy-light/20 rounded p-3 border border-gold/5 text-center">
            <div className="text-[8px] font-display tracking-wider text-marble/30">CORRELATION</div>
            <div className={`text-lg font-mono ${correlation > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {correlation > 0 ? '+' : ''}{correlation.toFixed(2)}
            </div>
          </div>
          <div className="bg-navy-light/20 rounded p-3 border border-gold/5 text-center">
            <div className="text-[8px] font-display tracking-wider text-marble/30">{pair.keyB.toUpperCase()}</div>
            <div className="text-sm font-mono text-marble">${priceB.toLocaleString()}</div>
          </div>
        </div>

        {/* Chart */}
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="crossA" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={pair.colorA} stopOpacity={0.3} />
                <stop offset="100%" stopColor={pair.colorA} stopOpacity={0} />
              </linearGradient>
              <linearGradient id="crossB" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={pair.colorB} stopOpacity={0.3} />
                <stop offset="100%" stopColor={pair.colorB} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(213,28%,24%)" />
            <XAxis dataKey="day" tick={{ fontSize: 8, fill: 'hsl(40,25%,96%,0.2)' }} axisLine={false} tickLine={false} />
            <YAxis yAxisId="a" tick={{ fontSize: 8, fill: 'hsl(40,25%,96%,0.2)' }} axisLine={false} tickLine={false} width={55} domain={['dataMin', 'dataMax']} />
            <YAxis yAxisId="b" orientation="right" tick={{ fontSize: 8, fill: 'hsl(40,25%,96%,0.2)' }} axisLine={false} tickLine={false} width={55} domain={['dataMin', 'dataMax']} />
            <Tooltip contentStyle={tooltipStyle} />
            <Area yAxisId="a" type="monotone" dataKey="a" stroke={pair.colorA} fill="url(#crossA)" strokeWidth={1.5} name={pair.keyA.toUpperCase()} />
            <Area yAxisId="b" type="monotone" dataKey="b" stroke={pair.colorB} fill="url(#crossB)" strokeWidth={1.5} name={pair.keyB.toUpperCase()} />
          </AreaChart>
        </ResponsiveContainer>

        <div className="text-center text-[9px] text-marble/20 mt-2 font-display tracking-wider">
          RATIO: {ratio.toFixed(ratio < 0.01 ? 6 : 4)} · 30-DAY SYNTHETIC COMPARISON
        </div>
      </div>
    </div>
  );
};

export default GACrossAssetDashboard;
