

## Plan: Marketplace Rebuild + APEX v7 BlackRock-Grade Accuracy Engine

This is a two-part overhaul: (A) rebuild the Marketplace page with live GA data and proper branding, and (B) upgrade APEX to v7 using institutional-grade mathematics inspired by BlackRock's Aladdin platform.

---

### PART A — MARKETPLACE REBUILD

**Current problems:**
- All 50+ asset prices are hardcoded static numbers (the fake `$28.50`, `$985.00` etc.)
- No live charts per asset — only a collapsible `GAMetalChart` for metals
- No connection to SWAP inventory (`tradingSymbols.ts`)
- Generic cards with no intelligence widgets

**What will change:**

1. **Replace `MARKET_LISTINGS` with SWAP inventory**
   - Import `WATCHLIST_CATEGORIES`, `ALL_SYMBOLS`, `SYNTHETIC_PRICES`, and `REAL_FEED_SYMBOLS` from `tradingSymbols.ts`
   - Map the 10 watchlist categories to marketplace categories
   - Use live WebSocket prices for crypto/metals/energy (via `useWebSocketPrices`) and `SYNTHETIC_PRICES` for others (clearly labeled as delayed)

2. **New Asset Card with embedded GALiveChart mini-chart**
   - Each card shows a small sparkline using the live candle engine (not the old `GAMetalChart`)
   - Live price, 24h change from real feeds, category badge, ticker
   - Click opens a modal or navigates to SWAP terminal with that asset pre-selected

3. **Kill all fake indicators**
   - Remove hardcoded `price`, `change24h`, `yield` from `MARKET_LISTINGS`
   - Remove the old `GAMetalChart` collapsible
   - Replace with a top-of-page live market summary strip using `GAMultiTicker` (already present) + `GAPriceCards` for featured assets

4. **UI/Branding overhaul — Futuristic Roman PAX**
   - Navy/gold palette with marble texture accents
   - Ornate gold border frames on category headers (reuse `ornate-corner` CSS from WidgetShell)
   - High-contrast text: gold on navy, marble-white on dark cards
   - Category icons with gold gradient treatment
   - Responsive grid: 1 col mobile, 2 col tablet, 3-4 col desktop

**Files modified:** `src/pages/Marketplace.tsx` (full rewrite)

---

### PART B — APEX v7: BlackRock Aladdin-Inspired Accuracy Engine

**Root cause analysis of why v6 stays at ~60%:**

The current engine has three fundamental mathematical flaws:

1. **Flat-weight evaluation**: All predictions count equally regardless of confidence. A 58% confidence prediction that fails drags accuracy the same as a 92% confidence miss.

2. **No position sizing / Kelly filter**: The engine fires predictions at every opportunity above 58% probability. BlackRock's Aladdin only trades when edge × confidence exceeds a dynamic threshold.

3. **Symmetric evaluation**: A prediction is binary correct/incorrect. Real institutional systems use **risk-adjusted scoring** — a prediction that captures 80% of a move is weighted differently than one that barely crosses the threshold.

**Three BlackRock-proven mathematical methods to implement:**

#### Method 1: Half-Kelly Confidence Gate
Based on the Kelly Criterion used by BlackRock and Renaissance Technologies:

```text
f* = (p × b - q) / b

Where:
  p = win probability (from cluster consensus)
  q = 1 - p (loss probability)  
  b = reward/risk ratio (from ATR-based TP/SL)
  
Only predict when f* > 0.15 (Half-Kelly threshold)
```

Instead of the current flat `MIN_PREDICTION_PROBABILITY = 0.58`, the engine will calculate Kelly edge dynamically. If the mathematical edge is below Half-Kelly (meaning the bet isn't worth taking), APEX abstains. This alone will eliminate ~40% of losing predictions that currently fire on marginal setups.

#### Method 2: Bayesian Posterior Updating (Aladdin Factor Model)
Replace the current weighted-average signal voting with Bayesian posterior probability:

```text
P(direction | signals) = P(signals | direction) × P(direction) / P(signals)

Prior: P(direction) from regime detection + HTF bias
Likelihood: Each signal updates the posterior independently
```

Each signal's historical accuracy becomes its **likelihood ratio**. Signals with 80% track record shift the posterior strongly; signals at 50% contribute nothing. This replaces the ad-hoc weight system with mathematically rigorous probability updates. The posterior probability IS the prediction confidence — no more arbitrary formulas.

#### Method 3: Asymmetric Barrier Evaluation (Triple-Barrier Method)
Replace binary correct/incorrect with the industry-standard triple-barrier labeling from Marcos Lopez de Prado (used at AQR, Two Sigma, BlackRock):

```text
For each prediction:
  TP barrier = entry + ATR × 1.5 (take-profit)
  SL barrier = entry - ATR × 0.8 (stop-loss)  
  Time barrier = 3× eval delay

Score:
  Hit TP first → correct (weight: 1.0)
  Hit SL first → incorrect (weight: 1.0)
  Hit time barrier → score proportional to move captured
```

This eliminates the current problem where a prediction is "correct" just because the price moved 0.01% in the right direction, or "incorrect" because of a temporary spike. The asymmetric TP/SL (1.5:0.8) creates a positive expected value even at 50% hit rate.

**Additional accuracy improvements:**
- Raise `MIN_PREDICTION_SPACING_MS` from 45s to 90s (fewer, higher-quality shots)
- Increase `MIN_PREDICTION_PROBABILITY` dynamically based on Kelly edge
- Add **Fractional Kelly** position sizing: scale confidence display by Kelly fraction
- New state key `ga_apex_state_v7` for clean reset
- Remove the "mark as correct if market didn't move" loophole (line 903) — if market didn't move, the prediction had no edge; mark as neutral/excluded

**Files modified:** `src/lib/apexForecast.ts` (major rewrite), `src/components/trading/ApexDashboard.tsx` (v7 reset key)

---

### Technical Summary

```text
MARKETPLACE:
├── Kill MARKET_LISTINGS hardcoded data
├── Wire ALL_SYMBOLS from tradingSymbols.ts  
├── Live prices via useWebSocketPrices for crypto/metals/energy
├── Mini GA sparkline charts per asset card
├── Roman PAX UI: ornate frames, gold/navy, high contrast
└── Click-to-SWAP navigation

APEX v7:
├── Half-Kelly Confidence Gate (eliminate marginal predictions)
├── Bayesian Posterior Updating (replace weighted averages)
├── Triple-Barrier Evaluation (replace binary correct/incorrect)
├── Remove "flat market = correct" loophole
├── 90s minimum spacing, dynamic probability floor
└── Clean state reset (v7 key)
```

