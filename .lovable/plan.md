

# Phase 4: Professional Analytics Widgets + Chart UI Cleanup

## Overview

Two parallel efforts in one implementation:

1. **4 new professional analytics widgets** as standalone components in `src/components/ga-widgets/`
2. **Chart header UI cleanup** -- consolidate overflowing tools into dropdown menus so nothing falls off-screen

---

## Part A: Chart UI Cleanup (GALiveChart.tsx)

### Problem
The chart header (line 514) packs too many elements into a single row: symbol info, bid/ask, day range, drawing tools (4 buttons + count + trash), 5 chart mode buttons, and 14 timeframe buttons. On many screen sizes these overflow or get clipped by `overflow-hidden`.

### Solution: Consolidate into 3 dropdown menus

**1. Drawing Tools dropdown**
- Replace the 4 inline tool buttons + count + trash with a single "Draw" toggle button
- When clicked, shows a dropdown with all 4 tools, the drawing count, and clear-all
- Active tool state shown via gold highlight on the trigger button

**2. Chart Mode dropdown**
- Replace 5 inline chart-mode icon buttons with a single button showing the current mode icon + a chevron
- Dropdown lists all 5 modes (Area, Candlestick, OHLC, Heikin-Ashi, Renko) with labels and icons
- Active mode gets a gold indicator dot

**3. Timeframe dropdown (desktop too)**
- Replace the 14 inline timeframe buttons with a single dropdown (same pattern already used on mobile)
- Shows current timeframe + chevron on desktop, opens a dropdown with all 14 options
- Group visually: Intraday (RT-30m), Hourly (1H-8H), Daily+ (1D-1M)

This frees the header to fit comfortably in one row on any screen width without overflow-hidden clipping.

### Implementation in `GALiveChart.tsx`

- Lines 587-598 (ChartDrawingTools inline render): Replace with a dropdown button that opens ChartDrawingTools in a positioned dropdown panel
- Lines 599-618 (chart mode buttons): Replace with a single-button dropdown
- Lines 620-650 (timeframe selector): Use the mobile dropdown pattern for all screen sizes, removing the flex-nowrap inline buttons

---

## Part B: 4 New Professional Analytics Widgets

### Widget 1: `src/components/ga-widgets/GAPerformanceDashboard.tsx`

A compact performance analytics card showing:
- Sharpe Ratio, Sortino Ratio, Max Drawdown, Calmar Ratio
- Win/Loss ratio with visual bar
- Profit Factor
- Average Win vs Average Loss comparison
- Monthly returns heatmap grid (12 months x simulated)

All data simulated/computed from paper trading state or mock data. Renders as a self-contained widget card using the existing WidgetShell-style border pattern.

### Widget 2: `src/components/ga-widgets/GAMarginCalc.tsx`

Margin & Leverage Calculator:
- Input fields: Account Size, Leverage (1x-100x), Position Size, Entry Price
- Computed outputs: Required Margin, Maintenance Margin, Liquidation Price, Max Position
- Visual margin usage bar (green/yellow/red zones)
- Preset buttons for common leverage levels (1x, 5x, 10x, 25x, 50x, 100x)

### Widget 3: `src/components/ga-widgets/GATradingSessions.tsx`

Global Trading Sessions Clock:
- Shows 4 major sessions: Sydney, Tokyo, London, New York
- Each with open/close times, current status (OPEN/CLOSED), and a visual timeline bar
- Overlapping session highlights (London-NY overlap = highest liquidity)
- Current time indicator on the timeline
- Session-specific volatility hint labels

### Widget 4: `src/components/ga-widgets/GAPipCalculator.tsx`

Pip Value & Profit Calculator:
- Inputs: Currency Pair (select from common pairs), Lot Size (micro/mini/standard), Entry Price, Exit Price
- Computed: Pip Value in USD, Total Pips, Profit/Loss
- Quick preset lot sizes (0.01, 0.1, 1.0, 10.0)
- Works for forex, metals (XAU, XAG pip definitions), and crypto

---

## Part C: Integration into TradingBridge

### `src/pages/TradingBridge.tsx`

- Import the 4 new widgets
- Add them to the **ANALYTICS** tab (bottomTab === 'analytics', lines 976-985):
  - Place GAPerformanceDashboard and GATradingSessions in the existing grid alongside GAMarketPulse, etc.
- Add GAPipCalculator and GAMarginCalc to the **RISK** tab (bottomTab === 'risk', lines 987-997):
  - Place them in the grid alongside the existing position sizer and correlation matrix

---

## Files Changed

| File | Change |
|------|--------|
| `src/components/trading/GALiveChart.tsx` | Refactor header: drawing tools, chart modes, and timeframes into dropdown menus |
| `src/components/ga-widgets/GAPerformanceDashboard.tsx` | **NEW** -- Performance metrics widget |
| `src/components/ga-widgets/GAMarginCalc.tsx` | **NEW** -- Margin calculator widget |
| `src/components/ga-widgets/GATradingSessions.tsx` | **NEW** -- Trading sessions clock widget |
| `src/components/ga-widgets/GAPipCalculator.tsx` | **NEW** -- Pip calculator widget |
| `src/pages/TradingBridge.tsx` | Import + place 4 new widgets in Analytics and Risk tabs |

No new dependencies required. All widgets use existing patterns (Recharts, Tailwind, lucide-react icons).

