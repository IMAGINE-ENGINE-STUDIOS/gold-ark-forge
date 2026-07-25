import { useState, useEffect, useRef, useMemo } from 'react';
import { TrendingUp, TrendingDown, Minus, ChevronDown, ChevronUp, Activity } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import { WATCHLIST_CATEGORIES, CATEGORY_COLORS } from '@/data/tradingSymbols';
import { bootstrapFeeds, useFeedHealth } from '@/hooks/useMarketFeed';
import { useLiveMarketData } from '@/hooks/useLiveMarketData';
import { buildTradingViewSymbols } from '@/lib/feeds/tradingViewSymbols';
import LivePulse from './LivePulse';

const MAX_SPARK = 24;

// ─── Single Asset Card with real live stream only ─────────────
const AssetCard = ({
  symbolKey, label, ticker, cat, basePrice, baseChange, isWsLive,
}: {
  symbolKey: string; label: string; ticker: string; cat: string;
  basePrice: number; baseChange: number; isWsLive: boolean;
}) => {
  const livePrice = basePrice;
  const [spark, setSpark] = useState<{ v: number }[]>([]);
  const lastPrice = useRef(0);

  useEffect(() => {
    if (livePrice > 0 && livePrice !== lastPrice.current) {
      lastPrice.current = livePrice;
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

      <div className="relative z-10 p-3 sm:p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-1 gap-1">
          <div className="flex items-center gap-1 min-w-0">
            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
            <span className="font-display text-[8px] sm:text-[9px] tracking-[0.15em] sm:tracking-[0.2em] text-marble/45 truncate">{label}</span>
          </div>
          <div className="flex-shrink-0">
            <LivePulse connected={isWsLive || basePrice > 0} label={isWsLive ? 'WS' : ''} />
          </div>
        </div>

        {/* Ticker */}
        <span className="text-[7px] sm:text-[8px] font-mono text-marble/25">{ticker}</span>

        {/* Price */}
        <div className="font-display text-base sm:text-lg text-marble font-semibold tracking-tight mt-0.5">
          {cat === 'forex' ? '' : '$'}{formatP(livePrice)}
        </div>

        {/* Change */}
        <div className={`flex items-center gap-1 text-[9px] sm:text-[10px] font-mono mt-0.5 ${
          isPos ? 'text-emerald-400' : isNeg ? 'text-red-400' : 'text-marble/30'
        }`}>
          {isPos ? <TrendingUp className="w-2.5 h-2.5" /> : isNeg ? <TrendingDown className="w-2.5 h-2.5" /> : <Minus className="w-2.5 h-2.5" />}
          {isPos ? '+' : ''}{change.toFixed(2)}%
        </div>

        {/* Sparkline */}
        {spark.length > 2 && (
          <div className="h-8 sm:h-10 mt-1.5 -mx-1">
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
  const live = useLiveMarketData();
  const health = useFeedHealth(1000);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const allSymbols = useMemo(() => WATCHLIST_CATEGORIES.flatMap((category) => category.items), []);

  useEffect(() => {
    bootstrapFeeds({ tradingView: buildTradingViewSymbols(allSymbols) });
  }, [allSymbols]);

  const sourceLine = useMemo(() => {
    const liveSources = health.filter((h) => h.ok).map((h) => h.source);
    return liveSources.length ? liveSources.join(' · ') : 'CONNECTING';
  }, [health]);

  const resolvePrice = (key: string, cat: string): { price: number; change: number; wsLive: boolean } => {
    const sym = allSymbols.find((item) => item.key === key && item.cat === cat);
    if (!sym) return { price: 0, change: 0, wsLive: false };
    const price = live.resolvePrice(sym);
    const change = live.resolveChange(sym);
    return { price, change, wsLive: price > 0 };
  };

  const toggle = (label: string) => setCollapsed(prev => ({ ...prev, [label]: !prev[label] }));

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-sm border border-gold/15 bg-navy-light/35 px-4 py-3">
        <div className="flex items-center gap-2 min-w-0">
          <Activity className="w-4 h-4 text-emerald-400" />
          <span className="font-display text-[10px] tracking-[0.24em] text-marble/70">TRADINGVIEW + DIRECT FEED ROUTER</span>
        </div>
        <div className="flex items-center gap-2 min-w-0">
          <LivePulse connected={health.some((h) => h.ok)} label="LIVE" />
          <span className="text-[9px] font-mono text-marble/35 truncate max-w-[70vw]">{sourceLine}</span>
        </div>
      </div>
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
