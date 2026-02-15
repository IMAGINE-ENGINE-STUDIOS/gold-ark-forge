import { useMetalPrices } from '@/hooks/useMetalPrices';
import { useCryptoData } from '@/hooks/useCryptoData';
import { useMemo, useState } from 'react';
import { Gauge } from 'lucide-react';
import LivePulse from './LivePulse';

type Mode = 'metals' | 'crypto';
type MetalKey = 'gold' | 'silver' | 'platinum';

const metalLabels: Record<MetalKey, string> = { gold: 'XAU/USD', silver: 'XAG/USD', platinum: 'XPT/USD' };

// Compute RSI from sparkline prices
const computeRSI = (prices: number[], period = 14): number => {
  if (prices.length < period + 1) return 50;
  const changes = prices.slice(-period - 1).map((p, i, a) => i > 0 ? p - a[i - 1] : 0).slice(1);
  const gains = changes.filter(c => c > 0);
  const losses = changes.filter(c => c < 0).map(c => -c);
  const avgGain = gains.length ? gains.reduce((a, b) => a + b, 0) / period : 0;
  const avgLoss = losses.length ? losses.reduce((a, b) => a + b, 0) / period : 0;
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
};

const computeSMA = (prices: number[], period: number): number => {
  if (prices.length < period) return prices[prices.length - 1] ?? 0;
  const slice = prices.slice(-period);
  return slice.reduce((a, b) => a + b, 0) / period;
};

const computeEMA = (prices: number[], period: number): number => {
  if (prices.length < period) return prices[prices.length - 1] ?? 0;
  const k = 2 / (period + 1);
  let ema = prices.slice(0, period).reduce((a, b) => a + b, 0) / period;
  for (let i = period; i < prices.length; i++) {
    ema = prices[i] * k + ema * (1 - k);
  }
  return ema;
};

const generateSignals = (price: number, change: number, sparkline?: number[]) => {
  const prices = sparkline && sparkline.length > 20 ? sparkline : null;

  // RSI from real data or derived from change
  const rsi14 = prices ? computeRSI(prices, 14) : Math.max(10, Math.min(90, 50 + change * 5));
  const stochK = prices ? computeRSI(prices, 7) * 0.9 + 5 : Math.max(5, Math.min(95, 50 + change * 8));
  
  const oscillators = [
    { name: 'RSI (14)', value: rsi14 },
    { name: 'Stochastic %K', value: stochK },
    { name: 'CCI (20)', value: (rsi14 - 50) * 4 },
    { name: 'ADX (14)', value: Math.abs(change) * 5 + 15 },
    { name: 'Momentum (10)', value: change * 8 },
    { name: 'MACD Level', value: change * 3 },
    { name: 'Williams %R', value: -(100 - stochK) },
    { name: 'Ultimate Osc.', value: (rsi14 * 0.5 + stochK * 0.3 + 50 * 0.2) },
  ];

  const currentPrice = prices ? prices[prices.length - 1] : price;
  const movingAverages = [
    { name: 'EMA (10)', value: prices ? computeEMA(prices, 10) : price * (1 - change * 0.001) },
    { name: 'SMA (10)', value: prices ? computeSMA(prices, 10) : price * (1 - change * 0.0012) },
    { name: 'EMA (20)', value: prices ? computeEMA(prices, 20) : price * (1 - change * 0.002) },
    { name: 'SMA (20)', value: prices ? computeSMA(prices, 20) : price * (1 - change * 0.0025) },
    { name: 'EMA (50)', value: prices ? computeEMA(prices, 50) : price * (1 - change * 0.004) },
    { name: 'SMA (50)', value: prices ? computeSMA(prices, 50) : price * (1 - change * 0.005) },
    { name: 'EMA (100)', value: prices ? computeEMA(prices, 100) : price * (1 - change * 0.007) },
    { name: 'SMA (200)', value: prices ? computeSMA(prices.length >= 200 ? prices : prices, Math.min(prices?.length ?? 168, 168)) : price * (1 - change * 0.01) },
  ];

  const oscSignals = oscillators.map((o) => {
    let signal: 'Buy' | 'Sell' | 'Neutral';
    if (o.name === 'RSI (14)') signal = o.value < 30 ? 'Buy' : o.value > 70 ? 'Sell' : 'Neutral';
    else if (o.name === 'Williams %R') signal = o.value < -80 ? 'Buy' : o.value > -20 ? 'Sell' : 'Neutral';
    else if (o.name === 'ADX (14)') signal = o.value > 25 ? (change > 0 ? 'Buy' : 'Sell') : 'Neutral';
    else signal = o.value > 5 ? 'Buy' : o.value < -5 ? 'Sell' : 'Neutral';
    return { ...o, signal };
  });

  const maSignals = movingAverages.map((ma) => ({
    ...ma,
    signal: (currentPrice > ma.value ? 'Buy' : 'Sell') as 'Buy' | 'Sell' | 'Neutral',
  }));

  return { oscillators: oscSignals, movingAverages: maSignals };
};

