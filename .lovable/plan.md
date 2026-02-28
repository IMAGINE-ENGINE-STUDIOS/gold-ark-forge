

# Replace Old Bot with WAVE Forecast Trading Engine

## What Changes

1. **Archive old bot** — Move `useTradingBot.ts` and `BotControlPanel.tsx` to an `/old-bots` archive page
2. **Build new WAVE bot** — A simple, direct trading engine that uses `computeForecastPoints` (the existing WAVE forecast function) to decide trades every 80 seconds
3. **Real-time accuracy tracking** — Every trade is logged with the forecast prediction; after the position closes, we compare predicted vs actual direction and measure accuracy live
4. **Tunable WAVE parameters** — Expose drift multiplier, wave amplitude, damping factor, cycle sensitivity as sliders so users can tune the forecast toward 100% accuracy

## Architecture

```text
WAVE Forecast (computeForecastPoints)
  ↓ every 80s
  bias > +0.15 → BUY
  bias < -0.15 → SELL
  else → HOLD
  ↓
  Paper Trading Engine (existing usePaperTrading)
  ↓
  Live P&L + Accuracy Tracker
```

No AI edge function. No 30-indicator engine. Pure WAVE forecast → trade → measure → tune.

## Files

| File | Action |
|---|---|
| `src/pages/OldBots.tsx` | **Create** — Archive page displaying old bot code reference |
| `src/hooks/useWaveBot.ts` | **Create** — New hook: 80s interval, reads WAVE bias, opens/closes positions via paper trading, tracks accuracy per trade |
| `src/components/trading/WaveBotPanel.tsx` | **Create** — New UI: start/stop, live accuracy %, P&L, tunable WAVE parameters (drift, amplitude, damping, cycle), trade log with predicted vs actual |
| `src/App.tsx` | **Modify** — Add `/old-bots` route |
| `src/pages/TradingBridge.tsx` | **Modify** — Replace `BotControlPanel` + `useTradingBot` with `WaveBotPanel` + `useWaveBot` in the BOT tab |

## New Hook: `useWaveBot`

- Config: `{ enabled, budget, interval (default 80s), entryThreshold (0.15), exitThreshold (-0.10), maxPositions, waveDrift, waveAmplitude, waveDamping, cycleSensitivity }`
- Every interval: for each tradable symbol, call a local version of `computeForecastPoints` with tunable params → get bias
- If bias > threshold and no position → BUY; if bias < -threshold → SELL
- Track each trade: `{ predictedDirection, entryPrice, forecastPrice, actualExitPrice, correct: boolean }`
- Accuracy = correct / total trades, displayed live
- Uses `usePaperTrading.submitOrder` / `closePosition` directly

## WAVE Parameter Tuning

Expose these as sliders in the panel:
- **Drift multiplier** (0.01–0.20, default 0.08) — controls trend-following strength
- **Wave amplitude** (0.1–0.8, default 0.3) — controls oscillation size
- **Damping** (0.1–1.5, default 0.5) — how quickly oscillation fades
- **Cycle sensitivity** (0.1–1.0, default 0.3) — base frequency when no cycles detected
- **Entry threshold** (0.05–0.50, default 0.15) — minimum bias to enter

## Accuracy Measurement

Each trade records:
- Forecast bias direction at entry (bullish/bearish)
- Forecast projected price
- Actual price at exit
- `correct = (predicted bullish && exitPrice > entryPrice) || (predicted bearish && exitPrice < entryPrice)`
- Running accuracy displayed as a percentage with color coding

