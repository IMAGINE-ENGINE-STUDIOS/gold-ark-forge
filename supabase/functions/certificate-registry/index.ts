import { createClient } from "https://esm.sh/@supabase/supabase-js@2.93.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function err(msg: string, status = 400) {
  return json({ error: msg }, status);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

  try {
    const body = await req.json();
    const { action } = body;

    // Public reads use anon client; writes use service role
    const anonClient = createClient(supabaseUrl, anonKey);
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // ---------- LIST ----------
    if (action === "list") {
      const { metal_type, status: certStatus, limit = 50, offset = 0 } = body;

      let query = anonClient
        .from("certificates")
        .select("*, partners!inner(legal_name, jurisdiction, partner_type)")
        .order("issued_at", { ascending: false })
        .range(offset, offset + limit - 1);

      if (certStatus) {
        query = query.eq("status", certStatus);
      }

      const { data, error } = await query;
      if (error) return err(error.message, 500);

      // Filter by metal_type from metadata_json client-side since jsonb operators
      // aren't directly chainable via the JS SDK filter syntax easily
      let filtered = data;
      if (metal_type) {
        filtered = data.filter(
          (c: any) => c.metadata_json?.metal_type === metal_type
        );
      }

      return json(filtered);
    }

    // ---------- GET ----------
    if (action === "get") {
      const { cert_id } = body;
      if (!cert_id) return err("cert_id required");

      const { data: cert, error: certErr } = await anonClient
        .from("certificates")
        .select("*, partners!inner(legal_name, jurisdiction, partner_type, status)")
        .eq("cert_id", cert_id)
        .maybeSingle();

      if (certErr) return err(certErr.message, 500);
      if (!cert) return err("Certificate not found", 404);

      // Fetch events
      const { data: events } = await anonClient
        .from("certificate_events")
        .select("*")
        .eq("cert_id", cert_id)
        .order("created_at", { ascending: true });

      // Fetch anchor leaves for these events
      const eventIds = (events || []).map((e: any) => e.event_id);
      let anchorLeaves: any[] = [];
      if (eventIds.length > 0) {
        const { data: leaves } = await anonClient
          .from("anchor_leaves")
          .select("*, anchors!inner(merkle_root, commit_txid, status, commit_height, commit_time)")
          .in("event_id", eventIds);
        anchorLeaves = leaves || [];
      }

      return json({ ...cert, events: events || [], anchor_leaves: anchorLeaves });
    }

    // ---------- CREATE ----------
    if (action === "create") {
      const {
        partner_id,
        owner_wallet_id,
        partner_sig,
        partner_sig_alg,
        metadata_json,
      } = body;

      if (!partner_id || !owner_wallet_id || !partner_sig || !partner_sig_alg || !metadata_json) {
        return err("Missing required fields: partner_id, owner_wallet_id, partner_sig, partner_sig_alg, metadata_json");
      }

      // Verify partner exists and is active
      const { data: partner } = await adminClient
        .from("partners")
        .select("partner_id, status")
        .eq("partner_id", partner_id)
        .maybeSingle();

      if (!partner || partner.status !== "active") {
        return err("Partner not found or not active", 403);
      }

      // Insert certificate
      const { data: cert, error: insertErr } = await adminClient
        .from("certificates")
        .insert({
          partner_id,
          owner_wallet_id,
          partner_sig,
          partner_sig_alg,
          metadata_json,
          status: "active",
        })
        .select()
        .single();

      if (insertErr) return err(insertErr.message, 500);

      // Insert issue event
      await adminClient.from("certificate_events").insert({
        cert_id: cert.cert_id,
        event_type: "issue",
        partner_id,
        partner_sig,
        event_payload: { metadata_json },
      });

      return json(cert, 201);
    }

    // ---------- FREEZE / UNFREEZE / REVOKE ----------
    if (["freeze", "unfreeze", "revoke"].includes(action)) {
      const { cert_id, partner_id, reason } = body;
      if (!cert_id || !partner_id) return err("cert_id and partner_id required");

      const statusMap: Record<string, string> = {
        freeze: "frozen",
        unfreeze: "active",
        revoke: "revoked",
      };

      const { data: cert, error: fetchErr } = await adminClient
        .from("certificates")
        .select("cert_id, status, cert_version")
        .eq("cert_id", cert_id)
        .maybeSingle();

      if (fetchErr || !cert) return err("Certificate not found", 404);

      // Validate transitions
      if (action === "freeze" && cert.status !== "active") {
        return err("Can only freeze active certificates");
      }
      if (action === "unfreeze" && cert.status !== "frozen") {
        return err("Can only unfreeze frozen certificates");
      }
      if (action === "revoke" && !["active", "frozen"].includes(cert.status)) {
        return err("Can only revoke active or frozen certificates");
      }

      const { error: updateErr } = await adminClient
        .from("certificates")
        .update({
          status: statusMap[action],
          cert_version: cert.cert_version + 1,
        })
        .eq("cert_id", cert_id);

      if (updateErr) return err(updateErr.message, 500);

      await adminClient.from("certificate_events").insert({
        cert_id,
        event_type: action,
        partner_id,
        event_payload: { reason: reason || null, previous_status: cert.status },
      });

      return json({ success: true, new_status: statusMap[action] });
    }

    // ---------- TRANSFER INTENT ----------
    if (action === "transfer_intent") {
      const { cert_id, seller_wallet_id, buyer_wallet_id, terms_json } = body;
      if (!cert_id || !seller_wallet_id || !buyer_wallet_id) {
        return err("cert_id, seller_wallet_id, buyer_wallet_id required");
      }

      // Verify cert is active and owned by seller
      const { data: cert } = await adminClient
        .from("certificates")
        .select("cert_id, status, owner_wallet_id")
        .eq("cert_id", cert_id)
        .maybeSingle();

      if (!cert) return err("Certificate not found", 404);
      if (cert.status !== "active") return err("Certificate is not active");
      if (cert.owner_wallet_id !== seller_wallet_id) {
        return err("Seller is not the certificate owner", 403);
      }

      const { data: transfer, error: transferErr } = await adminClient
        .from("transfers")
        .insert({
          cert_id,
          seller_wallet_id,
          buyer_wallet_id,
          terms_json: terms_json || {},
          status: "proposed",
        })
        .select()
        .single();

      if (transferErr) return err(transferErr.message, 500);

      await adminClient.from("certificate_events").insert({
        cert_id,
        event_type: "transfer_intent",
        actor_wallet_id: seller_wallet_id,
        event_payload: { transfer_id: transfer.transfer_id, buyer_wallet_id },
      });

      return json(transfer, 201);
    }

    return err(`Unknown action: ${action}`);
  } catch (e) {
    console.error("certificate-registry error:", e);
    return err("Internal server error", 500);
  }
});
