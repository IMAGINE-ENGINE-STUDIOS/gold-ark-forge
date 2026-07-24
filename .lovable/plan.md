# Enforce REAL-TIME, REAL-DATA only across the price surface

## Root cause of the desync

Both the chart header and the Command Deck header call `useWebSocketPrices` + `useSimulatedStream`, but they resolve the final number differently:

- **`GALiveChart.tsx` (L781–783):** `price = isWsLive ? wsData.price : streamedPrice` → when Binance WS is live it shows the raw tick and IGNORES the simulator.
- **`TradeCommandDeck.tsx` (L170–171):** `livePrice = streamedPrice || basePrice` → ALWAYS routed through `useSimulatedStream`, which applies `±0.03%` random jitter every 800–1200ms (see `useWebSocketPrices.ts` L155). That jitter is synthetic data and it drifts against the real WS tick shown on the chart.

Result: two headers referencing "the same" price show different numbers, and the deck's value is partially fake.

This also violates the project's Zero-Fake-Data mandate (`useSimulatedStream` is a synthetic generator).

## Fix — presentation-layer only, no business logic changes

### 1. Delete the synthetic stream entirely
- `src/hooks/useWebSocketPrices.ts`: remove `useSimulatedStream` (the `Math.random()` jitter loop). No component may import it after this change.

### 2. Add one real-data hook: `useLivePrice(symbolKey)`
Single source of truth used by both chart and deck. Resolution order, all real:
1. Binance WS tick (`useWebSocketPrices`) for crypto symbols in `BINANCE_STREAMS`.
2. Category feed already in the app — no new sources:
   - `metals` → `useMetalPrices` (`price_feeds` table, refetch 60s)
   - `crypto` (non-Binance) → `useCryptoData`
   - `energy` → `useOilGasPrices`
   - other → `activePrice` prop passed by parent (already resolved from real feeds)
3. Subscribe to Supabase Realtime on `public.price_feeds` so metals/energy updates push instead of waiting 60s (enable via migration: `ALTER PUBLICATION supabase_realtime ADD TABLE public.price_feeds;`). Cleanup channel on unmount.
4. Return `{ price, change24h, source, isLive, updatedAt }`. If no real value is available, return `price: 0` and let the UI show `—` / "AWAITING FEED". Never fabricate.

### 3. Rewire the two headers to the shared hook
- `GALiveChart.tsx`: replace the current base/stream chain with `useLivePrice(symbolKey)`; remove the `useSimulatedStream` call.
- `TradeCommandDeck.tsx`: same swap — remove `useSimulatedStream`, use `useLivePrice(activeSymbol.key)`. Bid/ask still derived from that single `price`.
- Header LED dot reflects `isLive` from the hook (green = WS/Realtime push in the last 5s, amber = last REST refresh, off = no data).

### 4. Audit and purge remaining synthetic tick usage
Grep and remove `useSimulatedStream` from every caller (chart, deck, anywhere else it surfaces). No replacement — components either get a real tick or render an empty state.

## Verification

- `/trading-bridge` with BTC: deck price === chart price on every tick.
- Switch to XAU (metals): both headers move together on the 60s Supabase refresh / Realtime push, no jitter between refreshes.
- Search confirms zero remaining imports of `useSimulatedStream`.
- `grep -r "Math.random" src/hooks src/components/trading` returns nothing in the price path.

## Files touched
- `src/hooks/useWebSocketPrices.ts` — remove `useSimulatedStream`.
- `src/hooks/useLivePrice.ts` — new unified real-data hook.
- `src/components/trading/GALiveChart.tsx` — swap to `useLivePrice`.
- `src/components/trading/TradeCommandDeck.tsx` — swap to `useLivePrice`.
- One migration to add `price_feeds` to `supabase_realtime` publication (idempotent).
