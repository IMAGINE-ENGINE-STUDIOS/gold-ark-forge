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

interface SpreadDataPoint {
  date: string;
  wti: number;
  brent: number;
  spread: number;
}

/* ─── KEYLESS PRIMARY SOURCE: Yahoo Finance chart API ──────────────
   The same source family the app's market-quotes function already
   uses for stocks — no API key, so oil & gas prices can never die
   because a secret lives in some other project's vault again.
   Daily closes give the latest price, the day change, and (for WTI +
   Brent) the 30-point spread history. EIA remains as a fallback for
   whenever a key IS configured and Yahoo is unreachable. */

const YAHOO_SYMBOLS: Array<{
  symbol: string; yahoo: string; name: string; unit: string; color: string; decimals: number;
}> = [
  { symbol: "CL", yahoo: "CL=F", name: "WTI Crude Oil", unit: "$/bbl", color: "hsl(25, 80%, 50%)", decimals: 2 },
  { symbol: "BZ", yahoo: "BZ=F", name: "Brent Crude Oil", unit: "$/bbl", color: "hsl(210, 60%, 50%)", decimals: 2 },
  { symbol: "NG", yahoo: "NG=F", name: "Natural Gas", unit: "$/MMBtu", color: "hsl(145, 60%, 45%)", decimals: 3 },
  { symbol: "HO", yahoo: "HO=F", name: "Heating Oil", unit: "$/gal", color: "hsl(0, 60%, 50%)", decimals: 3 },
  { symbol: "RB", yahoo: "RB=F", name: "RBOB Gasoline", unit: "$/gal", color: "hsl(43, 72%, 50%)", decimals: 3 },
];

interface DailyBar { date: string; close: number }

async function fetchYahooDaily(yahooSymbol: string): Promise<DailyBar[]> {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yahooSymbol)}?range=3mo&interval=1d`;
  const resp = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 (Gold Arrow price service)" } });
  if (!resp.ok) throw new Error(`Yahoo chart ${yahooSymbol} returned ${resp.status}`);
  const data = await resp.json();
  const result = data?.chart?.result?.[0];
  const timestamps: number[] = result?.timestamp ?? [];
  const closes: Array<number | null> = result?.indicators?.quote?.[0]?.close ?? [];
  const bars: DailyBar[] = [];
  for (let i = 0; i < timestamps.length; i++) {
    const close = closes[i];
    if (typeof close === "number" && close > 0) {
      bars.push({ date: new Date(timestamps[i] * 1000).toISOString().slice(0, 10), close });
    }
  }
  return bars;
}

const roundTo = (n: number, d: number) => Math.round(n * 10 ** d) / 10 ** d;

async function fetchFromYahoo(): Promise<CommodityPrice[]> {
  const now = new Date().toISOString();
  const settled = await Promise.allSettled(YAHOO_SYMBOLS.map((s) => fetchYahooDaily(s.yahoo)));
  const results: CommodityPrice[] = [];
  settled.forEach((res, i) => {
    if (res.status !== "fulfilled" || res.value.length < 2) return;
    const spec = YAHOO_SYMBOLS[i];
    const bars = res.value;
    const latest = bars[bars.length - 1].close;
    const prev = bars[bars.length - 2].close;
    results.push({
      symbol: spec.symbol, name: spec.name,
      price: roundTo(latest, spec.decimals),
      change: prev > 0 ? roundTo(((latest - prev) / prev) * 100, 2) : 0,
      unit: spec.unit, color: spec.color,
      source: "yahoo_finance", timestamp: now,
    });
  });
  return results;
}

async function fetchSpreadHistoryYahoo(): Promise<SpreadDataPoint[]> {
  const [wti, brent] = await Promise.all([fetchYahooDaily("CL=F"), fetchYahooDaily("BZ=F")]);
  const brentByDate = new Map(brent.map((b) => [b.date, b.close]));
  const result: SpreadDataPoint[] = [];
  for (const bar of wti) {
    const b = brentByDate.get(bar.date);
    if (b !== undefined) {
      result.push({
        date: bar.date,
        wti: roundTo(bar.close, 2),
        brent: roundTo(b, 2),
        spread: roundTo(bar.close - b, 2),
      });
    }
  }
  result.sort((a, b) => a.date.localeCompare(b.date));
  return result.slice(-30);
}

/* ─── EIA FALLBACK (only when a key is configured) ───────────────── */

async function fetchFromEIA(apiKey: string): Promise<CommodityPrice[]> {
  const results: CommodityPrice[] = [];
  const now = new Date().toISOString();
  const petroUrl = `https://api.eia.gov/v2/petroleum/pri/spt/data/?api_key=${apiKey}&frequency=daily&data[0]=value&facets[product][]=EPCWTI&facets[product][]=EPCBRENT&sort[0][column]=period&sort[0][direction]=desc&length=5`;
  const petroResp = await fetch(petroUrl);
  if (!petroResp.ok) throw new Error(`EIA petroleum API returned ${petroResp.status}`);
  const petroData = await petroResp.json();
  const petroRows = petroData?.response?.data ?? [];
  const push = (rows: any[], symbol: string, name: string, unit: string, color: string, d: number) => {
    if (rows.length >= 2) {
      const latest = parseFloat(rows[0].value);
      const prev = parseFloat(rows[1].value);
      results.push({
        symbol, name, price: roundTo(latest, d),
        change: prev > 0 ? roundTo(((latest - prev) / prev) * 100, 2) : 0,
        unit, color, source: "eia_gov", timestamp: now,
      });
    }
  };
  push(petroRows.filter((r: any) => r.product === "EPCWTI"), "CL", "WTI Crude Oil", "$/bbl", "hsl(25, 80%, 50%)", 2);
  push(petroRows.filter((r: any) => r.product === "EPCBRENT"), "BZ", "Brent Crude Oil", "$/bbl", "hsl(210, 60%, 50%)", 2);
  const extra: Array<[string, string, string, string, string]> = [
    [`https://api.eia.gov/v2/natural-gas/pri/fut/data/?api_key=${apiKey}&frequency=daily&data[0]=value&facets[process][]=PRS&sort[0][column]=period&sort[0][direction]=desc&length=5`, "NG", "Natural Gas", "$/MMBtu", "hsl(145, 60%, 45%)"],
    [`https://api.eia.gov/v2/petroleum/pri/spt/data/?api_key=${apiKey}&frequency=daily&data[0]=value&facets[product][]=EPD2DXL0&sort[0][column]=period&sort[0][direction]=desc&length=5`, "HO", "Heating Oil", "$/gal", "hsl(0, 60%, 50%)"],
    [`https://api.eia.gov/v2/petroleum/pri/spt/data/?api_key=${apiKey}&frequency=daily&data[0]=value&facets[product][]=EPC0&sort[0][column]=period&sort[0][direction]=desc&length=5`, "RB", "RBOB Gasoline", "$/gal", "hsl(43, 72%, 50%)"],
  ];
  for (const [url, symbol, name, unit, color] of extra) {
    try {
      const resp = await fetch(url);
      if (resp.ok) {
        const data = await resp.json();
        push(data?.response?.data ?? [], symbol, name, unit, color, 3);
      }
    } catch { /* best-effort leg */ }
  }
  return results;
}

