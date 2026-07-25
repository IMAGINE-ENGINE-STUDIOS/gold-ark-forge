## What's actually happening (verified this turn)

I hit every upstream directly. Here's the ground truth:

| Source | Status | Sample |
|---|---|---|
| gold-api.com (XAU) | ✅ LIVE | $4,053.70, updated seconds ago |
| `fetch-metal-prices` edge fn | ✅ LIVE | gold/silver/platinum returning fresh |
| `fetch-binance-market` edge fn | ⚠️ Returns data, but **stale** ($64k BTC in 2026 = mirror lag) |
| Binance direct WebSocket (browser) | ❌ Failing — `[WS] Reconnecting attempt 5/10` in your console. Sandbox/preview network is geoblocked from `stream.binance.com`. |
| U.S. Treasury FiscalData API | ❌ **Never actually integrated.** Only appears in marketing slides (`PartnersAndTractionSlide.tsx`) and category labels. No edge function, no hook, no adapter. |
| FRED / Stooq (`stream-fred`) | ✅ Deployed |
| Yahoo (`stream-yahoo`) | ✅ Deployed |

So three separate problems are stacked into one complaint:
1. **Treasury data was promised in a slide but never coded.**
2. **Crypto WebSocket is failing in the browser** → prices only refresh via the 1.5s REST poll, and even that poll is hitting a stale Binance mirror.
3. **Metals ARE live** — but if the UI shows the same number for 30s, it's because gold-api itself only ticks every few seconds and the WS badge/status may look "disconnected".

## Plan

### 1. Build the missing Treasury integration (real, not marketing)
- New edge function `stream-treasury` calling U.S. Treasury FiscalData API (no key required):
  - `/v2/accounting/od/avg_interest_rates` — live avg interest on all marketable Treasuries
  - `/v2/accounting/od/debt_to_penny` — daily total public debt
  - `/v1/accounting/od/rates_of_exchange` — official FX rates
- New hook `useTreasuryData.ts` polling every 60s (Treasury updates daily, no need faster).
- Surface in Eagle View "Decision Intelligence" deck as a **Macro / Sovereign** pillar (10Y avg yield, debt trend), and expose to GADS scoring for bonds/metals correlation.

### 2. Fix crypto so it's genuinely live
- Replace failing browser-direct Binance WS with a **server-side WebSocket relay** — new edge function `stream-crypto-ws` that opens the Binance combined stream from Deno and re-broadcasts via Supabase Realtime channel `market:crypto`.
- Client subscribes to that channel via `realtimeBridge.ts` (already wired for `market_ticks`). No more geoblock, sub-second ticks.
- Fallback chain in `fetch-binance-market`: add Coinbase (`api.exchange.coinbase.com/products/BTC-USD/ticker`) and Kraken (`api.kraken.com/0/public/Ticker`) BEFORE the Binance mirrors. These aren't geoblocked and are real-time. Fixes the stale $64k BTC.

### 3. Prove metals are live in the UI
- Add a visible "last tick" timestamp + pulsing dot on the price row (like the FeedStatusBadge) so you can see gold-api refreshing every 2s instead of guessing.
- Bump gold-api poll from 2s → 1s and add ETag caching in `fetch-metal-prices` so we don't waste calls when the value hasn't changed.

### 4. One consolidated `FeedStatus` panel
- Extend the badge in `TradingBridge` header to list each source with green/amber/red + last-tick age: Binance WS, Coinbase relay, gold-api, Yahoo, FRED, **Treasury (new)**. So when something silently fails you see it immediately instead of assuming everything is broken.

## Technical notes

- Treasury FiscalData is fully free, no auth, CORS-open — but we still route through an edge fn for caching + normalization.
- Coinbase & Kraken public REST endpoints are CORS-open, so the fallback can even run client-side if the edge relay is down.
- Server-side WS relay uses `Deno.upgradeWebSocket` on the edge fn and a single upstream connection fan-out; Supabase Realtime handles delivery to all browser clients.
- No schema changes required — `market_ticks` table already exists and is used by `realtimeBridge`.

## Files to touch
- **New**: `supabase/functions/stream-treasury/index.ts`, `supabase/functions/stream-crypto-ws/index.ts`, `src/hooks/useTreasuryData.ts`, `src/lib/feeds/sources/treasury.ts`, `src/lib/feeds/sources/coinbaseRelay.ts`
- **Edit**: `supabase/functions/fetch-binance-market/index.ts` (Coinbase/Kraken fallback), `src/hooks/useWebSocketPrices.ts` (route via Realtime relay), `src/hooks/useMetalPrices.ts` (1s poll), `src/components/trading/FeedStatusBadge.tsx` (expand), `src/pages/EagleView.tsx` (Treasury pillar)