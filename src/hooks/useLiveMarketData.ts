import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useMetalPrices } from '@/hooks/useMetalPrices';
import { useCryptoData } from '@/hooks/useCryptoData';
import { useOilGasPrices } from '@/hooks/useOilGasData';
import { BINANCE_STREAMS, useWebSocketPrices } from '@/hooks/useWebSocketPrices';
import { supabase } from '@/integrations/supabase/client';
import { ALL_SYMBOLS } from '@/data/tradingSymbols';
import { FeedRouter } from '@/lib/feeds/router';

type SymbolLite = { key: string; cat: string; ticker: string };

type BackendMarketData = {
  quotes?: Record<string, { price: number; change24h: number; volume: number; timestamp: number; source: string }>;
  candles?: Record<string, { closes: number[]; highs: number[]; lows: number[]; source: string }>;
};

const CRYPTO_BASE: Record<string, string> = {
  bitcoin: 'BTC', ethereum: 'ETH', solana: 'SOL', xrp: 'XRP', bnb: 'BNB',
  cardano: 'ADA', avalanche: 'AVAX', polkadot: 'DOT', chainlink: 'LINK', dogecoin: 'DOGE',
  polygon: 'MATIC', litecoin: 'LTC', uniswap: 'UNI', near: 'NEAR', aptos: 'APT', sui: 'SUI',
  arbitrum: 'ARB', optimism: 'OP', injective: 'INJ', render: 'RENDER', filecoin: 'FIL',
  cosmos: 'ATOM', algorand: 'ALGO', stellar: 'XLM', vechain: 'VET', hedera: 'HBAR',
  tron: 'TRX', shiba: 'SHIB', pepe: 'PEPE',
};

const METAL_FEED_SYMBOL: Record<string, string> = {
  gold: 'XAU/USD', silver: 'XAG/USD', platinum: 'XPT/USD', palladium: 'XPD/USD',
};

const ENERGY_FEED_SYMBOL: Record<string, string> = {
  oil: 'CL=F', brent: 'BZ=F', natgas: 'NG=F', rbob: 'RB=F', heating_oil: 'HO=F',
};

const yahooFxTicker = (ticker: string): string | null => {
  const [base, quote] = ticker.toUpperCase().split('/');
  if (!base || !quote) return null;
  return base === 'USD' ? `${quote}=X` : `${base}${quote}=X`;
};

const feedCandidates = (sym: SymbolLite): string[] => {
  if (sym.cat === 'crypto') {
    const base = CRYPTO_BASE[sym.key] ?? sym.ticker.split('-')[0]?.toUpperCase();
    return base ? [`${base}/USD`, `${base}/USDT`, sym.ticker] : [sym.ticker];
  }
  if (sym.cat === 'metals') return [METAL_FEED_SYMBOL[sym.key], sym.ticker].filter(Boolean);
  if (sym.cat === 'energy') return [ENERGY_FEED_SYMBOL[sym.key], sym.ticker].filter(Boolean);
  if (sym.cat === 'forex') return [yahooFxTicker(sym.ticker), sym.ticker].filter(Boolean);
  return [sym.ticker];
};

const latestRouterTick = (sym: SymbolLite) => {
  const tick = FeedRouter.latestOf(feedCandidates(sym));
  return tick && !tick.stale && Number.isFinite(tick.last) && tick.last > 0 ? tick : undefined;
};

/**
 * Live-first market data hook shared across Eagle View, Swap/Showroom,
 * Intelligence and Oil & Gas widget surfaces. Prices resolve in real time
 * from the same upstream sources (TradingView scanner, direct exchange
 * WebSockets, gold-api, Yahoo relay, oil feeds) used elsewhere in the app,
 * so every table stays in lockstep.
 */
