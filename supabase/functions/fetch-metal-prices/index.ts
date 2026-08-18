import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const UA = 'Mozilla/5.0 (compatible; GoldArrowMarketData/1.0)'

const METALS: { key: 'gold' | 'silver' | 'platinum'; code: string; future: string }[] = [
  { key: 'gold', code: 'XAU', future: 'GC=F' },
  { key: 'silver', code: 'XAG', future: 'SI=F' },
  { key: 'platinum', code: 'XPT', future: 'PL=F' },
]

async function spot(code: string): Promise<number | null> {
  try {
    const r = await fetch(`https://api.gold-api.com/price/${code}`)
    if (r.ok) {
      const d = await r.json()
      const p = Number(d?.price)
      if (isFinite(p) && p > 0) return p
    }
  } catch (_) { /* fall through */ }
  try {
    const r = await fetch(`https://api.coinbase.com/v2/prices/${code}-USD/spot`)
    if (r.ok) {
      const d = await r.json()
      const p = Number(d?.data?.amount)
      if (isFinite(p) && p > 0) return p
    }
  } catch (_) { /* fall through */ }
  return null
}

async function futureChange(symbol: string): Promise<{ last: number | null; change: number | null }> {
  try {
    const r = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1m&range=1d`,
      { headers: { 'User-Agent': UA, Accept: 'application/json' } },
    )
    if (!r.ok) return { last: null, change: null }
    const d = await r.json()
    const meta = d?.chart?.result?.[0]?.meta
    const last = Number(meta?.regularMarketPrice)
    const prev = Number(meta?.chartPreviousClose ?? meta?.previousClose)
    return {
      last: isFinite(last) && last > 0 ? last : null,
      change: isFinite(last) && isFinite(prev) && prev > 0 ? ((last - prev) / prev) * 100 : null,
    }
  } catch {
    return { last: null, change: null }
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const now = new Date().toISOString()
    const rows: { metal_type: string; price_usd: number; change_24h: number | null; updated_at: string }[] = []
    const failed: string[] = []

    await Promise.all(
      METALS.map(async (m) => {
        const [s, fut] = await Promise.all([spot(m.code), futureChange(m.future)])
        const price = s ?? fut.last
        if (price === null) {
          failed.push(m.key)
          return
        }
        rows.push({ metal_type: m.key, price_usd: price, change_24h: fut.change, updated_at: now })
      }),
    )

    // No synthetic fallback: if nothing resolved, leave the table untouched and report failure.
    if (rows.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'All metal price providers failed', failed }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    const { error: upsertError } = await supabase
      .from('price_feeds')
      .upsert(rows, { onConflict: 'metal_type' })

    if (upsertError) throw upsertError

    return new Response(
      JSON.stringify({
        success: true,
        prices: Object.fromEntries(rows.map((r) => [r.metal_type, { price_usd: r.price_usd, change_24h: r.change_24h }])),
        failed,
        updated_at: now,
        source: 'gold-api/coinbase/yahoo',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (err) {
    const error = err as Error
    console.error('Error fetching metal prices:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }
})
