import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Simple hash function for Merkle tree (using Web Crypto API)
async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message)
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

// Build Merkle root from bar data
async function buildMerkleRoot(bars: unknown[]): Promise<string> {
  if (bars.length === 0) {
    return await sha256('empty')
  }

  // Hash each bar's data
  const leaves = await Promise.all(
    bars.map(async (bar) => {
      const barData = JSON.stringify(bar)
      return await sha256(barData)
    })
  )

  // Build tree
  let currentLevel = leaves
  while (currentLevel.length > 1) {
    const nextLevel: string[] = []
    for (let i = 0; i < currentLevel.length; i += 2) {
      const left = currentLevel[i]
      const right = currentLevel[i + 1] || left // Duplicate if odd
      nextLevel.push(await sha256(left + right))
    }
    currentLevel = nextLevel
  }

  return currentLevel[0]
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Fetch all bullion bars
    const { data: bars, error: barsError } = await supabase
      .from('bullion_bars')
      .select('*')
      .order('serial_number')

    if (barsError) throw barsError

    // Calculate totals
    const totals = {
      gold_oz: 0,
      silver_oz: 0,
      platinum_oz: 0,
      bar_count: bars?.length || 0,
    }

    bars?.forEach((bar) => {
      const weight = Number(bar.weight_oz)
      switch (bar.metal_type) {
        case 'gold':
          totals.gold_oz += weight
          break
        case 'silver':
          totals.silver_oz += weight
          break
        case 'platinum':
          totals.platinum_oz += weight
          break
      }
    })

    // Build Merkle root from bar data
    const merkleRoot = await buildMerkleRoot(bars || [])

    // Generate snapshot ID
    const snapshotId = `SNAP-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`

    // Store snapshot
    const { data: snapshot, error: snapshotError } = await supabase
      .from('reserve_snapshots')
      .insert({
        snapshot_id: snapshotId,
        merkle_root: merkleRoot,
        total_gold_oz: totals.gold_oz,
        total_silver_oz: totals.silver_oz,
        total_platinum_oz: totals.platinum_oz,
        bar_count: totals.bar_count,
      })
      .select()
      .single()

    if (snapshotError) throw snapshotError

    // Update last_verified_at on all bars
    await supabase
      .from('bullion_bars')
      .update({ last_verified_at: new Date().toISOString() })
      .neq('id', '00000000-0000-0000-0000-000000000000') // Update all

    return new Response(
      JSON.stringify({
        success: true,
        snapshot: {
          id: snapshot.snapshot_id,
          merkle_root: snapshot.merkle_root,
          totals: {
            gold_oz: snapshot.total_gold_oz,
            silver_oz: snapshot.total_silver_oz,
            platinum_oz: snapshot.total_platinum_oz,
            bar_count: snapshot.bar_count,
          },
          created_at: snapshot.created_at,
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    const error = err as Error
    console.error('Error generating proof snapshot:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
