import { Gauge, TrendingUp, TrendingDown, Zap } from 'lucide-react';
import { useMetalPrices } from '@/hooks/useMetalPrices';
import { useCryptoData } from '@/hooks/useCryptoData';
import { useOilGasPrices } from '@/hooks/useOilGasData';
import { useWebSocketPrices } from '@/hooks/useWebSocketPrices';
import LivePulse from './LivePulse';
import { useMemo } from 'react';

const CRYPTO_WS_KEYS = ['bitcoin', 'ethereum', 'solana', 'xrp', 'cardano', 'dogecoin'];

const GAMarketPulse = () => {
  const { data: metals } = useMetalPrices();
  const { data: crypto, isLoading } = useCryptoData(20);
  const { data: oil } = useOilGasPrices();
  const wsPrices = useWebSocketPrices(CRYPTO_WS_KEYS);

  // Live metal prices (raw API, no simulation)
  const goldLive = metals?.gold?.price_usd ?? 0;
  const silverLive = metals?.silver?.price_usd ?? 0;

  const fearGreed = useMemo(() => {
    if (!crypto?.length) return 50;
    const avg24h = crypto.slice(0, 10).reduce((s, c) => s + (c.price_change_percentage_24h ?? 0), 0) / 10;
    return Math.round(50 + avg24h * 5);
  }, [crypto]);
  const fgLabel = fearGreed > 75 ? 'EXTREME GREED' : fearGreed > 55 ? 'GREED' : fearGreed > 45 ? 'NEUTRAL' : fearGreed > 25 ? 'FEAR' : 'EXTREME FEAR';
  const fgColor = fearGreed > 55 ? 'text-emerald-400' : fearGreed < 45 ? 'text-red-400' : 'text-gold';

  const movers = useMemo(() => {
    if (!crypto?.length) return [];
    return [...crypto]
      .filter(c => !['tether', 'usd-coin', 'dai', 'staked-ether'].includes(c.id))
      .sort((a, b) => Math.abs(b.price_change_percentage_24h ?? 0) - Math.abs(a.price_change_percentage_24h ?? 0))
      .slice(0, 6);
  }, [crypto]);

  // Live spot prices
  const spots = useMemo(() => {
    const items: { label: string; price: number; change: number }[] = [];
    items.push({ label: 'GOLD', price: goldLive, change: metals?.gold?.change_24h ?? 0 });
    items.push({ label: 'SILVER', price: silverLive, change: metals?.silver?.change_24h ?? 0 });

    const btcWs = wsPrices.bitcoin;
    const btc = crypto?.find(c => c.id === 'bitcoin');
    items.push({ label: 'BTC', price: btcWs?.price ?? btc?.current_price ?? 0, change: btcWs?.change24h ?? btc?.price_change_percentage_24h ?? 0 });

    const ethWs = wsPrices.ethereum;
    const eth = crypto?.find(c => c.id === 'ethereum');
    items.push({ label: 'ETH', price: ethWs?.price ?? eth?.current_price ?? 0, change: ethWs?.change24h ?? eth?.price_change_percentage_24h ?? 0 });

    const wti = oil?.find(p => p.symbol === 'CL');
    if (wti) items.push({ label: 'WTI', price: wti.price, change: wti.change });
    return items;
  }, [metals, crypto, oil, goldLive, silverLive, wsPrices]);

  return (
    <div className="relative rounded-sm bg-gradient-to-br from-navy via-navy to-navy-light border border-gold/30 overflow-hidden">
      <div className="ornate-corner ornate-corner-tl" />
      <div className="ornate-corner ornate-corner-tr" />
      <div className="ornate-corner ornate-corner-bl" />
      <div className="ornate-corner ornate-corner-br" />

      <div className="p-6 md:p-8">
        <div className="flex items-center gap-3 mb-6">
          <Zap className="w-5 h-5 text-gold" />
          <h3 className="font-display text-lg tracking-[0.1em] text-gold-light">MARKET PULSE</h3>
          <LivePulse label="STREAMING" />
        </div>

        {isLoading ? (
          <div className="h-40 bg-navy-light/30 rounded animate-pulse" />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Sentiment */}
            <div className="bg-navy-light/15 rounded-lg p-4 border border-gold/10">
              <div className="text-[8px] font-display tracking-[0.2em] text-marble/30 mb-3">MARKET SENTIMENT</div>
              <div className="text-center">
                <div className={`text-4xl font-mono ${fgColor}`}>{fearGreed}</div>
                <div className={`text-[10px] font-display tracking-wider mt-1 ${fgColor}`}>{fgLabel}</div>
                <div className="mt-3 h-2 bg-navy-dark/50 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-red-500 via-gold to-emerald-500 rounded-full" style={{ width: `${fearGreed}%` }} />
                </div>
              </div>
            </div>

            {/* Top Movers */}
            <div className="bg-navy-light/15 rounded-lg p-4 border border-gold/10">
              <div className="text-[8px] font-display tracking-[0.2em] text-marble/30 mb-3">TOP MOVERS (24H)</div>
              <div className="space-y-1.5">
                {movers.map(m => {
                  const wsKey = CRYPTO_WS_KEYS.find(k => k === m.id);
                  const ws = wsKey ? wsPrices[wsKey] : undefined;
                  const change = ws?.change24h ?? m.price_change_percentage_24h ?? 0;
                  return (
                    <div key={m.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <img src={m.image} alt={m.name} className="w-4 h-4 rounded-full" />
                        <span className="text-[10px] font-mono text-marble/60">{m.symbol.toUpperCase()}</span>
                      </div>
                      <span className={`text-[10px] font-mono flex items-center gap-0.5 ${change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {change >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {change.toFixed(1)}%
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Spot Prices */}
            <div className="bg-navy-light/15 rounded-lg p-4 border border-gold/10">
              <div className="text-[8px] font-display tracking-[0.2em] text-marble/30 mb-3">SPOT PRICES · LIVE</div>
              <div className="space-y-2">
                {spots.map(s => (
                  <div key={s.label} className="flex items-center justify-between">
                    <span className="text-[10px] font-display tracking-wider text-marble/50">{s.label}</span>
                    <div className="text-right">
                      <span className="text-xs font-mono text-marble">${s.price.toLocaleString('en-US', { maximumFractionDigits: s.price < 10 ? 4 : 2 })}</span>
                      <span className={`text-[9px] font-mono ml-2 ${s.change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {s.change >= 0 ? '+' : ''}{s.change.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GAMarketPulse;
