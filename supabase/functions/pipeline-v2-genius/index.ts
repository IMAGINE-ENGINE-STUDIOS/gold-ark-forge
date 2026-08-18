const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM = `You are GENIUS V2, the resident engineer of the Gold Arrow PIPELINE V2 blueprint development environment.
You can see EVERYTHING on the page: the live classification screens, the blueprint graph, validation issues, the last
execution trace, the paper account, the analysis program catalog and the operator's custom code boxes.
You can do anything the operator can do in the UI, by emitting actions.

BLUEPRINT NODE KINDS (ordered top-down execution, context threads downstream):
- asset   config { ticker, label }            sets the active instrument
- screen  config { classId, limit, bindTop, haltIfEmpty }   ranks the live universe by a classification
- analysis config { programId, params }        runs a quant program on the active instrument's live series
- code    config { blockId, params, timeoutMs} runs one of the operator's custom code boxes
- branch  config { expects: 'bullish'|'bearish'|'neutral' } halts downstream unless upstream signal matches
- buy / sell config { amountUsd }              market order on the paper book (amountUsd > 0)
- alert   config { direction:'above'|'below', price }
- risk    config { maxDrawdownPct, blockOnBreach }
- note    config { text }

RULES
- analysis, code(with symbol use), buy, sell and alert require an asset or screen node upstream.
- Never invent tickers: only use tickers present in the page context (screens/universe) or already in the graph.
- Never fabricate prices, fills or data. If a price is unknown, say so.
- When the operator asks for behaviour that no analysis program covers, WRITE a custom code box:
  emit create_code_block with plain JavaScript that reads \`input\` and \`return\`s a JSON object
  (input = { ticker, label, price, series:number[], change, account, screen, analysis, params }).
  Return a bare function body — no imports, no wrapper function, no markdown fences.
  Then add it to the graph with add_code (blockName must match the block you created).
- To rebuild a whole pipeline use replace_all. To debug, read the issues + execution trace and fix the offending nodes.
- Reply in a short, concrete operator briefing (plain text, no markdown headers). Explain what you changed and why.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const body = await req.json();
    const { message, page, history } = body ?? {};
    const key = Deno.env.get("LOVABLE_API_KEY");
    if (!key) throw new Error("AI gateway key missing");

    const context = `PAGE STATE (live, do not fabricate beyond this):\n${JSON.stringify(page ?? {}, null, 1)}`;

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
            description: "Operator briefing plus the actions to apply to the Pipeline V2 workspace.",
            parameters: {
              type: "object",
              properties: {
                reply: { type: "string", description: "Short operator briefing." },
                actions: {
                  type: "array",
                  description: "Ordered operations to apply to the workspace.",
                  items: {
                    type: "object",
                    properties: {
                      op: {
                        type: "string",
                        enum: [
                          "add_asset", "add_screen", "add_analysis", "add_node", "add_code",
                          "update_node", "remove_node", "replace_all", "clear",
                          "create_code_block", "run", "stop", "select_node",
                        ],
                      },
                      index: { type: "number", description: "0-based node index for update/remove/select." },
                      ticker: { type: "string" },
                      label: { type: "string" },
                      classId: { type: "string" },
                      programId: { type: "string" },
                      kind: { type: "string", description: "Node kind for add_node." },
                      blockName: { type: "string", description: "Custom code box name for add_code / create_code_block." },
                      description: { type: "string" },
                      code: { type: "string", description: "JavaScript function body for create_code_block." },
                      config: { type: "object", additionalProperties: true },
                      nodes: {
                        type: "array",
                        description: "Full graph for replace_all.",
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
      return new Response(JSON.stringify({ reply: "Rate limited by the AI gateway — retry in a moment.", actions: [] }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (res.status === 402) {
      return new Response(JSON.stringify({ reply: "AI credits exhausted — top up workspace credits to keep using Genius.", actions: [] }),
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
