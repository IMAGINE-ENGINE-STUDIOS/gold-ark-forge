import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message)
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

async function buildMerkleRoot(leaves: string[]): Promise<string> {
  if (leaves.length === 0) return await sha256('empty')

  let currentLevel = leaves
  while (currentLevel.length > 1) {
    const nextLevel: string[] = []
    for (let i = 0; i < currentLevel.length; i += 2) {
      const left = currentLevel[i]
      const right = currentLevel[i + 1] || left
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

    // Find unanchored certificate_events (not yet in anchor_leaves)
    const { data: allEvents, error: eventsError } = await supabase
      .from('certificate_events')
      .select('event_id, event_type, cert_id, created_at, event_payload')
      .order('created_at', { ascending: true })

    if (eventsError) throw eventsError

    // Get already-anchored event IDs
    const { data: anchoredLeaves, error: leavesError } = await supabase
      .from('anchor_leaves')
      .select('event_id')

    if (leavesError) throw leavesError

    const anchoredSet = new Set((anchoredLeaves || []).map(l => l.event_id))
    const unanchoredEvents = (allEvents || []).filter(e => !anchoredSet.has(e.event_id))

    if (unanchoredEvents.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: 'No unanchored events to process' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Hash each event's canonical JSON
    const leafHashes: string[] = []
    for (const event of unanchoredEvents) {
      const canonical = JSON.stringify({
        event_id: event.event_id,
        event_type: event.event_type,
        cert_id: event.cert_id,
        created_at: event.created_at,
        event_payload: event.event_payload,
      })
      leafHashes.push(await sha256(canonical))
    }

    // Build Merkle root
    const merkleRoot = await buildMerkleRoot(leafHashes)

    // Insert anchor row (merkle_root is bytea, use hex encoding)
    const { data: anchor, error: anchorError } = await supabase
      .from('anchors')
      .insert({
        merkle_root: `\\x${merkleRoot}`,
        leaf_count: unanchoredEvents.length,
        status: 'pending',
      })
      .select()
      .single()

    if (anchorError) throw anchorError

    // Insert anchor_leaves
    const leavesInsert = unanchoredEvents.map((event, index) => ({
      anchor_id: anchor.anchor_id,
      event_id: event.event_id,
      leaf_index: index,
      leaf_hash: `\\x${leafHashes[index]}`,
    }))

    const { error: insertLeavesError } = await supabase
      .from('anchor_leaves')
      .insert(leavesInsert)

    if (insertLeavesError) throw insertLeavesError

    // Backward compat: compute totals from active certificates and write reserve_snapshots
    const { data: activeCerts, error: certsError } = await supabase
      .from('certificates')
      .select('metadata_json')
      .eq('status', 'active')

    if (certsError) throw certsError

    const totals = { gold_oz: 0, silver_oz: 0, platinum_oz: 0, cert_count: 0 }
    for (const cert of activeCerts || []) {
      const meta = cert.metadata_json as { metal_type?: string; weight_oz?: number }
      const weight = Number(meta?.weight_oz || 0)
      totals.cert_count++
      switch (meta?.metal_type) {
        case 'gold': totals.gold_oz += weight; break
        case 'silver': totals.silver_oz += weight; break
        case 'platinum': totals.platinum_oz += weight; break
      }
    }

    const snapshotId = `SNAP-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
    await supabase.from('reserve_snapshots').insert({
      snapshot_id: snapshotId,
      merkle_root: merkleRoot,
      total_gold_oz: totals.gold_oz,
      total_silver_oz: totals.silver_oz,
      total_platinum_oz: totals.platinum_oz,
      bar_count: totals.cert_count,
    })

    return new Response(
      JSON.stringify({
        success: true,
        anchor_id: anchor.anchor_id,
        merkle_root: merkleRoot,
        leaf_count: unanchoredEvents.length,
        reserve_totals: totals,
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
