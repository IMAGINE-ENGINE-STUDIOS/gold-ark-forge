
# Integrate GA Widgets into GALIVE Trading Bridge

## Current State

The Trading Bridge has a 3-zone desktop layout (Watchlist sidebar | Chart + Trading panel | Bottom tabs) and 4-tab mobile layout. It currently uses only **8 of 45+ available GA widgets**: GALiveChart, GAMultiTicker, GAPriceCards, GAFearGreed, GATechnicalGauge, GANewsFeed, GATopMovers, GAMetalScreener.

Most bottom tabs (Analytics, Risk, Strategies, Social) use inline hardcoded panels instead of the rich proprietary GA widgets.

## Strategy: Context-Aware Widget Panels

Rather than dumping all widgets into one view, we integrate them **where they add the most value** -- inside the existing tab structure. Each bottom tab becomes a curated workspace of relevant GA widgets.

## Implementation Plan

### 1. New ANALYTICS Tab Content (replace inline `AnalyticsPanel`)

Replace the simple hardcoded analytics with real GA widgets:

- **GAMarketPulse** -- Live sentiment + volatility snapshot
- **GACrossAssetDashboard** -- Multi-asset correlation view tied to the active symbol's category
- **GAAssetOverview** -- Normalized performance comparison (metals vs crypto)
- **GAMiniCharts** -- Quick sparkline grid for watchlist symbols

### 2. New RISK Tab Content (enhance inline `RiskPanel`)

Keep the existing Position Sizer and Exposure Limits, then append:

- **GAVolatilityMatrix** -- Real-time volatility comparison across asset classes
- **GAGoldRatio** -- Gold/Silver ratio as a risk barometer
- **GABullionHeatmap** -- Visual heatmap of metal movements

### 3. New MARKET Tab (add to BOTTOM_TABS)

Add a new "MARKET" tab between BACKTEST and ANALYTICS:

- **GAMarketHeatmap** -- Full sector/asset heatmap
- **GACryptoHeatmap** -- Crypto-specific heatmap
- **GAForexMatrix** -- Currency strength grid
- **GAEconomicCalendar** -- Upcoming economic events
- **GAMarketQuotes** -- Live quote table
- **GAMarketSummary** -- Session summary

### 4. Enhance Right Sidebar (Desktop)

Below the Trading Panel and Depth of Market, add a compact widget stack:

- **GATechnicalGauge** -- Already imported but not rendered in desktop right panel; add it
- **GAFearGreed** -- Same situation; add compact version
- **GAPriceCards** -- Quick price reference strip

### 5. Enhance Mobile CHART Tab

Below the chart on mobile, currently shows PriceCards + FearGreed + TopMovers. Add:

- **GAMiniCharts** -- Compact sparkline grid
- **GAMarketPulse** -- Sentiment snapshot

### 6. Enhance Mobile TOOLS Tab

When viewing the ANALYTICS sub-tab on mobile, render the same GA widget stack from desktop (GAMarketPulse, GACrossAssetDashboard, GAMiniCharts).

### 7. Wire Active Symbol Context

Several widgets accept props (e.g., category, symbol). Wire `activeSymbol` into:

- GACrossAssetDashboard -- highlight the active asset class
- GATechnicalGauge -- show technicals for current symbol
- GAGoldRatio -- relevant when metals selected

---

## Technical Details

### Files Modified

1. **`src/pages/TradingBridge.tsx`**
   - Add new imports: `GAMiniCharts, GAGoldRatio, GACrossAssetDashboard, GAMarketPulse, GAVolatilityMatrix, GACryptoHeatmap, GAMarketHeatmap, GAForexMatrix, GAEconomicCalendar, GABullionHeatmap, GAMarketQuotes, GAMarketSummary, GAAssetOverview`
   - Add `'market'` to `BOTTOM_TABS` with icon `Layers` (already imported)
   - Update the `AnalyticsPanel` replacement in `bottomTab === 'analytics'` to render the GA widget grid
   - Update the `RiskPanel` section to append volatility/ratio widgets after existing content
   - Add new `bottomTab === 'market'` case rendering the market widget grid
   - Desktop right panel: append GATechnicalGauge, GAFearGreed, GAPriceCards below PortfolioSummary
   - Mobile chart tab: append GAMiniCharts, GAMarketPulse after existing widgets
   - Mobile tools tab analytics sub-case: render GA widget grid

### Layout Approach

All new widget sections use a responsive grid:
- Desktop bottom panel: `grid grid-cols-1 lg:grid-cols-2 gap-3` for large widgets
- Desktop right sidebar: single column stack with compact spacing
- Mobile: single column, full-width widgets

### No New Dependencies

All widgets already exist in `src/components/ga-widgets/`. No new packages or files needed.

### Performance Consideration

Widgets in non-active tabs won't mount until the tab is selected (conditional rendering already in place via `bottomTab === 'xyz'`), so there is no performance penalty from adding more tabs.
