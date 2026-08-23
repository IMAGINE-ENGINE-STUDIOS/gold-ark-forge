// market-history — REAL historical closes for pipeline simulation.
//
// Returns the actual traded closes for a list of provider quote ids (the same
// ids `market-quotes` uses). Nothing is generated: when a provider has no
// history for an id, the id is reported as missing and the caller must show an
// empty state instead of inventing prices.

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

const UA = 'Mozilla/5.0 (compatible; GoldArrowMarketData/1.0)'
const CACHE_MS = 60_000
const cache = new Map<string, { closes: number[]; at: number }>()

// Metals resolve their history from the COMEX/NYMEX futures contract.
const METAL_YAHOO: Record<string, string> = {
  XAU: 'GC=F', XAG: 'SI=F', XPT: 'PL=F', XPD: 'PA=F', HG: 'HG=F',
}

const timeout = (ms: number) => {
  const c = new AbortController()
  const t = setTimeout(() => c.abort(), ms)
  return { signal: c.signal, clear: () => clearTimeout(t) }
}

async function yahooCloses(symbol: string, interval: string, range: string): Promise<number[]> {
  const t = timeout(9000)
  try {
    const url =
      `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}` +
      `?interval=${encodeURIComponent(interval)}&range=${encodeURIComponent(range)}`
    const r = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'application/json' }, signal: t.signal })
    if (!r.ok) return []
    const d = await r.json()
    const res = d?.chart?.result?.[0]
    const raw: unknown[] = res?.indicators?.quote?.[0]?.close ?? []
    return raw.map(Number).filter((n) => Number.isFinite(n) && n > 0)
  } catch {
    return []
  } finally {
    t.clear()
  }
}

async function coinbaseCloses(product: string, granularity: number): Promise<number[]> {
  const t = timeout(9000)
  try {
    const r = await fetch(
      `https://api.exchange.coinbase.com/products/${encodeURIComponent(product)}/candles?granularity=${granularity}`,
      { headers: { 'User-Agent': UA }, signal: t.signal },
    )
    if (!r.ok) return []
    const rows = await r.json()
    if (!Array.isArray(rows)) return []
    // [time, low, high, open, close, volume] — newest first
    return rows
      .slice()
      .reverse()
      .map((row: number[]) => Number(row?.[4]))
      .filter((n) => Number.isFinite(n) && n > 0)
  } catch {
    return []
  } finally {
    t.clear()
  }
}

async function historyFor(id: string, interval: string, range: string): Promise<number[]> {
  const key = `${id}|${interval}|${range}`
  const hit = cache.get(key)
  if (hit && Date.now() - hit.at < CACHE_MS) return hit.closes

  let closes: number[] = []
  if (id.startsWith('METAL:')) {
    const code = id.slice(6).toUpperCase()
    if (METAL_YAHOO[code]) closes = await yahooCloses(METAL_YAHOO[code], interval, range)
  } else {
    closes = await yahooCloses(id, interval, range)
    // Crypto pairs fall back to the Coinbase exchange candles.
    if (!closes.length && /-USD$/.test(id)) {
      closes = await coinbaseCloses(id, interval === '1m' ? 60 : 3600)
    }
  }

  if (closes.length) cache.set(key, { closes, at: Date.now() })
  return closes
}

async function mapLimit<T, R>(items: T[], limit: number, fn: (t: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length)
  let i = 0
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (i < items.length) {
        const idx = i++
        out[idx] = await fn(items[idx])
      }
    }),
  )
  return out
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  try {
    const body = await req.json().catch(() => ({}))
    const raw = Array.isArray(body?.symbols) ? body.symbols : []
    const interval = body?.interval === '1d' ? '1d' : body?.interval === '5m' ? '5m' : '1m'
    const range = typeof body?.range === 'string' && /^[0-9]+(d|mo|y)$/.test(body.range)
      ? body.range
      : interval === '1d' ? '6mo' : '1d'
    const points = Math.max(20, Math.min(600, Number(body?.points) || 300))

    const symbols: string[] = Array.from(
      new Set(
        raw
          .filter((s: unknown): s is string => typeof s === 'string')
          .map((s: string) => s.trim())
          .filter((s: string) => s.length > 0 && s.length <= 24),
      ),
    ).slice(0, 60)

    if (!symbols.length) return json({ error: 'symbols must be a non-empty string array' }, 400)

    const started = Date.now()
    const results = await mapLimit(symbols, 8, (id) => historyFor(id, interval, range))

    const series: Record<string, number[]> = {}
    const missing: string[] = []
    results.forEach((closes, i) => {
      if (closes.length >= 5) series[symbols[i]] = closes.slice(-points)
      else missing.push(symbols[i])
    })

    return json({ series, missing, interval, range, latency_ms: Date.now() - started })
  } catch (err) {
    console.error('[market-history] error', err)
    return json({ error: (err as Error).message }, 500)
  }
})
