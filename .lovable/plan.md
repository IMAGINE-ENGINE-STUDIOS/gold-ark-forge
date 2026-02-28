

# Add Missing Bot Controls: Trade Button, Investment Budget, Real-Time Position Tracking

## What's Missing

1. **No "Start Trading" button** — The bot has an on/off switch but no prominent action button to begin trading
2. **No investment amount selector** — User cannot choose how much capital the bot should use (it uses the full $100k paper balance)
3. **No real-time bot positions view inside BOT tab** — Bot positions exist in paper.positions (with `botSource: true`) but are only visible in the BOOK tab, not the BOT tab itself
4. **No quick manual trade from BOT tab** — No way to manually execute a trade on the bot's recommended symbol

## Implementation Plan

### Step 1: Add `botBudget` to BotConfig and useTradingBot

**File: `src/hooks/useTradingBot.ts`**
- Add `botBudget: number` to `BotConfig` (default: 25000 — 25% of $100k)
- Use `botBudget` instead of `equity` when computing position sizes in the scan function
- Cap total bot exposure to `botBudget` instead of `equity * 0.80`
- Pass `botBudget` through to `BotControlPanel`

### Step 2: Enhance BotControlPanel with missing features

**File: `src/components/trading/BotControlPanel.tsx`**
- Add new props: `botPositions` (filtered `PaperPosition[]` where `botSource === true`), `onClosePosition`, `onNavigate`, `resolvePrice`
- **Investment Budget slider**: Add a prominent slider (e.g. $1,000 – $100,000) above the strategy selector to control `botBudget`
- **START TRADING button**: Large green button when bot is off, replaces the small switch as the primary action
- **Bot Positions section**: After the P&L summary, render `PositionMiniCard` for each bot position (`botSource === true`) with live sparklines, P&L, and close buttons
- **Quick stats**: Show "Budget Used" vs "Budget Available" alongside existing stats

### Step 3: Pass bot positions from TradingBridge to BotControlPanel

**File: `src/pages/TradingBridge.tsx`**
- Filter `paper.positions.filter(p => p.botSource)` and pass as `botPositions` prop
- Pass `resolvePriceForTicker`, `handleClosePosition`, and symbol navigation callback to BotControlPanel
- Do this for both desktop and mobile bot tab renders

## Files to Modify
| File | Changes |
|---|---|
| `src/hooks/useTradingBot.ts` | Add `botBudget` to config, use it for position sizing cap |
| `src/components/trading/BotControlPanel.tsx` | Add budget slider, START TRADING button, live bot positions list with PositionMiniCard |
| `src/pages/TradingBridge.tsx` | Pass filtered bot positions + callbacks to BotControlPanel |

