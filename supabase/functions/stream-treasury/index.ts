// stream-treasury — U.S. Treasury FiscalData relay (no auth, free, CORS-normalized).
// Aggregates the three most useful sovereign-macro series for Eagle View:
//   1. Average interest rates on marketable Treasuries (Bills / Notes / Bonds / TIPS / FRNs)
//   2. Total public debt to the penny (daily)
//   3. Official Treasury reporting rates of exchange (quarterly FX)
// Response is cached in-memory for 5 minutes because Treasury updates daily.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const BASE = "https://api.fiscaldata.treasury.gov/services/api/fiscal_service";
let cache: { at: number; payload: unknown } | null = null;
const TTL = 5 * 60_000;

async function getJSON(path: string): Promise<any> {
  const r = await fetch(`${BASE}${path}`);
  if (!r.ok) throw new Error(`fiscaldata ${path} ${r.status}`);
  return r.json();
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    if (cache && Date.now() - cache.at < TTL) {
      return new Response(JSON.stringify({ ...cache.payload as object, cached: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const [rates, debt, fx] = await Promise.all([
      getJSON("/v2/accounting/od/avg_interest_rates?sort=-record_date&page[size]=8").catch(() => null),
      getJSON("/v2/accounting/od/debt_to_penny?sort=-record_date&page[size]=30").catch(() => null),
      getJSON("/v1/accounting/od/rates_of_exchange?sort=-record_date&page[size]=40").catch(() => null),
    ]);

    // Normalise average interest rates → { security_desc, rate, date } list, latest date only
    const ratesRows = Array.isArray(rates?.data) ? rates.data : [];
    const latestDate = ratesRows[0]?.record_date ?? null;
    const avgRates = ratesRows
      .filter((r: any) => r.record_date === latestDate)
      .map((r: any) => ({
        security: r.security_desc,
        rate: Number(r.avg_interest_rate_amt),
        date: r.record_date,
      }));

    // Debt trend — last 30 records, most recent first
    const debtRows = Array.isArray(debt?.data) ? debt.data : [];
    const debtSeries = debtRows.map((r: any) => ({
      date: r.record_date,
      totalDebt: Number(r.tot_pub_debt_out_amt),
    })).filter((r: any) => Number.isFinite(r.totalDebt));
    const latestDebt = debtSeries[0]?.totalDebt ?? null;
    const debt30dAgo = debtSeries[debtSeries.length - 1]?.totalDebt ?? null;
    const debtChangePct = latestDebt && debt30dAgo ? ((latestDebt - debt30dAgo) / debt30dAgo) * 100 : null;

    // FX rates — latest record for common majors
    const fxRows = Array.isArray(fx?.data) ? fx.data : [];
    const wanted = new Set(["Euro Zone", "United Kingdom", "Japan", "Canada", "Switzerland", "China", "Mexico", "Brazil"]);
    const fxByCountry: Record<string, { rate: number; date: string; currency: string }> = {};
    for (const r of fxRows) {
      if (!wanted.has(r.country)) continue;
      const rate = Number(r.exchange_rate);
      if (!Number.isFinite(rate)) continue;
      // keep only most-recent per country
      if (!fxByCountry[r.country] || r.record_date > fxByCountry[r.country].date) {
        fxByCountry[r.country] = { rate, date: r.record_date, currency: r.currency };
      }
    }

    const payload = {
      source: "fiscaldata.treasury.gov",
      fetched_at: new Date().toISOString(),
      avg_interest_rates: {
        as_of: latestDate,
        rates: avgRates,
      },
      public_debt: {
        latest: latestDebt,
        latest_date: debtSeries[0]?.date ?? null,
        change_30d_pct: debtChangePct,
        series: debtSeries,
      },
      fx: fxByCountry,
    };

    cache = { at: Date.now(), payload };
    return new Response(JSON.stringify(payload), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "treasury fetch failed";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
