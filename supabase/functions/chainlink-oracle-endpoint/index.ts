import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Fetch latest reserve snapshot
    const { data: snapshot, error } = await supabase
      .from('reserve_snapshots')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) throw error

    if (!snapshot) {
      return new Response(
        JSON.stringify({
          success: true,
          data: null,
          message: 'No reserve snapshot available',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Format response for Chainlink oracle consumption
    // Chainlink expects specific format with reserves data
    const oracleResponse = {
      success: true,
      timestamp: new Date().toISOString(),
      snapshot_id: snapshot.snapshot_id,
      merkle_root: snapshot.merkle_root,
      reserves: {
        gold: {
          total_oz: Number(snapshot.total_gold_oz),
          // Convert to smallest unit for Chainlink (8 decimals)
          total_units: Math.floor(Number(snapshot.total_gold_oz) * 100000000),
        },
        silver: {
          total_oz: Number(snapshot.total_silver_oz),
          total_units: Math.floor(Number(snapshot.total_silver_oz) * 100000000),
        },
        platinum: {
          total_oz: Number(snapshot.total_platinum_oz),
          total_units: Math.floor(Number(snapshot.total_platinum_oz) * 100000000),
        },
      },
      bar_count: snapshot.bar_count,
      bitcoin_anchor: snapshot.bitcoin_txid || null,
      last_updated: snapshot.created_at,
    }

    return new Response(
      JSON.stringify(oracleResponse),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    const error = err as Error
    console.error('Error fetching oracle data:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