async function fetchSpreadHistoryEIA(apiKey: string): Promise<SpreadDataPoint[]> {
  const url = `https://api.eia.gov/v2/petroleum/pri/spt/data/?api_key=${apiKey}&frequency=daily&data[0]=value&facets[product][]=EPCWTI&facets[product][]=EPCBRENT&sort[0][column]=period&sort[0][direction]=desc&length=70`;
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`EIA spread history returned ${resp.status}`);
  const data = await resp.json();
  const rows = data?.response?.data ?? [];
  const byDate = new Map<string, { wti?: number; brent?: number }>();
  for (const row of rows) {
    if (!byDate.has(row.period)) byDate.set(row.period, {});
    const entry = byDate.get(row.period)!;
    if (row.product === "EPCWTI") entry.wti = parseFloat(row.value);
    if (row.product === "EPCBRENT") entry.brent = parseFloat(row.value);
  }
  const result: SpreadDataPoint[] = [];
  for (const [date, vals] of byDate) {
    if (vals.wti !== undefined && vals.brent !== undefined) {
      result.push({ date, wti: roundTo(vals.wti, 2), brent: roundTo(vals.brent, 2), spread: roundTo(vals.wti - vals.brent, 2) });
    }
  }
  result.sort((a, b) => a.date.localeCompare(b.date));
  return result.slice(-30);
}

/* ─── SERVE ──────────────────────────────────────────────────────── */

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const history = url.searchParams.get("history");
    const eiaKey = Deno.env.get("EIA_API_KEY"); // optional fallback only — never required

    if (history === "30") {
      let spread: SpreadDataPoint[] = [];
      let source = "yahoo_finance";
      try { spread = await fetchSpreadHistoryYahoo(); } catch (e) { console.log("[commodities] Yahoo spread failed:", e); }
      if (spread.length === 0 && eiaKey) {
        try { spread = await fetchSpreadHistoryEIA(eiaKey); source = "eia_gov"; } catch (e) { console.log("[commodities] EIA spread failed:", e); }
      }
      if (spread.length === 0) {
        return new Response(
          JSON.stringify({ success: false, error: "No spread history available from any source" }),
          { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      return new Response(
        JSON.stringify({ success: true, spread, source, timestamp: new Date().toISOString() }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let prices: CommodityPrice[] = [];
    let source = "yahoo_finance";
    try { prices = await fetchFromYahoo(); } catch (e) { console.log("[commodities] Yahoo fetch failed:", e); }
    if (prices.length === 0 && eiaKey) {
      try { prices = await fetchFromEIA(eiaKey); source = "eia_gov"; } catch (e) { console.log("[commodities] EIA fetch failed:", e); }
    }
    if (prices.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: "No price data returned from any source", source }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    console.log(`[commodities] Returning ${prices.length} prices from ${source}`);
    return new Response(
      JSON.stringify({ success: true, prices, source, timestamp: new Date().toISOString() }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("[commodities] fetch error:", msg);
    return new Response(
      JSON.stringify({ success: false, error: msg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
