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

// ─── EIA API v2 ─────────────────────────────────────────

async function fetchFromEIA(apiKey: string): Promise<CommodityPrice[]> {
  const results: CommodityPrice[] = [];
  const now = new Date().toISOString();

  const petroUrl = `https://api.eia.gov/v2/petroleum/pri/spt/data/?api_key=${apiKey}&frequency=daily&data[0]=value&facets[product][]=EPCWTI&facets[product][]=EPCBRENT&sort[0][column]=period&sort[0][direction]=desc&length=5`;

  console.log("[EIA] Fetching petroleum prices...");
  const petroResp = await fetch(petroUrl);

  if (!petroResp.ok) {
    const errText = await petroResp.text();
    throw new Error(`EIA petroleum API returned ${petroResp.status}: ${errText}`);
  }

  const petroData = await petroResp.json();
  const petroRows = petroData?.response?.data ?? [];
  console.log(`[EIA] Got ${petroRows.length} petroleum rows`);

  const wtiRows = petroRows.filter((r: any) => r.product === "EPCWTI");
  if (wtiRows.length >= 2) {
    const latest = parseFloat(wtiRows[0].value);
    const prev = parseFloat(wtiRows[1].value);
    const change = prev > 0 ? Math.round(((latest - prev) / prev) * 10000) / 100 : 0;
    results.push({
      symbol: "CL", name: "WTI Crude Oil",
      price: Math.round(latest * 100) / 100, change,
      unit: "$/bbl", color: "hsl(25, 80%, 50%)",
      source: "eia_gov", timestamp: now,
    });
  }

  const brentRows = petroRows.filter((r: any) => r.product === "EPCBRENT");
  if (brentRows.length >= 2) {
    const latest = parseFloat(brentRows[0].value);
    const prev = parseFloat(brentRows[1].value);
    const change = prev > 0 ? Math.round(((latest - prev) / prev) * 10000) / 100 : 0;
    results.push({
      symbol: "BZ", name: "Brent Crude Oil",
      price: Math.round(latest * 100) / 100, change,
      unit: "$/bbl", color: "hsl(210, 60%, 50%)",
      source: "eia_gov", timestamp: now,
    });
  }

  try {
    const ngUrl = `https://api.eia.gov/v2/natural-gas/pri/fut/data/?api_key=${apiKey}&frequency=daily&data[0]=value&facets[process][]=PRS&sort[0][column]=period&sort[0][direction]=desc&length=5`;
    console.log("[EIA] Fetching natural gas prices...");
    const ngResp = await fetch(ngUrl);
    if (ngResp.ok) {
      const ngData = await ngResp.json();
      const ngRows = ngData?.response?.data ?? [];
      console.log(`[EIA] Got ${ngRows.length} natural gas rows`);
      if (ngRows.length >= 2) {
        const latest = parseFloat(ngRows[0].value);
        const prev = parseFloat(ngRows[1].value);
        const change = prev > 0 ? Math.round(((latest - prev) / prev) * 10000) / 100 : 0;
        results.push({
          symbol: "NG", name: "Natural Gas",
          price: Math.round(latest * 1000) / 1000, change,
          unit: "$/MMBtu", color: "hsl(145, 60%, 45%)",
          source: "eia_gov", timestamp: now,
        });
      }
    }
  } catch (e) {
    console.log("[EIA] Natural gas fetch failed:", e);
  }

  try {
    const hoUrl = `https://api.eia.gov/v2/petroleum/pri/spt/data/?api_key=${apiKey}&frequency=daily&data[0]=value&facets[product][]=EPD2DXL0&sort[0][column]=period&sort[0][direction]=desc&length=5`;
    const hoResp = await fetch(hoUrl);
    if (hoResp.ok) {
      const hoData = await hoResp.json();
      const hoRows = hoData?.response?.data ?? [];
      if (hoRows.length >= 2) {
        const latest = parseFloat(hoRows[0].value);
        const prev = parseFloat(hoRows[1].value);
        const change = prev > 0 ? Math.round(((latest - prev) / prev) * 10000) / 100 : 0;
        results.push({
          symbol: "HO", name: "Heating Oil",
          price: Math.round(latest * 1000) / 1000, change,
          unit: "$/gal", color: "hsl(0, 60%, 50%)",
          source: "eia_gov", timestamp: now,
        });
      }
    }
  } catch (e) {
    console.log("[EIA] Heating oil fetch failed:", e);
  }

  try {
    const rbUrl = `https://api.eia.gov/v2/petroleum/pri/spt/data/?api_key=${apiKey}&frequency=daily&data[0]=value&facets[product][]=EPC0&sort[0][column]=period&sort[0][direction]=desc&length=5`;
    const rbResp = await fetch(rbUrl);
    if (rbResp.ok) {
      const rbData = await rbResp.json();
      const rbRows = rbData?.response?.data ?? [];
      if (rbRows.length >= 2) {
        const latest = parseFloat(rbRows[0].value);
        const prev = parseFloat(rbRows[1].value);
        const change = prev > 0 ? Math.round(((latest - prev) / prev) * 10000) / 100 : 0;
        results.push({
          symbol: "RB", name: "RBOB Gasoline",
          price: Math.round(latest * 1000) / 1000, change,
          unit: "$/gal", color: "hsl(43, 72%, 50%)",
          source: "eia_gov", timestamp: now,
        });
      }
    }
  } catch (e) {
    console.log("[EIA] Gasoline fetch failed:", e);
  }

  return results;
}

