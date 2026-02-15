import { useCryptoTrending, useCryptoData } from '@/hooks/useCryptoData';
import { Flame, TrendingUp, TrendingDown, Sparkles } from 'lucide-react';
import LivePulse from './LivePulse';
import { useState } from 'react';

type View = 'trending' | 'volume' | 'market_cap';

const STABLECOINS = ['usdt', 'usdc', 'dai', 'busd', 'tusd', 'fdusd'];

const GATopMovers = () => {
  const { data: trending, isLoading: loadingTrending } = useCryptoTrending();
  const { data: crypto, isLoading: loadingCrypto } = useCryptoData(30);
  const [view, setView] = useState<View>('trending');

  const isLoading = loadingTrending || loadingCrypto;

  const qualified = (crypto ?? []).filter(c => c.market_cap > 1e9 && !STABLECOINS.includes(c.symbol));
  const byVolume = [...qualified].sort((a, b) => b.total_volume - a.total_volume).slice(0, 10);
  const byMarketCap = [...qualified].sort((a, b) => b.market_cap - a.market_cap).slice(0, 10);

  return (
    <div className="relative rounded-sm bg-gradient-to-br from-navy via-navy to-navy-light border border-gold/30 overflow-hidden">
      <div className="ornate-corner ornate-corner-tl" />
      <div className="ornate-corner ornate-corner-tr" />
      <div className="ornate-corner ornate-corner-bl" />
      <div className="ornate-corner ornate-corner-br" />

      <div className="p-6 md:p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Flame className="w-5 h-5 text-gold" />
            <h3 className="font-display text-lg tracking-[0.1em] text-gold-light">TOP MOVERS</h3>
            <LivePulse label="LIVE" />
          </div>
          <div className="flex gap-1">
            {([
              { key: 'trending', label: 'TRENDING' },
              { key: 'volume', label: 'VOLUME' },
              { key: 'market_cap', label: 'MKT CAP' },
            ] as { key: View; label: string }[]).map((v) => (
              <button key={v.key} onClick={() => setView(v.key)} className={`px-3 py-1 text-[10px] font-display tracking-wider rounded transition-all ${view === v.key ? 'bg-gold/20 text-gold border border-gold/40' : 'text-marble/40 hover:text-marble/70 border border-transparent'}`}>
                {v.label}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-2">{[...Array(8)].map((_, i) => <div key={i} className="h-10 bg-navy-light/30 rounded animate-pulse" />)}</div>
        ) : view === 'trending' ? (
          <div className="space-y-2">
            {trending?.slice(0, 10).map((t, i) => (
              <div key={t.item.id} className="flex items-center gap-3 p-2.5 rounded hover:bg-navy-light/20 transition-colors">
                <span className="text-[10px] text-marble/30 w-5 text-right font-mono">{i + 1}</span>
                <img src={t.item.thumb} alt={t.item.name} className="w-6 h-6 rounded-full" />
                <div className="flex-1">
                  <span className="font-display text-xs text-marble/80 tracking-wider">{t.item.name}</span>
                  <span className="text-[10px] text-marble/30 ml-2">{t.item.symbol}</span>
                </div>
                <Sparkles className="w-3.5 h-3.5 text-gold/50" />
                <span className="text-[10px] text-gold/60 font-display">Score: {t.item.score + 1}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {(view === 'volume' ? byVolume : byMarketCap).map((c, i) => {
              const change = c.price_change_percentage_24h ?? 0;
              const metric = view === 'volume' ? c.total_volume : c.market_cap;
              return (
                <div key={c.id} className="flex items-center gap-3 p-2.5 rounded hover:bg-navy-light/20 transition-colors">
                  <span className="text-[10px] text-marble/30 w-5 text-right font-mono">{i + 1}</span>
                  <img src={c.image} alt={c.name} className="w-6 h-6 rounded-full" />
                  <div className="flex-1 min-w-0">
                    <span className="font-display text-xs text-marble/80 tracking-wider">{c.name}</span>
                    <span className="text-[10px] text-marble/30 ml-2">{c.symbol.toUpperCase()}</span>
                  </div>
                  <span className="text-sm text-marble font-medium">${c.current_price < 1 ? c.current_price.toFixed(4) : c.current_price.toLocaleString('en-US', { maximumFractionDigits: 2 })}</span>
                  <span className={`text-[10px] font-medium w-14 text-right ${change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {change >= 0 ? '+' : ''}{change.toFixed(1)}%
                  </span>
                  <span className="text-[10px] text-marble/30 font-mono w-20 text-right">
                    ${(metric / 1e9).toFixed(1)}B
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default GATopMovers;
