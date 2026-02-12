import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { ethers } from "https://esm.sh/ethers@6.13.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const NONCE_TTL_MS = 5 * 60 * 1000; // 5 minutes

function generateNonce(length = 16): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => chars[b % chars.length]).join("");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    const { action, siweMessage, signature } = await req.json();

    // ─── NONCE ────────────────────────────────────────
    if (action === "nonce") {
      const nonce = generateNonce();
      const expiresAt = new Date(Date.now() + NONCE_TTL_MS).toISOString();

      const { error } = await supabaseAdmin
        .from("siwe_nonces")
        .insert({ nonce, expires_at: expiresAt });

      if (error) throw error;

      // Cleanup expired nonces in the background
      supabaseAdmin
        .from("siwe_nonces")
        .delete()
        .lt("expires_at", new Date().toISOString())
        .then(() => {});

      return new Response(JSON.stringify({ nonce, expiresAt }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ─── VERIFY ───────────────────────────────────────
    if (action === "verify") {
      if (!siweMessage || !signature) {
        return new Response(
          JSON.stringify({ error: "Missing siweMessage or signature" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Parse SIWE message fields
      const addressMatch = siweMessage.match(/^(0x[a-fA-F0-9]{40})/m);
      const nonceMatch = siweMessage.match(/Nonce: (.+)/);
      const chainIdMatch = siweMessage.match(/Chain ID: (\d+)/);

      if (!addressMatch || !nonceMatch) {
        return new Response(
          JSON.stringify({ error: "Invalid SIWE message format" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const claimedAddress = addressMatch[1];
      const nonce = nonceMatch[1].trim();
      const chainId = chainIdMatch ? chainIdMatch[1] : "1";

      // Verify signature
      const recoveredAddress = ethers.verifyMessage(siweMessage, signature);
      if (recoveredAddress.toLowerCase() !== claimedAddress.toLowerCase()) {
        return new Response(
          JSON.stringify({ error: "Signature verification failed" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Validate nonce
      const { data: nonceRecord, error: nonceError } = await supabaseAdmin
        .from("siwe_nonces")
        .select("*")
        .eq("nonce", nonce)
        .eq("used", false)
        .gt("expires_at", new Date().toISOString())
        .maybeSingle();

      if (nonceError || !nonceRecord) {
        return new Response(
          JSON.stringify({ error: "Invalid or expired nonce" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Mark nonce as used
      await supabaseAdmin
        .from("siwe_nonces")
        .update({ used: true })
        .eq("id", nonceRecord.id);

      // Look up or create Supabase auth user for this wallet
      const walletEmail = `${claimedAddress.toLowerCase()}@wallet.goldarrow.io`;

      // Try to find existing user by email
      const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
      const existingUser = existingUsers?.users?.find(
        (u) => u.email === walletEmail
      );

      let userId: string;

      if (existingUser) {
        userId = existingUser.id;
      } else {
        // Create new user with wallet-derived email
        const { data: newUser, error: createError } =
          await supabaseAdmin.auth.admin.createUser({
            email: walletEmail,
            password: crypto.randomUUID(), // Random password, never used
            email_confirm: true,
            user_metadata: {
              wallet_address: claimedAddress,
              auth_method: "siwe",
            },
          });

        if (createError || !newUser.user) {
          throw createError || new Error("Failed to create user");
        }
        userId = newUser.user.id;
      }

      // Upsert wallet record
      const { error: walletError } = await supabaseAdmin
        .from("wallets")
        .upsert(
          {
            address: claimedAddress.toLowerCase(),
            wallet_type: "evm",
            last_seen_at: new Date().toISOString(),
          },
          { onConflict: "address" }
        );

      if (walletError) {
        console.error("Wallet upsert error:", walletError);
      }

      // Update profile with wallet address
      await supabaseAdmin
        .from("profiles")
        .update({ wallet_address: claimedAddress.toLowerCase() })
        .eq("user_id", userId);

      // Generate session token
      const { data: tokenData, error: tokenError } =
        await supabaseAdmin.auth.admin.generateLink({
          type: "magiclink",
          email: walletEmail,
        });

      if (tokenError || !tokenData) {
        throw tokenError || new Error("Failed to generate auth link");
      }

      // Extract the token from the link to create a session
      // We need to sign in on behalf of the user
      const { data: sessionData, error: sessionError } =
        await supabaseAdmin.auth.admin.generateLink({
          type: "magiclink",
          email: walletEmail,
        });

      // Use signInWithPassword with the known email
      // Since we created the user with a random password, we need a different approach
      // Let's use the admin API to create a custom token approach
      // The cleanest way: update the user's password to a known value for this session, then sign in
      const sessionPassword = crypto.randomUUID();
      await supabaseAdmin.auth.admin.updateUser(userId, {
        password: sessionPassword,
      });

      // Create an anon client to sign in
      const anonClient = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_ANON_KEY")!
      );

      const { data: signInData, error: signInError } =
        await anonClient.auth.signInWithPassword({
          email: walletEmail,
          password: sessionPassword,
        });

      if (signInError || !signInData.session) {
        throw signInError || new Error("Failed to create session");
      }

      return new Response(
        JSON.stringify({
          session: {
            access_token: signInData.session.access_token,
            refresh_token: signInData.session.refresh_token,
            expires_in: signInData.session.expires_in,
            token_type: signInData.session.token_type,
          },
          address: claimedAddress,
          userId,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid action. Use 'nonce' or 'verify'" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("SIWE auth error:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
