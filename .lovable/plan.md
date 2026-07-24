
## Goal

The current score sometimes reads as broken because:
1. `P(Goal)` collapses to 0 or ~1 whenever drift/vol are extreme, flattening every downstream multiplier.
2. Composite is a product chain of small factors, so one weak input zeroes the whole score.
3. There is no separation between **directional edge**, **execution quality**, **risk-adjusted expectancy**, and **liquidity** — everything is squeezed into one number.
4. Risk label uses ATR + drawdown only — ignores realized vol, MTF disagreement, regime, and tail (p10) losses.
5. No cross-symbol normalization, so BTC (low ATR%) and a shitcoin (high ATR%) never compete fairly.

## New Scoring Engine (`src/lib/precision/scoring.ts`)

Introduce a **6-pillar Gold Arrow Decision Score (GADS)** — each pillar is a 0–100 sub-score, then blended with tunable weights. Every pillar is exposed in the breakdown UI.

```text
GADS = w1·Edge + w2·Probability + w3·Expectancy + w4·RiskQuality + w5·Confluence + w6·Liquidity
       (default weights: 0.22, 0.20, 0.20, 0.18, 0.12, 0.08)
```

| Pillar | Inputs | Formula (all mapped 0–100) |
|---|---|---|
| **Edge** | MTF alignment (1h/4h/1d weighted), directional bias vs. trade side, regime fit | `50 + 50·tanh(2·alignedBias)` gated by regime-fit multiplier |
| **Probability** | Monte-Carlo P(Goal) + Bayesian shrink toward base rate (0.5) using path count | `100 · (α·pGoal + (1-α)·0.5)` with α = paths/(paths+50) |
| **Expectancy** | E[Ret], p10, p90, goal% vs. horizon | Sharpe-like: `50 + 25·(eRet / max(sigma·√H, ε))` clamped |
| **RiskQuality** | ATR%, realized vol, hist DD, p10 tail, MTF disagreement | Inverse composite: `100·exp(−k·riskComposite)` |
| **Confluence** | Setup strength, oscillator agreement count, ADX, BB-width regime match | Weighted count of confirming signals ÷ max |
| **Liquidity** | Category prior (majors > mid > exotic) + price stability (bar-to-bar gap variance) | Static category floor + variance penalty |

**Cross-symbol z-score pass**: after all rows scored, apply within-category z-normalization to Edge, Probability, Expectancy so a BTC 62 and a gold 62 mean comparable relative opportunity. Store both `rawScore` and `relativeScore`.

## New Risk Model

`RiskLabel` becomes a 5-tier scale (`LOW / MODERATE / ELEVATED / HIGH / EXTREME`) driven by a weighted risk composite:

```text
riskComposite = 0.40·ATR% + 0.25·realizedVol + 0.15·|p10Return|/goal + 0.10·histMaxDD + 0.10·(1 − |mtfAlignment|)
```

Thresholds calibrated so the distribution across the 60-symbol universe is roughly 15/30/30/20/5%.

## New Verdict Engine

`verdictFor()` upgraded to a 5-state ladder: `STRONG BUY / BUY / WATCH / HOLD / AVOID`, driven by GADS + RiskQuality with hard gates:

- `STRONG BUY`: GADS ≥ 78 AND Probability ≥ 60 AND Risk ≤ ELEVATED AND Edge aligned
- `BUY`: GADS ≥ 62 AND Probability ≥ 52
- `WATCH`: GADS 48–62, waiting for confluence
- `HOLD`: GADS 35–48
- `AVOID`: GADS < 35 OR Risk = EXTREME OR Edge against direction

Conviction (0–100) = `0.6·GADS + 0.4·Probability` gated by risk penalty.

## UI Changes (`SymbolRanker.tsx`, `EagleView.tsx`)

- Replace the single **Score** column with **GADS** (relative) and keep raw score inside the expanded breakdown.
- Expanded row now renders a **6-bar pillar chart** (Edge / Probability / Expectancy / RiskQuality / Confluence / Liquidity) with the exact numeric contribution to the final score.
- Tooltip on every pillar shows the formula, the raw inputs used, and where the value sits in the current universe (percentile).
- Verdict pill in hero + row updated to the 5-state ladder with matching gold-arrow color tokens.
- Add a small **"Score Health"** indicator (green dot / amber / red) showing whether inputs were sufficient (≥60 bars, live price, MTF resolved) — makes it obvious when a symbol has degraded scoring.

## Files to touch

- **New**: `src/lib/precision/scoring.ts` — pillar computation, normalization, GADS blend.
- **Edit**: `src/lib/precision/index.ts` — call new scoring, extend `PrecisionRow` with `gads`, `pillars`, `relativeScore`, `scoreHealth`, expand `RiskLabel` and `Verdict` types, upgrade `verdictFor`.
- **Edit**: `src/components/trading/SymbolRanker.tsx` — swap Score column to GADS, add pillar breakdown panel + tooltips + Score Health dot, update verdict ladder colors.
- **Edit**: `src/pages/EagleView.tsx` — hero card + Conviction Board consume new 5-state verdict and GADS.

## Out of scope

- Backend/edge-function changes (AI overlay keeps working; it just adjusts GADS instead of compositeScore).
- Live-feed plumbing (untouched — the "score not working" issue is math, not data).
- Visual redesign beyond the pillar chart + verdict ladder.

## Validation

- Manual: rescan universe, confirm scores span 15–90 (not clumped at 0 or 100), verdict distribution is not 100% AVOID, expanded row shows six pillar bars summing to GADS.
- Guard: every numeric passes through the existing `finiteNumber` helpers so degraded feeds render "—" instead of NaN.
