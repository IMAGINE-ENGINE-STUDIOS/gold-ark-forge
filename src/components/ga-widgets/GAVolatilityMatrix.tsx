import { useMemo } from 'react';
import { Activity, AlertTriangle } from 'lucide-react';
import { useCryptoData } from '@/hooks/useCryptoData';
import { useMetalPrices } from '@/hooks/useMetalPrices';
import { useOilGasPrices } from '@/hooks/useOilGasData';
import { useWebSocketPrices } from '@/hooks/useWebSocketPrices';
import LivePulse from './LivePulse';

const CRYPTO_WS_KEYS = ['bitcoin', 'ethereum', 'solana', 'xrp', 'cardano', 'dogecoin', 'avalanche'];

interface VolItem {
  name: string;
  symbol: string;
  vol24h: number;
  vol7d: number;
  price: number;
  category: string;
}

const GAVolatilityMatrix = () => {
  const { data: crypto } = useCryptoData(15);
  const { data: metals } = useMetalPrices();
  const { data: oil } = useOilGasPrices();
  const wsPrices = useWebSocketPrices(CRYPTO_WS_KEYS);

  const items = useMemo((): VolItem[] => {
    const list: VolItem[] = [];
    crypto?.slice(0, 8).filter(c => !['tether', 'usd-coin', 'dai'].includes(c.id)).forEach(c => {
      list.push({
        name: c.name, symbol: c.symbol.toUpperCase(),
        vol24h: Math.abs(c.price_change_percentage_24h ?? 0),
        vol7d: Math.abs(c.price_change_percentage_7d_in_currency ?? 0),
        price: c.current_price, category: 'CRYPTO',
      });
    });
    if (metals?.gold) list.push({ name: 'Gold', symbol: 'XAU', vol24h: Math.abs(metals.gold.change_24h ?? 0), vol7d: 0, price: metals.gold.price_usd, category: 'METALS' });
    if (metals?.silver) list.push({ name: 'Silver', symbol: 'XAG', vol24h: Math.abs(metals.silver.change_24h ?? 0), vol7d: 0, price: metals.silver.price_usd, category: 'METALS' });
    oil?.slice(0, 2).forEach(p => {
      list.push({ name: p.name, symbol: p.symbol, vol24h: Math.abs(p.change), vol7d: 0, price: p.price, category: 'ENERGY' });
    });
    return list.sort((a, b) => b.vol24h - a.vol24h);
  }, [crypto, metals, oil]);

  const getLevel = (v: number) => {
    if (v > 5) return { label: 'EXTREME', color: 'text-red-400', bg: 'bg-red-500' };
    if (v > 3) return { label: 'HIGH', color: 'text-amber-400', bg: 'bg-amber-500' };
    if (v > 1) return { label: 'MODERATE', color: 'text-gold', bg: 'bg-gold' };
    return { label: 'LOW', color: 'text-emerald-400', bg: 'bg-emerald-500' };
  };

  const avgVol = items.length ? items.reduce((s, i) => s + i.vol24h, 0) / items.length : 0;
  const marketLevel = getLevel(avgVol);

  return (
    <div className="relative rounded-sm bg-gradient-to-br from-navy via-navy to-navy-light border border-gold/30 overflow-hidden">
      <div className="ornate-corner ornate-corner-tl" />
      <div className="ornate-corner ornate-corner-tr" />
      <div className="ornate-corner ornate-corner-bl" />
      <div className="ornate-corner ornate-corner-br" />

      <div className="p-6 md:p-8">
        <div className="flex items-center gap-3 mb-6">
          <Activity className="w-5 h-5 text-gold" />
          <h3 className="font-display text-lg tracking-[0.1em] text-gold-light">VOLATILITY MATRIX</h3>
          <LivePulse label="LIVE" />
        </div>

        {/* Market-Wide Gauge */}
        <div className="bg-navy-light/15 rounded-lg p-4 border border-gold/10 mb-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[8px] font-display tracking-[0.2em] text-marble/30">MARKET-WIDE VOLATILITY</div>
              <div className={`text-2xl font-mono mt-1 ${marketLevel.color}`}>{avgVol.toFixed(2)}%</div>
              <div className={`text-[9px] font-display tracking-wider ${marketLevel.color}`}>{marketLevel.label}</div>
            </div>
            <div className="flex flex-col items-end gap-1">
              {items.filter(i => i.vol24h > 5).length > 0 && (
                <div className="flex items-center gap-1 text-[8px] text-red-400">
                  <AlertTriangle className="w-3 h-3" />
                  <span>{items.filter(i => i.vol24h > 5).length} EXTREME VOL ASSET{items.filter(i => i.vol24h > 5).length > 1 ? 'S' : ''}</span>
                </div>
              )}
              <div className="text-[8px] text-marble/20 font-mono">{items.length} assets tracked</div>
            </div>
          </div>
          {/* Vol distribution bar */}
          <div className="h-2 bg-navy-dark/50 rounded-full mt-3 overflow-hidden flex">
            {items.map((item, i) => {
              const level = getLevel(item.vol24h);
              return <div key={i} className={`h-full ${level.bg}`} style={{ width: `${100 / items.length}%`, opacity: 0.5 + (item.vol24h / 10) * 0.5 }} />;
            })}
          </div>
        </div>

        {/* Volatility Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
          {items.map(item => {
            const level = getLevel(item.vol24h);
            return (
              <div key={item.symbol} className={`bg-navy-light/10 rounded-lg p-3 border border-gold/5 hover:border-gold/15 transition-colors`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-display tracking-wider text-marble/60">{item.symbol}</span>
                  <div className={`w-2 h-2 rounded-full ${level.bg}`} style={{ opacity: 0.7 }} />
                </div>
                <div className="text-xs font-mono text-marble mb-1">${item.price < 10 ? item.price.toFixed(4) : item.price.toLocaleString('en-US', { maximumFractionDigits: 2 })}</div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[7px] text-marble/25">24H VOL</div>
                    <div className={`text-[10px] font-mono ${level.color}`}>{item.vol24h.toFixed(2)}%</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[7px] text-marble/25">7D VOL</div>
                    <div className="text-[10px] font-mono text-marble/40">{item.vol7d.toFixed(2)}%</div>
                  </div>
                </div>
                {/* Vol bar */}
                <div className="h-1 bg-navy-dark/40 rounded-full mt-1.5 overflow-hidden">
                  <div className={`h-full rounded-full ${level.bg}`} style={{ width: `${Math.min(item.vol24h * 10, 100)}%`, opacity: 0.6 }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default GAVolatilityMatrix;