// ─── HISTORICAL SPREAD DATA ─────────────────────────────

async function fetchSpreadHistory(apiKey: string): Promise<SpreadDataPoint[]> {
  const url = `https://api.eia.gov/v2/petroleum/pri/spt/data/?api_key=${apiKey}&frequency=daily&data[0]=value&facets[product][]=EPCWTI&facets[product][]=EPCBRENT&sort[0][column]=period&sort[0][direction]=desc&length=70`;

  console.log("[EIA] Fetching spread history...");
  const resp = await fetch(url);

  if (!resp.ok) {
    const errText = await resp.text();
    throw new Error(`EIA spread history returned ${resp.status}: ${errText}`);
  }

  const data = await resp.json();
  const rows = data?.response?.data ?? [];
  console.log(`[EIA] Got ${rows.length} spread history rows`);

  // Group by date
  const byDate = new Map<string, { wti?: number; brent?: number }>();
  for (const row of rows) {
    const date = row.period;
    const val = parseFloat(row.value);
    if (!byDate.has(date)) byDate.set(date, {});
    const entry = byDate.get(date)!;
    if (row.product === "EPCWTI") entry.wti = val;
    if (row.product === "EPCBRENT") entry.brent = val;
  }

  // Build sorted array of complete pairs
  const result: SpreadDataPoint[] = [];
  for (const [date, vals] of byDate) {
    if (vals.wti !== undefined && vals.brent !== undefined) {
      result.push({
        date,
        wti: Math.round(vals.wti * 100) / 100,
        brent: Math.round(vals.brent * 100) / 100,
        spread: Math.round((vals.wti - vals.brent) * 100) / 100,
      });
    }
  }

  result.sort((a, b) => a.date.localeCompare(b.date));
  // Return last 30 data points
  return result.slice(-30);
}

// ─── SERVE ──────────────────────────────────────────────

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("EIA_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ success: false, error: "EIA_API_KEY is not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const url = new URL(req.url);
    const history = url.searchParams.get("history");

    // Historical spread mode
    if (history === "30") {
      const spreadData = await fetchSpreadHistory(apiKey);

      if (spreadData.length === 0) {
        return new Response(
          JSON.stringify({ success: false, error: "No spread history returned" }),
          { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log(`[EIA] Returning ${spreadData.length} spread data points`);
      return new Response(
        JSON.stringify({ success: true, spread: spreadData, source: "eia_gov", timestamp: new Date().toISOString() }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Default: live prices
    const prices = await fetchFromEIA(apiKey);

    if (prices.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: "No price data returned from EIA", source: "eia_gov" }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[EIA] Returning ${prices.length} commodity prices`);

    return new Response(
      JSON.stringify({ success: true, prices, source: "eia_gov", timestamp: new Date().toISOString() }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("[EIA] Commodity price fetch error:", msg);
    return new Response(
      JSON.stringify({ success: false, error: msg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
