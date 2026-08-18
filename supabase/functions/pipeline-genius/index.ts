const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM = `You are GENIUS, the pipeline copilot inside the Gold Arrow trading workspace.
You help the operator BUILD, MODIFY, ANALYZE and TROUBLESHOOT an automation workflow ("pipeline").

A pipeline is an ordered list of nodes. Valid node kinds:
symbol, buy, sell, stop, schedule, alertup, alertdown, trail, hedge, dca, grid, scalp, momentum, meanrev, genius, wave, risk, timer.

Rules:
- Every symbol-consuming node (buy, sell, stop, trail, alertup, alertdown, schedule, dca, grid, scalp, momentum, meanrev, wave, genius) must be preceded by a symbol node that sets context.
- buy/sell config: { amount, currency:'USD', amountUsd, orderType:'market'|'limit', limitPrice }. amountUsd must be > 0.
- symbol config: { symbol: label e.g. 'XAU/USD', ticker: e.g. 'GLD' }.
- alertup/alertdown config: { price, channel:'app' }. risk config: { maxDrawdownPct, blockOnBreach }.

Answer with a short, concrete operator briefing (plain text, no markdown headers) plus optional actions.
Only emit actions when the user asks to build/modify/run/stop something. Never invent fills or prices.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { message, workflow, issues, log, account, history } = await req.json();
    const key = Deno.env.get("LOVABLE_API_KEY");
    if (!key) throw new Error("AI gateway key missing");

    const context = `CURRENT PIPELINE (ordered):\n${JSON.stringify(workflow ?? [], null, 1)}\n\nVALIDATION ISSUES:\n${JSON.stringify(issues ?? [])}\n\nLAST EXECUTION LOG:\n${JSON.stringify((log ?? []).slice(-25))}\n\nPAPER ACCOUNT:\n${JSON.stringify(account ?? null)}`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM },
          { role: "system", content: context },
          ...(Array.isArray(history) ? history.slice(-8) : []),
          { role: "user", content: String(message ?? "") },
        ],
        tools: [{
          type: "function",
          function: {
            name: "emit_plan",
            description: "Return the operator briefing and any pipeline actions to apply.",
            parameters: {
              type: "object",
              properties: {
                reply: { type: "string", description: "Short operator briefing." },
                actions: {
                  type: "array",
                  description: "Ordered mutations / commands to apply.",
                  items: {
                    type: "object",
                    properties: {
                      op: { type: "string", enum: ["add_node", "update_node", "remove_node", "clear", "replace_all", "run", "stop"] },
                      index: { type: "number", description: "0-based node index for update/remove, or insert position for add_node." },
                      kind: { type: "string" },
                      label: { type: "string" },
                      config: { type: "object", additionalProperties: true },
                      nodes: {
                        type: "array",
                        description: "Full pipeline for replace_all.",
                        items: {
                          type: "object",
                          properties: {
                            kind: { type: "string" },
                            label: { type: "string" },
                            config: { type: "object", additionalProperties: true },
                          },
                          required: ["kind"],
                          additionalProperties: false,
                        },
                      },
                    },
                    required: ["op"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["reply"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "emit_plan" } },
      }),
    });

    if (res.status === 429) {
      return new Response(JSON.stringify({ reply: "Rate limit hit on the AI gateway — try again in a moment.", actions: [] }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (res.status === 402) {
      return new Response(JSON.stringify({ reply: "AI credits exhausted. Top up workspace credits to keep using Genius.", actions: [] }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (!res.ok) throw new Error(`gateway ${res.status}: ${await res.text()}`);

    const data = await res.json();
    const choice = data?.choices?.[0]?.message;
    let payload: any = { reply: choice?.content ?? "No response.", actions: [] };
    const call = choice?.tool_calls?.[0];
    if (call?.function?.arguments) {
      try { payload = JSON.parse(call.function.arguments); } catch { /* keep fallback */ }
    }
    return new Response(JSON.stringify({ reply: payload.reply ?? "", actions: payload.actions ?? [] }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String((e as Error).message ?? e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
