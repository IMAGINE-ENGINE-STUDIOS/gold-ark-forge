

# Trading Bot Redesign — Professional, Accurate, Production-Ready

## Problems Identified

1. **UI is incomprehensible** -- Tiny 6-7px text, cryptic signal bars (T/M/V/$/W), no clear explanation of what the bot is doing or why
2. **Candle data is synthetic noise** -- `getCandleData()` generates 60 random walk points seeded from a single price + change%. The bot's 30+ indicators are computing signals on fake data, making all decisions meaningless
3. **WAVE bias is a simplified proxy** -- `getWaveBias()` just normalizes the symbol's change% to -1..1, not the actual WAVE forecast engine
4. **No AUTO vs ASK mode** -- Bot only runs in full-auto. No confirmation step before executing trades
5. **No fee simulation** -- No spread, commission, or slippage deducted from trades. P&L is unrealistic
6. **Bot scans ALL symbols** -- Scans every symbol in the watchlist indiscriminately instead of analyzing viability
7. **No clear profit/loss accounting** -- Bot P&L not tracked separately from manual trades

## Implementation Plan

### Step 1: Redesign BotControlPanel UI for clarity

Completely rewrite `BotControlPanel.tsx`:

- **Header section**: Large status badge (ACTIVE/PAUSED/OFF) with bot P&L in big readable text
- **Mode selector**: Two clear modes:
  - **AUTO** -- Bot executes trades automatically
  - **ASK** -- Bot proposes trades, user confirms/rejects via approve/dismiss buttons on each proposal
- **Strategy cards**: Replace 2x2 grid of tiny buttons with vertically stacked cards, each with a description of what it does in plain English
- **Pending approvals queue** (ASK mode): Show proposed trades as actionable cards with signal reasoning, expected entry/exit, estimated profit/loss, and approve/reject buttons
- **Live dashboard**: Replace tiny signal bars with a clear horizontal gauge per indicator group (Trend, Momentum, Volatility, Volume, Wave) with color gradient and percentage labels
- **Activity log**: Increase text size from 7-9px to 11-12px, add clear icons, color-code BUY/SELL/EXIT rows, show dollar amounts prominently
- **Bot P&L card**: Separate bot-only P&L from manual trades -- show bot entry count, exit count, total realized P&L, unrealized P&L
- **Fee disclosure**: Show simulated fees deducted per trade

### Step 2: Add fee simulation to paper trading

Edit `usePaperTrading.ts`:

- Add configurable fee structure: `{ spreadBps: 5, commissionPerTrade: 1.50, slippageBps: 2 }`
- On every `submitOrder()`, deduct:
  - Spread cost: `price * qty * spreadBps / 10000`
  - Commission: flat $1.50 per trade
  - Slippage: `price * qty * slippageBps / 10000`
- Actual fill price adjusted by slippage (buy slightly higher, sell slightly lower)
- Track cumulative fees paid in account stats
- This ensures P&L is realistic and comparable to real broker execution

### Step 3: Fix candle data to use real price history

Edit `TradingBridge.tsx` `getCandleData()`:

- Maintain a `candleHistoryRef` map that accumulates real price ticks over time per symbol
- On each scan, push the current resolved price as a new data point with timestamp
- Build OHLC from real ticks at the configured timeframe
- Only compute indicators when sufficient real data has accumulated (minimum 30 real ticks)
- This replaces the random walk generator with actual observed prices

### Step 4: Connect real WAVE forecast bias

Edit `TradingBridge.tsx` `getWaveBias()`:

- Import `computeForecastPoints` from the GALIVE chart engine
- Feed it the real accumulated candle data for the symbol
- Extract the forecast bias (-1 to +1) from the projected direction and confidence
- Fall back to 0 (neutral) if insufficient data

### Step 5: Add AUTO/ASK execution modes to bot engine

Edit `useTradingBot.ts`:

- Add `mode: 'auto' | 'ask'` to `BotConfig`
- Add `pendingProposals: BotDecision[]` state for ASK mode
- In ASK mode, instead of calling `submitOrder()`, push the decision to `pendingProposals` with status `'pending'`
- Add `approveProposal(id)` and `rejectProposal(id)` callbacks
- On approve, execute the trade at the current live price (re-validate it's still viable)
- On reject, move to activity log as "rejected by user"
- Add `botSource: boolean` tag to orders so bot trades are distinguishable

### Step 6: Accurate bot P&L tracking

Edit `useTradingBot.ts`:

- Track `botOrders: string[]` -- IDs of orders placed by the bot
- Compute bot-specific realized P&L by cross-referencing bot entry/exit pairs
- Expose `botStats: { realizedPnl, unrealizedPnl, totalFees, winCount, lossCount, avgHoldTime }`

## Files to Create
None

## Files to Modify
| File | Changes |
|---|---|
| `src/components/trading/BotControlPanel.tsx` | Complete UI redesign -- readable layout, AUTO/ASK mode, pending approvals, fee display, bot P&L card |
| `src/hooks/useTradingBot.ts` | Add ASK mode with pending proposals, approve/reject flow, bot-specific P&L tracking |
| `src/hooks/usePaperTrading.ts` | Add fee simulation (spread + commission + slippage) to submitOrder |
| `src/pages/TradingBridge.tsx` | Replace synthetic candle data with real price accumulation, connect real WAVE bias |

## No database changes required
## No new dependencies required

