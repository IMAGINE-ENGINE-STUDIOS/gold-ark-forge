import { useState, useMemo } from 'react';
import { LayoutGrid } from 'lucide-react';
import LivePulse from './LivePulse';
import { useCryptoData } from '@/hooks/useCryptoData';
import { useForexRates } from '@/hooks/useForexRates';
import { useOilGasPrices } from '@/hooks/useOilGasData';
import { useMetalPrices } from '@/hooks/useMetalPrices';
import { WATCHLIST_CATEGORIES, ALL_SYMBOLS } from '@/data/tradingSymbols';
import { quoteIdFor } from '@/lib/priceSource';
import { useMarketQuotes } from '@/hooks/useMarketQuotes';

// Live quote lookup for a list of catalog keys — no synthetic fallback.
function useKeyQuotes(keys: string[]) {
  const ids = keys.map((k) => {
    const sym = ALL_SYMBOLS.find((s) => s.key === k);
    return sym ? quoteIdFor(sym) : null;
  });
  const { quotes } = useMarketQuotes(ids, 30000);
  const byKey: Record<string, { p: number; c: number }> = {};
  keys.forEach((k, i) => {
    const id = ids[i];
    const q = id ? quotes[id] : undefined;
    if (q && q.last > 0) byKey[k] = { p: q.last, c: q.change24h ?? 0 };
  });
  return byKey;
}

const TABS = ['CRYPTO', 'STOCKS', 'FOREX', 'ENERGY', 'METALS', 'BONDS'] as const;
type Tab = (typeof TABS)[number];

// ─── CRYPTO TAB ──────────────────────────────────────────
const categoryMap: Record<string, string> = {
  bitcoin: 'Store of Value', ethereum: 'Smart Contracts', tether: 'Stablecoin',
  'binance-coin': 'Exchange', solana: 'Smart Contracts', ripple: 'Payments',
  'usd-coin': 'Stablecoin', dogecoin: 'Meme', cardano: 'Smart Contracts',
  tron: 'Smart Contracts', avalanche: 'Smart Contracts', polkadot: 'Infrastructure',
  chainlink: 'Oracle', litecoin: 'Payments', stellar: 'Payments',
  'shiba-inu': 'Meme', uniswap: 'DeFi', hedera: 'Enterprise',
  polygon: 'Layer 2', filecoin: 'Storage',
};

