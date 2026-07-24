import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Live free source (no API key). Returns spot price per troy ounce in USD.
// Docs: https://gold-api.com/
const LIVE_ENDPOINTS: Record<'gold' | 'silver' | 'platinum', string> = {
  gold: 'https://api.gold-api.com/price/XAU',
  silver: 'https://api.gold-api.com/price/XAG',
  platinum: 'https://api.gold-api.com/price/XPT',
}

async function fetchLive(metal: 'gold' | 'silver' | 'platinum', prevPrice?: number) {
  const r = await fetch(LIVE_ENDPOINTS[metal], { headers: { 'Accept': 'application/json' } })
  if (!r.ok) throw new Error(`gold-api ${metal} ${r.status}`)
  const j = await r.json()
  const price = Number(j.price)
  if (!Number.isFinite(price) || price <= 0) throw new Error(`gold-api ${metal} invalid price`)
  // Derive 24h change from previous stored price if available (rough proxy until we cache history)
  const change = prevPrice && prevPrice > 0 ? ((price - prevPrice) / prevPrice) * 100 : 0
  return { price, change }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Load previous prices to compute rough intraday change proxy
    const { data: prev } = await supabase.from('price_feeds').select('metal_type, price_usd')
    const prevMap = new Map<string, number>((prev ?? []).map((r: { metal_type: string; price_usd: number }) => [r.metal_type, Number(r.price_usd)]))

    const [gold, silver, platinum] = await Promise.all([
      fetchLive('gold', prevMap.get('gold')),
      fetchLive('silver', prevMap.get('silver')),
      fetchLive('platinum', prevMap.get('platinum')),
    ])
    const prices = { gold, silver, platinum }

    // Upsert prices into database
    const now = new Date().toISOString()
    
    const upsertData = [
      { metal_type: 'gold', price_usd: prices.gold.price, change_24h: prices.gold.change, updated_at: now },
      { metal_type: 'silver', price_usd: prices.silver.price, change_24h: prices.silver.change, updated_at: now },
      { metal_type: 'platinum', price_usd: prices.platinum.price, change_24h: prices.platinum.change, updated_at: now },
    ]

    const { error: upsertError } = await supabase
      .from('price_feeds')
      .upsert(upsertData, { onConflict: 'metal_type' })

    if (upsertError) throw upsertError

    return new Response(
      JSON.stringify({
        success: true,
        prices: {
          gold: { price_usd: prices.gold.price, change_24h: prices.gold.change },
          silver: { price_usd: prices.silver.price, change_24h: prices.silver.change },
          platinum: { price_usd: prices.platinum.price, change_24h: prices.platinum.change },
        },
        updated_at: now,
        source: 'gold-api.com',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    const error = err as Error
    console.error('Error fetching metal prices:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
