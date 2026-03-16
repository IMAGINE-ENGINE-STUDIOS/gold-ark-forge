

# APEX Accuracy: 3 Improvements + 3 Strategy Adjustments

## 3 Accuracy Improvements (Technical)

### 1. Multi-Timeframe Confirmation Filter
Currently APEX only analyzes signals on a single timeframe. Add a **higher-timeframe bias check**: before issuing a directional call on RT/1m, compute the SMA and momentum signals on 5m aggregated data. If the higher timeframe disagrees with the lower timeframe direction, either skip the prediction or halve the probability. This eliminates the most common failure mode — predicting against the dominant trend.

**Changes**: `apexForecast.ts` — new `higherTimeframeBias()` function that aggregates recent candles into 5x-period bars, computes SMA20 and momentum on those, and returns a directional filter. Applied in `computeConsensus` as a veto gate.

### 2. Cooldown After Consecutive Misses
Currently after a miss, APEX immediately tries again, often in the same adverse conditions. Add a **miss-streak cooldown**: after 2 consecutive misses, pause predictions for 2 evaluation cycles (e.g. 120–600s depending on timeframe). This prevents compounding errors in choppy/news-driven markets and lets the self-correction engine adjust weights before the next batch of predictions.

**Changes**: `apexForecast.ts` — track `consecutiveMisses` in state. In `logDirectionalPrediction`, check if cooldown is active; if so, skip logging and return early.

### 3. Signal Decay Weighting (Recency Bias)
Currently all 12 signals are computed on equal lookback windows. Add **exponential recency weighting** to momentum, ROC, and SMA signals — give the last 5 bars 2x weight compared to bars 10+ ago. This makes the engine more responsive to recent price action shifts without shortening the indicator period (which would add noise).

**Changes**: `apexForecast.ts` — modify `signalMomentum`, `signalROC`, and `signalSMACross` to apply exponential decay to their internal calculations. Add a `decayFactor` parameter (default 0.85).

---

## 3 Strategy Adjustments (Behavioral)

### 4. Raise Confluence Gate During Low-Volatility Regimes
Currently the confluence gate is only adjusted by accuracy. Add a **volatility-aware gate**: when ATR is below 0.3x its 50-period average (low volatility / consolidation), raise the minimum confluence from 4 to 6. Low-vol environments produce noisy, contradictory signals — requiring more agreement prevents weak predictions during chop.

**Changes**: `apexForecast.ts` — in `getAdaptiveThreshold`, compute `atr / avgATR50` ratio. If below 0.3, add +2 to the threshold.

### 5. Direction Persistence Filter
Currently APEX can flip between bullish and bearish on consecutive predictions. Add a **direction persistence requirement**: if the previous prediction was bullish, the next prediction can only flip to bearish if the bias magnitude exceeds 0.15 (currently any non-zero bias triggers a flip). This prevents whipsaw predictions in ranging markets and aligns with how institutional signals work.

**Changes**: `apexForecast.ts` — store `lastPredictedDirection` in state. In `logDirectionalPrediction`, compare new direction to last; if flipping, require `|bias| > 0.15` instead of `|bias| > 0.06`.

### 6. Weighted Accuracy Scoring (Recent Predictions Matter More)
Currently the accuracy floor treats all historical predictions equally. A prediction from 2 hours ago has the same weight as one from 10 seconds ago. Add **time-decayed accuracy**: recent predictions (last 5 minutes) count 2x, older ones decay to 0.5x. This makes the self-correction engine react faster to changing market conditions and prevents stale good performance from masking a current accuracy drop.

**Changes**: `apexForecast.ts` — in `evaluateAndCorrect` and `batchAudit`, apply a `recencyWeight = Math.max(0.5, 2.0 - (ageMs / 300000))` to each evaluated shot when computing accuracy percentages.

---

## Summary of File Changes
- **1 file modified**: `src/lib/apexForecast.ts` — all 6 changes are localized to the forecast engine logic

