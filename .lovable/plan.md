

# Gold Arrow Trading Bot — AI-Powered Autonomous Trading Engine

## Overview

Build an autonomous trading bot that runs inside the Swap terminal, consuming all 30+ proprietary indicators, the WAVE forecast engine, and real-time price feeds to generate, execute, and manage paper trading positions with optimal entry/exit timing.

## Architecture

```text
┌─────────────────────────────────────────────────┐
│              TradingBridge.tsx                   │
│  ┌───────────────────────────────────────────┐  │
│  │         useTradingBot() hook               │  │
│  │  ┌─────────┐  ┌──────────┐  ┌──────────┐ │  │
│  │  │ Signal  │→│ Decision │→│ Executor │ │  │
│  │  │ Engine  │  │ Matrix   │  │          │ │  │
│  │  └─────────┘  └──────────┘  └──────────┘ │  │
│  │       ↑              ↑            ↓       │  │
│  │  All 30+        Risk Mgmt   paper.submit  │  │
│  │  Indicators     + Sizing    Order()       │  │
│  │  + WAVE bias                              │  │
│  └───────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────┐  │
│  │       BotControlPanel.tsx (UI)             │  │
│  │  ON/OFF · Strategy · Risk · Activity Log  │  │
│  └───────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
```

## Signal Engine — Multi-Indicator Consensus

The bot computes a composite signal score from **all existing indicator functions** in `IndicatorOverlay.tsx`:

| Signal Group | Indicators Used | Weight |
|---|---|---|
| **Trend** | SMA20/50 cross, EMA20, Ichimoku cloud position, Alligator, Parabolic SAR | 30% |
| **Momentum** | RSI, Stoch RSI, MACD cross + histogram, CCI, Momentum, Awesome Oscillator | 25% |
| **Volatility** | Bollinger position, ATR, Keltner channel, Std Dev, Donchian breakout | 15% |
| **Volume** | OBV trend, MFI, CMF, A/D Line, Force Index | 15% |
| **Forecast** | WAVE bias (-1 to +1), forecast direction, confidence band width | 15% |

Each group produces a normalized score from -1 (strong sell) to +1 (strong buy). The weighted composite determines the action:
- **> +0.55**: Strong BUY signal
- **+0.25 to +0.55**: Weak BUY (reduced position size)
- **-0.25 to +0.25**: HOLD / no action
- **-0.55 to -0.25**: Weak SELL
- **< -0.55**: Strong SELL signal

## Risk Management Layer

- **Position sizing**: Kelly Criterion based on win rate and avg win/loss ratio from order history
- **Max exposure**: Never exceed 25% of equity per position, 80% total
- **Stop-loss**: Auto-set at 1.5x ATR below entry (configurable)
- **Take-profit**: Auto-set at 2.5x ATR above entry (risk-reward ratio ≥ 1.67)
- **Cooldown**: Minimum 30 seconds between trades on same symbol to prevent whipsaw
- **Drawdown circuit breaker**: Pause bot if account drawdown exceeds 10% from peak

## Strategy Presets

1. **Conservative** — Only trades on strong signals (> 0.65), tight stops, low position size
2. **Balanced** — Default thresholds, moderate sizing
3. **Aggressive** — Trades on weak signals too, larger positions, wider stops
4. **WAVE-First** — Heavily weights the forecast engine (40% WAVE, 60% indicators)

## Bot Control Panel UI

A new collapsible section in the Swap terminal sidebar with:
- Master ON/OFF toggle with pulsing green/red indicator
- Strategy preset selector (Conservative / Balanced / Aggressive / WAVE-First)
- Scan interval slider (5s to 60s)
- Max concurrent positions limit (1-10)
- Risk per trade % slider (1-10%)
- Live activity log showing signal scores, decisions, and executions
- Running P&L since bot activation
- Kill switch (close all positions immediately)

## Execution Loop

Every scan cycle (default 10s):
1. For each symbol in the active watchlist, compute all indicator values from current candle data
2. Run the WAVE forecast engine (`computeForecastPoints`) to get bias and projected price
3. Aggregate into composite signal score
4. Check against existing positions (don't double-enter, check for exit signals on open positions)
5. Apply risk management filters (sizing, exposure, cooldown, drawdown)
6. Execute via `paper.submitOrder()` with calculated stop-loss and take-profit
7. Log decision to activity feed with full indicator snapshot

## Implementation Plan

### Step 1: Create Signal Engine hook
New file `src/hooks/useTradingBot.ts` containing:
- `computeCompositeSignal()` — runs all 30+ indicators on a price array, returns -1 to +1 score with breakdown
- `calculatePositionSize()` — Kelly Criterion + max exposure constraints
- `shouldEnter()` / `shouldExit()` — decision logic with cooldown and drawdown checks
- Main `useEffect` loop with `setInterval` for the scan cycle
- Activity log state (last 50 decisions with timestamps and scores)

### Step 2: Create Bot Control Panel UI
New file `src/components/trading/BotControlPanel.tsx`:
- ON/OFF toggle, strategy selector, risk sliders
- Live signal score display per scanned symbol (color-coded)
- Activity log with indicator breakdown tooltips
- Running stats: trades made, win rate since activation, P&L
- Kill switch button

### Step 3: Integrate into TradingBridge
Edit `src/pages/TradingBridge.tsx`:
- Add new "BOT" tab icon (Bot icon) to the sidebar tabs
- Wire `useTradingBot` hook with `paper.submitOrder`, `paper.closePosition`, and the price resolver
- Pass current candle data from GALiveChart to the bot engine
- Show bot status indicator in the header bar

### Step 4: Bot activity persistence
- Save bot settings (strategy, risk params, on/off state) to `localStorage`
- Log bot trades with a `source: 'bot'` tag in the paper order for analytics filtering

## Files to Create
| File | Purpose |
|---|---|
| `src/hooks/useTradingBot.ts` | Signal engine, risk management, execution loop |
| `src/components/trading/BotControlPanel.tsx` | Bot configuration and monitoring UI |

## Files to Modify
| File | Changes |
|---|---|
| `src/pages/TradingBridge.tsx` | Add BOT tab, integrate hook, wire price data |

## No database changes required
## No new dependencies required

