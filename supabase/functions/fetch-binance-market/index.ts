import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const BINANCE_STREAMS: Record<string, string> = {
  bitcoin: "BTCUSDT", ethereum: "ETHUSDT", solana: "SOLUSDT",
  xrp: "XRPUSDT", cardano: "ADAUSDT", dogecoin: "DOGEUSDT",
  polkadot: "DOTUSDT", chainlink: "LINKUSDT", avalanche: "AVAXUSDT",
  polygon: "MATICUSDT", litecoin: "LTCUSDT", uniswap: "UNIUSDT",
  near: "NEARUSDT", aptos: "APTUSDT", sui: "SUIUSDT",
  arbitrum: "ARBUSDT", optimism: "OPUSDT", injective: "INJUSDT",
  render: "RENDERUSDT", filecoin: "FILUSDT", cosmos: "ATOMUSDT",
  algorand: "ALGOUSDT", stellar: "XLMUSDT", vechain: "VETUSDT",
  fantom: "FTMUSDT", hedera: "HBARUSDT", tron: "TRXUSDT",
  bnb: "BNBUSDT", shiba: "SHIBUSDT", pepe: "PEPEUSDT",
};

const keyForSymbol = (symbol: string) =>
  Object.entries(BINANCE_STREAMS).find(([, mapped]) => mapped === symbol)?.[0];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = req.method === "POST" ? await req.json().catch(() => ({})) : {};
    const requested = Array.isArray(body.keys) ? body.keys.map(String) : Object.keys(BINANCE_STREAMS);
    const keys = requested.filter((key: string) => BINANCE_STREAMS[key]);
    const symbols = keys.map((key: string) => BINANCE_STREAMS[key]);

    if (symbols.length === 0) {
      return new Response(JSON.stringify({ quotes: {}, candles: {}, source: "binance" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Multi-exchange fallback so we never serve stale mirror data.
    // Order: Coinbase (never geoblocked) → Kraken → Binance US → Binance global → vision mirror.
    const quotes: Record<string, { price: number; change24h: number; volume: number; timestamp: number; source: string }> = {};

    // ── 1. Coinbase (per-symbol) ──
    const COINBASE_MAP: Record<string, string> = {
      BTCUSDT: "BTC-USD", ETHUSDT: "ETH-USD", SOLUSDT: "SOL-USD", XRPUSDT: "XRP-USD",
      ADAUSDT: "ADA-USD", DOGEUSDT: "DOGE-USD", DOTUSDT: "DOT-USD", LINKUSDT: "LINK-USD",
      AVAXUSDT: "AVAX-USD", MATICUSDT: "MATIC-USD", LTCUSDT: "LTC-USD", UNIUSDT: "UNI-USD",
      NEARUSDT: "NEAR-USD", APTUSDT: "APT-USD", SUIUSDT: "SUI-USD", ARBUSDT: "ARB-USD",
      OPUSDT: "OP-USD", INJUSDT: "INJ-USD", RENDERUSDT: "RENDER-USD", FILUSDT: "FIL-USD",
      ATOMUSDT: "ATOM-USD", ALGOUSDT: "ALGO-USD", XLMUSDT: "XLM-USD", HBARUSDT: "HBAR-USD",
      SHIBUSDT: "SHIB-USD", PEPEUSDT: "PEPE-USD",
    };
    await Promise.all(symbols.map(async (sym) => {
      const key = keyForSymbol(sym);
      const cb = COINBASE_MAP[sym];
      if (!key || !cb) return;
      try {
        const [tickerR, statsR] = await Promise.all([
          fetch(`https://api.exchange.coinbase.com/products/${cb}/ticker`),
          fetch(`https://api.exchange.coinbase.com/products/${cb}/stats`),
        ]);
        if (!tickerR.ok) return;
        const t = await tickerR.json();
        const s = statsR.ok ? await statsR.json() : {};
        const price = Number(t.price);
        const open = Number(s.open);
        if (!Number.isFinite(price) || price <= 0) return;
        const change24h = Number.isFinite(open) && open > 0 ? ((price - open) / open) * 100 : 0;
        quotes[key] = {
          price,
          change24h,
          volume: Number(t.volume) || Number(s.volume) || 0,
          timestamp: Date.now(),
          source: "coinbase_rest",
        };
      } catch (_) { /* fall through to next source */ }
    }));

    // ── 2. Binance fallback for anything Coinbase didn't cover ──
    const missing = symbols.filter(s => !quotes[keyForSymbol(s) ?? ""]);
    let workingHost = "https://api.binance.us";
    if (missing.length > 0) {
      const hosts = ["https://api.binance.us", "https://api.binance.com", "https://data-api.binance.vision"];
      const tickerPath = missing.length === 1
        ? `/api/v3/ticker/24hr?symbol=${missing[0]}`
        : `/api/v3/ticker/24hr?symbols=${encodeURIComponent(JSON.stringify(missing))}`;
      let tickerResp: Response | null = null;
      for (const host of hosts) {
        try {
          const r = await fetch(host + tickerPath);
          if (r.ok) { tickerResp = r; workingHost = host; break; }
        } catch (_) { /* try next host */ }
      }
      if (tickerResp) {
        const tickerJson = await tickerResp.json();
        const rows = Array.isArray(tickerJson) ? tickerJson : [tickerJson];
        for (const row of rows) {
          const key = keyForSymbol(String(row.symbol ?? ""));
          const price = Number(row.lastPrice);
          if (!key || !Number.isFinite(price) || price <= 0) continue;
          quotes[key] = {
            price,
            change24h: Number(row.priceChangePercent) || 0,
            volume: Number(row.quoteVolume) || 0,
            timestamp: Date.now(),
            source: "binance_rest",
          };
        }
      }
    }

    if (Object.keys(quotes).length === 0) throw new Error("All crypto sources unavailable");

    const candles: Record<string, { closes: number[]; highs: number[]; lows: number[]; source: string }> = {};
    if (body.includeKlines) {
      await Promise.all(keys.slice(0, 60).map(async (key: string) => {
        try {
          const kResp = await fetch(`${workingHost}/api/v3/klines?symbol=${BINANCE_STREAMS[key]}&interval=1h&limit=168`);
          if (!kResp.ok) return;
          const kRows = await kResp.json();
          const closes = kRows.map((r: unknown[]) => Number(r[4])).filter((n: number) => Number.isFinite(n) && n > 0);
          const highs = kRows.map((r: unknown[]) => Number(r[2])).filter((n: number) => Number.isFinite(n) && n > 0);
          const lows = kRows.map((r: unknown[]) => Number(r[3])).filter((n: number) => Number.isFinite(n) && n > 0);
          if (closes.length >= 60 && highs.length === closes.length && lows.length === closes.length) {
            candles[key] = { closes, highs, lows, source: "binance_1h_klines" };
          }
        } catch (_) {
          // Keep the rest of the batch usable when a single market is unavailable.
        }
      }));
    }

    return new Response(JSON.stringify({ quotes, candles, source: "binance", timestamp: new Date().toISOString() }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown Binance market error";
    return new Response(JSON.stringify({ error: msg, quotes: {}, candles: {}, source: "binance" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});