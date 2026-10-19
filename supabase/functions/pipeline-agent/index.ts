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

// Genius configuration mirrors Startup Factory Hub: Meta Llama models served
// by Groq (GROQ_API_KEY secret), called from this edge function.
// Keep in sync with src/lib/aiModels.ts.
const ALLOWED_MODELS = new Set([
  'llama-3.3-70b-versatile',
  'meta-llama/llama-4-maverick-17b-128e-instruct',
  'meta-llama/llama-4-scout-17b-16e-instruct',
  'llama-3.1-8b-instant',
]);
const DEFAULT_MODEL = 'llama-3.3-70b-versatile';
// Fallback order when a model fails at the provider: any model-level error
// advances the chain; only an auth failure (401) stops it.
const FALLBACK_CHAIN = ['llama-3.3-70b-versatile', 'openai/gpt-oss-120b', 'openai/gpt-oss-20b', 'llama-3.1-8b-instant'];
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const systemPrompt = typeof body?.systemPrompt === 'string' ? body.systemPrompt.slice(0, 4000) : '';
    const taskPrompt = typeof body?.taskPrompt === 'string' ? body.taskPrompt.slice(0, 4000) : '';
    const requested = ALLOWED_MODELS.has(body?.model) ? body.model as string : DEFAULT_MODEL;
    const temperature = Math.max(0, Math.min(1.5, Number(body?.temperature ?? 0.3)));
    const context = body?.context ?? {};

    const key = Deno.env.get('GROQ_API_KEY');
    if (!key) return json({ error: 'GROQ_API_KEY is not configured' }, 500);

    const chain = Array.from(new Set([requested, ...FALLBACK_CHAIN]));
    let res: Response | null = null;
    let lastStatus = 0;
    for (const model of chain) {
      res = await fetch(GROQ_URL, {
        method: 'POST',
        headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          temperature,
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
      if (res.ok) break;
      lastStatus = res.status;
      const details = await res.text().catch(() => '');
      console.error(`[pipeline-agent] groq ${res.status} on ${model}: ${details.slice(0, 240)}`);
      if (res.status === 401) {
        return json({ error: 'ai_auth', message: 'GROQ_API_KEY was rejected by Groq — check the secret.' }, 500);
      }
      res = null;
    }

    if (!res) {
      if (lastStatus === 429) return json({ error: 'rate_limited', message: 'AI is rate limited — the agent step was skipped.' }, 429);
      return json({ error: 'ai_failed', message: `AI request failed (${lastStatus}).` }, 502);
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
