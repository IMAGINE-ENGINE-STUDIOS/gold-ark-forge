import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
  'Cache-Control': 'public, max-age=60',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    const body = await req.json()
    const { action, cert_id, event_id, snapshot_id } = body

    if (!action) {
      return new Response(JSON.stringify({ error: 'Missing action parameter' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // ACTION: verify
    if (action === 'verify') {
      if (!cert_id) {
        return new Response(JSON.stringify({ error: 'Missing cert_id' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const { data: cert, error: certErr } = await supabase
        .from('certificates')
        .select('cert_id, status, issued_at, metadata_json, partner_sig_alg, cert_version, partner_id')
        .eq('cert_id', cert_id)
        .single()

      if (certErr || !cert) {
        return new Response(JSON.stringify({ error: 'Certificate not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const { data: partner } = await supabase
        .from('partners')
        .select('legal_name, jurisdiction, partner_type')
        .eq('partner_id', cert.partner_id)
        .single()

      return new Response(JSON.stringify({ certificate: cert, partner }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // ACTION: history
    if (action === 'history') {
      if (!cert_id) {
        return new Response(JSON.stringify({ error: 'Missing cert_id' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const { data: events, error: evErr } = await supabase
        .from('certificate_events')
        .select('event_id, event_type, created_at, event_payload, actor_wallet_id')
        .eq('cert_id', cert_id)
        .order('created_at', { ascending: true })

      if (evErr) {
        return new Response(JSON.stringify({ error: 'Failed to fetch events' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      return new Response(JSON.stringify({ events: events || [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // ACTION: anchor_proof
    if (action === 'anchor_proof') {
      const targetId = cert_id || event_id
      if (!targetId) {
        return new Response(JSON.stringify({ error: 'Missing cert_id or event_id' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      let eventIds: string[] = []

      if (event_id) {
        eventIds = [event_id]
      } else {
        const { data: events } = await supabase
          .from('certificate_events')
          .select('event_id')
          .eq('cert_id', cert_id)
          .order('created_at', { ascending: false })
          .limit(1)

        if (events && events.length > 0) {
          eventIds = [events[0].event_id]
        }
      }

      if (eventIds.length === 0) {
        return new Response(JSON.stringify({ error: 'No events found for this certificate' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const { data: leaf } = await supabase
        .from('anchor_leaves')
        .select('leaf_hash, leaf_index, anchor_id')
        .eq('event_id', eventIds[0])
        .single()

      if (!leaf) {
        return new Response(JSON.stringify({ error: 'No anchor proof found for this event' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const { data: anchor } = await supabase
        .from('anchors')
        .select('merkle_root, commit_txid, status, commit_height, commit_time')
        .eq('anchor_id', leaf.anchor_id)
        .single()

      return new Response(JSON.stringify({
        proof: {
          event_id: eventIds[0],
          leaf_hash: leaf.leaf_hash,
          leaf_index: leaf.leaf_index,
          merkle_root: anchor?.merkle_root,
          commit_txid: anchor?.commit_txid,
          status: anchor?.status,
          commit_height: anchor?.commit_height,
          commit_time: anchor?.commit_time,
        },
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // ACTION: reserve_snapshot
    if (action === 'reserve_snapshot') {
      let query = supabase
        .from('reserve_snapshots')
        .select('*')

      if (snapshot_id) {
        query = query.eq('snapshot_id', snapshot_id).single()
      } else {
        query = query.order('created_at', { ascending: false }).limit(1).single()
      }

      const { data: snapshot, error: snapErr } = await query

      if (snapErr || !snapshot) {
        return new Response(JSON.stringify({ error: 'No reserve snapshot found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      return new Response(JSON.stringify({ snapshot }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ error: `Unknown action: ${action}` }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
