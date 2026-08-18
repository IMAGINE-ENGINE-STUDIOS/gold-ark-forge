# Real-Time Market Data Overhaul

Today gold, silver, platinum come from `fetch-metal-prices`, which only writes hardcoded fallback numbers (2350 / 28.50 / 985) unless a `METALS_API_KEY` exists — it does not. Stocks, indices, bonds and most energy/exotic symbols come from the static `SYNTHETIC_PRICES` table in `src/data/tradingSymbols.ts`. Only crypto (Binance WebSocket + CoinGecko), FX (Frankfurter) and WTI/Brent (EIA) are genuinely live. That is why XAU/USD does not match investing.com.

## Goal

One market-data service that serves genuine live quotes for every asset class, with a strict no-synthetic-fallback policy: if a quote cannot be sourced, the UI shows "NO FEED" instead of a fake number.

## Data sources (all free, no paid keys)

| Class | Primary | Backup |
|---|---|---|
| Metals (XAU, XAG, XPT, XPD, HG copper) | Yahoo Finance quote/chart endpoints (`GC=F`, `SI=F`, `PL=F`, `PA=F`, `HG=F`, spot `XAUUSD=X`) | Stooq CSV (`xauusd`), then last DB tick |
| Crypto | Binance WebSocket (existing) | CoinGecko markets, then last DB tick |
| Forex | Yahoo `EURUSD=X` style pairs (real-time) | Frankfurter (existing, daily ECB) |
| Stocks / ETFs | Yahoo quote by ticker | Stooq CSV |
| Indices | Yahoo (`^GSPC`, `^NDX`, `^DJI`, `^VIX`, ...) | Stooq |
| Bonds / yields | Yahoo (`^TNX`, `^TYX`, `^FVX`) | FRED via existing macro path |
| Energy | EIA (existing) + Yahoo futures (`CL=F`, `BZ=F`, `NG=F`) | last DB tick |

Yahoo endpoints are fetched **server-side from an edge function** (browser calls are CORS-blocked and rate-limited by IP).

## Backend work

1. New edge function `market-quotes` (public, `verify_jwt = false`):
   - `POST { tickers: string[] }` → batched Yahoo quote fetch (chunks of ~40), normalized to `{ symbol, last, change24h, bid, ask, prevClose, ts, source }`.
   - Per-provider fallback chain with timeouts; providers tried in the order above.
   - Writes every successful quote into the existing `market_ticks` table (upsert on `symbol`), so the DB always holds the last known good tick and the whole app can share one cache.
   - In-memory 5s cache inside the function to absorb burst traffic.
   - Zod validation of the request body; ticker list capped at 200.
2. Rewrite `fetch-metal-prices` to pull real spot from the same provider chain and drop the hardcoded fallback block. On total failure it returns an error and leaves `price_feeds` untouched (no stale-write of fake numbers).
3. Optional scheduled refresh: a cron-triggered call every 60s that keeps `market_ticks` warm for the most-watched symbols so first paint is instant.

## Frontend work

4. New `src/hooks/useMarketQuotes.ts` — React Query hook that takes a list of tickers, calls `market-quotes`, refetches every 10s, and exposes `{ price, change, stale, source }` per symbol.
5. New `src/lib/priceSource.ts` — single resolver replacing the scattered logic: Binance WS → `market-quotes` → `market_ticks` last known → `null`. Never `SYNTHETIC_PRICES`.
6. Rewire `resolveSymbolPrice` in `src/pages/TradingBridge.tsx`, plus `GAAllAssetPriceCards`, `GALiveChart`, `GALiveStandalone`, `GAMarketHeatmap`, `Marketplace`, and `useGeniusTrader` to the shared resolver.
7. Demote `SYNTHETIC_PRICES` to a display-only "reference last close" used for nothing that trades; any UI without a live quote renders a dimmed "NO FEED" state and the trading engine refuses to size an order on it.
8. `LivePriceIndicator` gains a source badge (WS / LIVE / CACHED) and an age timestamp so it is obvious when a number is not fresh.

## Verification

- Compare the rendered XAU/USD, BTC, EURUSD, SPX and TNX values against public references and confirm they match within normal spread.
- Confirm `market_ticks` fills with rows carrying real `source` values.
- Confirm a forced provider failure renders "NO FEED" and blocks order placement rather than showing a synthetic price.
