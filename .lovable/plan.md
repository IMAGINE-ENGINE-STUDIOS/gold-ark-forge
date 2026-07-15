
# Precision Indicator Rank — AI-Augmented Goal Seeker

Turn the current single-timeframe technical ranker into a rigorous, multi-signal engine whose top candidates are re-scored by Lovable AI, with the results persisted and streamed live.

## What changes for the user

- Same ANALYTICS card, but each row now shows: **AI Score**, **Confidence Band**, **Expected Return**, **Max Drawdown Risk**, **Suggested Entry / SL / TP**, and an **AI Rationale** popover.
- New controls: **Confidence Level** (P50/P70/P90), **Capital at Risk**, and **Time-in-Force** (intraday / swing / position).
- Ranking mode toggle: **Statistical** (fast, deterministic, no credits) vs **AI-Enhanced** (top-N re-ranked by Lovable AI).

## Architecture

```text
ALL_SYMBOLS ──► Statistical Layer (client)          ──► Top-N shortlist ──► AI Layer (edge fn)
                 ├─ Multi-TF snapshot (1h/4h/1d)          (e.g. top 12)      ├─ Lovable AI Gateway
                 ├─ ATR / realized vol / drawdown                            ├─ Structured Output (Zod)
                 ├─ Momentum + trend regime (ADX)                            └─ Rationale + adj. score
                 ├─ Monte-Carlo P(goal) via GBM
                 └─ Composite deterministic score
                                                    ◄── merged & sorted ◄── persisted to Cloud
```

## Statistical layer (client, deterministic)

Extend `src/lib/technicalSignals.ts` with a `buildPrecisionSnapshot()` that returns, per symbol:

1. **Multi-timeframe alignment** — build 1h / 4h / 1d candles by resampling the existing tick history; require agreement across ≥2 TFs for high-confidence signals.
2. **Regime detection** — ADX + Bollinger width classify each TF as `trend | range | squeeze`; different scoring weights per regime.
3. **Realized volatility & tail risk** — 20-period stdev of log returns + max historical drawdown → risk floor.
4. **Monte-Carlo goal probability** — 1,000-path GBM using drift = EMA slope, sigma = realized vol; returns `P(hit goal before horizon)` and `E[max drawdown]`. Replaces the current single-shot normal CDF (which ignores path-dependence).
5. **Setup detection** — Donchian breakout, mean-reversion at Bollinger band, MACD cross with volume confirmation.
6. **Composite score** = `w1·P(goal) + w2·trend_alignment + w3·setup_strength − w4·tail_risk − w5·regime_mismatch`.

All pure functions in `src/lib/precision/` (indicators.ts, montecarlo.ts, regime.ts, score.ts) with unit-testable signatures.

## AI layer (edge function, on-demand)

New edge function `supabase/functions/rank-symbols-ai/index.ts`:

- Input: `{ goalPct, horizonH, direction, capitalUsd, confidence, candidates: PrecisionRow[] }` (top 8–15 only, to keep tokens & latency bounded).
- Model: `google/gemini-3.5-flash` via Lovable AI Gateway (fast + cheap for structured re-ranking); the AI Gateway helper from the existing `automation-agent` function is reused.
- Structured output via AI SDK `Output.object` with a flat, constraint-free Zod schema:
  ```
  { rankings: [{ ticker, adjustedScore, expectedReturnPct, maxDrawdownPct,
                 entry, stopLoss, takeProfit, riskLabel, rationale }] }
  ```
- System prompt gives the model the goal, horizon, capital, and the per-symbol stat pack (bias, ATR%, MC probability, regime, setup, MTF alignment) and asks it to (a) verify statistical consistency, (b) penalize crowded/late setups, (c) size entry/SL/TP against ATR, (d) explain in ≤2 sentences.
- Rate-limit: server-side 6-req/min per user; client debounces at 20s. Handles 429 / 402 with UI toasts per gateway guidelines.

## Persistence (Lovable Cloud)

New table `rank_snapshots` (RLS scoped to `auth.uid()`):

```
id uuid pk, user_id uuid, created_at timestamptz,
goal_pct numeric, horizon_h int, direction text, scope text,
mode text ('stat'|'ai'), payload jsonb  -- full ranked rows
```

Purpose: history view ("what were the top ranks 2h ago?"), backtestable, and cheap re-open without re-scanning. GRANTs for `authenticated` + `service_role`.

## UI changes (`src/components/trading/SymbolRanker.tsx`)

- Add mode toggle **STAT / AI-ENHANCED**; capital + confidence inputs.
- Two-stage scan: statistical pass fills table immediately; if AI mode is on and user clicks **REFINE WITH AI**, top-N is sent to the edge function and the table updates in place with AI fields.
- New columns: `E[Ret%]`, `E[MaxDD%]`, `Entry/SL/TP`, `AI` (rationale popover with `react-markdown`).
- Row expand shows: MTF alignment heat-strip (1h/4h/1d), setup label, MC distribution sparkline, and AI rationale.
- History drawer lists previous `rank_snapshots` for the current user.

## Precision & safety guardrails

- **Zero fake data**: if a symbol has <60 candles across the target TF, it's excluded from AI submission (not fabricated).
- **Deterministic first**: AI never overrides risk band by more than one level; if it disagrees strongly it must justify in `rationale` (validated server-side).
- **Bounded cost**: AI runs only on the top 12 candidates, ≤ once per 20s, ≤ 6 calls/min/user.
- **No advice framing**: rationales are labeled "Analytical view — not investment advice."

## Files to add / change

- add `src/lib/precision/indicators.ts` (MTF resample, extended indicators)
- add `src/lib/precision/montecarlo.ts` (GBM path sim, P(goal), E[maxDD])
- add `src/lib/precision/regime.ts`, `score.ts`, `types.ts`
- add `supabase/functions/rank-symbols-ai/index.ts` (+ config entry)
- add migration `rank_snapshots` table + RLS + GRANTs
- add `src/hooks/useSymbolRanker.ts` (orchestrates stat pass, AI call, persistence, subscription)
- edit `src/components/trading/SymbolRanker.tsx` (new columns, mode toggle, rationale popover, history drawer)
- optional: expose ranker output to Automation → Bots as a "Top Rank" symbol source

## Verification

- Typecheck.
- Playwright: open `/trading-bridge`, RESEARCH → ANALYTICS, run STAT scan (rows appear), toggle AI-ENHANCED, click REFINE, assert new columns populate and rationale opens.
- Edge fn smoke test with a fixed candidate set → asserts schema.
- Check that a row's suggested SL is always further from price than 0.5·ATR and TP ≥ goal.

## Out of scope (deliberate)

- No live order routing from this card (kept read-only; execution stays in EXECUTE tab).
- No new AI model selector UI — model is fixed to `google/gemini-3.5-flash`; can be revisited later.
- No backtest engine rewrite — this ranker feeds the existing BACKTEST tab as a follow-up.
