

# Fix: Bot Not Trading and No Real-Time P&L

## Root Cause

Two interconnected bugs prevent the bot from showing gains/losses in real-time:

### Bug 1: Scan loop resets infinitely (no trades execute)
`scan` is in the dependency array of the `useEffect` that creates `setInterval`. But `scan` depends on `activityLog`, which changes every time the scan logs a decision. This creates a loop: scan runs → logs a decision → `activityLog` changes → `scan` recreated → `useEffect` clears and restarts interval → scan runs again from scratch. The `async` nature compounds this — multiple scans can overlap.

**Fix**: Remove `activityLog` from `scan`'s dependency array. Use refs for values that `scan` reads but shouldn't trigger recreation (activityLog, positions). Stabilize the interval.

### Bug 2: Position P&L not updating in real-time
The `updatePrices` effect (line 573) depends on `paper.positions.length` instead of a price tick counter. When position count stays the same, changes in `metalPricesData`/`cryptoDataAll`/`oilPricesData` should still trigger updates — but the `resolveSymbolPrice` callback reference is memoized with `useCallback` and may not change when underlying query data changes. Need to add a tick counter or depend on the raw price data objects directly.

**Fix**: Add a 1-second interval that calls `updatePrices` with freshly resolved prices for all open positions. This guarantees real-time P&L regardless of data dependency chain issues.

## Files to Modify

### `src/hooks/useTradingBot.ts`
- Move `activityLog` and `positions` reads inside `scan` to use refs instead of closure state
- Add `activityLogRef` and `positionsRef` that stay synced via `useEffect`
- Remove `activityLog` and `positions` from `scan`'s dependency array
- This stabilizes the scan interval so it actually runs continuously

### `src/pages/TradingBridge.tsx`
- Add a 1-second `setInterval` that calls `paper.updatePrices()` with current resolved prices for all open positions
- This ensures P&L updates in real-time regardless of React dependency chain issues
- Replace the existing `useEffect` (line 573-584) with a stable interval-based approach

## Expected Result
- Bot scan runs stably every 10 seconds without resetting
- Trades execute and appear in the activity log with AI badges
- Open positions show live P&L updating every second
- Total P&L in the dashboard card updates in real-time

