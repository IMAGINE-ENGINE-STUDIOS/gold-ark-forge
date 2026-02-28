

# Fix WAVE Bot: Real-Time Position Movement + Increase Max to 500

## Problems Identified

1. **Bot opens positions but never closes them** — The exit logic in `checkExits` only detects externally-closed positions. The bias-reversal close in `scan` uses `entryThreshold * 0.5` which may never trigger if bias stays near zero. Positions sit forever.
2. **No automatic take-profit/stop-loss** — There's no time-based or price-based exit mechanism. Positions just hang open indefinitely.
3. **Stats/accuracy never update** — Since positions never close, `closedTrades` stays 0, accuracy shows "—", P&L shows $0.00. The widget looks frozen/static.
4. **maxPositions capped at 5** — Once 5 positions open, the bot stops entirely. User wants 500.
5. **Trade log limit is 200** — `saveTrades` slices to 200, needs to increase for 500 positions.

## Fix Strategy

### `src/hooks/useWaveBot.ts`
- **Add time-based auto-close**: Close positions after a configurable hold period (default ~3-5 scan cycles = 240-400s). This ensures positions cycle and accuracy gets measured.
- **Add price-target exit**: Close when price moves ≥ forecast distance from entry (take-profit) or moves against by same amount (stop-loss).
- **Relax bias-reversal threshold**: Lower from `0.5 * entryThreshold` to `0.3 * entryThreshold` so reversals trigger more easily.
- **Increase maxPositions default to 500**, increase trade history cap from 200 to 1000.
- **Fix `checkExits`**: Also close trades whose positions still exist but have exceeded hold time or hit price targets.
- **Force position P&L recalculation each scan**: Update trade records with current prices so the log shows live movement, not just static entry data.

### `src/components/trading/WaveBotPanel.tsx`
- **Update Max Positions slider**: Change max from 15 to 500.
- **Add live P&L per-trade in the log**: Show current price alongside entry/forecast so user sees movement in real-time.
- **Add hold-time display**: Show how long each position has been open.
- **Auto-refresh the trade log section**: The panel should re-render as trades update (already happens via state, but need to ensure closed trades appear quickly).

### Key Logic Addition (auto-close in scan):
```text
For each open bot position:
  1. Check time held > maxHoldSeconds (default 320s = 4 cycles)
     → Close at current price, record accuracy
  2. Check if price hit take-profit (moved in predicted direction by ≥ ATR)
     → Close at current price, record as correct
  3. Check if price hit stop-loss (moved against by ≥ ATR)  
     → Close at current price, record as incorrect
  4. Check bias reversal (existing, but with lower threshold)
     → Close at current price
```

This creates a continuous cycle: open → hold 3-5 minutes → close → measure → open new. Real-time accuracy updates every few minutes.

