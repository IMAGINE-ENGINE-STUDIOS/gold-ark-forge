import { useCryptoData, useCryptoGlobal } from '@/hooks/useCryptoData';
import { useMetalPrices } from '@/hooks/useMetalPrices';
import { Globe, TrendingUp, TrendingDown, Activity } from 'lucide-react';
import LivePulse from './LivePulse';
import AnimatedNumber from './AnimatedNumber';

const GAMarketSummary = () => {
  const { data: global, isLoading: loadingGlobal } = useCryptoGlobal();
  const { data: crypto, isLoading: loadingCrypto } = useCryptoData(20);
  const { data: metals, isLoading: loadingMetals } = useMetalPrices();

  const isLoading = loadingGlobal || loadingCrypto || loadingMetals;

  const gainers = (crypto ?? []).filter((c) => (c.price_change_percentage_24h ?? 0) > 0).sort((a, b) => (b.price_change_percentage_24h ?? 0) - (a.price_change_percentage_24h ?? 0)).slice(0, 5);
  const losers = (crypto ?? []).filter((c) => (c.price_change_percentage_24h ?? 0) < 0).sort((a, b) => (a.price_change_percentage_24h ?? 0) - (b.price_change_percentage_24h ?? 0)).slice(0, 5);

  return (
    <div className="relative rounded-sm bg-gradient-to-br from-navy via-navy to-navy-light border border-gold/30 overflow-hidden">
      <div className="ornate-corner ornate-corner-tl" />
      <div className="ornate-corner ornate-corner-tr" />
      <div className="ornate-corner ornate-corner-bl" />
      <div className="ornate-corner ornate-corner-br" />

      <div className="p-6 md:p-8">
        <div className="flex items-center gap-3 mb-6">
          <Globe className="w-5 h-5 text-gold" />
          <h3 className="font-display text-lg tracking-[0.1em] text-gold-light">GLOBAL MARKET OVERVIEW</h3>
          <LivePulse label="LIVE" />
        </div>

        {isLoading ? (
          <div className="space-y-4">{[...Array(4)].map((_, i) => <div key={i} className="h-20 bg-navy-light/30 rounded animate-pulse" />)}</div>
        ) : (
          <>
            {/* Global Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {[
                { label: 'TOTAL MARKET CAP', value: (global?.total_market_cap?.usd ?? 0) / 1e12, suffix: 'T', prefix: '$' },
                { label: '24H VOLUME', value: (global?.total_volume?.usd ?? 0) / 1e9, suffix: 'B', prefix: '$' },
                { label: 'BTC DOMINANCE', value: global?.market_cap_percentage?.btc ?? 0, suffix: '%', prefix: '' },
                { label: 'ACTIVE COINS', value: global?.active_cryptocurrencies ?? 0, suffix: '', prefix: '' },
              ].map((stat) => (
                <div key={stat.label} className="bg-navy-dark/50 border border-gold/10 rounded-sm p-4">
                  <div className="text-[10px] text-marble/40 tracking-widest font-display mb-2">{stat.label}</div>
                  <div className="font-display text-xl text-marble font-semibold">
                    {stat.prefix}<AnimatedNumber value={stat.value} decimals={stat.suffix === '%' ? 1 : 2} />{stat.suffix}
                  </div>
                </div>
              ))}
            </div>

            {/* Metal Prices Row */}
            <div className="mb-8">
              <h4 className="font-display text-[10px] tracking-[0.3em] text-marble/40 mb-3">PRECIOUS METALS</h4>
              <div className="grid grid-cols-3 gap-4">
                {(['gold', 'silver', 'platinum'] as const).map((m) => {
                  const feed = metals?.[m];
                  const change = feed?.change_24h ?? 0;
                  return (
                    <div key={m} className="bg-navy-dark/40 border border-gold/10 rounded-sm p-3 flex items-center justify-between">
                      <div>
                        <span className="font-display text-[10px] tracking-widest text-marble/50">{m.toUpperCase()}</span>
                        <div className="font-display text-lg text-marble font-semibold">
                          ${(feed?.price_usd ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </div>
                      </div>
                      <span className={`text-xs font-medium ${change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {change >= 0 ? '+' : ''}{change.toFixed(2)}%
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Gainers & Losers */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-display text-[10px] tracking-[0.3em] text-emerald-400/70 mb-3 flex items-center gap-2">
                  <TrendingUp className="w-3.5 h-3.5" /> TOP GAINERS (24H)
                </h4>
                <div className="space-y-1.5">
                  {gainers.map((c) => (
                    <div key={c.id} className="flex items-center gap-3 p-2 rounded hover:bg-navy-light/20 transition-colors">
                      <img src={c.image} alt={c.name} className="w-5 h-5 rounded-full" />
                      <span className="font-display text-xs text-marble/70 tracking-wider flex-1">{c.symbol.toUpperCase()}</span>
                      <span className="text-sm text-marble font-medium">${c.current_price < 1 ? c.current_price.toFixed(4) : c.current_price.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                      <span className="text-xs text-emerald-400 font-medium w-16 text-right">+{(c.price_change_percentage_24h ?? 0).toFixed(2)}%</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="font-display text-[10px] tracking-[0.3em] text-red-400/70 mb-3 flex items-center gap-2">
                  <TrendingDown className="w-3.5 h-3.5" /> TOP LOSERS (24H)
                </h4>
                <div className="space-y-1.5">
                  {losers.map((c) => (
                    <div key={c.id} className="flex items-center gap-3 p-2 rounded hover:bg-navy-light/20 transition-colors">
                      <img src={c.image} alt={c.name} className="w-5 h-5 rounded-full" />
                      <span className="font-display text-xs text-marble/70 tracking-wider flex-1">{c.symbol.toUpperCase()}</span>
                      <span className="text-sm text-marble font-medium">${c.current_price < 1 ? c.current_price.toFixed(4) : c.current_price.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                      <span className="text-xs text-red-400 font-medium w-16 text-right">{(c.price_change_percentage_24h ?? 0).toFixed(2)}%</span>
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

export default GAMarketSummary;
