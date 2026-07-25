/**
 * FRED (Federal Reserve Economic Data) relay.
 * Free official macro data. If FRED_API_KEY is unset, falls back to the
 * public no-auth Stooq CSV mirror for a curated set of series.
 *
 * Body: { series_ids: string[] }
 * Response: { observations: [{ series_id, value, date }] }
 */
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

const KEY = Deno.env.get('FRED_API_KEY');

async function fromFred(id: string) {
  const u = `https://api.stlouisfed.org/fred/series/observations?series_id=${id}&api_key=${KEY}&file_type=json&sort_order=desc&limit=1`;
  const r = await fetch(u);
  if (!r.ok) throw new Error(`fred ${id}: ${r.status}`);
  const j = await r.json();
  const o = j?.observations?.[0];
  if (!o) return null;
  return { series_id: id, value: Number(o.value), date: o.date, source: 'FRED' };
}

const STOOQ_FALLBACK: Record<string, string> = {
  DGS10: '^tnx.us',
  DGS2: '^tyx.us',
  VIXCLS: '^vix.us',
};

async function fromStooq(id: string) {
  const s = STOOQ_FALLBACK[id];
  if (!s) return null;
  const r = await fetch(`https://stooq.com/q/l/?s=${s}&f=sd2t2ohlcv&h&e=csv`);
  if (!r.ok) return null;
  const txt = await r.text();
  const lines = txt.trim().split('\n');
  if (lines.length < 2) return null;
  const cols = lines[1].split(',');
  const close = Number(cols[6]);
  const date = cols[1];
  if (!Number.isFinite(close)) return null;
  return { series_id: id, value: close, date, source: 'stooq' };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const body = await req.json().catch(() => ({}));
    const ids: string[] = Array.isArray(body?.series_ids) ? body.series_ids.slice(0, 50) : [];
    if (!ids.length) {
      return new Response(JSON.stringify({ error: 'series_ids[] required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const observations = (await Promise.all(ids.map(async (id) => {
      try { return KEY ? await fromFred(id) : await fromStooq(id); }
      catch { return await fromStooq(id); }
    }))).filter(Boolean);
    return new Response(JSON.stringify({ observations, fetched_at: Date.now() }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});