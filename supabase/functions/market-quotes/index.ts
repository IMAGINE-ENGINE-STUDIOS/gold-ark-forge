import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })

export interface Quote {
  id: string
  last: number
  prevClose: number | null
  change24h: number | null
  ts: string
  source: string
}

const UA = 'Mozilla/5.0 (compatible; GoldArrowMarketData/1.0)'
const CACHE_MS = 5_000
const cache = new Map<string, { q: Quote; at: number }>()

const timeout = (ms: number) => {
  const c = new AbortController()
  const t = setTimeout(() => c.abort(), ms)
  return { signal: c.signal, clear: () => clearTimeout(t) }
}

// ─── Provider: gold-api.com (real metal SPOT) ─────────────
async function fetchMetalSpot(code: string): Promise<Quote | null> {
  const t = timeout(6000)
  try {
    const r = await fetch(`https://api.gold-api.com/price/${code}`, { signal: t.signal })
    if (!r.ok) return null
    const d = await r.json()
    const price = Number(d?.price)
    if (!isFinite(price) || price <= 0) return null
    return {
      id: `METAL:${code}`,
      last: price,
      prevClose: null,
      change24h: null,
      ts: d?.updatedAt ?? new Date().toISOString(),
      source: 'gold-api',
    }
  } catch {
    return null
  } finally {
    t.clear()
  }
}

// ─── Provider: Yahoo Finance chart (equities, fx, futures, indices) ───
async function fetchYahoo(symbol: string): Promise<Quote | null> {
  const t = timeout(8000)
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1m&range=1d`
    const r = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'application/json' }, signal: t.signal })
    if (!r.ok) return null
    const d = await r.json()
    const meta = d?.chart?.result?.[0]?.meta
    const last = Number(meta?.regularMarketPrice)
    if (!isFinite(last) || last <= 0) return null
    const prev = Number(meta?.chartPreviousClose ?? meta?.previousClose)
    const prevClose = isFinite(prev) && prev > 0 ? prev : null
    return {
      id: symbol,
      last,
      prevClose,
      change24h: prevClose ? ((last - prevClose) / prevClose) * 100 : null,
      ts: meta?.regularMarketTime ? new Date(meta.regularMarketTime * 1000).toISOString() : new Date().toISOString(),
      source: 'yahoo',
    }
  } catch {
    return null
  } finally {
    t.clear()
  }
}

// ─── Provider: Coinbase spot (metal + fx backup) ──────────
async function fetchCoinbase(pair: string, id: string): Promise<Quote | null> {
  const t = timeout(6000)
  try {
    const r = await fetch(`https://api.coinbase.com/v2/prices/${pair}/spot`, { signal: t.signal })
    if (!r.ok) return null
    const d = await r.json()
    const last = Number(d?.data?.amount)
    if (!isFinite(last) || last <= 0) return null
    return { id, last, prevClose: null, change24h: null, ts: new Date().toISOString(), source: 'coinbase' }
  } catch {
    return null
  } finally {
    t.clear()
  }
}

// Yahoo futures fallback per metal code
const METAL_YAHOO_FALLBACK: Record<string, string> = {
  XAU: 'GC=F', XAG: 'SI=F', XPT: 'PL=F', XPD: 'PA=F', HG: 'HG=F',
}

async function resolveOne(id: string): Promise<Quote | null> {
  const cached = cache.get(id)
  if (cached && Date.now() - cached.at < CACHE_MS) return cached.q

  let q: Quote | null = null
  if (id.startsWith('METAL:')) {
    const code = id.slice(6).toUpperCase()
    q = await fetchMetalSpot(code)
    if (!q) q = await fetchCoinbase(`${code}-USD`, id)
    if (!q && METAL_YAHOO_FALLBACK[code]) {
      const y = await fetchYahoo(METAL_YAHOO_FALLBACK[code])
      if (y) q = { ...y, id }
    }
    // enrich change from the futures contract when spot provider omits it
    if (q && q.change24h === null && METAL_YAHOO_FALLBACK[code]) {
      const y = await fetchYahoo(METAL_YAHOO_FALLBACK[code])
      if (y?.change24h !== null && y?.change24h !== undefined) q = { ...q, change24h: y.change24h }
    }
  } else {
    q = await fetchYahoo(id)
  }

  if (q) cache.set(id, { q, at: Date.now() })
  return q
}

async function mapLimit<T, R>(items: T[], limit: number, fn: (t: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length)
  let i = 0
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (i < items.length) {
      const idx = i++
      out[idx] = await fn(items[idx])
    }
  })
  await Promise.all(workers)
  return out
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  try {
    const body = await req.json().catch(() => ({}))
    const raw = Array.isArray(body?.symbols) ? body.symbols : []
    const assetClass = typeof body?.assetClass === 'string' ? body.assetClass : 'mixed'

    const symbols = Array.from(
      new Set(
        raw
          .filter((s: unknown): s is string => typeof s === 'string')
          .map((s: string) => s.trim())
          .filter((s: string) => s.length > 0 && s.length <= 24),
      ),
    ).slice(0, 200)

    if (symbols.length === 0) return json({ error: 'symbols must be a non-empty string array' }, 400)

    const started = Date.now()
    const results = await mapLimit(symbols, 10, resolveOne)
    const quotes: Record<string, Quote> = {}
    const missing: string[] = []
    results.forEach((q, idx) => {
      if (q) quotes[symbols[idx]] = q
      else missing.push(symbols[idx])
    })

    // Persist last known good ticks (best-effort)
    try {
      const url = Deno.env.get('SUPABASE_URL')
      const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
      if (url && key && Object.keys(quotes).length > 0) {
        const supabase = createClient(url, key)
        const rows = Object.values(quotes).map((q) => ({
          symbol: q.id,
          source: q.source,
          asset_class: assetClass,
          last: q.last,
          change_24h: q.change24h,
          latency_ms: Date.now() - started,
          ts: q.ts,
        }))
        await supabase.from('market_ticks').upsert(rows, { onConflict: 'symbol,source' })
      }
    } catch (e) {
      console.error('[market-quotes] tick persist failed', e)
    }

    return json({ quotes, missing, latency_ms: Date.now() - started })
  } catch (err) {
    console.error('[market-quotes] error', err)
    return json({ error: (err as Error).message }, 500)
  }
})
