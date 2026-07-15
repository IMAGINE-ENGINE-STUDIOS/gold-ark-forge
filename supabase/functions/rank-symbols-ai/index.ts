// ─────────────────────────────────────────────────────────────
// RANK-SYMBOLS-AI — takes a shortlist of statistically-scored
// candidates and asks Lovable AI to reason about them, producing
// entry/SL/TP suggestions, expected return, and a short rationale.
// Never executes trades. Read-only advisory.
// ─────────────────────────────────────────────────────────────
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { createOpenAICompatible } from 'npm:@ai-sdk/openai-compatible';
import { generateText, Output, NoObjectGeneratedError } from 'npm:ai';
import { z } from 'npm:zod';

const CandidateSchema = z.object({
  ticker: z.string(),
  label: z.string(),
  category: z.string(),
  price: z.number(),
  atrPct: z.number(),
  realizedVolPct: z.number(),
  histMaxDDPct: z.number(),
  mtfAlignment: z.number(),
  regime: z.string(),
  setup: z.string(),
  setupStrength: z.number(),
  pGoal: z.number(),
  eReturnPct: z.number(),
  eMaxDDPct: z.number(),
  p10ReturnPct: z.number(),
  p90ReturnPct: z.number(),
  compositeScore: z.number(),
  riskLabel: z.string(),
  biasByTf: z.record(z.string(), z.number()),
});

const BodySchema = z.object({
  goalPct: z.number(),
  horizonH: z.number(),
  direction: z.enum(['long', 'short']),
  capitalUsd: z.number().nullable(),
  candidates: z.array(CandidateSchema).min(1).max(15),
});

// Output schema kept flat, no bounds/enums (per gateway rules)
const RankingSchema = z.object({
  rankings: z.array(z.object({
    ticker: z.string(),
    adjustedScore: z.number(),
    expectedReturnPct: z.number(),
    maxDrawdownPct: z.number(),
    entry: z.number(),
    stopLoss: z.number(),
    takeProfit: z.number(),
    riskLabel: z.string(),
    rationale: z.string(),
  })),
});

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return json({ error: 'unauthorized' }, 401);
    }
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const token = authHeader.replace('Bearer ', '');
    const { data: claims, error: authErr } = await supabase.auth.getClaims(token);
    if (authErr || !claims?.claims) return json({ error: 'unauthorized' }, 401);
    const userId = claims.claims.sub as string;

    const body = await req.json().catch(() => ({}));
    const parsed = BodySchema.safeParse(body);
    if (!parsed.success) {
      return json({ error: 'validation', details: parsed.error.flatten() }, 400);
    }
    const { goalPct, horizonH, direction, capitalUsd, candidates } = parsed.data;

    const key = Deno.env.get('LOVABLE_API_KEY');
    if (!key) return json({ error: 'LOVABLE_API_KEY not set' }, 500);

    const gateway = createOpenAICompatible({
      name: 'lovable',
      baseURL: 'https://ai.gateway.lovable.dev/v1',
      headers: { 'Lovable-API-Key': key, 'X-Lovable-AIG-SDK': 'vercel-ai-sdk' },
    });
    const model = gateway('google/gemini-3.5-flash');

    const system =
      'You are the PRECISION RANK AI for Gold Arrow. You receive a shortlist of instruments with ' +
      'multi-timeframe technical stats and Monte-Carlo goal probabilities. Your job: verify statistical ' +
      'consistency, penalize crowded / late setups, size Entry/SL/TP against ATR, and produce a re-ranked ' +
      'list with a 1–2 sentence rationale per instrument. All output is analytical — never advice, never ' +
      'auto-executed. Rules: SL distance must be at least 0.5×ATR%×price on the risk side. TP distance ' +
      'must be at least the goal %. adjustedScore is 0..100. riskLabel must be one of LOW, MEDIUM, HIGH, ' +
      'EXTREME. Do not add tickers that are not in the input.';

    const userPrompt = JSON.stringify({
      goal: { pct: goalPct, horizonHours: horizonH, direction },
      capitalUsd,
      candidates,
      instructions:
        'Re-rank strictly using the provided stats. Prefer candidates whose multi-timeframe bias, ' +
        'setup, and Monte-Carlo probability agree. Downgrade squeeze regimes with low setupStrength.',
    });

    let rankings: z.infer<typeof RankingSchema>['rankings'] = [];
    try {
      const { output } = await generateText({
        model,
        system,
        prompt: userPrompt,
        output: Output.object({ schema: RankingSchema }),
      });
      rankings = output.rankings;
    } catch (err) {
      if (NoObjectGeneratedError.isInstance(err)) {
        try {
          const parsedText = JSON.parse((err as { text?: string }).text ?? '{}');
          rankings = RankingSchema.parse(parsedText).rankings;
        } catch {
          return json({ error: 'ai_output_invalid' }, 502);
        }
      } else {
        throw err;
      }
    }

    // Server-side sanity: restrict to input tickers, clamp scores, validate risk labels
    const validRisks = new Set(['LOW', 'MEDIUM', 'HIGH', 'EXTREME']);
    const inputTickers = new Set(candidates.map(c => c.ticker));
    rankings = rankings
      .filter(r => inputTickers.has(r.ticker))
      .map(r => ({
        ...r,
        adjustedScore: Math.max(0, Math.min(100, r.adjustedScore)),
        riskLabel: validRisks.has(r.riskLabel) ? r.riskLabel : 'MEDIUM',
        rationale: r.rationale.slice(0, 400),
      }));

    return json({ rankings, model: 'google/gemini-3.5-flash', userId });
  } catch (e) {
    const msg = (e as Error).message ?? String(e);
    return json({ error: msg }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status,
  });
}