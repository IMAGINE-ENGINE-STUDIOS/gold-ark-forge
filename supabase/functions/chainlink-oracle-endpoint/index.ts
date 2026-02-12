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

    // Compute live reserve totals from active certificates
    const { data: activeCerts, error: certsError } = await supabase
      .from('certificates')
      .select('metadata_json')
      .eq('status', 'active')

    if (certsError) throw certsError

    let gold_oz = 0, silver_oz = 0, platinum_oz = 0, cert_count = 0

    if (activeCerts && activeCerts.length > 0) {
      for (const cert of activeCerts) {
        const meta = cert.metadata_json as { metal_type?: string; weight_oz?: number }
        const weight = Number(meta?.weight_oz || 0)
        cert_count++
        switch (meta?.metal_type) {
          case 'gold': gold_oz += weight; break
          case 'silver': silver_oz += weight; break
          case 'platinum': platinum_oz += weight; break
        }
      }
    }

    // Fetch latest anchor with commit_txid
    const { data: latestAnchor } = await supabase
      .from('anchors')
      .select('anchor_id, merkle_root, commit_txid, status, created_at')
      .in('status', ['confirmed', 'broadcast'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    // If no active certificates, fall back to reserve_snapshots
    if (cert_count === 0) {
      const { data: snapshot } = await supabase
        .from('reserve_snapshots')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (snapshot) {
        gold_oz = Number(snapshot.total_gold_oz)
        silver_oz = Number(snapshot.total_silver_oz)
        platinum_oz = Number(snapshot.total_platinum_oz)
        cert_count = snapshot.bar_count
      }
    }

    const oracleResponse = {
      success: true,
      timestamp: new Date().toISOString(),
      anchor_id: latestAnchor?.anchor_id || null,
      merkle_root: latestAnchor?.merkle_root || null,
      reserves: {
        gold: {
          total_oz: gold_oz,
          total_units: Math.floor(gold_oz * 100000000),
        },
        silver: {
          total_oz: silver_oz,
          total_units: Math.floor(silver_oz * 100000000),
        },
        platinum: {
          total_oz: platinum_oz,
          total_units: Math.floor(platinum_oz * 100000000),
        },
      },
      bar_count: cert_count,
      bitcoin_anchor: latestAnchor?.commit_txid || null,
      last_updated: latestAnchor?.created_at || new Date().toISOString(),
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
