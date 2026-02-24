

# Swap Terminal — Comprehensive Audit & Rename Plan

## Overview
Rename "Trading Bridge" to "Swap" across the entire platform, fix identified bugs, and ensure full integration between all tabs and the GA infrastructure.

---

## Issues Found

### 1. Naming: "Trading Bridge" appears in multiple files
- `src/components/Header.tsx` line 12: nav label
- `src/pages/TradingBridge.tsx` line 885: desktop top bar title
- `src/pages/LogRegistry.tsx` lines 85, 101: references
- `src/pages/LogRegistry2.tsx` line 157: reference
- `src/components/trading/GALiveChart.tsx` lines 2-4, 543: comments
- `src/App.tsx` line 47: route path `/trading-bridge` (keep path, update import alias)

### 2. Duplicate INTELLIGENCE link in desktop top bar
Line 895-896 has the INTELLIGENCE link duplicated twice.

### 3. Equity curve uses fake delta calculation
In `AnalyticsPanel` (lines 1253-1257), the paper equity curve replay uses an arbitrary formula (`o.side === 'sell' ? o.price * o.qty * 0.01 : -o.price * o.qty * 0.005`) instead of tracking actual cash flow. This produces inaccurate equity history.

### 4. Live mode equity curve is fully randomized
Lines 1237-1244 generate random data points for the live equity curve instead of using actual Alpaca account data.

### 5. Social Panel uses hardcoded mock traders
The `SocialPanel` component (line 1700+) displays static mock data. This is acceptable as a "coming soon" feature but should be clearly labeled.

### 6. Risk Panel correlation matrix and exposure data are static
The `RiskPanel` uses hardcoded correlation and exposure values, not derived from actual portfolio data.

### 7. Mobile PORTFOLIO tab doesn't show paper positions
Line 704-709: The mobile "portfolio" tab only shows live broker data (`PortfolioSummary`, `PositionsPanel`), ignoring paper mode entirely.

---

## Implementation Plan

### Step 1: Rename "Trading Bridge" to "Swap" everywhere
**Files to edit:**
- `src/components/Header.tsx` — Change nav label from "Trading Bridge" to "Swap"
- `src/pages/TradingBridge.tsx` — Change desktop title from "TRADING BRIDGE" to "SWAP"
- `src/pages/LogRegistry.tsx` — Update button text and description references
- `src/pages/LogRegistry2.tsx` — Update description reference
- `src/components/trading/GALiveChart.tsx` — Update comments only

Route path `/trading-bridge` will remain unchanged for URL stability; only display labels change.

### Step 2: Fix duplicate INTELLIGENCE link
Remove the duplicate `<Link to="/intelligence">` on line 896.

### Step 3: Fix paper equity curve to use real cash flow tracking
Replace the arbitrary delta formula with actual position-value tracking:
- Walk through sorted orders chronologically
- For buys: deduct `price * qty` from running cash
- For sells: add `price * qty` to running cash
- At each point, compute equity = cash + estimated positions value
- This produces an accurate equity history from the order ledger

### Step 4: Fix live equity curve
Instead of random data, show a single "current equity" point if no historical data is available, with a clear "Connect broker for historical data" note. Remove the fake random curve generation.

### Step 5: Fix mobile PORTFOLIO tab for paper mode
Add paper position rendering to the mobile `portfolio` tab (line 704+), mirroring the desktop BOOK tab's paper position display with real-time price coloring and SELL buttons.

### Step 6: Label placeholder panels clearly
Add "COMING SOON" badges to the Social and Strategies panels since they use static/mock data, making it clear these are preview features.

---

## Technical Details

### Files Modified (6 files)

| File | Changes |
|------|---------|
| `src/components/Header.tsx` | Rename "Trading Bridge" to "Swap" in nav |
| `src/pages/TradingBridge.tsx` | Rename title, fix duplicate link, fix equity curve, fix mobile portfolio tab, label placeholders |
| `src/pages/LogRegistry.tsx` | Rename references to "Swap" |
| `src/pages/LogRegistry2.tsx` | Rename reference to "Swap" |
| `src/components/trading/GALiveChart.tsx` | Update comments |

### No database changes required
### No new dependencies required

