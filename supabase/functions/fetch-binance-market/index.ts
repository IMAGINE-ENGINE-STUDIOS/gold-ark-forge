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

    const tickerUrl = symbols.length === 1
      ? `https://api.binance.com/api/v3/ticker/24hr?symbol=${symbols[0]}`
      : `https://api.binance.com/api/v3/ticker/24hr?symbols=${encodeURIComponent(JSON.stringify(symbols))}`;
    const tickerResp = await fetch(tickerUrl);
    if (!tickerResp.ok) throw new Error(`Binance ticker returned ${tickerResp.status}`);

    const tickerJson = await tickerResp.json();
    const rows = Array.isArray(tickerJson) ? tickerJson : [tickerJson];
    const quotes: Record<string, { price: number; change24h: number; volume: number; timestamp: number; source: string }> = {};
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

    const candles: Record<string, { closes: number[]; highs: number[]; lows: number[]; source: string }> = {};
    if (body.includeKlines) {
      await Promise.all(keys.slice(0, 60).map(async (key: string) => {
        try {
          const kResp = await fetch(`https://api.binance.com/api/v3/klines?symbol=${BINANCE_STREAMS[key]}&interval=1h&limit=168`);
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