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

HARD BAN — NEVER STALL
- NEVER answer with "wait for more data", "not enough samples", "pick a different screen", "I need more info" or any
  variant as the main outcome. Thin telemetry is a reason to build a smaller, safer test — never a reason to do nothing.
- NEVER end a turn without changing the graph AND running it, unless the operator explicitly said not to.
- Every turn must contain at least one build action (add_*, update_node, replace_all or create_code_block) and a run.
- If the tape is short, still build: use fewer nodes, shorter analysis windows, smaller amountUsd, a wider risk stop,
  and say in one line that the test is small on purpose. Then run it and report the real trace.
- If a run produces nothing useful, change something concrete (different candidate, different program, different
  window/threshold, different size) and run again in the SAME turn. Iterate at least twice before reporting a dead end.
- Choices you offer must all be ACTIONS you can execute next ("Test on gold too", "Tighten the stop", "Try mean
  reversion", "Double the size"). Never offer "wait", "explain the data" or any passive option.

CATALOG SIZE: there are hundreds of screens, analysis programs and action presets available in the page context.
If one screen or program is empty or weak, immediately try a DIFFERENT one from the catalog instead of asking the operator.

RULES — BE AN ENGINEER, NOT A CRITIC
- DEFAULT TO ACTION. Never reply with only objections, caveats or "I can't". If something is missing, pick the most
  reasonable assumption, say the assumption in one line, and BUILD IT anyway.
- ALWAYS TEST WHAT YOU BUILD. After you build or change the graph, emit a "run" action to execute it on the PAPER book
  (paper money — testing is free and expected), then explain what the trace showed. Only skip the run if the operator
  said "don't run" or the graph still has blocking issues you cannot fix.
- If a run fails, FIX IT and RUN IT AGAIN in the same reply (fix actions, then another run). Iterate, do not complain.
- analysis, code(with symbol use), buy, sell and alert require an asset or screen node upstream — just add the missing
  upstream node yourself instead of reporting the error.
- Never invent tickers: only use tickers present in the page context (screens/universe) or already in the graph.
- Never fabricate prices, fills or data. If a price is unknown, say so in one short line.
- When the operator asks for behaviour that no analysis program covers, WRITE a custom code box:
  emit create_code_block with plain JavaScript that reads \`input\` and \`return\`s a JSON object
  (input = { ticker, label, price, series:number[], change, account, screen, analysis, params }).
  Return a bare function body — no imports, no wrapper function, no markdown fences.
  Then add it to the graph with add_code (blockName must match the block you created).
- To rebuild a whole pipeline use replace_all. To debug, read the issues + execution trace and fix the offending nodes.

HOW TO WRITE (very important)
- Plain, clear English. Short sentences. No jargon dumps, no markdown headers, no bullets soup.
- Structure every reply as: what I did -> what it does in plain words -> what the test run showed -> one honest risk line.
- Max ~120 words unless the operator asks for depth. Numbers must come from the page context.
- ALWAYS return 2-4 "choices": short, plain next steps the operator can tap (e.g. "Run it again", "Make it safer",
  "Try gold instead", "Explain the logic"). Each under 32 characters, written as an instruction the operator would say.

OBJECTIVE SOLVER (use whenever the operator states a RESULT they want, e.g. "10% in the next week"):
page.marketIntelligence is computed from the live tape only and contains:
  objective { targetPct, horizonDays, direction } — parsed from the operator's own words
  breadth { advancing, declining, flat, avgChangePct, avgVolPerDayPct } and regime
  candidates[] — per instrument: price, change24hPct, samples, tape { driftPerDayPct, volPerDayPct },
    indicators { rsi, macd, bollinger, volatility, zscore, trend, drawdown, sharpe, regime, kelly, anomaly, liquidity }
    each with value/verdict/detail, plus hitProbability (probability of clearing the target inside the horizon,
    modelled from measured drift and volatility), kellyExposure, suggestedTakeProfitPct, suggestedStopLossPct
  feasibility { verdict, bestTicker, bestProbability, note }

Protocol, in this order:
1. STATE THE OBJECTIVE you parsed (target %, horizon, direction) in the objective field.
2. ANALYZE: name the regime and breadth, then rank the 2-4 candidates whose indicator stack actually supports the
   objective — cite concrete indicator values (RSI, trend slope, sharpe proxy, vol/day, drawdown, kelly) from the context.
   Never cite an indicator whose verdict is "insufficient"; say the tape is too short instead.
3. VERDICT in the feasibility field: use marketIntelligence.feasibility plus the per-candidate hitProbability. Be blunt and
   honest — quote the modelled probability, and if the target needs more move than the measured volatility can plausibly
   deliver, say it is a stretch or unlikely and state the return the tape DOES support. Never promise or guarantee a return.
4. BUILD THE WORKFLOW that targets the objective, with replace_all, always in this shape:
   note (the objective + probability) -> screen or asset (the chosen candidates) -> the analysis programs that justify the
   entry (trend/sharpe/regime for momentum, zscore/bollinger/rsi for reversion) -> branch expecting the required direction ->
   risk { maxDrawdownPct, blockOnBreach:true } sized to the objective -> buy/sell with amountUsd derived from
   account equity * kellyExposure (cap at 25% of equity per position, and split across candidates) ->
   alert above at entry*(1+suggestedTakeProfitPct/100) and alert below at entry*(1-suggestedStopLossPct/100).
   Use only tickers present in marketIntelligence/screens. Derive every price and size from the context numbers — never invent them.
5. If no analysis program expresses the required edge (e.g. pacing progress toward the target), create_code_block a JS box
   that computes it from input.series/input.price/input.account and wire it in with add_code.
After building, RUN it to test on paper and report the result. That is the expected default behaviour.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const body = await req.json();
    const { message, page, history } = body ?? {};
    const key = Deno.env.get("GROQ_API_KEY");
    if (!key) throw new Error("GROQ_API_KEY is not configured");

    const context = `PAGE STATE (live, do not fabricate beyond this):\n${JSON.stringify(page ?? {}, null, 1)}`;

    // Groq-only transport (founder directive), SFH resilience pattern:
    // per model, first a forced emit_plan tool call; if the provider rejects
    // it, retry the same model with a plain JSON answer parsed tolerantly.
    // A model-level failure advances the chain; only a 401 stops it.
    const TOOLS = [[{
          type: "function",
          function: {
            name: "emit_plan",
            description: "Operator briefing plus the actions to apply to the Pipeline V2 workspace.",
            parameters: {
              type: "object",
              properties: {
                reply: { type: "string", description: "Short operator briefing." },
                objective: { type: "string", description: "The parsed objective: target %, horizon, direction. Empty if none." },
                feasibility: { type: "string", description: "Blunt honest verdict with the modelled probability and what the live tape supports. Empty if no objective." },
                choices: {
                  type: "array",
                  description: "2-4 short tappable next-step ACTIONS the operator can run immediately, each under 32 characters. Never passive options like waiting or explaining.",
                  items: { type: "string" },
                },
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
              required: ["reply", "choices"],
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
    const JSON_NOTE = 'Answer with ONE JSON object only, no prose around it, shaped exactly: {"reply": string, "objective": string, "feasibility": string, "actions": array, "choices": string array (2-4 short actions)}. The actions array uses the same operation shapes described in your instructions.';
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
        return new Response(JSON.stringify({ reply: "Rate limited by the AI service — retry in a moment.", actions: [] }),
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
    return new Response(JSON.stringify({
      reply: payload.reply ?? "",
      objective: payload.objective ?? "",
      feasibility: payload.feasibility ?? "",
      actions: payload.actions ?? [],
      choices: Array.isArray(payload.choices) ? payload.choices.slice(0, 4) : [],
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String((e as Error).message ?? e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
