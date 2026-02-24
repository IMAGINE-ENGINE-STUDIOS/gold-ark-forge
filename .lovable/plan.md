

# Swap Terminal: Advanced Analytics + Beginner & Pro Feature Gaps

## 1. Add Sharpe Ratio & Max Drawdown to Analytics KPI Row

Currently the Analytics KPI row shows 6 metrics: Equity, Cash, Positions, Total Trades, Win Rate, and Unrealized P&L. We will add two new computed KPIs:

- **Sharpe Ratio** -- computed from the equity curve data points (daily returns standard deviation vs. mean, annualized). For paper mode this replays the order ledger; for live mode it shows "--" until enough data exists.
- **Max Drawdown** -- tracks the largest peak-to-trough decline across the equity curve history. Displayed as a negative percentage in red.

The KPI grid expands from `grid-cols-6` to `grid-cols-4 lg:grid-cols-8` to accommodate both new cards cleanly on all screen sizes.

---

## 2. Five Missing Features for Beginners

After auditing the full Swap terminal, these are the gaps that would trip up anyone new to trading:

| # | Feature | What It Solves |
|---|---------|---------------|
| B1 | **Glossary Tooltips** | Hover any KPI label (Sharpe, Drawdown, P&L, Win Rate, etc.) to see a plain-English explanation. Beginners don't know what "Sortino" means. |
| B2 | **Trade Recap Card** | After every paper trade fills, show a summary card: "You bought 5 shares of XAU at $2,340. Your cost was $11,700. Here's what to watch." Currently there's zero post-trade feedback. |
| B3 | **Risk Thermometer** | A simple visual gauge (green/yellow/red) in the TRADE tab showing "Your portfolio risk level" based on concentration and position size vs. account. Beginners over-concentrate. |
| B4 | **Guided First Trade** | A one-time onboarding overlay on the Swap page: "1. Pick an asset, 2. Set quantity, 3. Click BUY." Currently the UI is dense with no guidance for first-time users. |
| B5 | **P&L Explainer Row** | Below each position in the BOOK tab, show a single line: "You're up $12.50 because XAU rose from $2,340 to $2,342.50 (x5 shares)." Beginners can't mentally connect price movement to dollar P&L. |

---

## 3. Five Missing Features for Pros

| # | Feature | What It Solves |
|---|---------|---------------|
| P1 | **Sortino Ratio + Calmar Ratio** | Add alongside Sharpe in the KPI row. Pros need downside-only risk metrics, not just symmetric volatility. |
| P2 | **Drawdown Chart** | A dedicated underwater equity chart below the equity curve showing drawdown depth over time. Pros monitor recovery speed. |
| P3 | **Trade Log Export (CSV)** | A download button on the Analytics tab that exports all orders, positions, and P&L to CSV. Pros need this for tax reporting and external analysis. |
| P4 | **Correlation-Aware Position Sizer** | The Risk tab's Position Sizer ignores portfolio correlation. It should warn when adding a position highly correlated to existing holdings. |
| P5 | **Session Performance Breakdown** | Split P&L by trading session (Asia/London/NY) in Analytics. Pros optimize around session-specific volatility patterns. |

---

## 4. Implementation Plan

### Step 1: Sharpe Ratio & Max Drawdown KPIs (AnalyticsPanel)
- Compute from `pnlCurve` data array: calculate sequential returns, derive mean, std dev, max peak-to-trough
- Add two new KPI cards to the grid
- Expand grid from `lg:grid-cols-6` to `lg:grid-cols-8`

### Step 2: Sortino + Calmar Ratios (Pro)
- Compute alongside Sharpe using only negative returns for downside deviation
- Calmar = annualized return / max drawdown
- Add as additional KPI cards

### Step 3: Drawdown Chart (Pro)
- New chart section below equity curve showing underwater drawdown as a red-filled area
- Computed from the same equity curve data

### Step 4: Glossary Tooltips (Beginner)
- Wrap each KPI label in a Tooltip component with beginner-friendly explanations
- Use existing Radix tooltip from the UI library

### Step 5: Trade Recap Card (Beginner)
- After `paper.submitOrder` succeeds, show a toast-style recap card with entry price, total cost, and asset context
- Integrated into the existing toast system

### Step 6: Risk Thermometer (Beginner)
- Simple gauge component in TRADE tab sidebar
- Calculates concentration (largest position / equity) and colors accordingly

### Step 7: P&L Explainer Row (Beginner)
- Add a subtitle line under each BOOK position showing the math breakdown

### Step 8: Guided First Trade Overlay (Beginner)
- Conditional overlay shown once (localStorage flag) with 3-step walkthrough
- Dismissable, never shown again

### Step 9: Trade Log CSV Export (Pro)
- Button in Analytics tab header
- Generates CSV from paper.orders array with all fields

### Step 10: Session Performance Breakdown (Pro)
- Categorize each order by UTC hour into Asia/London/NY sessions
- Show P&L breakdown per session as a small grouped bar chart

---

## Technical Details

### Files to Create
| File | Purpose |
|------|---------|
| `src/components/trading/RiskThermometer.tsx` | Visual risk gauge for beginners |
| `src/components/trading/TradeRecapToast.tsx` | Post-trade summary card |
| `src/components/trading/FirstTradeGuide.tsx` | One-time onboarding overlay |
| `src/components/trading/DrawdownChart.tsx` | Underwater equity chart for pros |
| `src/components/trading/SessionBreakdown.tsx` | Session P&L analysis for pros |

### Files to Modify
| File | Changes |
|------|---------|
| `src/pages/TradingBridge.tsx` | Add Sharpe/Sortino/Calmar/MaxDD KPIs to AnalyticsPanel, glossary tooltips on all KPI labels, P&L explainer in BOOK, CSV export button, integrate new components, first-trade guide |

### No database changes required
### No new dependencies required -- uses existing Recharts, Radix Tooltip, and sonner toast