export function useLiveMarketData() {
  const [feedVersion, setFeedVersion] = useState(0);
  const { data: metalPricesData } = useMetalPrices();
  const { data: cryptoDataAll } = useCryptoData(50);
  const { data: oilPricesData } = useOilGasPrices();

  useEffect(() => {
    let frame = 0;
    const unsubscribe = FeedRouter.subscribeAll(() => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        setFeedVersion((v) => (v + 1) % 1_000_000);
      });
    });
    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      unsubscribe();
    };
  }, []);

  const cryptoStreamKeys = useMemo(
    () => ALL_SYMBOLS
      .filter(s => s.cat === 'crypto' && BINANCE_STREAMS[s.key])
      .map(s => s.key),
    [],
  );
  const cryptoTickPrices = useWebSocketPrices(cryptoStreamKeys);
  const { data: backendCryptoQuotes } = useQuery({
    queryKey: ['eagle-binance-quotes', cryptoStreamKeys.join('|')],
    queryFn: async (): Promise<BackendMarketData> => {
      const { data, error } = await supabase.functions.invoke('fetch-binance-market', {
        body: { keys: cryptoStreamKeys, includeKlines: false },
      });
      if (error) throw error;
      return (data ?? {}) as BackendMarketData;
    },
    refetchInterval: 1500,
    staleTime: 800,
    retry: 1,
  });

  const { data: backendCryptoCandles } = useQuery({
    queryKey: ['eagle-binance-candles', cryptoStreamKeys.join('|')],
    queryFn: async (): Promise<BackendMarketData> => {
      const { data, error } = await supabase.functions.invoke('fetch-binance-market', {
        body: { keys: cryptoStreamKeys, includeKlines: true },
      });
      if (error) throw error;
      return (data ?? {}) as BackendMarketData;
    },
    refetchInterval: 300000,
    staleTime: 120000,
    retry: 1,
  });

  const resolvePrice = useCallback((sym: SymbolLite): number => {
    const routerTick = latestRouterTick(sym);
    if (routerTick) return routerTick.last;

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
      const tick = cryptoTickPrices[sym.key];
      if (tick?.price) return tick.price;
      const backend = backendCryptoQuotes?.quotes?.[sym.key];
      if (backend?.price) return backend.price;
      const coin = cryptoDataAll?.find(c => c.id === sym.key || c.symbol === sym.key);
      if (coin?.current_price) return coin.current_price;
    }
    if (sym.cat === 'energy') {
      const feedTicker = ENERGY_FEED_SYMBOL[sym.key] ?? sym.ticker;
      const feed = oilPricesData?.find(p => p.symbol === sym.ticker || p.symbol === feedTicker.replace('=F', ''));
      if (feed?.price) return feed.price;
    }
    return 0;
  }, [feedVersion, metalPricesData, cryptoDataAll, oilPricesData, cryptoTickPrices, backendCryptoQuotes]);

  const resolveChange = useCallback((sym: SymbolLite): number => {
    const routerTick = latestRouterTick(sym);
    if (routerTick?.change24h !== undefined && Number.isFinite(routerTick.change24h)) return routerTick.change24h;

    if (sym.cat === 'metals') {
      const map: Record<string, string> = {
        gold: 'gold', silver: 'silver', platinum: 'platinum',
        palladium: 'platinum', copper: 'gold',
      };
      const key = map[sym.key];
      return key ? (metalPricesData?.[key]?.change_24h ?? 0) : 0;
    }
    if (sym.cat === 'crypto') {
      const tick = cryptoTickPrices[sym.key];
      if (tick) return tick.change24h;
      const backend = backendCryptoQuotes?.quotes?.[sym.key];
      if (backend) return backend.change24h;
      const coin = cryptoDataAll?.find(c => c.id === sym.key || c.symbol === sym.key);
      return coin?.price_change_percentage_24h ?? 0;
    }
    if (sym.cat === 'energy') {
      const feedTicker = ENERGY_FEED_SYMBOL[sym.key] ?? sym.ticker;
      const feed = oilPricesData?.find(p => p.symbol === sym.ticker || p.symbol === feedTicker.replace('=F', ''));
      if (feed) return feed.change ?? 0;
    }
    return 0;
  }, [feedVersion, metalPricesData, cryptoDataAll, oilPricesData, cryptoTickPrices, backendCryptoQuotes]);

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

  const seed = useCallback((ticker: string, sym: SymbolLite) => {
    if (bootstrappedRef.current.has(ticker)) return;
    const h = candleHistoryRef.current[ticker] || { timestamps: [], prices: [] };
    if (h.prices.length >= 30) {
      bootstrappedRef.current.add(ticker);
      candleHistoryRef.current[ticker] = h;
      return;
    }
    if (sym.cat === 'crypto') {
      const k = backendCryptoCandles?.candles?.[sym.key];
      if (k?.closes?.length && k.closes.length >= 60) {
        const now = Date.now();
        const hourMs = 3600_000;
        const seedP = k.closes.slice(-168);
        const seedT = seedP.map((_, i) => now - (seedP.length - i) * hourMs);
        h.prices = [...seedP, ...h.prices];
        h.timestamps = [...seedT, ...h.timestamps];
        bootstrappedRef.current.add(ticker);
        candleHistoryRef.current[ticker] = h;
        return;
      }
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
  }, [cryptoDataAll, backendCryptoCandles]);

  // Stable ref so the interval below doesn't get torn down on every rAF-driven
  // resolvePrice recreation (that was thrashing the timer and hurting perf).
  const resolvePriceRef = useRef(resolvePrice);
  useEffect(() => { resolvePriceRef.current = resolvePrice; }, [resolvePrice]);

  useEffect(() => {
    const appendLiveTicks = () => {
      const now = Date.now();
      const resolve = resolvePriceRef.current;
      for (const sym of ALL_SYMBOLS) {
        const price = resolve(sym);
        if (price <= 0) continue;
        const h = candleHistoryRef.current[sym.ticker] || { timestamps: [], prices: [] };
        const lastTs = h.timestamps[h.timestamps.length - 1] || 0;
        const lastPrice = h.prices[h.prices.length - 1];
        if (now - lastTs < 1000 || lastPrice === price) {
          candleHistoryRef.current[sym.ticker] = h;
          continue;
        }
        h.timestamps.push(now);
        h.prices.push(price);
        if (h.prices.length > 500) {
          h.prices.splice(0, h.prices.length - 500);
          h.timestamps.splice(0, h.timestamps.length - 500);
        }
        candleHistoryRef.current[sym.ticker] = h;
      }
    };

    appendLiveTicks();
    const id = window.setInterval(appendLiveTicks, 1000);
    return () => window.clearInterval(id);
  }, []);

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