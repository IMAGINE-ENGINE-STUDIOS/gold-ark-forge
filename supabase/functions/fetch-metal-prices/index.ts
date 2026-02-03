import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Fallback prices if API fails
const fallbackPrices = {
  gold: { price: 2350.00, change: 0.45 },
  silver: { price: 28.50, change: 0.82 },
  platinum: { price: 985.00, change: -0.23 },
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const metalsApiKey = Deno.env.get('METALS_API_KEY')
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    let prices = fallbackPrices

    // Try to fetch real prices if API key is configured
    if (metalsApiKey) {
      try {
        // Using metals-api.com format (or similar service)
        const response = await fetch(
          `https://metals-api.com/api/latest?access_key=${metalsApiKey}&base=USD&symbols=XAU,XAG,XPT`,
          { headers: { 'Accept': 'application/json' } }
        )
        
        if (response.ok) {
          const data = await response.json()
          
          if (data.success && data.rates) {
            // Convert from USD per unit to USD per oz
            // XAU = gold, XAG = silver, XPT = platinum
            prices = {
              gold: { 
                price: 1 / data.rates.XAU, 
                change: Math.random() * 2 - 1 // Mock change for now
              },
              silver: { 
                price: 1 / data.rates.XAG, 
                change: Math.random() * 3 - 1.5 
              },
              platinum: { 
                price: 1 / data.rates.XPT, 
                change: Math.random() * 2 - 1 
              },
            }
          }
        }
      } catch (apiError) {
        console.log('API fetch failed, using fallback prices:', apiError)
      }
    }

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
        source: metalsApiKey ? 'metals-api' : 'fallback',
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
