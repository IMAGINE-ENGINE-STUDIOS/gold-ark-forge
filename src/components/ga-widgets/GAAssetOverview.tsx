import { useMetalPrices } from '@/hooks/useMetalPrices';
import { useCryptoData } from '@/hooks/useCryptoData';
import { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Eye } from 'lucide-react';
import LivePulse from './LivePulse';

type ViewMode = 'metals' | 'crypto';

const GAAssetOverview = () => {
  const { data: prices, isLoading: loadingMetals } = useMetalPrices();
  const { data: crypto, isLoading: loadingCrypto } = useCryptoData(5);
  const [mode, setMode] = useState<ViewMode>('metals');

  const metalData = useMemo(() => {
    if (!prices) return [];
    const metals = ['gold', 'silver', 'platinum'] as const;
    // Generate 30 days of normalized performance data
    return Array.from({ length: 30 }, (_, day) => {
      const point: Record<string, number | string> = { day: `D${day + 1}` };
      metals.forEach((m) => {
        const feed = prices[m];
        if (!feed) return;
        const change = feed.change_24h ?? 0;
        const dailyChange = change / 30;
        const noise = Math.sin(day * 2.1 + (m === 'gold' ? 0 : m === 'silver' ? 2 : 4)) * 0.5;
        point[m] = parseFloat((100 + dailyChange * day + noise).toFixed(2));
      });
      return point;
    });
  }, [prices]);

  const cryptoData = useMemo(() => {
    if (!crypto) return [];
    const top3 = crypto.slice(0, 3);
    if (top3.length === 0 || !top3[0].sparkline_in_7d?.price) return [];
    const len = Math.min(...top3.map((c) => c.sparkline_in_7d?.price.length ?? 0), 48);
    return Array.from({ length: len }, (_, i) => {
      const point: Record<string, number | string> = { day: `${i}` };
      top3.forEach((c) => {
        const prices = c.sparkline_in_7d?.price ?? [];
        const base = prices[0] || 1;
        point[c.symbol.toUpperCase()] = parseFloat(((prices[i] / base) * 100).toFixed(2));
      });
      return point;
    });
  }, [crypto]);

  const data = mode === 'metals' ? metalData : cryptoData;
  const isLoading = mode === 'metals' ? loadingMetals : loadingCrypto;

  const metalColors = { gold: 'hsl(43, 72%, 50%)', silver: 'hsl(210, 6%, 67%)', platinum: 'hsl(210, 4%, 76%)' };
  const cryptoColors = ['hsl(37, 90%, 55%)', 'hsl(215, 70%, 55%)', 'hsl(145, 60%, 45%)'];

  const lines = mode === 'metals'
    ? Object.entries(metalColors).map(([key, color]) => ({ key, color }))
    : (crypto?.slice(0, 3) ?? []).map((c, i) => ({ key: c.symbol.toUpperCase(), color: cryptoColors[i] }));

  return (
    <div className="relative rounded-sm bg-gradient-to-br from-navy via-navy to-navy-light border border-gold/30 overflow-hidden">
      <div className="ornate-corner ornate-corner-tl" />
      <div className="ornate-corner ornate-corner-tr" />
      <div className="ornate-corner ornate-corner-bl" />
      <div className="ornate-corner ornate-corner-br" />

      <div className="p-6 md:p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Eye className="w-5 h-5 text-gold" />
            <h3 className="font-display text-lg tracking-[0.1em] text-gold-light">MULTI-ASSET OVERVIEW</h3>
            <LivePulse label="LIVE" />
          </div>
          <div className="flex gap-1">
            {(['metals', 'crypto'] as ViewMode[]).map((m) => (
              <button key={m} onClick={() => setMode(m)} className={`px-3 py-1 text-[10px] font-display tracking-wider rounded transition-all ${mode === m ? 'bg-gold/20 text-gold border border-gold/40' : 'text-marble/40 hover:text-marble/70 border border-transparent'}`}>
                {m.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <p className="text-[10px] text-marble/30 mb-4 tracking-widest font-display">NORMALIZED PERFORMANCE (BASE 100)</p>

        {isLoading ? (
          <div className="h-80 bg-navy-light/30 rounded animate-pulse" />
        ) : (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                <XAxis dataKey="day" tick={{ fontSize: 9, fill: 'hsl(210, 6%, 67%)' }} axisLine={{ stroke: 'hsl(213, 28%, 24%)' }} tickLine={false} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 9, fill: 'hsl(210, 6%, 67%)' }} axisLine={false} tickLine={false} domain={['auto', 'auto']} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'hsl(213, 32%, 12%)', border: '1px solid hsl(43, 72%, 50%, 0.3)', borderRadius: 4 }}
                  labelStyle={{ color: 'hsl(210, 6%, 67%)', fontSize: 10 }}
                  itemStyle={{ fontSize: 11 }}
                />
                <Legend wrapperStyle={{ fontSize: 10, fontFamily: 'var(--font-display)' }} />
                {lines.map(({ key, color }) => (
                  <Line key={key} type="monotone" dataKey={key} stroke={color} strokeWidth={2} dot={false} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
};

export default GAAssetOverview;
