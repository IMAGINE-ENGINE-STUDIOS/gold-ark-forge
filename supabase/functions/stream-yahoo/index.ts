/**
 * Yahoo Finance quote relay.
 * Free official ~1-minute feed for stocks, ETFs, indices, and FX pairs.
 * Called by the client every 3s with a batch of Yahoo symbols.
 * Response: { quotes: [{ symbol, price, bid, ask, change_pct, volume, currency }] }
 */
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

const CACHE = new Map<string, { ts: number; data: unknown }>();
const CACHE_MS = 1500;

async function fetchYahoo(symbols: string[]): Promise<unknown[]> {
  const now = Date.now();
  const need: string[] = [];
  const out: unknown[] = [];
  for (const s of symbols) {
    const hit = CACHE.get(s);
    if (hit && now - hit.ts < CACHE_MS) out.push(hit.data);
    else need.push(s);
  }
  if (need.length) {
    const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(need.join(','))}`;
    const r = await fetch(url, {
      headers: {
        'user-agent': 'Mozilla/5.0 GoldArrow/1.0',
        'accept': 'application/json',
      },
    });
    if (!r.ok) throw new Error(`yahoo ${r.status}: ${await r.text()}`);
    const j = await r.json();
    const rows = (j?.quoteResponse?.result ?? []) as Array<Record<string, unknown>>;
    for (const row of rows) {
      const price = Number(
        row.regularMarketPrice ?? row.postMarketPrice ?? row.preMarketPrice ?? 0,
      );
      const quote = {
        symbol: String(row.symbol),
        price,
        bid: row.bid != null ? Number(row.bid) : undefined,
        ask: row.ask != null ? Number(row.ask) : undefined,
        change_pct: row.regularMarketChangePercent != null
          ? Number(row.regularMarketChangePercent) : undefined,
        volume: row.regularMarketVolume != null
          ? Number(row.regularMarketVolume) : undefined,
        currency: row.currency,
      };
      CACHE.set(String(row.symbol), { ts: now, data: quote });
      out.push(quote);
    }
  }
  return out;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const body = await req.json().catch(() => ({}));
    const symbols: string[] = Array.isArray(body?.symbols) ? body.symbols.slice(0, 200) : [];
    if (!symbols.length) {
      return new Response(JSON.stringify({ error: 'symbols[] required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const quotes = await fetchYahoo(symbols);
    return new Response(JSON.stringify({ quotes, fetched_at: Date.now() }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 502,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});