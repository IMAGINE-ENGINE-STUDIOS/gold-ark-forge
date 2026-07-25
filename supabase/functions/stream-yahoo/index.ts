/**
 * Yahoo Finance quote relay.
 * Free official ~1-minute feed for stocks, ETFs, indices, and FX pairs.
 * Called by the client every 3s with a batch of Yahoo symbols.
 * Response: { quotes: [{ symbol, price, bid, ask, change_pct, volume, currency }] }
 */
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

const CACHE = new Map<string, { ts: number; data: unknown }>();
const CACHE_MS = 1500;

const HIST_CACHE = new Map<string, { ts: number; closes: number[]; highs: number[]; lows: number[] }>();
const HIST_CACHE_MS = 60_000; // 1 min

async function fetchHistory(symbol: string, range = '1mo', interval = '1h') {
  const key = `${symbol}|${range}|${interval}`;
  const now = Date.now();
  const hit = HIST_CACHE.get(key);
  if (hit && now - hit.ts < HIST_CACHE_MS) return hit;
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=${interval}&range=${range}`;
  const r = await fetch(url, {
    headers: {
      'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      'accept': 'application/json',
    },
  });
  if (!r.ok) throw new Error(`yahoo hist ${symbol} ${r.status}`);
  const j = await r.json();
  const q = j?.chart?.result?.[0]?.indicators?.quote?.[0];
  if (!q) throw new Error('no quote');
  const closes = (q.close || []).filter((v: unknown): v is number => typeof v === 'number' && Number.isFinite(v) && v > 0);
  const highs = (q.high || []).filter((v: unknown): v is number => typeof v === 'number' && Number.isFinite(v) && v > 0);
  const lows = (q.low || []).filter((v: unknown): v is number => typeof v === 'number' && Number.isFinite(v) && v > 0);
  const entry = { ts: now, closes, highs, lows };
  HIST_CACHE.set(key, entry);
  return entry;
}

/**
 * Fetch one symbol from Yahoo's open v8 chart endpoint.
 * The chart response includes `meta.regularMarketPrice`, `previousClose`,
 * `regularMarketVolume`, `bid`, `ask` — same fields the old /v7/quote gave
 * us, but without the crumb/cookie auth barrier.
 */
async function fetchOne(symbol: string) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1m&range=1d`;
  const r = await fetch(url, {
    headers: {
      'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      'accept': 'application/json',
    },
  });
  if (!r.ok) throw new Error(`yahoo ${symbol} ${r.status}`);
  const j = await r.json();
  const meta = j?.chart?.result?.[0]?.meta;
  if (!meta) return null;
  const price = Number(meta.regularMarketPrice ?? meta.previousClose ?? 0);
  if (!Number.isFinite(price) || price <= 0) return null;
  const prev = Number(meta.chartPreviousClose ?? meta.previousClose ?? 0);
  const change_pct = prev > 0 ? ((price - prev) / prev) * 100 : undefined;
  return {
    symbol,
    price,
    bid: meta.bid != null ? Number(meta.bid) : undefined,
    ask: meta.ask != null ? Number(meta.ask) : undefined,
    change_pct,
    volume: meta.regularMarketVolume != null ? Number(meta.regularMarketVolume) : undefined,
    currency: meta.currency,
  };
}

async function fetchYahoo(symbols: string[]): Promise<unknown[]> {
  const now = Date.now();
  const need: string[] = [];
  const out: unknown[] = [];
  for (const s of symbols) {
    const hit = CACHE.get(s);
    if (hit && now - hit.ts < CACHE_MS) out.push(hit.data);
    else need.push(s);
  }
  const results = await Promise.all(need.map(async (s) => {
    try {
      const q = await fetchOne(s);
      if (q) CACHE.set(s, { ts: now, data: q });
      return q;
    } catch { return null; }
  }));
  for (const q of results) if (q) out.push(q);
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
    if (body?.history) {
      const range = typeof body.range === 'string' ? body.range : '1mo';
      const interval = typeof body.interval === 'string' ? body.interval : '1h';
      const bars: Record<string, { closes: number[]; highs: number[]; lows: number[] }> = {};
      await Promise.all(symbols.map(async (s) => {
        try {
          const h = await fetchHistory(s, range, interval);
          if (h.closes.length > 5) bars[s] = { closes: h.closes, highs: h.highs, lows: h.lows };
        } catch { /* skip */ }
      }));
      return new Response(JSON.stringify({ bars, fetched_at: Date.now() }), {
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