import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { z } from 'npm:zod@3.25.76';

const BodySchema = z.object({
  symbols: z.array(z.string().min(3).max(64)).min(1).max(1200),
});

const CACHE = new Map<string, { ts: number; data: Quote }>();
const CACHE_MS = 750;

type Quote = {
  tvSymbol: string;
  name: string;
  price: number;
  change_pct?: number;
  volume?: number;
  bid?: number;
  ask?: number;
  update_mode?: string;
  currency?: string;
};

const columns = ['name', 'close', 'change', 'volume', 'bid', 'ask', 'update_mode', 'currency'];

async function fetchTradingView(symbols: string[]): Promise<Quote[]> {
  const now = Date.now();
  const cached: Quote[] = [];
  const needed: string[] = [];

  for (const symbol of symbols) {
    const hit = CACHE.get(symbol);
    if (hit && now - hit.ts < CACHE_MS) cached.push(hit.data);
    else needed.push(symbol);
  }

  if (!needed.length) return cached;

  const response = await fetch('https://scanner.tradingview.com/global/scan', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'accept': 'application/json',
      'origin': 'https://www.tradingview.com',
      'referer': 'https://www.tradingview.com/',
      'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    },
    body: JSON.stringify({
      symbols: { tickers: needed, query: { types: [] } },
      columns,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`TradingView scanner ${response.status}: ${body.slice(0, 240)}`);
  }

  const json = await response.json();
  const fresh: Quote[] = [];
  for (const row of json?.data ?? []) {
    const tvSymbol = String(row?.s ?? '');
    const d = row?.d ?? [];
    const price = Number(d[1]);
    if (!tvSymbol || !Number.isFinite(price) || price <= 0) continue;
    const quote: Quote = {
      tvSymbol,
      name: String(d[0] ?? tvSymbol),
      price,
      change_pct: Number.isFinite(Number(d[2])) ? Number(d[2]) : undefined,
      volume: Number.isFinite(Number(d[3])) ? Number(d[3]) : undefined,
      bid: Number.isFinite(Number(d[4])) ? Number(d[4]) : undefined,
      ask: Number.isFinite(Number(d[5])) ? Number(d[5]) : undefined,
      update_mode: typeof d[6] === 'string' ? d[6] : undefined,
      currency: typeof d[7] === 'string' ? d[7] : undefined,
    };
    CACHE.set(tvSymbol, { ts: now, data: quote });
    fresh.push(quote);
  }

  return [...cached, ...fresh];
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const parsed = BodySchema.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: parsed.error.flatten().fieldErrors }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const symbols = Array.from(new Set(parsed.data.symbols));
    const quotes = await fetchTradingView(symbols);
    return new Response(JSON.stringify({ quotes, fetched_at: Date.now(), source: 'tradingview_scanner' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : String(error) }), {
      status: 502,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});