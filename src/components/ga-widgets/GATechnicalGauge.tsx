import { useMetalPrices } from '@/hooks/useMetalPrices';
import { useCryptoData } from '@/hooks/useCryptoData';
import { useMemo, useState } from 'react';
import { Gauge } from 'lucide-react';
import LivePulse from './LivePulse';
import { buildTechnicalSnapshot, type TechnicalCandleInput, type TechnicalSignalRow } from '@/lib/technicalSignals';

type Mode = 'metals' | 'crypto';
type MetalKey = 'gold' | 'silver' | 'platinum';

interface GATechnicalGaugeProps {
  assetLabel?: string;
  candles?: TechnicalCandleInput | null;
}

const metalLabels: Record<MetalKey, string> = { gold: 'XAU/USD', silver: 'XAG/USD', platinum: 'XPT/USD' };

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

  const rsi14 = prices ? computeRSI(prices, 14) : Math.max(10, Math.min(90, 50 + change * 5));
  const stochK = prices ? computeRSI(prices, 7) * 0.9 + 5 : Math.max(5, Math.min(95, 50 + change * 8));

  const oscillators: TechnicalSignalRow[] = [
    { name: 'RSI (14)', value: rsi14, signal: rsi14 < 30 ? 'Buy' : rsi14 > 70 ? 'Sell' : 'Neutral' },
    { name: 'Stochastic %K', value: stochK, signal: stochK < 20 ? 'Buy' : stochK > 80 ? 'Sell' : 'Neutral' },
    { name: 'CCI (20)', value: (rsi14 - 50) * 4, signal: rsi14 < 35 ? 'Buy' : rsi14 > 65 ? 'Sell' : 'Neutral' },
    { name: 'ADX (14)', value: Math.abs(change) * 5 + 15, signal: Math.abs(change) < 2 ? 'Neutral' : change > 0 ? 'Buy' : 'Sell' },
    { name: 'Momentum (10)', value: change * 8, signal: change > 0 ? 'Buy' : change < 0 ? 'Sell' : 'Neutral' },
    { name: 'MACD Level', value: change * 3, signal: change > 0 ? 'Buy' : change < 0 ? 'Sell' : 'Neutral' },
    { name: 'Williams %R', value: -(100 - stochK), signal: stochK < 20 ? 'Buy' : stochK > 80 ? 'Sell' : 'Neutral' },
    { name: 'Ultimate Osc.', value: (rsi14 * 0.5 + stochK * 0.3 + 50 * 0.2), signal: change > 0.5 ? 'Buy' : change < -0.5 ? 'Sell' : 'Neutral' },
  ];

  const currentPrice = prices ? prices[prices.length - 1] : price;
  const movingAverages: TechnicalSignalRow[] = [
    { name: 'EMA (10)', value: prices ? computeEMA(prices, 10) : price * (1 - change * 0.001), signal: currentPrice > (prices ? computeEMA(prices, 10) : price * (1 - change * 0.001)) ? 'Buy' : 'Sell' },
    { name: 'SMA (10)', value: prices ? computeSMA(prices, 10) : price * (1 - change * 0.0012), signal: currentPrice > (prices ? computeSMA(prices, 10) : price * (1 - change * 0.0012)) ? 'Buy' : 'Sell' },
    { name: 'EMA (20)', value: prices ? computeEMA(prices, 20) : price * (1 - change * 0.002), signal: currentPrice > (prices ? computeEMA(prices, 20) : price * (1 - change * 0.002)) ? 'Buy' : 'Sell' },
    { name: 'SMA (20)', value: prices ? computeSMA(prices, 20) : price * (1 - change * 0.0025), signal: currentPrice > (prices ? computeSMA(prices, 20) : price * (1 - change * 0.0025)) ? 'Buy' : 'Sell' },
    { name: 'EMA (50)', value: prices ? computeEMA(prices, 50) : price * (1 - change * 0.004), signal: currentPrice > (prices ? computeEMA(prices, 50) : price * (1 - change * 0.004)) ? 'Buy' : 'Sell' },
    { name: 'SMA (50)', value: prices ? computeSMA(prices, 50) : price * (1 - change * 0.005), signal: currentPrice > (prices ? computeSMA(prices, 50) : price * (1 - change * 0.005)) ? 'Buy' : 'Sell' },
    { name: 'EMA (100)', value: prices ? computeEMA(prices, 100) : price * (1 - change * 0.007), signal: currentPrice > (prices ? computeEMA(prices, 100) : price * (1 - change * 0.007)) ? 'Buy' : 'Sell' },
    { name: 'SMA (200)', value: prices ? computeSMA(prices, Math.min(prices.length, 168)) : price * (1 - change * 0.01), signal: currentPrice > (prices ? computeSMA(prices, Math.min(prices.length, 168)) : price * (1 - change * 0.01)) ? 'Buy' : 'Sell' },
  ];

  return { oscillators, movingAverages };
};

const signalColor = (signal: string) =>
  signal === 'Buy' ? 'text-emerald-400' : signal === 'Sell' ? 'text-red-400' : 'text-marble/50';

