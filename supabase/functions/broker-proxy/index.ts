import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { encode as encodeBase64 } from "https://deno.land/std@0.168.0/encoding/base64.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ─── Alpaca ───────────────────────────────────────────────
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
  if (!resp.ok) throw new Error(data?.message || `Alpaca API ${resp.status}`);
  return data;
}

// ─── Coinbase ─────────────────────────────────────────────
const COINBASE_SANDBOX = "https://api-public.sandbox.exchange.coinbase.com";
const COINBASE_PROD = "https://api.exchange.coinbase.com";

function getCoinbaseBase(env: string) {
  return env === "sandbox" || env === "paper" ? COINBASE_SANDBOX : COINBASE_PROD;
}

async function coinbaseFetch(
  path: string,
  apiKey: string,
  apiSecret: string,
  passphrase: string,
  base: string,
  opts: { method?: string; body?: string } = {}
) {
  const method = opts.method || "GET";
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const bodyStr = opts.body || "";
  const message = timestamp + method.toUpperCase() + path + bodyStr;

  // HMAC-SHA256 sign
  const key = Uint8Array.from(atob(apiSecret), (c) => c.charCodeAt(0));
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    key,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", cryptoKey, new TextEncoder().encode(message));
  const signature = encodeBase64(new Uint8Array(sig));

  const resp = await fetch(`${base}${path}`, {
    method,
    headers: {
      "CB-ACCESS-KEY": apiKey,
      "CB-ACCESS-SIGN": signature,
      "CB-ACCESS-TIMESTAMP": timestamp,
      "CB-ACCESS-PASSPHRASE": passphrase,
      "Content-Type": "application/json",
    },
    body: bodyStr || undefined,
  });
  const data = await resp.json();
  if (!resp.ok) throw new Error(data?.message || `Coinbase API ${resp.status}`);
  return data;
}

// ─── Interactive Brokers (Client Portal) ──────────────────
const IBKR_PAPER = "https://localhost:5000/v1/api";
const IBKR_LIVE = "https://localhost:5000/v1/api";
// Note: IBKR Client Portal Gateway runs locally; in production
// the user would self-host. We proxy through their configured base.

async function ibkrFetch(path: string, _apiKey: string, _apiSecret: string, opts: { method?: string; body?: string } = {}) {
  // IBKR uses session-based auth via the Client Portal Gateway.
  // The gateway must be authenticated separately by the user.
  // We relay requests assuming the gateway session is active.
  const resp = await fetch(`${IBKR_LIVE}${path}`, {
    method: opts.method || "GET",
    headers: { "Content-Type": "application/json" },
    body: opts.body || undefined,
  });
  const data = await resp.json();
  if (!resp.ok) throw new Error(data?.error || `IBKR API ${resp.status}`);
  return data;
}

// ─── Broker Router ────────────────────────────────────────

interface Connection {
  id: string;
  broker: string;
  environment: string;
  api_key: string;
  api_secret: string;
  api_passphrase: string | null;
}

async function handleAlpaca(action: string, conn: Connection, params: Record<string, unknown>, userId: string, supabase: ReturnType<typeof createClient>) {
  const base = getAlpacaBase(conn.environment);

  switch (action) {
    case "account": {
      const account = await alpacaFetch(`${base}/v2/account`, conn.api_key, conn.api_secret);
      return { success: true, account };
    }
    case "positions": {
      const positions = await alpacaFetch(`${base}/v2/positions`, conn.api_key, conn.api_secret);
      return { success: true, positions };
    }
    case "order": {
      const orderBody: Record<string, unknown> = {
        symbol: params.symbol,
        qty: params.qty,
        side: params.side,
        type: params.orderType || "market",
        time_in_force: params.timeInForce || "day",
      };
      if (params.orderType === "limit" && params.limitPrice) orderBody.limit_price = params.limitPrice;
      if (params.orderType === "stop" && params.stopPrice) orderBody.stop_price = params.stopPrice;

      const order = await alpacaFetch(`${base}/v2/orders`, conn.api_key, conn.api_secret, {
        method: "POST",
        body: JSON.stringify(orderBody),
      });

      await supabase.from("broker_orders").insert({
        user_id: userId,
        connection_id: conn.id,
        broker_order_id: order.id,
        symbol: params.symbol as string,
        side: params.side as string,
        order_type: (params.orderType as string) || "market",
        qty: params.qty as number,
        limit_price: (params.limitPrice as number) || null,
        status: order.status || "pending",
        broker_response: order,
      });
      return { success: true, order };
    }
    case "orders": {
      const status = (params.status as string) || "all";
      const orders = await alpacaFetch(`${base}/v2/orders?status=${status}&limit=50&direction=desc`, conn.api_key, conn.api_secret);
      return { success: true, orders };
    }
    case "cancel": {
      await alpacaFetch(`${base}/v2/orders/${params.orderId}`, conn.api_key, conn.api_secret, { method: "DELETE" });
      return { success: true };
    }
    case "quote": {
      const quote = await alpacaFetch(`${ALPACA_DATA}/v2/stocks/${params.symbol}/quotes/latest`, conn.api_key, conn.api_secret);
      return { success: true, quote };
    }
    default:
      throw new Error(`Unknown Alpaca action: ${action}`);
  }
}

