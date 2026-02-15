import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Alpaca base URLs
const ALPACA_PAPER = "https://paper-api.alpaca.markets";
const ALPACA_LIVE = "https://api.alpaca.markets";
const ALPACA_DATA = "https://data.alpaca.markets";

function getAlpacaBase(env: string) {
  return env === "live" ? ALPACA_LIVE : ALPACA_PAPER;
}

async function alpacaFetch(url: string, apiKey: string, apiSecret: string, opts: RequestInit = {}) {
  const resp = await fetch(url, {
    ...opts,
    headers: {
      "APCA-API-KEY-ID": apiKey,
      "APCA-API-SECRET-KEY": apiSecret,
      "Content-Type": "application/json",
      ...(opts.headers || {}),
    },
  });
  const data = await resp.json();
  if (!resp.ok) {
    throw new Error(data?.message || `Alpaca API ${resp.status}`);
  }
  return data;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth: get user from JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Invalid session" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { action, connectionId, ...params } = body;

    // Helper: get broker connection
    async function getConnection(connId?: string) {
      let query = supabase
        .from("broker_connections")
        .select("*")
        .eq("is_active", true);

      if (connId) {
        query = query.eq("id", connId);
      }

      const { data, error } = await query.limit(1).maybeSingle();
      if (error || !data) throw new Error("No active broker connection found");
      return data;
    }

    switch (action) {
      // ─── ACCOUNT INFO ──────────────────────────
      case "account": {
        const conn = await getConnection(connectionId);
        const base = getAlpacaBase(conn.environment);
        const account = await alpacaFetch(`${base}/v2/account`, conn.api_key, conn.api_secret);
        return new Response(JSON.stringify({ success: true, account }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // ─── POSITIONS ─────────────────────────────
      case "positions": {
        const conn = await getConnection(connectionId);
        const base = getAlpacaBase(conn.environment);
        const positions = await alpacaFetch(`${base}/v2/positions`, conn.api_key, conn.api_secret);
        return new Response(JSON.stringify({ success: true, positions }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // ─── SUBMIT ORDER ──────────────────────────
      case "order": {
        const conn = await getConnection(connectionId);
        const base = getAlpacaBase(conn.environment);

        const orderBody: Record<string, unknown> = {
          symbol: params.symbol,
          qty: params.qty,
          side: params.side,
          type: params.orderType || "market",
          time_in_force: params.timeInForce || "day",
        };

        if (params.orderType === "limit" && params.limitPrice) {
          orderBody.limit_price = params.limitPrice;
        }
        if (params.orderType === "stop" && params.stopPrice) {
          orderBody.stop_price = params.stopPrice;
        }

        const order = await alpacaFetch(`${base}/v2/orders`, conn.api_key, conn.api_secret, {
          method: "POST",
          body: JSON.stringify(orderBody),
        });

        // Log order locally
        await supabase.from("broker_orders").insert({
          user_id: user.id,
          connection_id: conn.id,
          broker_order_id: order.id,
          symbol: params.symbol,
          side: params.side,
          order_type: params.orderType || "market",
          qty: params.qty,
          limit_price: params.limitPrice || null,
          status: order.status || "pending",
          broker_response: order,
        });

        return new Response(JSON.stringify({ success: true, order }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // ─── ORDER HISTORY ─────────────────────────
      case "orders": {
        const conn = await getConnection(connectionId);
        const base = getAlpacaBase(conn.environment);
        const status = params.status || "all";
        const orders = await alpacaFetch(
          `${base}/v2/orders?status=${status}&limit=50&direction=desc`,
          conn.api_key, conn.api_secret
        );
        return new Response(JSON.stringify({ success: true, orders }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // ─── CANCEL ORDER ──────────────────────────
      case "cancel": {
        const conn = await getConnection(connectionId);
        const base = getAlpacaBase(conn.environment);
        await alpacaFetch(`${base}/v2/orders/${params.orderId}`, conn.api_key, conn.api_secret, {
          method: "DELETE",
        });
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // ─── QUOTE (market data) ───────────────────
      case "quote": {
        const conn = await getConnection(connectionId);
        const symbol = params.symbol;
        const quote = await alpacaFetch(
          `${ALPACA_DATA}/v2/stocks/${symbol}/quotes/latest`,
          conn.api_key, conn.api_secret
        );
        return new Response(JSON.stringify({ success: true, quote }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      default:
        return new Response(JSON.stringify({ error: `Unknown action: ${action}` }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("[broker-proxy]", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
