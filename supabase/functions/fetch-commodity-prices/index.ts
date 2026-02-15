import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface CommodityPrice {
  symbol: string;
  name: string;
  price: number;
  change: number;
  unit: string;
  color: string;
  source: string;
  timestamp: string;
}

// ─── Source 1: Yahoo Finance via public query endpoint ───
async function fetchFromYahooFinance(): Promise<CommodityPrice[]> {
  const symbols = [
    { yahoo: "CL=F", symbol: "CL", name: "WTI Crude Oil", unit: "$/bbl", color: "hsl(25, 80%, 50%)" },
    { yahoo: "BZ=F", symbol: "BZ", name: "Brent Crude Oil", unit: "$/bbl", color: "hsl(210, 60%, 50%)" },
    { yahoo: "NG=F", symbol: "NG", name: "Natural Gas", unit: "$/MMBtu", color: "hsl(145, 60%, 45%)" },
    { yahoo: "HO=F", symbol: "HO", name: "Heating Oil", unit: "$/gal", color: "hsl(0, 60%, 50%)" },
    { yahoo: "RB=F", symbol: "RB", name: "RBOB Gasoline", unit: "$/gal", color: "hsl(43, 72%, 50%)" },
  ];

  const query = symbols.map((s) => s.yahoo).join(",");
  const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${query}&fields=regularMarketPrice,regularMarketChangePercent,shortName`;

  const resp = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; GoldArrow/1.0)",
    },
  });

  if (!resp.ok) throw new Error(`Yahoo Finance returned ${resp.status}`);

  const data = await resp.json();
  const quotes = data?.quoteResponse?.result ?? [];

  return symbols.map((s) => {
    const q = quotes.find((r: any) => r.symbol === s.yahoo);
    if (!q || !q.regularMarketPrice) throw new Error(`Missing data for ${s.yahoo}`);
    return {
      symbol: s.symbol,
      name: s.name,
      price: Math.round(q.regularMarketPrice * 100) / 100,
      change: Math.round((q.regularMarketChangePercent ?? 0) * 100) / 100,
      unit: s.unit,
      color: s.color,
      source: "yahoo_finance",
      timestamp: new Date().toISOString(),
    };
  });
}

// ─── Source 2: Fallback via public commodity proxy ───
async function fetchFromOpenExchange(): Promise<CommodityPrice[]> {
  // Use a lightweight free commodities endpoint
  const url = "https://cdn.jsdelivr.net/npm/@nicheprotocol/commodity-data@latest/data/latest.json";
  try {
    const resp = await fetch(url);
    if (!resp.ok) throw new Error("CDN fetch failed");
    const data = await resp.json();
    // Map if the structure matches; otherwise throw to hit fallback
    if (!data?.WTI) throw new Error("Unexpected data structure");
    return [
      { symbol: "CL", name: "WTI Crude Oil", price: data.WTI, change: 0, unit: "$/bbl", color: "hsl(25, 80%, 50%)", source: "open_exchange", timestamp: new Date().toISOString() },
      { symbol: "BZ", name: "Brent Crude Oil", price: data.BRENT, change: 0, unit: "$/bbl", color: "hsl(210, 60%, 50%)", source: "open_exchange", timestamp: new Date().toISOString() },
      { symbol: "NG", name: "Natural Gas", price: data.NATGAS, change: 0, unit: "$/MMBtu", color: "hsl(145, 60%, 45%)", source: "open_exchange", timestamp: new Date().toISOString() },
    ];
  } catch {
    throw new Error("Open exchange fetch failed");
  }
}

// ─── Source 3: EIA API (if key configured) ───
async function fetchFromEIA(): Promise<CommodityPrice[] | null> {
  const apiKey = Deno.env.get("EIA_API_KEY");
  if (!apiKey) return null;

  const series = [
    { id: "PET.RWTC.D", symbol: "CL", name: "WTI Crude Oil", unit: "$/bbl", color: "hsl(25, 80%, 50%)" },
    { id: "PET.RBRTE.D", symbol: "BZ", name: "Brent Crude Oil", unit: "$/bbl", color: "hsl(210, 60%, 50%)" },
    { id: "NG.RNGWHHD.D", symbol: "NG", name: "Natural Gas", unit: "$/MMBtu", color: "hsl(145, 60%, 45%)" },
  ];

  const results: CommodityPrice[] = [];

  for (const s of series) {
    try {
      const url = `https://api.eia.gov/v2/seriesid/${s.id}?api_key=${apiKey}&num=2`;
      const resp = await fetch(url);
      if (!resp.ok) continue;
      const data = await resp.json();
      const points = data?.response?.data ?? [];
      if (points.length >= 2) {
        const latest = points[0].value;
        const prev = points[1].value;
        const change = prev > 0 ? Math.round(((latest - prev) / prev) * 10000) / 100 : 0;
        results.push({
          symbol: s.symbol,
          name: s.name,
          price: Math.round(latest * 100) / 100,
          change,
          unit: s.unit,
          color: s.color,
          source: "eia_gov",
          timestamp: new Date().toISOString(),
        });
      }
    } catch {
      // Skip this series
    }
  }

  return results.length > 0 ? results : null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Priority: EIA (government source) > Yahoo Finance > Open Exchange > Error
    let prices: CommodityPrice[] | null = null;
    let source = "unknown";

    // Try EIA first (most authoritative)
    try {
      prices = await fetchFromEIA();
      if (prices) source = "eia_gov";
    } catch (e) {
      console.log("EIA fetch failed:", e);
    }

    // Try Yahoo Finance
    if (!prices) {
      try {
        prices = await fetchFromYahooFinance();
        source = "yahoo_finance";
      } catch (e) {
        console.log("Yahoo Finance fetch failed:", e);
      }
    }

    // Try open exchange
    if (!prices) {
      try {
        prices = await fetchFromOpenExchange();
        source = "open_exchange";
      } catch (e) {
        console.log("Open exchange fetch failed:", e);
      }
    }

    if (!prices || prices.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: "All commodity data sources unavailable", source: "none" }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, prices, source, timestamp: new Date().toISOString() }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("Commodity price fetch error:", msg);
    return new Response(
      JSON.stringify({ success: false, error: msg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