async function handleCoinbase(action: string, conn: Connection, params: Record<string, unknown>, userId: string, supabase: ReturnType<typeof createClient>) {
  const base = getCoinbaseBase(conn.environment);
  const passphrase = conn.api_passphrase || "";

  switch (action) {
    case "account": {
      const accounts = await coinbaseFetch("/accounts", conn.api_key, conn.api_secret, passphrase, base);
      // Aggregate into a summary
      let totalUsd = 0;
      const balances: Array<{ currency: string; available: string; balance: string }> = [];
      for (const acct of accounts) {
        const bal = parseFloat(acct.balance);
        const avail = parseFloat(acct.available);
        if (bal > 0 || avail > 0) {
          balances.push({ currency: acct.currency, available: acct.available, balance: acct.balance });
          if (acct.currency === "USD") totalUsd += avail;
        }
      }
      return {
        success: true,
        account: {
          id: conn.id,
          status: "active",
          buying_power: totalUsd.toString(),
          cash: totalUsd.toString(),
          portfolio_value: totalUsd.toString(),
          equity: totalUsd.toString(),
          currency: "USD",
          balances,
        },
      };
    }
    case "positions": {
      const accounts = await coinbaseFetch("/accounts", conn.api_key, conn.api_secret, passphrase, base);
      const positions = accounts
        .filter((a: { balance: string; currency: string }) => parseFloat(a.balance) > 0 && a.currency !== "USD")
        .map((a: { currency: string; balance: string; available: string }) => ({
          symbol: `${a.currency}-USD`,
          qty: a.balance,
          avg_entry_price: "0",
          market_value: "0",
          current_price: "0",
          unrealized_pl: "0",
          unrealized_plpc: "0",
          side: "long",
        }));
      return { success: true, positions };
    }
    case "order": {
      const orderBody: Record<string, unknown> = {
        product_id: params.symbol as string,
        side: params.side as string,
        type: params.orderType === "market" ? "market" : "limit",
      };
      if (params.orderType === "market") {
        if (params.side === "buy") {
          orderBody.funds = params.qty;
        } else {
          orderBody.size = params.qty;
        }
      } else {
        orderBody.size = params.qty;
        orderBody.price = params.limitPrice;
      }

      const order = await coinbaseFetch("/orders", conn.api_key, conn.api_secret, passphrase, base, {
        method: "POST",
        body: JSON.stringify(orderBody),
      });

      await supabase.from("broker_orders").insert({
        user_id: userId,
        connection_id: conn.id,
        broker_order_id: order.id,
        symbol: params.symbol as string,
        side: params.side as string,
        order_type: (params.orderType as string) || "market",
        qty: params.qty as number,
        limit_price: (params.limitPrice as number) || null,
        status: order.status || "pending",
        broker_response: order,
      });
      return { success: true, order };
    }
    case "orders": {
      const orders = await coinbaseFetch("/orders?status=all&limit=50", conn.api_key, conn.api_secret, passphrase, base);
      return { success: true, orders };
    }
    case "cancel": {
      await coinbaseFetch(`/orders/${params.orderId}`, conn.api_key, conn.api_secret, passphrase, base, { method: "DELETE" });
      return { success: true };
    }
    default:
      throw new Error(`Unknown Coinbase action: ${action}`);
  }
}

