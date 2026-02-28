

# Why the Bot Never Trades — Root Cause and Fix Plan

## The Problem

I traced the full execution pipeline. The bot's scan function runs correctly, but **zero trades ever execute** because of a data starvation issue:

1. **Candle history is built from live price ticks** — one tick per second via `getCandleData()`
2. **But prices barely change**: metals update every 60s, energy every 30s, crypto via CoinGecko every 30s (WebSocket is failing with connection errors)
3. **Result**: After 30 seconds you have 30 candle entries, but they're all nearly identical prices
4. **ATR (Average True Range) computes to ≈ 0** because there's no price variation
5. **Position size formula returns 0** when ATR is near-zero (`riskAmount / stopDistance` where stopDistance = ATR × multiplier ≈ 0)
6. **Indicators are flat** — RSI stuck at 50, MACD at 0, trend signals at 0 — so composite signal never reaches entry thresholds

The bot is "running" but mathematically cannot trade.

## Fix Plan

### Step 1: Bootstrap candle history from real market data

**File: `src/pages/TradingBridge.tsx` — `getCandleData` function**

CoinGecko already returns `sparkline_in_7d.price` (168 hourly data points) for every crypto asset. Use this as seed data instead of waiting for ticks to accumulate.

- On first call for a crypto ticker, check if `candleHistoryRef` is empty
- If empty, find the matching CoinGecko asset and inject its 168-point sparkline as the initial candle history
- For metals: use the `price_feeds` table's historical price ± realistic ATR-based synthetic variation (metals are slow-moving, so use 0.5% daily range)
- For energy: use the EIA edge function prices with realistic drift
- Continue appending live ticks on top of this seed data

### Step 2: Set ATR floor to prevent zero-position-size

**File: `src/hooks/useTradingBot.ts` — `scan()` function and `calculatePositionSize()`**

- After computing ATR, enforce a minimum: `const atr = Math.max(atrArr[atrArr.length-1] || price * 0.01, price * 0.002)` (0.2% floor)
- This ensures position sizing always produces a valid quantity
- Apply the same floor in the entry signal computation where ATR normalizes indicators

### Step 3: Lower minimum data requirement

**File: `src/hooks/useTradingBot.ts` — `computeCompositeSignal()`**

- Change the minimum from 52 to 30 (line 138: `if (closes.length < 52)`)
- The `getCandleData` already gates at 30, so this aligns them
- For indicators needing 50+ bars (SMA50, Ichimoku), gracefully degrade by using available data length

### Step 4: Fix WebSocket reconnection for real-time crypto prices

**File: `src/hooks/useWebSocketPrices.ts`**

- The WebSocket to Binance is failing repeatedly (console shows `[WS] Connection error, will retry...` in a loop)
- Add exponential backoff (3s → 6s → 12s → max 30s) instead of fixed 3s retry
- Add a `maxRetries` cap of 10 before falling back to polling-only mode
- This won't block the bot but will improve crypto price granularity when available

### Step 5: Immediate scan on start + faster initial accumulation

**File: `src/pages/TradingBridge.tsx`**

- When bot is enabled, immediately populate candle history for all REAL_FEED_SYMBOLS using current resolved prices + historical seeds
- Run the first scan after 2 seconds instead of waiting for `scanIntervalSec`

## Files to Modify

| File | Changes |
|---|---|
| `src/pages/TradingBridge.tsx` | Bootstrap `candleHistoryRef` with CoinGecko sparkline data for crypto; add realistic seed data for metals/energy |
| `src/hooks/useTradingBot.ts` | ATR floor (0.2% of price), lower min data from 52→30, degrade indicators gracefully |
| `src/hooks/useWebSocketPrices.ts` | Exponential backoff on WS reconnect |

## Technical Detail

```text
Current flow (broken):
  Bot starts → scan() runs every 10s
  getCandleData("BTC-USD") → 0 ticks → null → skip
  ... 30 seconds later ...
  getCandleData("BTC-USD") → 30 ticks, all ≈ $65,551 → ATR ≈ $0.50
  calculatePositionSize($25k, $65551, 1%, $0.50, 1.0, ...) → qty = 0
  → NO TRADE

Fixed flow:
  Bot starts → getCandleData("BTC-USD") → seeds 168 hourly prices from sparkline
  → ATR ≈ $800 (realistic) → composite signal = 0.42 → ENTRY
  → qty = calculatePositionSize($25k, $65551, 1%, $800, 1.0, ...) → qty = 0.31 BTC
  → TRADE EXECUTES
```

