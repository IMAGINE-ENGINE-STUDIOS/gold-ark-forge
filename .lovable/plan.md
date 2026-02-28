

# Replace Non-GA Inline Components with Existing GA Widgets in Trading Bridge

## Problem Identified

The Trading Bridge tabs contain several **inline-built, non-GA panels** that duplicate or could be replaced by the proprietary GA widgets already built for the Intelligence and Oil & Gas pages. Here's the mapping:

---

## Tab-by-Tab Audit

### TRADE tab
- **DepthOfMarket** — Custom component using `Math.random()` for bid/ask volumes. No GA equivalent exists (keep but label as SIMULATED).
- **Inline equity/cash/P&L cards** — Custom 3-column grid. Could use **GAPerformanceDashboard** instead.

### BOOK tab
- ✅ Already uses `GALivePriceNotice`, `GATradeJournal` — GOOD.
- **Missing**: No market context widgets. Should add **GATopMovers** and **GACryptoPriceCards** for real-time position context.

### BOT tab
- ✅ Custom BotControlPanel — Appropriate (no GA equivalent). GOOD.

### BACKTEST tab
- **BacktestPanel** — Uses `Math.random()` random walk for price simulation. Non-GA, fake data. Should label as SIMULATED.

### ANALYTICS tab
- ✅ Uses `GAMarketPulse`, `GACrossAssetDashboard`, `GAPerformanceDashboard`, `GATradingSessions`, `GAAssetOverview`, `GAMiniCharts` — GOOD.
- **Inline AnalyticsPanel** — Custom equity curve chart, asset allocation pie, position P&L breakdown, advanced metrics (Sharpe, Sortino, Calmar). These are custom portfolio analytics specific to paper trading data — appropriate to keep inline since they consume paper account state.
- **DrawdownChart** — Custom but uses real paper equity data. Keep.
- **SessionBreakdown** — Custom but uses real paper order data. Keep.
- **Missing**: **GAPortfolioAllocator** (from Intelligence page) not used here — would complement the allocation pie.

### RISK tab
- ✅ Uses `GAVolatilityMatrix`, `GAGoldRatio`, `GAPipCalculator`, `GAMarginCalc`, `GABullionHeatmap` — GOOD.
- **Inline RiskPanel** — Has hardcoded correlation matrix (`[-0.2, 1.0, 0.6...]`) and static exposure limits. Could use **GACommodityRadar** for live cross-asset analysis.
- **Missing**: **GAForexWarRoom** (from Intelligence) — provides strength index relevant to risk assessment.

### MARKET tab
- ✅ Uses `GAMarketHeatmap`, `GACryptoHeatmap`, `GAForexMatrix`, `GAEconomicCalendar`, `GAMarketQuotes`, `GAMarketSummary` — GOOD.
- **Missing**: **GACryptoMarket** (full crypto dashboard), **GACryptoPriceCards** (live price cards with sparklines), **GANewsFeed** (real-time news), **GATopMovers** — all exist on Intelligence but absent here.

### STRATEGIES tab
- **StrategiesPanel** — Entirely custom with "COMING SOON" badge. Placeholder UI with disabled buttons. Not replaceable but should have **GATechnicalGauge** added for strategy context.

### SOCIAL tab
- **SocialPanel** — Entirely mock data (`mockTraders` array with hardcoded names/returns). Not replaceable by GA widgets but should be labeled as COMING SOON (already is).

---

## Implementation Plan

### Step 1: Enhance MARKET tab with missing Intelligence widgets
Add `GACryptoMarket`, `GACryptoPriceCards`, `GANewsFeed`, `GATopMovers` to the MARKET tab (desktop + mobile).

### Step 2: Enhance RISK tab with cross-asset GA widgets
Add `GACommodityRadar` and `GAForexWarRoom` to the RISK tab alongside existing risk widgets.

### Step 3: Enhance ANALYTICS tab with portfolio allocator
Add `GAPortfolioAllocator` to the ANALYTICS tab widget grid.

### Step 4: Enhance BOOK tab with real-time market context widgets
Add `GATopMovers`, `GACryptoPriceCards` below positions for real-time market context.

### Step 5: Enhance STRATEGIES tab with technical context
Add `GATechnicalGauge` for strategy decision support.

### Step 6: Add missing imports
Import `GACryptoMarket`, `GACryptoPriceCards`, `GACommodityRadar`, `GAForexWarRoom`, `GAPortfolioAllocator` into TradingBridge.

## Files to Modify
| File | Changes |
|---|---|
| `src/pages/TradingBridge.tsx` | Add missing GA widget imports; enhance MARKET, RISK, ANALYTICS, BOOK, and STRATEGIES tabs with existing GA widgets |

## No new files needed
## No database changes needed