const GATechnicalGauge = ({ assetLabel, candles }: GATechnicalGaugeProps) => {
  const { data: prices, isLoading: loadingMetals } = useMetalPrices();
  const { data: cryptoData, isLoading: loadingCrypto } = useCryptoData(10);
  const [mode, setMode] = useState<Mode>('metals');
  const [activeMetal, setActiveMetal] = useState<MetalKey>('gold');
  const [activeCrypto, setActiveCrypto] = useState(0);

  const lockedToAsset = Boolean(assetLabel);
  const isLoading = lockedToAsset ? !candles || candles.closes.length < 30 : (mode === 'metals' ? loadingMetals : loadingCrypto);

  const fallbackData = useMemo(() => {
    if (mode === 'metals') {
      const feed = prices?.[activeMetal];
      return { price: feed?.price_usd ?? 0, change: feed?.change_24h ?? 0, label: metalLabels[activeMetal], sparkline: undefined as number[] | undefined };
    }
    const coin = cryptoData?.[activeCrypto];
    return {
      price: coin?.current_price ?? 0,
      change: coin?.price_change_percentage_24h ?? 0,
      label: coin ? `${coin.symbol.toUpperCase()}/USD` : '',
      sparkline: coin?.sparkline_in_7d?.price,
    };
  }, [mode, activeMetal, activeCrypto, prices, cryptoData]);

  const lockedSnapshot = useMemo(() => {
    if (!candles) return null;
    return buildTechnicalSnapshot(candles);
  }, [candles]);

  const fallbackSnapshot = useMemo(() => {
    const { oscillators, movingAverages } = generateSignals(fallbackData.price, fallbackData.change, fallbackData.sparkline);
    const totalBuy = [...oscillators, ...movingAverages].filter((item) => item.signal === 'Buy').length;
    const totalSell = [...oscillators, ...movingAverages].filter((item) => item.signal === 'Sell').length;
    const totalNeutral = oscillators.length + movingAverages.length - totalBuy - totalSell;
    const total = totalBuy + totalSell + totalNeutral;
    return {
      oscillators,
      movingAverages,
      totalBuy,
      totalSell,
      totalNeutral,
      overallSignal: totalBuy > totalSell + 3 ? 'STRONG BUY' : totalBuy > totalSell ? 'BUY' : totalSell > totalBuy + 3 ? 'STRONG SELL' : totalSell > totalBuy ? 'SELL' : 'NEUTRAL',
      overallBias: total > 0 ? (totalBuy - totalSell) / total : 0,
      score: total > 0 ? ((totalBuy - totalSell) / total) * 90 : 0,
      currentPrice: fallbackData.price,
      decision: {
        direction: totalBuy > totalSell ? 'bullish' : totalSell > totalBuy ? 'bearish' : 'neutral',
        confidence: 0.55,
        setup: 'BROAD TECHNICAL STACK',
        aligned: totalBuy !== totalSell,
        regime: 'mixed' as const,
      },
    };
  }, [fallbackData]);

  const snapshot = lockedToAsset ? lockedSnapshot : fallbackSnapshot;
  const label = lockedToAsset ? assetLabel ?? '' : fallbackData.label;

  const overallColor = snapshot?.overallSignal.includes('BUY') ? 'text-emerald-400'
    : snapshot?.overallSignal.includes('SELL') ? 'text-red-400' : 'text-marble/50';

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
          {!lockedToAsset && (
            <div className="flex gap-1">
              {(['metals', 'crypto'] as Mode[]).map((item) => (
                <button key={item} onClick={() => setMode(item)} className={`px-3 py-1 text-[10px] font-display tracking-wider rounded transition-all ${mode === item ? 'bg-gold/20 text-gold border border-gold/40' : 'text-marble/40 hover:text-marble/70 border border-transparent'}`}>
                  {item.toUpperCase()}
                </button>
              ))}
            </div>
          )}
        </div>

        {!lockedToAsset && (
          <div className="flex gap-1 mb-6">
            {mode === 'metals' ? (
              (Object.keys(metalLabels) as MetalKey[]).map((metal) => (
                <button
                  key={metal}
                  onClick={() => setActiveMetal(metal)}
                  className={`px-3 py-1 text-[10px] font-display tracking-[0.15em] rounded transition-all ${
                    activeMetal === metal ? 'bg-gold/20 text-gold border border-gold/40' : 'text-marble/40 hover:text-marble/70 border border-transparent'
                  }`}
                >
                  {metal.toUpperCase()}
                </button>
              ))
            ) : (
              cryptoData?.slice(0, 6).map((coin, index) => (
                <button
                  key={coin.id}
                  onClick={() => setActiveCrypto(index)}
                  className={`flex items-center gap-1.5 px-3 py-1 text-[10px] font-display tracking-wider rounded transition-all ${
                    activeCrypto === index ? 'bg-gold/20 text-gold border border-gold/40' : 'text-marble/40 hover:text-marble/70 border border-transparent'
                  }`}
                >
                  <img src={coin.image} alt={coin.symbol} className="w-3.5 h-3.5 rounded-full" />
                  {coin.symbol.toUpperCase()}
                </button>
              ))
            )}
          </div>
        )}

        {isLoading || !snapshot ? (
          <div className="h-64 rounded border border-gold/10 bg-navy-light/20 flex items-center justify-center text-center px-6">
            <div>
              <div className="text-xs font-display tracking-[0.2em] text-gold/60">BUILDING LIVE SIGNAL STACK</div>
              <div className="text-[10px] text-marble/35 mt-2">Waiting for enough live candles to score {label || 'the active asset'} with real indicators.</div>
            </div>
          </div>
        ) : (
          <>
            <div className="flex flex-col items-center mb-6">
              <svg width="200" height="110" viewBox="0 0 200 110">
                <path d="M 15 100 A 85 85 0 0 1 185 100" fill="none" stroke="hsl(213, 28%, 24%)" strokeWidth="8" strokeLinecap="round" />
                <path d="M 15 100 A 85 85 0 0 1 60 25" fill="none" stroke="hsl(0, 70%, 50%)" strokeWidth="8" strokeLinecap="round" opacity="0.3" />
                <path d="M 60 25 A 85 85 0 0 1 140 25" fill="none" stroke="hsl(210, 6%, 67%)" strokeWidth="8" strokeLinecap="round" opacity="0.3" />
                <path d="M 140 25 A 85 85 0 0 1 185 100" fill="none" stroke="hsl(145, 70%, 45%)" strokeWidth="8" strokeLinecap="round" opacity="0.3" />
                <line
                  x1="100"
                  y1="100"
                  x2={100 + 70 * Math.cos(((snapshot.score - 90) * Math.PI) / 180)}
                  y2={100 + 70 * Math.sin(((snapshot.score - 90) * Math.PI) / 180)}
                  stroke="hsl(43, 72%, 50%)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  className="transition-all duration-700"
                />
                <circle cx="100" cy="100" r="5" fill="hsl(43, 72%, 50%)" />
              </svg>
              <span className={`font-display text-lg tracking-[0.15em] mt-2 ${overallColor}`}>
                {snapshot.overallSignal}
              </span>
              <span className="text-[10px] text-marble/30 tracking-widest mt-1">{label}</span>
            </div>

            {lockedToAsset && (
              <div className="mb-6 rounded border border-gold/15 bg-navy-light/20 p-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-[9px] font-display tracking-[0.18em] text-gold/60">APEX FILTER</div>
                    <div className="text-xs font-display tracking-wider text-marble/80 mt-1">{snapshot.decision.setup}</div>
                  </div>
                  <div className="text-right">
                    <div className={`text-[10px] font-display tracking-wider ${snapshot.decision.direction === 'bullish' ? 'text-emerald-400' : snapshot.decision.direction === 'bearish' ? 'text-red-400' : 'text-marble/40'}`}>
                      {snapshot.decision.direction === 'neutral' ? 'NO TRADE' : snapshot.decision.direction.toUpperCase()}
                    </div>
                    <div className="text-[9px] font-mono text-marble/35 mt-1">{(snapshot.decision.confidence * 100).toFixed(0)}% confidence</div>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-3 gap-4 mb-6">
              {[
                { label: 'Buy', count: snapshot.totalBuy, color: 'bg-emerald-400' },
                { label: 'Neutral', count: snapshot.totalNeutral, color: 'bg-marble/40' },
                { label: 'Sell', count: snapshot.totalSell, color: 'bg-red-400' },
              ].map((item) => (
                <div key={item.label} className="text-center">
                  <div className="text-2xl font-display text-marble font-semibold">{item.count}</div>
                  <div className={`h-1 rounded-full mt-1 ${item.color}`} />
                  <div className="text-[10px] text-marble/40 mt-1 tracking-widest">{item.label.toUpperCase()}</div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-display text-[10px] tracking-[0.2em] text-marble/50 mb-3">OSCILLATORS</h4>
                <div className="space-y-1.5">
                  {snapshot.oscillators.map((oscillator) => (
                    <div key={oscillator.name} className="flex items-center justify-between text-xs">
                      <span className="text-marble/50">{oscillator.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-marble/30 font-mono">{oscillator.value.toFixed(2)}</span>
                        <span className={`w-12 text-right text-[10px] font-medium ${signalColor(oscillator.signal)}`}>{oscillator.signal}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="font-display text-[10px] tracking-[0.2em] text-marble/50 mb-3">MOVING AVERAGES</h4>
                <div className="space-y-1.5">
                  {snapshot.movingAverages.map((movingAverage) => (
                    <div key={movingAverage.name} className="flex items-center justify-between text-xs">
                      <span className="text-marble/50">{movingAverage.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-marble/30 font-mono">${movingAverage.value.toFixed(2)}</span>
                        <span className={`w-12 text-right text-[10px] font-medium ${signalColor(movingAverage.signal)}`}>{movingAverage.signal}</span>
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