function CryptoHeatmap() {
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

  if (isLoading) return <div className="h-80 bg-navy-light/30 rounded animate-pulse" />;
  return (
    <div className="flex flex-wrap gap-1.5" style={{ minHeight: 300 }}>
      {treemapData.map((coin) => {
        const size = Math.max(coin.pct * 3.5, 2.5);
        const bgOpacity = Math.min(Math.abs(coin.change) / 10, 0.8);
        const bgColor = coin.change >= 0 ? `hsla(145, 70%, 45%, ${bgOpacity})` : `hsla(0, 70%, 50%, ${bgOpacity})`;
        return (
          <div key={coin.id} className="rounded-sm border border-gold/10 flex flex-col items-center justify-center text-center transition-all hover:border-gold/30 hover:scale-[1.02] cursor-default group relative"
            style={{ width: `${size}%`, minWidth: 60, minHeight: 60, flexGrow: coin.pct, backgroundColor: bgColor }}>
            <img src={coin.image} alt={coin.name} className="w-5 h-5 rounded-full mb-1 opacity-80" />
            <span className="font-display text-[9px] tracking-widest text-marble/80">{coin.symbol.toUpperCase()}</span>
            <span className={`text-[10px] font-medium ${coin.change >= 0 ? 'text-emerald-300' : 'text-red-300'}`}>
              {coin.change >= 0 ? '+' : ''}{coin.change.toFixed(1)}%
            </span>
            <div className="absolute -top-16 left-1/2 -translate-x-1/2 bg-navy-dark border border-gold/30 rounded px-3 py-2 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-20 whitespace-nowrap pointer-events-none">
              <div className="text-[10px] text-marble/60">{coin.name}</div>
              <div className="text-xs text-marble font-medium">${coin.current_price.toLocaleString()}</div>
              <div className="text-[9px] text-marble/40">MCap: ${(coin.market_cap / 1e9).toFixed(1)}B</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── STOCKS TAB ──────────────────────────────────────────
const stockSectors: Record<string, { label: string; color: string; keys: string[] }> = {
  tech: { label: 'Technology', color: 'hsl(217, 91%, 60%)', keys: ['aapl', 'msft', 'nvda', 'googl', 'amzn', 'meta', 'crm', 'adbe', 'nflx', 'amd', 'avgo', 'orcl', 'pltr', 'coin'] },
  energy: { label: 'Energy', color: 'hsl(25, 95%, 53%)', keys: ['xom', 'cvx', 'cop', 'slb', 'bp', 'shel', 'oxy'] },
  finance: { label: 'Finance', color: 'hsl(43, 72%, 50%)', keys: ['jpm', 'gs', 'ms', 'bac', 'c', 'wfc', 'v'] },
  mining: { label: 'Mining', color: 'hsl(170, 70%, 50%)', keys: ['nem', 'gold_stock', 'fmg', 'rio', 'bhp', 'vale'] },
  index: { label: 'Indices', color: 'hsl(262, 83%, 58%)', keys: ['sp500', 'nasdaq', 'dow', 'russell'] },
};

function StocksHeatmap() {
  const allKeys = Object.values(stockSectors).flatMap((s) => s.keys);
  const priceByKey = useKeyQuotes(allKeys);
  return (
    <div className="space-y-3">
      {Object.values(stockSectors).map((sector) => (
        <div key={sector.label}>
          <div className="text-[8px] font-display tracking-[0.2em] text-marble/30 mb-1">{sector.label.toUpperCase()}</div>
          <div className="flex flex-wrap gap-1">
            {sector.keys.map((key) => {
              const sp = priceByKey[key];
              if (!sp) return null;
              const bgOpacity = Math.min(Math.abs(sp.c) / 3, 0.7);
              const bgColor = sp.c >= 0 ? `hsla(145, 70%, 45%, ${bgOpacity})` : `hsla(0, 70%, 50%, ${bgOpacity})`;
              const sym = WATCHLIST_CATEGORIES.flatMap(c => c.items).find(s => s.key === key);
              return (
                <div key={key} className="rounded-sm border border-gold/10 flex flex-col items-center justify-center text-center p-2 transition-all hover:border-gold/30 hover:scale-[1.02] cursor-default"
                  style={{ minWidth: 65, flexGrow: 1, backgroundColor: bgColor }}>
                  <span className="font-display text-[9px] tracking-wider text-marble/80">{sym?.ticker || key.toUpperCase()}</span>
                  <span className="text-[10px] font-mono text-marble/60">${sp.p.toLocaleString()}</span>
                  <span className={`text-[10px] font-medium ${sp.c >= 0 ? 'text-emerald-300' : 'text-red-300'}`}>
                    {sp.c >= 0 ? '+' : ''}{sp.c.toFixed(2)}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── FOREX TAB ───────────────────────────────────────────
function ForexHeatmap() {
  const { data: rates, isLoading } = useForexRates();
  const currencies = ['USD', 'EUR', 'GBP', 'JPY', 'CHF', 'AUD', 'CAD'];
  if (isLoading) return <div className="h-60 bg-navy-light/30 rounded animate-pulse" />;
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className="text-[8px] text-marble/20 font-display p-1" />
            {currencies.map(c => <th key={c} className="text-[8px] text-marble/40 font-mono p-1.5">{c}</th>)}
          </tr>
        </thead>
        <tbody>
          {currencies.map(base => (
            <tr key={base}>
              <td className="text-[8px] text-marble/40 font-mono p-1.5 font-bold">{base}</td>
              {currencies.map(quote => {
                if (base === quote) return <td key={quote} className="p-1 text-center bg-gold/20 rounded text-[9px] font-mono text-gold">1.00</td>;
                const rate = rates?.[base]?.rates?.[quote];
                if (!rate) return <td key={quote} className="p-1 text-center text-[9px] text-marble/20">—</td>;
                const strength = rate > 1 ? Math.min((rate - 1) * 0.5, 0.6) : Math.min((1 - rate) * 0.5, 0.6);
                const bg = rate > 1 ? `hsla(145, 60%, 45%, ${strength})` : `hsla(0, 60%, 50%, ${strength})`;
                return (
                  <td key={quote} className="p-1 text-center rounded text-[9px] font-mono text-marble/70 transition-colors hover:ring-1 hover:ring-gold/30 cursor-default" style={{ backgroundColor: bg }}>
                    {rate.toFixed(rate > 100 ? 1 : 4)}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── ENERGY TAB ──────────────────────────────────────────
function EnergyHeatmap() {
  const { data: prices, isLoading } = useOilGasPrices();
  if (isLoading) return <div className="h-40 bg-navy-light/30 rounded animate-pulse" />;
  return (
    <div className="space-y-2">
      {(prices || []).map(p => {
        const barWidth = Math.min(Math.abs(p.change) * 10, 100);
        const isPositive = p.change >= 0;
        return (
          <div key={p.symbol} className="flex items-center gap-3 p-2 rounded border border-gold/10 bg-navy-light/10 hover:border-gold/20 transition-colors">
            <div className="w-16 text-[10px] font-mono text-marble/60">{p.symbol}</div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-mono text-marble">${p.price.toFixed(2)}</span>
                <span className={`text-[10px] font-mono ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                  {isPositive ? '+' : ''}{p.change.toFixed(2)}%
                </span>
              </div>
              <div className="h-1.5 bg-navy-dark/50 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${isPositive ? 'bg-emerald-500/60' : 'bg-red-500/60'}`} style={{ width: `${barWidth}%` }} />
              </div>
            </div>
            <div className="text-[8px] text-marble/25 w-14 text-right">{p.unit}</div>
          </div>
        );
      })}
    </div>
  );
}

// ─── METALS TAB ──────────────────────────────────────────
function MetalsHeatmap() {
  const { data: metalPrices, isLoading } = useMetalPrices();
  if (isLoading) return <div className="h-40 bg-navy-light/30 rounded animate-pulse" />;
  const metals = [
    { key: 'gold', label: 'GOLD', symbol: 'XAU', color: 'hsl(43, 72%, 50%)' },
    { key: 'silver', label: 'SILVER', symbol: 'XAG', color: 'hsl(210, 6%, 67%)' },
    { key: 'platinum', label: 'PLATINUM', symbol: 'XPT', color: 'hsl(200, 20%, 70%)' },
  ];
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      {metals.map(m => {
        const feed = metalPrices?.[m.key];
        const price = feed?.price_usd ?? 0;
        const change = feed?.change_24h ?? 0;
        const bgOpacity = Math.min(Math.abs(change) / 5, 0.5);
        const bg = change >= 0 ? `hsla(145, 60%, 45%, ${bgOpacity})` : `hsla(0, 60%, 50%, ${bgOpacity})`;
        return (
          <div key={m.key} className="rounded border border-gold/15 p-4 text-center transition-all hover:border-gold/30" style={{ backgroundColor: bg }}>
            <div className="w-3 h-3 rounded-full mx-auto mb-2" style={{ backgroundColor: m.color }} />
            <div className="font-display text-sm tracking-[0.15em] text-marble/80">{m.label}</div>
            <div className="font-mono text-lg text-marble mt-1">${price.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
            <div className={`text-xs font-mono mt-1 ${change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {change >= 0 ? '+' : ''}{change.toFixed(2)}%
            </div>
            <div className="text-[8px] text-marble/25 mt-1">{m.symbol}/USD · TROY OZ</div>
          </div>
        );
      })}
    </div>
  );
}

// ─── BONDS TAB ───────────────────────────────────────────
function BondsHeatmap() {
  const bondKeys = ['tlt', 'ief', 'shy', 'tip', 'lqd', 'hyg', 'bnd', 'agg', 'mub', 'emb', 'govt', 'vcsh'];
  const bondLabels: Record<string, string> = {
    tlt: '20Y Treasury', ief: '10Y Treasury', shy: '1-3Y Treasury', tip: 'TIPS',
    lqd: 'IG Corp', hyg: 'HY Corp', bnd: 'Total Bond', agg: 'US Agg',
    mub: 'Muni', emb: 'EM Bond', govt: 'US Treasury', vcsh: 'Short Corp',
  };
  const priceByKey = useKeyQuotes(bondKeys);
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
      {bondKeys.map(key => {
        const sp = priceByKey[key];
        if (!sp) return null;
        const yieldEst = (100 - sp.p) / 20;
        const yieldColor = yieldEst > 3 ? 'hsla(0, 60%, 50%, 0.3)' : yieldEst > 1.5 ? 'hsla(43, 60%, 50%, 0.2)' : 'hsla(145, 60%, 45%, 0.2)';
        return (
          <div key={key} className="rounded border border-gold/10 p-3 text-center transition-all hover:border-gold/25 cursor-default" style={{ backgroundColor: yieldColor }}>
            <div className="text-[8px] font-display tracking-wider text-marble/40">{bondLabels[key]}</div>
            <div className="font-mono text-sm text-marble mt-1">${sp.p.toFixed(2)}</div>
            <div className={`text-[10px] font-mono ${sp.c >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {sp.c >= 0 ? '+' : ''}{sp.c.toFixed(2)}%
            </div>
            <div className="text-[8px] text-marble/20 mt-0.5">~{yieldEst.toFixed(1)}% yield</div>
          </div>
        );
      })}
    </div>
  );
}

// ─── MAIN COMPONENT ──────────────────────────────────────
const GAMarketHeatmap = () => {
  const [tab, setTab] = useState<Tab>('CRYPTO');

  return (
    <div className="relative rounded-sm bg-gradient-to-br from-navy via-navy to-navy-light border border-gold/30 overflow-hidden">
      <div className="ornate-corner ornate-corner-tl" />
      <div className="ornate-corner ornate-corner-tr" />
      <div className="ornate-corner ornate-corner-bl" />
      <div className="ornate-corner ornate-corner-br" />

      <div className="p-6 md:p-8">
        <div className="flex items-center gap-3 mb-4">
          <LayoutGrid className="w-5 h-5 text-gold" />
          <h3 className="font-display text-lg tracking-[0.1em] text-gold-light">MULTI-MARKET HEATMAP</h3>
          <LivePulse label="LIVE" />
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 overflow-x-auto">
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-1.5 rounded text-[9px] font-display tracking-[0.15em] transition-all whitespace-nowrap ${
                tab === t ? 'bg-gold/15 text-gold border border-gold/30' : 'text-marble/30 border border-gold/5 hover:text-marble/50 hover:border-gold/15'
              }`}>
              {t}
            </button>
          ))}
        </div>

        {tab === 'CRYPTO' && <CryptoHeatmap />}
        {tab === 'STOCKS' && <StocksHeatmap />}
        {tab === 'FOREX' && <ForexHeatmap />}
        {tab === 'ENERGY' && <EnergyHeatmap />}
        {tab === 'METALS' && <MetalsHeatmap />}
        {tab === 'BONDS' && <BondsHeatmap />}
      </div>
    </div>
  );
};

export default GAMarketHeatmap;
