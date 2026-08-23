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
- agent    { agentName, systemPrompt, taskPrompt, model, temperature, minConfidence }
                                                      a prompted AI worker that returns bullish/bearish/neutral/hold + confidence
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
showed -> one honest risk line. Max ~110 words. Always return 3-4 tappable "choices", each an action under 34 characters.`;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const { message, page, history } = (await req.json()) ?? {};
    const key = Deno.env.get('LOVABLE_API_KEY');
    if (!key) throw new Error('AI gateway key missing');

    const res = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: SYSTEM },
          { role: 'system', content: `PAGE STATE (live, do not fabricate beyond this):\n${JSON.stringify(page ?? {}, null, 1)}` },
          ...(Array.isArray(history) ? history.slice(-14) : []),
          { role: 'user', content: String(message ?? '') },
        ],
        tools: [{
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
        }],
        tool_choice: { type: 'function', function: { name: 'emit_plan' } },
      }),
    });

    if (res.status === 429) {
      return new Response(JSON.stringify({ reply: 'The AI service is rate limited right now — try again in a moment.', actions: [], choices: ['Try again'] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    if (res.status === 402) {
      return new Response(JSON.stringify({ reply: 'AI credits are exhausted — top up workspace credits to keep using Genius.', actions: [], choices: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    if (!res.ok) {
      const details = await res.text();
      console.error(`gateway ${res.status}: ${details}`);
      return new Response(JSON.stringify({ error: 'AI request failed', status: res.status, details }),
        { status: res.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const data = await res.json();
    const choice = data?.choices?.[0]?.message;
    let payload: any = { reply: choice?.content ?? 'No response.', actions: [] };
    const call = choice?.tool_calls?.[0];
    if (call?.function?.arguments) {
      try { payload = JSON.parse(call.function.arguments); } catch { /* keep fallback */ }
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