async function handleIBKR(action: string, conn: Connection, params: Record<string, unknown>, userId: string, supabase: ReturnType<typeof createClient>) {
  switch (action) {
    case "account": {
      const accounts = await ibkrFetch("/portfolio/accounts", conn.api_key, conn.api_secret);
      const acctId = accounts?.[0]?.accountId;
      if (!acctId) throw new Error("No IBKR account found");
      const summary = await ibkrFetch(`/portfolio/${acctId}/summary`, conn.api_key, conn.api_secret);
      return {
        success: true,
        account: {
          id: acctId,
          account_number: acctId,
          status: "active",
          buying_power: summary?.buyingpower?.amount?.toString() || "0",
          cash: summary?.totalcashvalue?.amount?.toString() || "0",
          portfolio_value: summary?.netliquidation?.amount?.toString() || "0",
          equity: summary?.netliquidation?.amount?.toString() || "0",
          currency: "USD",
        },
      };
    }
    case "positions": {
      const accounts = await ibkrFetch("/portfolio/accounts", conn.api_key, conn.api_secret);
      const acctId = accounts?.[0]?.accountId;
      const posData = await ibkrFetch(`/portfolio/${acctId}/positions/0`, conn.api_key, conn.api_secret);
      const positions = (posData || []).map((p: Record<string, unknown>) => ({
        symbol: p.contractDesc || p.ticker,
        qty: (p.position as number)?.toString() || "0",
        avg_entry_price: (p.avgCost as number)?.toString() || "0",
        market_value: (p.mktValue as number)?.toString() || "0",
        current_price: (p.mktPrice as number)?.toString() || "0",
        unrealized_pl: (p.unrealizedPnl as number)?.toString() || "0",
        unrealized_plpc: "0",
        side: (p.position as number) > 0 ? "long" : "short",
      }));
      return { success: true, positions };
    }
    case "order": {
      const accounts = await ibkrFetch("/portfolio/accounts", conn.api_key, conn.api_secret);
      const acctId = accounts?.[0]?.accountId;
      const orderBody = {
        orders: [{
          conid: params.conid || 0,
          orderType: params.orderType === "market" ? "MKT" : "LMT",
          side: (params.side as string).toUpperCase(),
          quantity: params.qty,
          price: params.limitPrice || 0,
          tif: "DAY",
        }],
      };
      const order = await ibkrFetch(`/iserver/account/${acctId}/orders`, conn.api_key, conn.api_secret, {
        method: "POST",
        body: JSON.stringify(orderBody),
      });

      await supabase.from("broker_orders").insert({
        user_id: userId,
        connection_id: conn.id,
        broker_order_id: order?.[0]?.order_id?.toString() || null,
        symbol: params.symbol as string,
        side: params.side as string,
        order_type: (params.orderType as string) || "market",
        qty: params.qty as number,
        limit_price: (params.limitPrice as number) || null,
        status: "pending",
        broker_response: order,
      });
      return { success: true, order };
    }
    case "orders": {
      const orders = await ibkrFetch("/iserver/account/orders", conn.api_key, conn.api_secret);
      return { success: true, orders: orders?.orders || [] };
    }
    case "cancel": {
      const accounts = await ibkrFetch("/portfolio/accounts", conn.api_key, conn.api_secret);
      const acctId = accounts?.[0]?.accountId;
      await ibkrFetch(`/iserver/account/${acctId}/order/${params.orderId}`, conn.api_key, conn.api_secret, { method: "DELETE" });
      return { success: true };
    }
    default:
      throw new Error(`Unknown IBKR action: ${action}`);
  }
}

// ─── Main Handler ─────────────────────────────────────────

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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

    // Get connection
    let query = supabase
      .from("broker_connections")
      .select("*")
      .eq("is_active", true);
    if (connectionId) query = query.eq("id", connectionId);
    const { data: connData, error: connError } = await query.limit(1).maybeSingle();
    if (connError || !connData) throw new Error("No active broker connection found");

    const conn = connData as Connection;
    let result: Record<string, unknown>;

    switch (conn.broker) {
      case "alpaca":
        result = await handleAlpaca(action, conn, params, user.id, supabase);
        break;
      case "coinbase":
        result = await handleCoinbase(action, conn, params, user.id, supabase);
        break;
      case "ibkr":
        result = await handleIBKR(action, conn, params, user.id, supabase);
        break;
      default:
        throw new Error(`Unsupported broker: ${conn.broker}`);
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("[broker-proxy]", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
