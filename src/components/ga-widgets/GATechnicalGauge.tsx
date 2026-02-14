import { useMetalPrices } from '@/hooks/useMetalPrices';
import { useMemo, useState } from 'react';
import { Gauge } from 'lucide-react';

type MetalKey = 'gold' | 'silver' | 'platinum';

const metalLabels: Record<MetalKey, string> = { gold: 'XAU/USD', silver: 'XAG/USD', platinum: 'XPT/USD' };

// Generate synthetic oscillator/MA signals from price + change data
const generateSignals = (price: number, change: number) => {
  const seed = price * 100 + change * 10;
  const rng = (n: number) => ((Math.sin(seed * n) + 1) / 2);

  const oscillators = [
    { name: 'RSI (14)', value: 30 + change * 5 + rng(1) * 40 },
    { name: 'Stochastic %K', value: 20 + change * 8 + rng(2) * 50 },
    { name: 'CCI (20)', value: change * 30 + rng(3) * 60 - 30 },
    { name: 'ADX (14)', value: 15 + rng(4) * 35 },
    { name: 'Momentum (10)', value: change * 10 + rng(5) * 20 - 10 },
    { name: 'MACD Level', value: change * 5 + rng(6) * 10 - 5 },
    { name: 'Williams %R', value: -(20 + rng(7) * 60) },
    { name: 'Ultimate Osc.', value: 40 + change * 3 + rng(8) * 20 },
  ];

  const movingAverages = [
    { name: 'EMA (10)', value: price * (1 - 0.005 * rng(10)) },
    { name: 'SMA (10)', value: price * (1 - 0.008 * rng(11)) },
    { name: 'EMA (20)', value: price * (1 - 0.012 * rng(12)) },
    { name: 'SMA (20)', value: price * (1 - 0.015 * rng(13)) },
    { name: 'EMA (50)', value: price * (1 - 0.025 * rng(14)) },
    { name: 'SMA (50)', value: price * (1 - 0.03 * rng(15)) },
    { name: 'EMA (100)', value: price * (1 - 0.04 * rng(16)) },
    { name: 'SMA (200)', value: price * (1 - 0.06 * rng(17)) },
  ];

  // Score oscillators
  const oscSignals = oscillators.map((o) => {
    let signal: 'Buy' | 'Sell' | 'Neutral';
    if (o.name === 'RSI (14)') signal = o.value < 30 ? 'Buy' : o.value > 70 ? 'Sell' : 'Neutral';
    else if (o.name === 'Williams %R') signal = o.value < -80 ? 'Buy' : o.value > -20 ? 'Sell' : 'Neutral';
    else signal = o.value > 10 ? 'Buy' : o.value < -10 ? 'Sell' : 'Neutral';
    return { ...o, signal };
  });

  // Score MAs
  const maSignals = movingAverages.map((ma) => ({
    ...ma,
    signal: (price > ma.value ? 'Buy' : 'Sell') as 'Buy' | 'Sell' | 'Neutral',
  }));

  return { oscillators: oscSignals, movingAverages: maSignals };
};

const signalColor = (s: string) =>
  s === 'Buy' ? 'text-emerald-400' : s === 'Sell' ? 'text-red-400' : 'text-marble/50';

