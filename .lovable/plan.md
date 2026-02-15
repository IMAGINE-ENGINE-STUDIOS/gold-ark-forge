

# Calendar Scheduler, Risk Limits & Price Alert Notifications

## Overview
Add three major features to the Trading Bridge: (1) a calendar-based order scheduler for automated recurring buys/sells with goal tracking, (2) configurable risk limits with auto-sell protection, and (3) a real-time price alert system with desktop notifications and sound.

---

## 1. Calendar Order Scheduler

A new "SCHEDULE" tab in the bottom panel for programming future and recurring orders.

### Features
- **One-time scheduled orders**: Pick a date/time from a calendar, set symbol, side (buy/sell), quantity, and order type
- **Recurring orders (DCA+)**: Daily, weekly, bi-weekly, monthly frequency with start/end dates
- **Goal tracking**: Set a target portfolio value or accumulation goal (e.g., "Accumulate 1 BTC by Q3") with progress bar
- **Pre-authorized auto-sells**: Set a floor price -- if symbol drops below it, automatically submit a sell order via the connected broker
- **Schedule list view**: See all upcoming and past scheduled orders in a timeline/calendar grid

### New File: `src/components/trading/SchedulePanel.tsx`
- Calendar date picker using existing `react-day-picker` (already installed)
- Recurring frequency selector (daily/weekly/bi-weekly/monthly)
- Symbol + quantity + side inputs (reuse patterns from OrderForm)
- Goal section: target value input, current progress bar, estimated completion date
- Schedule list with activate/pause/delete controls
- All schedules stored in localStorage (no database needed for v1)

### New File: `src/hooks/useScheduledOrders.ts`
- Custom hook managing scheduled orders in localStorage
- `useEffect` timer that checks every 30 seconds if any order is due
- When triggered: calls `useSubmitOrder` to execute via the connected broker
- Tracks execution history (success/fail/skipped)
- Auto-sell monitor: continuously checks price against floor thresholds using WebSocket/simulated stream data

---

## 2. Risk Limits & Auto-Sell Protection

Enhance the existing Risk panel with configurable stop-loss automation.

### Features
- **Per-symbol floor price**: Set minimum price thresholds -- if price drops below, auto-submit a market sell order
- **Portfolio-wide drawdown limit**: If total portfolio drops X% from peak, pause all automated orders and alert
- **Daily loss limit**: Max dollar loss per day before all auto-trading halts
- **Position size limits**: Max percentage of portfolio in any single asset

### New File: `src/components/trading/RiskLimits.tsx`
- UI for setting floor prices per symbol (table with symbol, current price, floor price, status)
- Portfolio drawdown % input with visual gauge
- Daily loss limit input
- Active/paused toggle for each limit
- Warning indicators when limits are approaching (yellow at 80%, red at 95%)

### New File: `src/hooks/useRiskMonitor.ts`
- Monitors live prices against configured floor prices
- When floor is breached: auto-submits sell order via broker-proxy, fires alert notification, logs event
- Tracks peak portfolio value for drawdown calculation
- Persists limits in localStorage

---

## 3. Price Alert Notifications

Real-time alert system that triggers when symbols cross user-defined thresholds.

### Features
- **Create alerts**: Symbol + condition (above/below/crosses) + price threshold
- **Desktop notifications**: Browser Notification API with permission request
- **Sound alerts**: Short audio chime using Web Audio API (no external files needed)
- **In-app toast**: Sonner toast notification with alert details
- **Alert history**: Log of all triggered alerts with timestamps
- **Persistent**: Alerts survive page refresh (localStorage)

### New File: `src/components/trading/PriceAlerts.tsx`
- Alert creation form: symbol picker, condition (above/below/crosses), price input
- Active alerts list with delete/mute controls
- Alert history log
- Sound toggle + volume control
- Desktop notification permission button
- Bell icon badge in the top bar showing active alert count

### New File: `src/hooks/usePriceAlerts.ts`
- Stores alerts in localStorage
- Monitors prices from `useWebSocketPrices` (crypto) and `useSimulatedStream` (non-crypto)
- When threshold crossed:
  1. Play notification sound via Web Audio API (synthesized beep, no file needed)
  2. Show browser desktop notification (if permitted)
  3. Show sonner toast
  4. Log to alert history
- Cooldown period (60s) to prevent alert spam for the same symbol

### New File: `src/lib/notificationSound.ts`
- `playAlertSound()`: Uses Web Audio API to generate a short ascending tone
- `requestNotificationPermission()`: Wrapper for `Notification.requestPermission()`
- `sendDesktopNotification(title, body)`: Creates browser notification with Gold Arrow branding

---

## Integration into TradingBridge

### Modified File: `src/pages/TradingBridge.tsx`
- Add "SCHEDULE" tab to `BOTTOM_TABS` array (with Calendar icon)
- Add "ALERTS" tab to `BOTTOM_TABS` array (with Bell icon)
- Render `SchedulePanel` when schedule tab is active
- Render `PriceAlerts` when alerts tab is active
- Add alert bell icon with badge count to the top bar (desktop + mobile)
- Integrate `useRiskMonitor` at the TradingBridge level so it runs while terminal is open
- Add `RiskLimits` component inside the existing Risk tab alongside the current position sizer and exposure limits
- Wire price data (from existing hooks) into the alert and risk monitoring systems
- Add schedule tab to mobile TOOLS section

### Modified File: `src/components/trading/RuleBuilder.tsx`
- Add `'schedule'` as a new ActionType so rules can schedule future orders
- Expand the broker dropdown to include all 15 brokers

---

## Technical Details

### Data Flow for Auto-Execution
1. `useScheduledOrders` checks timer every 30s
2. If order is due AND connected broker exists -> calls `useSubmitOrder`
3. `useRiskMonitor` checks prices every tick (WebSocket update or 1s interval)
4. If floor breached -> calls `useSubmitOrder` for emergency sell + fires alert
5. `usePriceAlerts` checks prices on every WebSocket/stream update
6. If threshold crossed -> plays sound + desktop notification + toast

### localStorage Schema
```text
ga_scheduled_orders: [{ id, symbol, side, qty, orderType, scheduledAt, recurrence, goalTarget, floorPrice, status, history[] }]
ga_price_alerts: [{ id, symbol, condition, threshold, active, muted, createdAt, triggeredAt[] }]
ga_risk_limits: { floors: { [symbol]: price }, drawdownLimit: %, dailyLossLimit: $, peakValue: $ }
```

### Mobile Responsiveness
- Schedule panel: single-column form, calendar inline
- Price alerts: stacked card layout
- Risk limits: vertical sections
- Alert bell badge visible in mobile top bar

### Files Summary

**New files (6):**
- `src/components/trading/SchedulePanel.tsx`
- `src/components/trading/PriceAlerts.tsx`
- `src/components/trading/RiskLimits.tsx`
- `src/hooks/useScheduledOrders.ts`
- `src/hooks/usePriceAlerts.ts`
- `src/lib/notificationSound.ts`

**Modified files (2):**
- `src/pages/TradingBridge.tsx` -- Add SCHEDULE + ALERTS tabs, alert bell badge, integrate risk monitor
- `src/components/trading/RuleBuilder.tsx` -- Add schedule action type, expand broker list