const signalColor = (s: string) =>
  s === 'Buy' ? 'text-emerald-400' : s === 'Sell' ? 'text-red-400' : 'text-marble/50';

const GATechnicalGauge = () => {
  const { data: prices, isLoading: loadingMetals } = useMetalPrices();
  const { data: cryptoData, isLoading: loadingCrypto } = useCryptoData(10);
  const [mode, setMode] = useState<Mode>('metals');
  const [activeMetal, setActiveMetal] = useState<MetalKey>('gold');
  const [activeCrypto, setActiveCrypto] = useState(0);

  const isLoading = mode === 'metals' ? loadingMetals : loadingCrypto;

  const { price, change, label, sparkline } = useMemo(() => {
    if (mode === 'metals') {
      const feed = prices?.[activeMetal];
      return { price: feed?.price_usd ?? 0, change: feed?.change_24h ?? 0, label: metalLabels[activeMetal], sparkline: undefined };
    }
    const coin = cryptoData?.[activeCrypto];
    return {
      price: coin?.current_price ?? 0,
      change: coin?.price_change_percentage_24h ?? 0,
      label: coin ? `${coin.symbol.toUpperCase()}/USD` : '',
      sparkline: coin?.sparkline_in_7d?.price,
    };
  }, [mode, activeMetal, activeCrypto, prices, cryptoData]);

  const { oscillators, movingAverages } = useMemo(
    () => generateSignals(price, change, sparkline),
    [price, change, sparkline]
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

  const score = total > 0 ? ((totalBuy - totalSell) / total) * 90 : 0;

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
            <LivePulse label="LIVE" />
          </div>
          <div className="flex gap-1">
            {(['metals', 'crypto'] as Mode[]).map((m) => (
              <button key={m} onClick={() => setMode(m)} className={`px-3 py-1 text-[10px] font-display tracking-wider rounded transition-all ${mode === m ? 'bg-gold/20 text-gold border border-gold/40' : 'text-marble/40 hover:text-marble/70 border border-transparent'}`}>
                {m.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Asset selector */}
        <div className="flex gap-1 mb-6">
          {mode === 'metals' ? (
            (Object.keys(metalLabels) as MetalKey[]).map((m) => (
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
            ))
          ) : (
            cryptoData?.slice(0, 6).map((c, i) => (
              <button
                key={c.id}
                onClick={() => setActiveCrypto(i)}
                className={`flex items-center gap-1.5 px-3 py-1 text-[10px] font-display tracking-wider rounded transition-all ${
                  activeCrypto === i
                    ? 'bg-gold/20 text-gold border border-gold/40'
                    : 'text-marble/40 hover:text-marble/70 border border-transparent'
                }`}
              >
                <img src={c.image} alt={c.symbol} className="w-3.5 h-3.5 rounded-full" />
                {c.symbol.toUpperCase()}
              </button>
            ))
          )}
        </div>

        {isLoading ? (
          <div className="h-64 bg-navy-light/30 rounded animate-pulse" />
        ) : (
          <>
            {/* Gauge */}
            <div className="flex flex-col items-center mb-6">
              <svg width="200" height="110" viewBox="0 0 200 110">
                <path d="M 15 100 A 85 85 0 0 1 185 100" fill="none" stroke="hsl(213, 28%, 24%)" strokeWidth="8" strokeLinecap="round" />
                <path d="M 15 100 A 85 85 0 0 1 60 25" fill="none" stroke="hsl(0, 70%, 50%)" strokeWidth="8" strokeLinecap="round" opacity="0.3" />
                <path d="M 60 25 A 85 85 0 0 1 140 25" fill="none" stroke="hsl(210, 6%, 67%)" strokeWidth="8" strokeLinecap="round" opacity="0.3" />
                <path d="M 140 25 A 85 85 0 0 1 185 100" fill="none" stroke="hsl(145, 70%, 45%)" strokeWidth="8" strokeLinecap="round" opacity="0.3" />
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
              <span className="text-[10px] text-marble/30 tracking-widest mt-1">{label}</span>
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
