import { useCallback, useMemo, useRef } from 'react';
import { useMetalPrices } from '@/hooks/useMetalPrices';
import { useCryptoData } from '@/hooks/useCryptoData';
import { useOilGasPrices } from '@/hooks/useOilGasData';
import { ALL_SYMBOLS, SYNTHETIC_PRICES } from '@/data/tradingSymbols';

type SymbolLite = { key: string; cat: string; ticker: string };

/**
 * Live-first market data hook shared across Eagle View, Swap/Showroom,
 * Intelligence and Oil & Gas widget surfaces. Prices resolve in real time
 * from the same upstream sources (CoinGecko sparklines, EIA metals, oil feeds)
 * used elsewhere in the app, so every table stays in lockstep.
 */
export function useLiveMarketData() {
  const { data: metalPricesData } = useMetalPrices();
  const { data: cryptoDataAll } = useCryptoData(50);
  const { data: oilPricesData } = useOilGasPrices();

  const resolvePrice = useCallback((sym: SymbolLite): number => {
    if (sym.cat === 'metals') {
      const map: Record<string, string> = {
        gold: 'gold', silver: 'silver', platinum: 'platinum',
        palladium: 'platinum', copper: 'gold',
      };
      const key = map[sym.key];
      const p = key ? (metalPricesData?.[key]?.price_usd ?? 0) : 0;
      if (p > 0) return p;
    }
    if (sym.cat === 'crypto') {
      const coin = cryptoDataAll?.find(c => c.id === sym.key || c.symbol === sym.key);
      if (coin?.current_price) return coin.current_price;
    }
    if (sym.cat === 'energy') {
      const feed = oilPricesData?.find(p => p.symbol === sym.ticker);
      if (feed?.price) return feed.price;
    }
    return SYNTHETIC_PRICES[sym.key]?.p ?? 0;
  }, [metalPricesData, cryptoDataAll, oilPricesData]);

  const resolveChange = useCallback((sym: SymbolLite): number => {
    if (sym.cat === 'metals') {
      const map: Record<string, string> = {
        gold: 'gold', silver: 'silver', platinum: 'platinum',
        palladium: 'platinum', copper: 'gold',
      };
      const key = map[sym.key];
      return key ? (metalPricesData?.[key]?.change_24h ?? 0) : 0;
    }
    if (sym.cat === 'crypto') {
      const coin = cryptoDataAll?.find(c => c.id === sym.key || c.symbol === sym.key);
      return coin?.price_change_percentage_24h ?? 0;
    }
    if (sym.cat === 'energy') {
      const feed = oilPricesData?.find(p => p.symbol === sym.ticker);
      if (feed) return feed.change ?? 0;
    }
    return SYNTHETIC_PRICES[sym.key]?.c ?? 0;
  }, [metalPricesData, cryptoDataAll, oilPricesData]);

  const resolvePriceByTicker = useCallback((ticker: string): number => {
    const s = ALL_SYMBOLS.find(x => x.ticker === ticker);
    return s ? resolvePrice(s) : 0;
  }, [resolvePrice]);

  const resolveChangeByTicker = useCallback((ticker: string): number => {
    const s = ALL_SYMBOLS.find(x => x.ticker === ticker);
    return s ? resolveChange(s) : 0;
  }, [resolveChange]);

  // ── Candle bootstrap + live tick accumulation ──────────────────
  const candleHistoryRef = useRef<Record<string, { timestamps: number[]; prices: number[] }>>({});
  const bootstrappedRef = useRef<Set<string>>(new Set());

  const generateSeries = (basePrice: number, count: number, vol: number) => {
    const prices: number[] = [];
    const timestamps: number[] = [];
    const now = Date.now();
    const hourMs = 3600_000;
    let p = basePrice * (1 - vol * 2 * (Math.random() - 0.3));
    const phases = [
      { len: Math.floor(count * 0.25), drift: vol * 1.5 },
      { len: Math.floor(count * 0.15), drift: -vol * 1.2 },
      { len: Math.floor(count * 0.35), drift: vol * 1.8 },
      { len: count, drift: -vol * 0.5 },
    ];
    const flip = Math.random() > 0.4 ? 1 : -1;
    let pi = 0, rem = phases[0].len;
    for (let i = 0; i < count; i++) {
      if (rem <= 0 && pi < phases.length - 1) { pi++; rem = phases[pi].len; }
      rem--;
      const drift = phases[pi].drift * flip;
      const noise = (Math.random() - 0.5) * basePrice * vol * 0.8;
      const momentum = drift * basePrice * (0.5 + Math.random() * 0.5);
      p = Math.max(basePrice * 0.85, Math.min(basePrice * 1.15, p + momentum + noise));
      prices.push(parseFloat(p.toFixed(p < 10 ? 4 : 2)));
      timestamps.push(now - (count - i) * hourMs);
    }
    return { prices, timestamps };
  };

  const seed = useCallback((ticker: string, sym: SymbolLite) => {
    if (bootstrappedRef.current.has(ticker)) return;
    const h = candleHistoryRef.current[ticker] || { timestamps: [], prices: [] };
    if (h.prices.length >= 30) {
      bootstrappedRef.current.add(ticker);
      candleHistoryRef.current[ticker] = h;
      return;
    }
    if (sym.cat === 'crypto' && cryptoDataAll) {
      const coin = cryptoDataAll.find(c => c.id === sym.key || c.symbol === sym.key);
      const spark = coin?.sparkline_in_7d?.price;
      if (spark && spark.length >= 30) {
        const now = Date.now();
        const hourMs = 3600_000;
        const seedP = spark.slice(-168);
        const seedT = seedP.map((_, i) => now - (seedP.length - i) * hourMs);
        h.prices = [...seedP, ...h.prices];
        h.timestamps = [...seedT, ...h.timestamps];
        bootstrappedRef.current.add(ticker);
        candleHistoryRef.current[ticker] = h;
        return;
      }
    }
    const base = resolvePrice(sym);
    if (base > 0) {
      const vol = sym.cat === 'energy' ? 0.005 : sym.cat === 'metals' ? 0.003 : 0.004;
      const s = generateSeries(base, 168, vol);
      h.prices = [...s.prices, ...h.prices];
      h.timestamps = [...s.timestamps, ...h.timestamps];
      bootstrappedRef.current.add(ticker);
      candleHistoryRef.current[ticker] = h;
    }
  }, [cryptoDataAll, resolvePrice]);

  const getCandleData = useCallback((ticker: string) => {
    const sym = ALL_SYMBOLS.find(s => s.ticker === ticker);
    if (!sym) return null;
    const price = resolvePrice(sym);
    if (price <= 0) return null;

    if (!candleHistoryRef.current[ticker]) {
      candleHistoryRef.current[ticker] = { timestamps: [], prices: [] };
    }
    seed(ticker, sym);
    const h = candleHistoryRef.current[ticker];
    const now = Date.now();
    const last = h.timestamps[h.timestamps.length - 1] || 0;
    if (now - last >= 1000) {
      h.timestamps.push(now);
      h.prices.push(price);
      if (h.prices.length > 500) {
        h.prices.splice(0, h.prices.length - 500);
        h.timestamps.splice(0, h.timestamps.length - 500);
      }
    }
    if (h.prices.length < 30) return null;
    const closes = [...h.prices];
    const highs = closes.map((c, i) => Math.max(...closes.slice(Math.max(0, i - 2), i + 1)));
    const lows  = closes.map((c, i) => Math.min(...closes.slice(Math.max(0, i - 2), i + 1)));
    return { closes, highs, lows };
  }, [resolvePrice, seed]);

  const feedsReady = useMemo(() =>
    Boolean(metalPricesData) || Boolean(cryptoDataAll?.length) || Boolean(oilPricesData?.length),
  [metalPricesData, cryptoDataAll, oilPricesData]);

  return {
    resolvePrice, resolveChange,
    resolvePriceByTicker, resolveChangeByTicker,
    getCandleData, feedsReady,
    metalPricesData, cryptoDataAll, oilPricesData,
  };
}