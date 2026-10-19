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
    const key = Deno.env.get("GROQ_API_KEY");
    if (!key) throw new Error("GROQ_API_KEY is not configured");

    const context = `CURRENT PIPELINE (ordered):\n${JSON.stringify(workflow ?? [], null, 1)}\n\nVALIDATION ISSUES:\n${JSON.stringify(issues ?? [])}\n\nLAST EXECUTION LOG:\n${JSON.stringify((log ?? []).slice(-25))}\n\nPAPER ACCOUNT:\n${JSON.stringify(account ?? null)}`;

    // Groq-only transport (founder directive), SFH resilience pattern:
    // per model, first a forced emit_plan tool call; if the provider rejects
    // it, retry the same model with a plain JSON answer parsed tolerantly.
    // A model-level failure advances the chain; only a 401 stops it.
    const TOOLS = [[{
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
        }]];
    const baseMessages = [
      { role: "system", content: SYSTEM },
      { role: "system", content: context },
      ...(Array.isArray(history) ? history.slice(-8) : []),
      { role: "user", content: String(message ?? "") },
    ];
    const JSON_NOTE = 'Answer with ONE JSON object only, no prose around it, shaped exactly: {"reply": string, "actions": array}. The actions array uses the same operation shapes described in your instructions.';
    const attempt = (model: string, withTools: boolean) => fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify(withTools
        ? { model, messages: baseMessages, tools: TOOLS, tool_choice: { type: "function", function: { name: "emit_plan" } } }
        : { model, messages: [...baseMessages, { role: "system", content: JSON_NOTE }] }),
    });

    let res: Response | null = null;
    let lastStatus = 0;
    outer:
    for (const model of ['llama-3.3-70b-versatile', 'openai/gpt-oss-120b', 'openai/gpt-oss-20b', 'llama-3.1-8b-instant']) {
      for (const withTools of [true, false]) {
        const r = await attempt(model, withTools);
        if (r.ok) { res = r; break outer; }
        lastStatus = r.status;
        const errText = await r.text().catch(() => "");
        console.error(`groq ${r.status} on ${model} (tools=${withTools}): ${errText.slice(0, 200)}`);
        if (r.status === 401) break outer;
      }
    }

    if (!res) {
      if (lastStatus === 429) {
        return new Response(JSON.stringify({ reply: "Rate limit hit on the AI service — try again in a moment.", actions: [] }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      throw new Error(`groq ${lastStatus}`);
    }

    const data = await res.json();
    const choice = data?.choices?.[0]?.message;
    let payload: any = { reply: choice?.content ?? "No response.", actions: [] };
    const call = choice?.tool_calls?.[0];
    if (call?.function?.arguments) {
      try { payload = JSON.parse(call.function.arguments); } catch { /* keep fallback */ }
    }
    else if (typeof choice?.content === "string") {
      const m = choice.content.match(/\{[\s\S]*\}/);
      if (m) { try { const p = JSON.parse(m[0]); if (p && typeof p === "object" && ("reply" in p || "actions" in p)) payload = p; } catch { /* keep fallback */ } }
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
