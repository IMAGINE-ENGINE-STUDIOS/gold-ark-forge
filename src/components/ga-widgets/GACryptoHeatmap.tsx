import { useCryptoData } from '@/hooks/useCryptoData';
import { LayoutGrid } from 'lucide-react';
import LivePulse from './LivePulse';
import { useMemo } from 'react';

const categoryMap: Record<string, string> = {
  bitcoin: 'Store of Value', ethereum: 'Smart Contracts', tether: 'Stablecoin',
  'binance-coin': 'Exchange', solana: 'Smart Contracts', ripple: 'Payments',
  'usd-coin': 'Stablecoin', dogecoin: 'Meme', cardano: 'Smart Contracts',
  tron: 'Smart Contracts', avalanche: 'Smart Contracts', polkadot: 'Infrastructure',
  chainlink: 'Oracle', litecoin: 'Payments', stellar: 'Payments',
  'shiba-inu': 'Meme', uniswap: 'DeFi', hedera: 'Enterprise',
  polygon: 'Layer 2', filecoin: 'Storage',
};

const sectorColors: Record<string, string> = {
  'Store of Value': 'hsl(37, 90%, 55%)',
  'Smart Contracts': 'hsl(215, 70%, 55%)',
  'Stablecoin': 'hsl(210, 6%, 67%)',
  'Exchange': 'hsl(43, 72%, 50%)',
  'Payments': 'hsl(280, 60%, 55%)',
  'Meme': 'hsl(340, 70%, 55%)',
  'Infrastructure': 'hsl(170, 60%, 45%)',
  'Oracle': 'hsl(210, 4%, 76%)',
  'DeFi': 'hsl(145, 60%, 45%)',
  'Layer 2': 'hsl(260, 60%, 55%)',
  'Enterprise': 'hsl(200, 50%, 50%)',
  'Storage': 'hsl(30, 60%, 50%)',
};

const GACryptoHeatmap = () => {
  const { data: crypto, isLoading } = useCryptoData(30);

  const treemapData = useMemo(() => {
    if (!crypto) return [];
    const totalMcap = crypto.reduce((s, c) => s + c.market_cap, 0);
    return crypto.map((c) => {
      const sector = categoryMap[c.id] || 'Other';
      const pct = (c.market_cap / totalMcap) * 100;
      const change = c.price_change_percentage_24h ?? 0;
      return { ...c, sector, pct, change };
    });
  }, [crypto]);

  // Simple treemap layout: flex-wrap with sized boxes
  return (
    <div className="relative rounded-sm bg-gradient-to-br from-navy via-navy to-navy-light border border-gold/30 overflow-hidden">
      <div className="ornate-corner ornate-corner-tl" />
      <div className="ornate-corner ornate-corner-tr" />
      <div className="ornate-corner ornate-corner-bl" />
      <div className="ornate-corner ornate-corner-br" />

      <div className="p-6 md:p-8">
        <div className="flex items-center gap-3 mb-6">
          <LayoutGrid className="w-5 h-5 text-gold" />
          <h3 className="font-display text-lg tracking-[0.1em] text-gold-light">CRYPTO SECTOR HEATMAP</h3>
          <LivePulse label="LIVE" />
        </div>

        {isLoading ? (
          <div className="h-80 bg-navy-light/30 rounded animate-pulse" />
        ) : (
          <>
            <div className="flex flex-wrap gap-1.5" style={{ minHeight: 300 }}>
              {treemapData.map((coin) => {
                const size = Math.max(coin.pct * 3.5, 2.5);
                const bgOpacity = Math.min(Math.abs(coin.change) / 10, 0.8);
                const bgColor = coin.change >= 0
                  ? `hsla(145, 70%, 45%, ${bgOpacity})`
                  : `hsla(0, 70%, 50%, ${bgOpacity})`;

                return (
                  <div
                    key={coin.id}
                    className="rounded-sm border border-gold/10 flex flex-col items-center justify-center text-center transition-all hover:border-gold/30 hover:scale-[1.02] cursor-default group relative"
                    style={{
                      width: `${size}%`,
                      minWidth: 60,
                      minHeight: 60,
                      flexGrow: coin.pct,
                      backgroundColor: bgColor,
                    }}
                  >
                    <img src={coin.image} alt={coin.name} className="w-5 h-5 rounded-full mb-1 opacity-80" />
                    <span className="font-display text-[9px] tracking-widest text-marble/80">{coin.symbol.toUpperCase()}</span>
                    <span className={`text-[10px] font-medium ${coin.change >= 0 ? 'text-emerald-300' : 'text-red-300'}`}>
                      {coin.change >= 0 ? '+' : ''}{coin.change.toFixed(1)}%
                    </span>

                    {/* Tooltip */}
                    <div className="absolute -top-16 left-1/2 -translate-x-1/2 bg-navy-dark border border-gold/30 rounded px-3 py-2 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-20 whitespace-nowrap pointer-events-none">
                      <div className="text-[10px] text-marble/60">{coin.name}</div>
                      <div className="text-xs text-marble font-medium">${coin.current_price.toLocaleString()}</div>
                      <div className="text-[9px] text-marble/40">MCap: ${(coin.market_cap / 1e9).toFixed(1)}B</div>
                      <div className="text-[9px] text-gold/50">{coin.sector}</div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Sector Legend */}
            <div className="flex flex-wrap gap-3 mt-4">
              {Object.entries(sectorColors).slice(0, 8).map(([sector, color]) => (
                <div key={sector} className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                  <span className="text-[9px] text-marble/40 tracking-wider font-display">{sector}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default GACryptoHeatmap;
