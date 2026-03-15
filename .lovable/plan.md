

## APEX Forecast Engine v4 — 200% Accuracy Overhaul

### Root Causes of Current Inaccuracy

1. **Sinusoidal projection model** — fitting a sine wave to price is fundamentally wrong; prices don't oscillate at fixed frequencies
2. **No regime detection** — treats trending and ranging markets identically, causing trend signals and mean-reversion signals to cancel each other out
3. **Weak signal scaling** — RSI, SMA, EMA signals are too conservative (0.25-0.3 multipliers), producing near-zero votes
4. **No signal confluence gate** — makes predictions even when only 2 of 8 signals are active, producing low-confidence noise
5. **30-second evaluation window** — too short to measure if a directional prediction was correct
6. **Missing key indicators** — no Stochastic, no Rate of Change, no volume structure, no trend strength (ADX-like)

### Redesign Plan

**File: `src/lib/apexForecast.ts`** — Full v4 rewrite

#### A. New Signal Architecture (12 signals, up from 8)
- **Add Stochastic Oscillator** — K/D crossover for overbought/oversold confirmation
- **Add Rate of Change (ROC)** — 12-period momentum, stronger than linear regression slope
- **Add Trend Strength (ADX-style)** — directional movement index to measure if market is trending or ranging
- **Add SMA Cross signal** — SMA10 vs SMA20 crossover, the most reliable short-term trend signal
- Strengthen existing signal scaling (remove the 0.25-0.3 dampeners that kill signal strength)

#### B. Regime Detection Engine
- Compute **Hurst exponent estimate** from recent price data (>0.5 = trending, <0.5 = mean-reverting)
- When trending: boost momentum, SMA, EMA, MACD weights by 1.5x; dampen bollinger, vwap by 0.5x
- When ranging: boost bollinger, RSI, vwap by 1.5x; dampen momentum, MACD by 0.5x
- This alone should eliminate the biggest source of wrong predictions

#### C. Projection Model Overhaul
- Replace sinusoidal model with **adaptive linear extrapolation + ATR envelope**
- Forecast = currentPrice + (weightedBias * ATR * stepDecay) per step
- No fake wave oscillations — just the mathematically expected direction with proper decay
- Confidence band = ATR * sqrt(step) (random walk scaling, statistically correct)

#### D. Confluence Gate
- Require minimum 4 of 12 signals to agree on direction before making a bullish/bearish call
- Below threshold → output "neutral" instead of a weak directional guess
- This eliminates the majority of wrong predictions (low-confidence noise)

#### E. Smarter Evaluation
- Increase evaluation delay from 30s to **timeframe-adaptive**: RT=60s, 1m=120s, 5m=300s, etc.
- Add **magnitude-aware scoring**: prediction correct if direction matches AND price moved > 0.5 ATR in that direction
- Faster learning rate on corrections (0.12 base instead of 0.06)

#### F. Per-Regime Weight Sets
- Store separate weight sets for trending vs ranging regimes
- Self-correction adjusts only the active regime's weights
- Prevents trending corrections from degrading ranging performance

### Summary of Changes
- **1 file modified**: `src/lib/apexForecast.ts` — complete v4 engine rewrite with regime detection, 12 signals, confluence gating, adaptive projection, and smarter self-correction

