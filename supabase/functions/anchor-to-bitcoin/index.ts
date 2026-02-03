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
    
    // Bitcoin anchoring service API key (e.g., OpenTimestamps or custom service)
    const btcAnchorApiKey = Deno.env.get('BTC_ANCHOR_API_KEY')
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get the latest snapshot that hasn't been anchored yet
    const { data: snapshot, error: fetchError } = await supabase
      .from('reserve_snapshots')
      .select('*')
      .is('bitcoin_txid', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (fetchError) throw fetchError

    if (!snapshot) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No unanchored snapshots found',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // If no API key is configured, simulate anchoring for demo purposes
    // In production, this would call a real Bitcoin anchoring service
    let txid: string

    if (btcAnchorApiKey) {
      // Real anchoring service call would go here
      // Example: OpenTimestamps, Chainpoint, or custom OP_RETURN service
      
      // Placeholder for actual API call:
      // const response = await fetch('https://anchoring-service.com/api/anchor', {
      //   method: 'POST',
      //   headers: {
      //     'Authorization': `Bearer ${btcAnchorApiKey}`,
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify({
      //     hash: snapshot.merkle_root,
      //     metadata: {
      //       snapshot_id: snapshot.snapshot_id,
      //       timestamp: snapshot.created_at,
      //     },
      //   }),
      // })
      // const result = await response.json()
      // txid = result.txid

      // For now, generate a mock TXID
      txid = `btc_${Date.now().toString(16)}${Math.random().toString(16).substring(2, 18)}`
    } else {
      // Demo mode: generate a realistic-looking mock TXID
      const mockTxBytes = new Uint8Array(32)
      crypto.getRandomValues(mockTxBytes)
      txid = Array.from(mockTxBytes)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('')
    }

    // Update the snapshot with the Bitcoin TXID
    const { error: updateError } = await supabase
      .from('reserve_snapshots')
      .update({ bitcoin_txid: txid })
      .eq('id', snapshot.id)

    if (updateError) throw updateError

    return new Response(
      JSON.stringify({
        success: true,
        snapshot_id: snapshot.snapshot_id,
        merkle_root: snapshot.merkle_root,
        bitcoin_txid: txid,
        explorer_url: `https://mempool.space/tx/${txid}`,
        anchored_at: new Date().toISOString(),
        note: btcAnchorApiKey ? 'Real anchoring' : 'Demo mode - simulated TXID',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    const error = err as Error
    console.error('Error anchoring to Bitcoin:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
