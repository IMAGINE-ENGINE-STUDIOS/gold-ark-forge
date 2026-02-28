

# Real-Time Data: 1-3 Second Updates, Zero Fake Data

## The Reality

- **Crypto**: Binance WebSocket already delivers sub-second real-time prices for 30 coins. This is genuinely real-time.
- **Metals, Energy, Forex**: No free WebSocket feeds exist. CoinGecko, EIA, Frankfurter are REST APIs with rate limits. Polling them every 1-3s will get you rate-limited and blocked.
- **`useSimulatedStream`**: Currently generates fake jitter between polls. You want this gone.

## What We Will Do

### 1. Remove all fake/simulated data entirely
- **Delete `useSimulatedStream`** from `useWebSocketPrices.ts`
- **Remove all 10+ usages** across `GALiveChart`, `GALiveStandalone`, `GAGoldRatio`, `GACrossAssetDashboard`, `GAMultiTicker`, `GAMiniCharts`, `GAPriceCards`, `GAMarketQuotes`, `GABullionHeatmap`, `GAMetalScreener`
- Replace every `useSimulatedStream` call with the raw API price directly — no jitter, no drift, no faking
- **Remove `FALLBACK_MARKETS`** array from `useCryptoData.ts` (static fake crypto data)
- **Remove fallback drift logic** from `useOilGasData.ts` (the `Math.sin` fake price generation in the catch block)

### 2. Maximize polling frequency to API limits
| Data Source | Current | New | Notes |
|---|---|---|---|
| Binance WebSocket (crypto) | Sub-second | Sub-second | Already real-time, no change |
| CoinGecko markets | 30s | **10s** | Free tier limit ~10-30 calls/min |
| CoinGecko global | 60s | **30s** | |
| Metal prices (Supabase) | 60s | **5s** | Our own DB, no rate limit |
| Oil/Gas (EIA edge fn) | 30s | **10s** | Edge function caches, safe |
| Forex (Frankfurter) | 60s | **10s** | Public API, generous limits |
| Spreads | 30s | **10s** | |

### 3. Override CoinGecko prices with Binance WebSocket ticks
For any crypto asset where Binance WS has a live price, use that instead of the CoinGecko polled price. This gives true sub-second updates for all 30 crypto symbols.

### 4. Bot scan interval to 3 seconds
Change default `scanIntervalSec` from 10 to 3.

### 5. Set all `staleTime` to match new intervals
Halve all `staleTime` values so React Query never serves old cached data.

## Files to Modify

| File | Change |
|---|---|
| `src/hooks/useWebSocketPrices.ts` | Delete `useSimulatedStream` entirely |
| `src/hooks/useMetalPrices.ts` | refetchInterval → 5s, staleTime → 3s |
| `src/hooks/useCryptoData.ts` | refetchInterval → 10s, staleTime → 5s, remove `FALLBACK_MARKETS` |
| `src/hooks/useOilGasData.ts` | refetchInterval → 10s, remove fake drift in catch |
| `src/hooks/useForexRates.ts` | refetchInterval → 10s, staleTime → 5s |
| `src/hooks/useTradingBot.ts` | scanIntervalSec default → 3 |
| `src/components/trading/GALiveChart.tsx` | Remove `useSimulatedStream` import/usage, use raw price |
| `src/components/ga-widgets/GALiveStandalone.tsx` | Same |
| `src/components/ga-widgets/GAGoldRatio.tsx` | Same |
| `src/components/ga-widgets/GACrossAssetDashboard.tsx` | Same |
| `src/components/ga-widgets/GAMultiTicker.tsx` | Same |
| `src/components/ga-widgets/GAMiniCharts.tsx` | Same |
| `src/components/ga-widgets/GAPriceCards.tsx` | Same |
| `src/components/ga-widgets/GAMarketQuotes.tsx` | Same (if applicable) |
| `src/components/ga-widgets/GABullionHeatmap.tsx` | Same |
| `src/components/ga-widgets/GAMetalScreener.tsx` | Same |

## Result

- **Crypto**: Real prices every ~100ms via Binance WebSocket
- **Metals**: Real prices every 5s from your database
- **Energy**: Real prices every 10s from EIA
- **Forex**: Real prices every 10s from Frankfurter
- **Bot**: Scans every 3s using only real data
- **Zero fake data**: No simulated streams, no fallback arrays, no drift formulas

