const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM = `You are AUTOPILOT, the coding copilot of the Gold Arrow Pipeline v2 blueprint environment.
You write, explain, fix and optimise small JavaScript "blocks" that become visual boxes in a no-code trading blueprint.

CONTRACT for every block you write:
- The code is ONLY the BODY of an async function. NEVER wrap it in \`async (input) => { }\`, \`function(){}\`, markdown fences or exports — start directly with statements and end with a \`return\`.
- It receives one variable: \`input\`.
- input = { ticker, label, price, series (number[] of live prices, oldest first), change, account:{equity,totalPnl,startingBalance}, screen:[{ticker,label,score}], analysis:{id,value,verdict,detail}|null, params:{} }
- It must \`return\` a JSON-serialisable object. Prefer { signal: 'bullish'|'bearish'|'neutral', value: number, message: string }.
- No imports, no fetch, no DOM, no while(true). Runs in a Web Worker with a 4s timeout.
- Never fabricate prices; if series is too short, return { signal:'neutral', value:0, message:'insufficient data' }.

Reply with a one-paragraph plain-text explanation and, when code is requested or changed, the full new code.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { message, code, mode, blockName } = await req.json();
    const key = Deno.env.get("LOVABLE_API_KEY");
    if (!key) throw new Error("AI gateway key missing");

    const task = mode === "explain" ? "Explain what this block does, its edge cases and risks."
      : mode === "fix" ? "Find and fix bugs. Return corrected full code."
      : mode === "optimize" ? "Improve robustness and clarity. Return the full improved code."
      : "Write or modify the block as requested.";

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM },
          { role: "system", content: `BLOCK NAME: ${blockName ?? "untitled"}\nCURRENT CODE:\n${code ?? "(empty)"}\nTASK: ${task}` },
          { role: "user", content: String(message ?? task) },
        ],
        tools: [{
          type: "function",
          function: {
            name: "emit_block",
            description: "Return the explanation and, when applicable, the full block code.",
            parameters: {
              type: "object",
              properties: {
                reply: { type: "string", description: "Plain-text explanation for the operator." },
                code: { type: "string", description: "Full JavaScript block body, or empty string when unchanged." },
                name: { type: "string", description: "Suggested short block name." },
              },
              required: ["reply"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "emit_block" } },
      }),
    });

    if (res.status === 429) {
      return new Response(JSON.stringify({ reply: "Rate limit hit on the AI gateway — try again in a moment.", code: "" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (res.status === 402) {
      return new Response(JSON.stringify({ reply: "AI credits exhausted. Top up workspace credits to keep using Autopilot.", code: "" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (!res.ok) throw new Error(`gateway ${res.status}: ${await res.text()}`);

    const data = await res.json();
    const choice = data?.choices?.[0]?.message;
    let payload: any = { reply: choice?.content ?? "No response.", code: "" };
    const call = choice?.tool_calls?.[0];
    if (call?.function?.arguments) {
      try { payload = JSON.parse(call.function.arguments); } catch { /* keep fallback */ }
    }
    return new Response(JSON.stringify({ reply: payload.reply ?? "", code: payload.code ?? "", name: payload.name ?? "" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String((e as Error).message ?? e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});