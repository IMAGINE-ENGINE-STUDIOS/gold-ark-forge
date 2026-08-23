// pipeline-agent — one configurable AI worker executed as a step inside a
// Pipeline V4 lane (or inside a consensus lane, where it arbitrates across
// every parallel lane).
//
// The operator owns the prompts: `systemPrompt` and `taskPrompt` come straight
// from the step configuration. The context block is assembled by the client
// from REAL market state only — this function never invents prices.

import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

const BASE_SYSTEM = `You are a trading agent inside an automated strategy lane.
You receive REAL live market context. Never invent numbers that are not in the context.
Answer with a verdict the lane can act on: bullish (buy), bearish (sell), neutral (do nothing) or hold (keep what is open).
Give a confidence between 0 and 1 and one short plain-English reason (max 30 words) that names the numbers you used.
If the context is too thin to justify a trade, say neutral with low confidence — do not guess.`;

// Keep in sync with src/lib/aiModels.ts.
const ALLOWED_MODELS = new Set([
  'google/gemini-3.1-flash-lite', 'google/gemini-3.7-flash', 'google/gemini-3.6-flash',
  'google/gemini-3.5-flash', 'google/gemini-3-flash-preview', 'google/gemini-3.1-pro-preview',
  'google/gemini-2.5-flash', 'google/gemini-2.5-flash-lite', 'google/gemini-2.5-pro',
  'openai/gpt-5.6-luna', 'openai/gpt-5.6-terra', 'openai/gpt-5.6-sol',
  'openai/gpt-5.5', 'openai/gpt-5.4', 'openai/gpt-5.4-mini', 'openai/gpt-5.4-nano',
  'openai/gpt-5.2', 'openai/gpt-5', 'openai/gpt-5-mini', 'openai/gpt-5-nano',
]);
const DEFAULT_MODEL = 'google/gemini-3.7-flash';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const systemPrompt = typeof body?.systemPrompt === 'string' ? body.systemPrompt.slice(0, 4000) : '';
    const taskPrompt = typeof body?.taskPrompt === 'string' ? body.taskPrompt.slice(0, 4000) : '';
    const model = ALLOWED_MODELS.has(body?.model) ? body.model as string : DEFAULT_MODEL;
    const temperature = Math.max(0, Math.min(1.5, Number(body?.temperature ?? 0.3)));
    const context = body?.context ?? {};

    // OpenAI GPT-5 models reject a non-default temperature; the GPT-5.6 family on
    // chat completions additionally rejects tools unless reasoning is turned off.
    const isGpt5 = model.startsWith('openai/gpt-5');
    const isGpt56 = model.startsWith('openai/gpt-5.6');

    const key = Deno.env.get('LOVABLE_API_KEY');
    if (!key) return json({ error: 'AI gateway key missing' }, 500);

    const res = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        ...(isGpt5 ? {} : { temperature }),
        ...(isGpt56 ? { reasoning_effort: 'none' } : {}),
        messages: [
          { role: 'system', content: `${BASE_SYSTEM}\n\nOPERATOR INSTRUCTIONS:\n${systemPrompt || '(none)'}` },
          { role: 'system', content: `LIVE CONTEXT (real data, do not go beyond it):\n${JSON.stringify(context).slice(0, 12000)}` },
          { role: 'user', content: taskPrompt || 'Judge the current setup and give your verdict.' },
        ],

        tools: [{
          type: 'function',
          function: {
            name: 'emit_verdict',
            description: 'The agent decision this lane will act on.',
            parameters: {
              type: 'object',
              properties: {
                verdict: { type: 'string', enum: ['bullish', 'bearish', 'neutral', 'hold'] },
                confidence: { type: 'number' },
                reason: { type: 'string' },
              },
              required: ['verdict', 'confidence', 'reason'],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: 'function', function: { name: 'emit_verdict' } },
      }),
    });

    if (res.status === 429) return json({ error: 'rate_limited', message: 'AI is rate limited — the agent step was skipped.' }, 429);
    if (res.status === 402) return json({ error: 'no_credits', message: 'AI credits are exhausted — add credits to run agent steps.' }, 402);
    if (!res.ok) {
      const details = await res.text();
      console.error(`[pipeline-agent] gateway ${res.status}: ${details}`);
      return json({ error: 'ai_failed', message: `AI request failed (${res.status}).` }, res.status);
    }

    const data = await res.json();
    const call = data?.choices?.[0]?.message?.tool_calls?.[0];
    let out = { verdict: 'neutral', confidence: 0, reason: 'The agent returned nothing usable.' };
    if (call?.function?.arguments) {
      try {
        const parsed = JSON.parse(call.function.arguments);
        out = {
          verdict: ['bullish', 'bearish', 'neutral', 'hold'].includes(parsed.verdict) ? parsed.verdict : 'neutral',
          confidence: Math.max(0, Math.min(1, Number(parsed.confidence) || 0)),
          reason: String(parsed.reason ?? '').slice(0, 400),
        };
      } catch { /* keep fallback */ }
    }

    return json(out);
  } catch (e) {
    console.error('[pipeline-agent] failed', e);
    return json({ error: String((e as Error).message ?? e) }, 500);
  }
});
