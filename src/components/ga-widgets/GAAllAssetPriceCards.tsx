import { useState, useEffect, useRef, useMemo } from 'react';
import { TrendingUp, TrendingDown, Minus, ChevronDown, ChevronUp } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import { WATCHLIST_CATEGORIES, SYNTHETIC_PRICES, CATEGORY_COLORS } from '@/data/tradingSymbols';
import { useWebSocketPrices, useSimulatedStream } from '@/hooks/useWebSocketPrices';
import { useMetalPrices } from '@/hooks/useMetalPrices';
import { useCryptoData } from '@/hooks/useCryptoData';
import LivePulse from './LivePulse';

const ALL_CRYPTO_KEYS = WATCHLIST_CATEGORIES
  .filter(c => c.label.startsWith('CRYPTO'))
  .flatMap(c => c.items.map(i => i.key));

const MAX_SPARK = 24;

// ─── Single Asset Card with simulated stream ─────────────
const AssetCard = ({
  symbolKey, label, ticker, cat, basePrice, baseChange, isWsLive,
}: {
  symbolKey: string; label: string; ticker: string; cat: string;
  basePrice: number; baseChange: number; isWsLive: boolean;
}) => {
  const { price: livePrice } = useSimulatedStream(basePrice, baseChange, symbolKey);
  const [spark, setSpark] = useState<{ v: number }[]>([]);
  const seeded = useRef(false);

  // Seed sparkline
  useEffect(() => {
    if (basePrice <= 0 || seeded.current) return;
    seeded.current = true;
    const start = basePrice / (1 + baseChange / 100);
    const pts = Array.from({ length: 16 }, (_, i) => {
      const p = i / 15;
      const noise = Math.sin(i * 1.3) * 0.002 * basePrice;
      return { v: start + (basePrice - start) * p + noise };
    });
    setSpark(pts);
  }, [basePrice, baseChange]);

  // Append live ticks
  useEffect(() => {
    if (livePrice > 0) {
      setSpark(prev => [...prev.slice(-MAX_SPARK + 1), { v: livePrice }]);
    }
  }, [livePrice]);

  const change = baseChange;
  const color = CATEGORY_COLORS[cat] ?? 'hsl(43, 72%, 50%)';
  const isPos = change > 0;
  const isNeg = change < 0;

  const formatP = (p: number) => {
    if (p === 0) return '—';
    if (p < 0.001) return p.toFixed(8);
    if (p < 0.01) return p.toFixed(6);
    if (p < 1) return p.toFixed(4);
    if (p < 10) return p.toFixed(3);
    if (p < 1000) return p.toFixed(2);
    return p.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <div className="relative rounded-sm overflow-hidden bg-gradient-to-br from-navy via-navy to-navy-light border border-gold/15 group transition-all duration-300 hover:border-gold/40 hover:shadow-[0_0_20px_-8px_hsla(43,72%,50%,0.12)]">
      <div className="ornate-corner ornate-corner-tl" />
      <div className="ornate-corner ornate-corner-tr" />

      <div className="relative z-10 p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
            <span className="font-display text-[9px] tracking-[0.2em] text-marble/45 truncate max-w-[80px]">{label}</span>
          </div>
          <LivePulse connected={isWsLive || basePrice > 0} label={isWsLive ? 'WS' : ''} />
        </div>

        {/* Ticker */}
        <span className="text-[8px] font-mono text-marble/25">{ticker}</span>

        {/* Price */}
        <div className="font-display text-lg text-marble font-semibold tracking-tight mt-0.5">
          {cat === 'forex' ? '' : '$'}{formatP(livePrice)}
        </div>

        {/* Change */}
        <div className={`flex items-center gap-1 text-[10px] font-mono mt-0.5 ${
          isPos ? 'text-emerald-400' : isNeg ? 'text-red-400' : 'text-marble/30'
        }`}>
          {isPos ? <TrendingUp className="w-2.5 h-2.5" /> : isNeg ? <TrendingDown className="w-2.5 h-2.5" /> : <Minus className="w-2.5 h-2.5" />}
          {isPos ? '+' : ''}{change.toFixed(2)}%
        </div>

        {/* Sparkline */}
        {spark.length > 2 && (
          <div className="h-10 mt-1.5 -mx-1">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={spark}>
                <defs>
                  <linearGradient id={`sp-${symbolKey}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity={0.35} />
                    <stop offset="100%" stopColor={color} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="v" stroke={color} strokeWidth={1.5} fill={`url(#sp-${symbolKey})`} dot={false} isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Main Component ──────────────────────────────────────
const GAAllAssetPriceCards = () => {
  const wsPrices = useWebSocketPrices(ALL_CRYPTO_KEYS);
  const { data: metalPrices } = useMetalPrices();
  const { data: cryptoData } = useCryptoData(30);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  // Build a crypto price lookup by key
  const cryptoLookup = useMemo(() => {
    const map: Record<string, { price: number; change: number }> = {};
    if (cryptoData) {
      const keyToId: Record<string, string> = {
        bitcoin: 'bitcoin', ethereum: 'ethereum', solana: 'solana',
        xrp: 'ripple', bnb: 'binancecoin', cardano: 'cardano',
        avalanche: 'avalanche-2', polkadot: 'polkadot', chainlink: 'chainlink',
        dogecoin: 'dogecoin', tron: 'tron',
      };
      cryptoData.forEach(coin => {
        const key = Object.entries(keyToId).find(([_, id]) => id === coin.id)?.[0] ?? coin.symbol;
        map[key] = { price: coin.current_price, change: coin.price_change_percentage_24h ?? 0 };
      });
    }
    return map;
  }, [cryptoData]);

  const resolvePrice = (key: string, cat: string): { price: number; change: number; wsLive: boolean } => {
    // 1. WebSocket (crypto)
    const ws = wsPrices[key];
    if (ws && ws.price > 0) {
      return { price: ws.price, change: ws.change24h, wsLive: true };
    }
    // 2. CoinGecko API (crypto)
    if (cat === 'crypto' && cryptoLookup[key]) {
      return { price: cryptoLookup[key].price, change: cryptoLookup[key].change, wsLive: false };
    }
    // 3. Metal price feeds (DB)
    if (cat === 'metals' && metalPrices?.[key as 'gold' | 'silver' | 'platinum']) {
      const m = metalPrices[key as 'gold' | 'silver' | 'platinum'];
      return { price: m.price_usd, change: m.change_24h ?? 0, wsLive: false };
    }
    // 4. Synthetic fallback
    const syn = SYNTHETIC_PRICES[key];
    if (syn) return { price: syn.p, change: syn.c, wsLive: false };
    return { price: 0, change: 0, wsLive: false };
  };

  const toggle = (label: string) => setCollapsed(prev => ({ ...prev, [label]: !prev[label] }));

  return (
    <div className="space-y-8">
      {WATCHLIST_CATEGORIES.map(category => {
        const isCollapsed = collapsed[category.label];
        const catColor = CATEGORY_COLORS[category.items[0]?.cat] ?? 'hsl(43,72%,50%)';

        return (
          <div key={category.label}>
            {/* Category header */}
            <button
              onClick={() => toggle(category.label)}
              className="flex items-center gap-3 w-full mb-4 group/cat"
            >
              <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: catColor }} />
              <span className="font-display text-xs tracking-[0.2em] text-gold-light/80">{category.label}</span>
              <span className="text-[10px] text-marble/25 font-mono">{category.items.length} assets</span>
              <div className="flex-1 h-px bg-gold/10" />
              {isCollapsed
                ? <ChevronDown className="w-4 h-4 text-marble/30 group-hover/cat:text-gold transition-colors" />
                : <ChevronUp className="w-4 h-4 text-marble/30 group-hover/cat:text-gold transition-colors" />
              }
            </button>

            {!isCollapsed && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                {category.items.map(item => {
                  const { price, change, wsLive } = resolvePrice(item.key, item.cat);
                  return (
                    <AssetCard
                      key={item.key}
                      symbolKey={item.key}
                      label={item.label}
                      ticker={item.ticker}
                      cat={item.cat}
                      basePrice={price}
                      baseChange={change}
                      isWsLive={wsLive}
                    />
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default GAAllAssetPriceCards;