const GATechnicalGauge = () => {
  const { data: prices, isLoading } = useMetalPrices();
  const [activeMetal, setActiveMetal] = useState<MetalKey>('gold');

  const feed = prices?.[activeMetal];
  const price = feed?.price_usd ?? 0;
  const change = feed?.change_24h ?? 0;

  const { oscillators, movingAverages } = useMemo(
    () => generateSignals(price, change),
    [price, change]
  );

  const countSignals = (items: { signal: string }[]) => {
    const buy = items.filter((i) => i.signal === 'Buy').length;
    const sell = items.filter((i) => i.signal === 'Sell').length;
    const neutral = items.length - buy - sell;
    return { buy, sell, neutral };
  };

  const oscCount = countSignals(oscillators);
  const maCount = countSignals(movingAverages);
  const totalBuy = oscCount.buy + maCount.buy;
  const totalSell = oscCount.sell + maCount.sell;
  const totalNeutral = oscCount.neutral + maCount.neutral;
  const total = totalBuy + totalSell + totalNeutral;

  const overallSignal = totalBuy > totalSell + 3 ? 'STRONG BUY' :
    totalBuy > totalSell ? 'BUY' :
    totalSell > totalBuy + 3 ? 'STRONG SELL' :
    totalSell > totalBuy ? 'SELL' : 'NEUTRAL';

  const overallColor = overallSignal.includes('BUY') ? 'text-emerald-400' :
    overallSignal.includes('SELL') ? 'text-red-400' : 'text-marble/50';

  // Gauge needle angle: -90 (sell) to +90 (buy)
  const score = ((totalBuy - totalSell) / total) * 90;

  return (
    <div className="relative rounded-sm bg-gradient-to-br from-navy via-navy to-navy-light border border-gold/30 overflow-hidden">
      <div className="ornate-corner ornate-corner-tl" />
      <div className="ornate-corner ornate-corner-tr" />
      <div className="ornate-corner ornate-corner-bl" />
      <div className="ornate-corner ornate-corner-br" />

      <div className="p-6 md:p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Gauge className="w-5 h-5 text-gold" />
            <h3 className="font-display text-lg tracking-[0.1em] text-gold-light">TECHNICAL ANALYSIS</h3>
          </div>
          <div className="flex gap-1">
            {(Object.keys(metalLabels) as MetalKey[]).map((m) => (
              <button
                key={m}
                onClick={() => setActiveMetal(m)}
                className={`px-3 py-1 text-[10px] font-display tracking-[0.15em] rounded transition-all ${
                  activeMetal === m
                    ? 'bg-gold/20 text-gold border border-gold/40'
                    : 'text-marble/40 hover:text-marble/70 border border-transparent'
                }`}
              >
                {m.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="h-64 bg-navy-light/30 rounded animate-pulse" />
        ) : (
          <>
            {/* Gauge */}
            <div className="flex flex-col items-center mb-6">
              <svg width="200" height="110" viewBox="0 0 200 110">
                {/* Background arc */}
                <path d="M 15 100 A 85 85 0 0 1 185 100" fill="none" stroke="hsl(213, 28%, 24%)" strokeWidth="8" strokeLinecap="round" />
                {/* Red zone */}
                <path d="M 15 100 A 85 85 0 0 1 60 25" fill="none" stroke="hsl(0, 70%, 50%)" strokeWidth="8" strokeLinecap="round" opacity="0.3" />
                {/* Neutral zone */}
                <path d="M 60 25 A 85 85 0 0 1 140 25" fill="none" stroke="hsl(210, 6%, 67%)" strokeWidth="8" strokeLinecap="round" opacity="0.3" />
                {/* Green zone */}
                <path d="M 140 25 A 85 85 0 0 1 185 100" fill="none" stroke="hsl(145, 70%, 45%)" strokeWidth="8" strokeLinecap="round" opacity="0.3" />
                {/* Needle */}
                <line
                  x1="100" y1="100"
                  x2={100 + 70 * Math.cos(((score - 90) * Math.PI) / 180)}
                  y2={100 + 70 * Math.sin(((score - 90) * Math.PI) / 180)}
                  stroke="hsl(43, 72%, 50%)" strokeWidth="2.5" strokeLinecap="round"
                  className="transition-all duration-700"
                />
                <circle cx="100" cy="100" r="5" fill="hsl(43, 72%, 50%)" />
              </svg>
              <span className={`font-display text-lg tracking-[0.15em] mt-2 ${overallColor}`}>
                {overallSignal}
              </span>
              <span className="text-[10px] text-marble/30 tracking-widest mt-1">{metalLabels[activeMetal]}</span>
            </div>

            {/* Summary bars */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              {[
                { label: 'Buy', count: totalBuy, color: 'bg-emerald-400' },
                { label: 'Neutral', count: totalNeutral, color: 'bg-marble/40' },
                { label: 'Sell', count: totalSell, color: 'bg-red-400' },
              ].map((s) => (
                <div key={s.label} className="text-center">
                  <div className="text-2xl font-display text-marble font-semibold">{s.count}</div>
                  <div className={`h-1 rounded-full mt-1 ${s.color}`} />
                  <div className="text-[10px] text-marble/40 mt-1 tracking-widest">{s.label.toUpperCase()}</div>
                </div>
              ))}
            </div>

            {/* Detail tables */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-display text-[10px] tracking-[0.2em] text-marble/50 mb-3">OSCILLATORS</h4>
                <div className="space-y-1.5">
                  {oscillators.map((o) => (
                    <div key={o.name} className="flex items-center justify-between text-xs">
                      <span className="text-marble/50">{o.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-marble/30 font-mono">{o.value.toFixed(2)}</span>
                        <span className={`w-12 text-right text-[10px] font-medium ${signalColor(o.signal)}`}>{o.signal}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="font-display text-[10px] tracking-[0.2em] text-marble/50 mb-3">MOVING AVERAGES</h4>
                <div className="space-y-1.5">
                  {movingAverages.map((ma) => (
                    <div key={ma.name} className="flex items-center justify-between text-xs">
                      <span className="text-marble/50">{ma.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-marble/30 font-mono">${ma.value.toFixed(2)}</span>
                        <span className={`w-12 text-right text-[10px] font-medium ${signalColor(ma.signal)}`}>{ma.signal}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default GATechnicalGauge;
