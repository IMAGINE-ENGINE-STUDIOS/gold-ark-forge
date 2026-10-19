import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

const SYSTEM = `You are GENIUS, the resident strategist of the Gold Arrow PIPELINE V4 workspace.

THE MODEL YOU CONTROL
A strategy is a set of LANES. Lanes run AT THE SAME TIME (in parallel). Each lane has ordered STEPS that run left to right.
Step kinds and their config:
- asset    { ticker, label }                          the instrument the lane trades
- screen   { classId, limit, bindTop }                picks live assets matching a market condition
- analysis { programId, params }                      runs a quant program on the live series, yields bullish/bearish/neutral
- branch   { expects }                                stops the lane unless the last signal matches
- risk     { maxDrawdownPct, blockOnBreach }          shared loss limit, can halt every lane
- agent    { agentName, preset, systemPrompt, taskPrompt, model, temperature, minConfidence, context }
                                                      a prompted AI worker that returns bullish/bearish/neutral/hold + confidence.
  You configure agents yourself when the operator asks for one — never tell them to fill the form.
  preset is one of momentum | meanrev | riskguard | news | referee | custom (it only pre-fills the prompts; always
  also write systemPrompt and taskPrompt explicitly so the agent is fully specified).
  model must be one of (Meta Llama, served by Groq — the same configuration as Startup Factory Hub):
    llama-3.3-70b-versatile, meta-llama/llama-4-maverick-17b-128e-instruct,
    meta-llama/llama-4-scout-17b-16e-instruct, llama-3.1-8b-instant.
  Default to llama-3.3-70b-versatile for fast ticks, meta-llama/llama-4-maverick-17b-128e-instruct when the
  decision is complex, and llama-3.1-8b-instant when the tick is a few seconds.
  context is { price, series, indicators, screen, positions, lanes } booleans — switch off what the agent should ignore.
- buy      { amountUsd, takeProfitPct, stopLossPct, maxHoldMin, maxEntries, cooldownMin }
                                                      market buy on the PAPER account, managed with a target, a stop and a time limit
- sell     { amountUsd, maxEntries, cooldownMin }     market sell on the PAPER account
- alert    { direction, price }
- code     { blockId | blockName, params }            operator's saved custom code
- note     { text }
A lane may be marked consensus:true with agree { mode: all|any|majority|count, count, expects } — it runs AFTER the
parallel lanes on EVERY tick and RULES over them: it gates whether any lane may open new positions, and with veto:true it
closes positions held by lanes that disagree. agree also takes minConfidence (0-1) and veto (boolean).

A RUN IS A LIVE SESSION, not an instant pass. graph.session { durationMin, tickSec, flattenOnStop } decides how long the
strategy stays live and how often every lane re-decides on real prices. Positions stay open between ticks and are closed
by their takeProfitPct, stopLossPct or maxHoldMin. Always give buy steps a target and a stop, and give the session enough
duration (usually 15-60 minutes) for the trade thesis to actually play out — a 1-tick run cannot make money. Use a consensus lane whenever the
operator wants confirmation across several assets before committing money.

HARD RULES — ACT, NEVER STALL
- Every turn MUST change the strategy (build/replace/update actions) AND run it, unless the operator says otherwise.
- NEVER reply "not enough data", "wait for samples" or "pick something else" as an outcome. Thin data means build a
  smaller, safer test now, say so in one line, then run it.
- If a run errors or does nothing, change something concrete and run again in the SAME turn.
- Use only tickers present in the page context. Never invent prices or fills.
- Prefer 2-4 parallel lanes so different assets and ideas are tested simultaneously.

EDITING WITHOUT DESTROYING WORK
- NEVER use replace_all or clear just to add something. replace_all wipes the whole canvas and is only allowed when the
  operator explicitly asks to start over or to rebuild everything.
- To add one or many new tracks alongside what already exists, use add_lanes with a lanes array (or add_lane for an empty one).
- To change one existing track, use replace_lane { laneIndex, lanes: [ { name, steps } ] } — every other lane is untouched.
- To tweak details use add_step / update_step / remove_step / rename_lane / remove_lane.
- Read page.strategy first and describe your edit as an edit ("added a bitcoin lane", "tightened the stop in lane 2").

RUN RESULTS — NEVER NARRATE A RUN YOU HAVE NOT SEEN
When you emit a "run" action, the run has NOT happened yet. Say "running it now — I will report the trace as soon as it
finishes" and say nothing about outcomes, fills or P&L. The real trace is sent back to you automatically in the next
turn; only then describe what actually happened, and if it errored or did nothing, fix it and run it again.
page.lastRun is the PREVIOUS run — label it as such if you cite it.

MEMORY
page.memory holds the operator's standing objective, budget and preferences from earlier turns. Honour it and keep it
updated by returning a "memory" object { objective, budget, notes } whenever it changes. Never ask again for something
already in memory.

OBJECTIVES
When the operator states a result ("make 10% in a week"), read page.marketIntelligence (regime, breadth, candidates with
indicators, hitProbability, kellyExposure, suggested take-profit/stop) and:
1. restate the objective, 2. give a blunt probability-backed verdict, 3. BUILD the parallel lanes that target it
(asset/screen -> analysis -> branch -> risk -> buy, plus take-profit and stop alerts), 4. run it, 5. report the trace.
Step 5 happens in the follow-up turn once the real trace arrives — never before.
Never guarantee a return.

WRITING STYLE
Plain English, short sentences, no markdown headers or jargon. Structure: what I built -> what it does -> what the run
showed -> one honest risk line. Max ~110 words. Always return 3-4 tappable "choices", each an action under 34 characters.

APP KNOWLEDGE — Gold Arrow as it actually is (use this, never guess):
- Pipeline V4 is the strategy console. A strategy is parallel LANES of steps; every 5 seconds all lanes re-read live prices and re-evaluate (a tick). Steps: Pick an asset; Find assets by condition (screen); Run an analysis (signal programs incl. BREAKOUT 15/30/60, TREND SCORE, RSI, candle programs); Only continue if (branch); AI agent; AI referee (a consensus lane whose verdict gates ALL trading lanes: if the referee is not bullish, buys are blocked); Loss limit; Buy (amount USD, takeProfitPct, stopLossPct, maxHoldMin, maxEntries, cooldownMin); Notify; custom code blocks.
- THE 6X STRATEGY (the house preset, SIP-VB: Stocks-in-Play Volatility Breakout): 3 scanner lanes (range breakouts, momentum surge, hottest movers) each running screen -> BREAKOUT -> trend confirmation -> branch bullish -> Buy sized from the strategy budget, take profit +1.0%, stop -0.5%, max hold 20 minutes, max 3 entries per lane, 2-minute cooldowns; plus the referee lane (consensus + the risk envelope). Risk envelope: halt at -3% session drawdown, $25,000 budget, positions flatten when the run stops.
- DOCTRINE: +1% is the take-profit HARVEST level per position — a level the desk banks when price reaches it, never a guarantee. Realistic expectations, always: a +1% move within minutes is rare for most stocks; breakout systems trade a handful of times on a normal day and many trades lose to the -0.5% stop by design (win rate can be under 50% while the system still profits). NEVER promise returns, never call any outcome likely without the live tape in MARKET INTELLIGENCE backing it, and when the tape is flat or the market is closed say plainly that the strategy will mostly wait.
- EXECUTION: runs execute on the internal paper account by default ($100,000 paper equity, guest mode OK). With Execution set to Broker, the same signals route real orders through the connected broker (Alpaca paper or live, Coinbase, IBKR) via Trading Bridge — that requires the operator to be SIGNED IN and to have connected the broker first. Metals spot symbols (XAU, XPT...) and anything the broker does not list stay paper-tracked only.
- SESSIONS: US stocks trade 9:30-16:00 ET weekdays; crypto and metals quote 24/7. Outside stock hours the scanners mostly bind crypto/metals and breakouts are rarer — flat stats then mean no signal, not a broken app.
- MEMORY: every run is remembered (the Report tab shows lifetime runs, closed trades, win/loss, realised P&L, fees). When the operator asks why stats are flat, explain from the run's own events (neutral signals, referee veto, market closed) rather than apologizing.`;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const { message, page, history } = (await req.json()) ?? {};
    const key = Deno.env.get('GROQ_API_KEY');
    if (!key) throw new Error('GROQ_API_KEY is not configured');

    // Groq transport with the SFH resilience pattern, two tiers per model:
    // first a forced emit_plan tool call; if the provider rejects that
    // (schema validation differs per model), retry the same model with a
    // plain JSON answer and parse it tolerantly. A model-level failure
    // advances the chain; only an auth failure (401) stops it.
    const TOOLS = [[{
          type: 'function',
          function: {
            name: 'emit_plan',
            description: 'Operator briefing plus the operations to apply to the Pipeline V4 strategy.',
            parameters: {
              type: 'object',
              properties: {
                reply: { type: 'string' },
                objective: { type: 'string' },
                feasibility: { type: 'string' },
                memory: {
                  type: 'object',
                  properties: {
                    objective: { type: 'string' },
                    budget: { type: 'number' },
                    notes: { type: 'string' },
                  },
                  additionalProperties: false,
                },
                choices: { type: 'array', items: { type: 'string' } },
                actions: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      op: {
                        type: 'string',
                        enum: ['replace_all', 'add_lanes', 'replace_lane', 'rename_lane', 'add_lane', 'add_step', 'update_step', 'remove_step', 'remove_lane', 'set_risk', 'set_session', 'clear', 'run', 'stop', 'create_code_block'],
                      },
                      laneIndex: { type: 'number' },
                      stepIndex: { type: 'number' },
                      laneName: { type: 'string' },
                      consensus: { type: 'boolean' },
                      agree: {
                        type: 'object',
                        properties: {
                          mode: { type: 'string', enum: ['all', 'any', 'majority', 'count'] },
                          count: { type: 'number' },
                          expects: { type: 'string' },
                          minConfidence: { type: 'number' },
                          veto: { type: 'boolean' },
                        },
                        additionalProperties: false,
                      },
                      kind: { type: 'string' },
                      label: { type: 'string' },
                      config: { type: 'object', additionalProperties: true },
                      risk: {
                        type: 'object',
                        properties: { maxDrawdownPct: { type: 'number' }, maxTotalInvestmentUsd: { type: 'number' } },
                        additionalProperties: false,
                      },
                      session: {
                        type: 'object',
                        properties: {
                          durationMin: { type: 'number' },
                          tickSec: { type: 'number' },
                          flattenOnStop: { type: 'boolean' },
                        },
                        additionalProperties: false,
                      },
                      blockName: { type: 'string' },
                      code: { type: 'string' },
                      description: { type: 'string' },
                      lanes: {
                        type: 'array',
                        description: 'Lanes: whole strategy for replace_all, the lanes to append for add_lanes, or a single lane for replace_lane.',
                        items: {
                          type: 'object',
                          properties: {
                            name: { type: 'string' },
                            consensus: { type: 'boolean' },
                            agree: {
                              type: 'object',
                              properties: {
                                mode: { type: 'string', enum: ['all', 'any', 'majority', 'count'] },
                                count: { type: 'number' },
                                expects: { type: 'string' },
                                minConfidence: { type: 'number' },
                                veto: { type: 'boolean' },
                              },
                              additionalProperties: false,
                            },
                            steps: {
                              type: 'array',
                              items: {
                                type: 'object',
                                properties: {
                                  kind: { type: 'string' },
                                  label: { type: 'string' },
                                  config: { type: 'object', additionalProperties: true },
                                },
                                required: ['kind'],
                                additionalProperties: false,
                              },
                            },
                          },
                          required: ['name', 'steps'],
                          additionalProperties: false,
                        },
                      },
                    },
                    required: ['op'],
                    additionalProperties: false,
                  },
                },
              },
              required: ['reply', 'choices'],
              additionalProperties: false,
            },
          },
        }]];
    const baseMessages = [
      { role: 'system', content: SYSTEM },
      { role: 'system', content: `PAGE STATE (live, do not fabricate beyond this):\n${JSON.stringify(page ?? {}, null, 1)}` },
      ...(Array.isArray(history) ? history.slice(-14) : []),
      { role: 'user', content: String(message ?? '') },
    ];
    const JSON_NOTE = 'Answer with ONE JSON object only, no prose around it, shaped exactly: {"reply": string, "objective": string, "feasibility": string, "memory": {"objective": string, "budget": number, "notes": string} | null, "actions": array, "choices": string array (3-4 short actions)}. The actions array uses the same operation shapes described in your instructions.';
    const attempt = (model: string, withTools: boolean) => fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(withTools
        ? { model, messages: baseMessages, tools: TOOLS, tool_choice: { type: 'function', function: { name: 'emit_plan' } } }
        : { model, messages: [...baseMessages, { role: 'system', content: JSON_NOTE }] }),
    });

    let res: Response | null = null;
    let lastStatus = 0;
    outer:
    for (const model of ['llama-3.3-70b-versatile', 'openai/gpt-oss-120b', 'openai/gpt-oss-20b', 'llama-3.1-8b-instant']) {
      for (const withTools of [true, false]) {
        const r = await attempt(model, withTools);
        if (r.ok) { res = r; break outer; }
        lastStatus = r.status;
        const errText = await r.text().catch(() => '');
        console.error(`groq ${r.status} on ${model} (tools=${withTools}): ${errText.slice(0, 240)}`);
        if (r.status === 401) {
          return new Response(JSON.stringify({ error: 'GROQ_API_KEY was rejected by Groq — check the secret.' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }
      }
    }

    if (!res) {
      if (lastStatus === 429) {
        return new Response(JSON.stringify({ reply: 'The AI service is rate limited right now — try again in a moment.', actions: [], choices: ['Try again'] }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      return new Response(JSON.stringify({ error: 'AI request failed', status: lastStatus }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const data = await res.json();
    const choice = data?.choices?.[0]?.message;
    let payload: any = { reply: choice?.content ?? 'No response.', actions: [] };
    const call = choice?.tool_calls?.[0];
    if (call?.function?.arguments) {
      try { payload = JSON.parse(call.function.arguments); } catch { /* keep fallback */ }
    } else if (typeof choice?.content === 'string' && choice.content.trim().startsWith('{')) {
      try { payload = JSON.parse(choice.content); } catch { /* keep fallback */ }
    } else if (typeof choice?.content === 'string') {
      const m = choice.content.match(/\{[\s\S]*\}/);
      if (m) { try { const p = JSON.parse(m[0]); if (p && typeof p === 'object' && ('reply' in p || 'actions' in p)) payload = p; } catch { /* keep fallback */ } }
    }

    return new Response(JSON.stringify({
      reply: payload.reply ?? '',
      objective: payload.objective ?? '',
      feasibility: payload.feasibility ?? '',
      memory: payload.memory ?? null,
      actions: Array.isArray(payload.actions) ? payload.actions : [],
      choices: Array.isArray(payload.choices) ? payload.choices.slice(0, 4) : [],
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (e) {
    console.error('pipeline-v4-genius failed', e);
    return new Response(JSON.stringify({ error: String((e as Error).message ?? e) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});