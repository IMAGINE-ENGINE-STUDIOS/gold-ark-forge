

## Comprehensive Plan: Heatmap Expansion, Intelligence Tool Upgrades, and Order Confirmation Dialog

This plan covers three major workstreams: expanding the GA proprietary heatmap with multi-market tabs, integrating GA/OG widgets into more powerful composite tools on the Intelligence and Oil & Gas pages, and building a professional-grade order confirmation dialog for the Trading Bridge.

---

### Part 1: Multi-Market Heatmap Tabs (GA Heatmap Widget)

**Current state:** The `GACryptoHeatmap` widget only shows crypto sectors. The TradingView heatmap (used on the Showroom page) supports stock markets but is an external embed.

**Goal:** Build a proprietary tabbed heatmap component that covers all major markets using the same Hellenic aesthetic.

**New file:** `src/components/ga-widgets/GAMarketHeatmap.tsx`

A tabbed wrapper that renders different heatmap views:

| Tab | Data Source | Layout |
|-----|-----------|--------|
| CRYPTO | CoinGecko (existing `useCryptoData`) | Treemap by market cap, colored by 24h change |
| STOCKS | `SYNTHETIC_PRICES` from `tradingSymbols.ts` (sector-grouped) | Treemap grouped by sector (Tech, Energy, Finance, Mining) |
| FOREX | `useForexRates` (existing hook) | Grid of currency pair strength tiles |
| ENERGY | `useOilGasPrices` (existing hook) | Horizontal bar tiles for WTI, Brent, NatGas, etc. |
| METALS | `useMetalPrices` (existing hook) | Weighted tiles by current price/volume |
| BONDS | `SYNTHETIC_PRICES` bond entries | Yield-colored grid tiles |

Each tab reuses the existing treemap flex-wrap layout from `GACryptoHeatmap` but with category-specific color schemes and grouping logic. The component uses internal tabs (not Radix Tabs) matching the existing gold/navy button style used throughout other widgets.

**Integration:** Replace the `GACryptoHeatmap` import on the Intelligence page with `GAMarketHeatmap`. The existing `GACryptoHeatmap` component is preserved as-is (the new widget wraps it internally for the CRYPTO tab).

---

### Part 2: Intelligence Page -- Composite Tool Upgrades

**Current state:** The Intelligence page (`/intelligence`) lists 35+ individual widgets in a linear showroom format. Each widget stands alone.

**Goal:** Add new "composite tool" sections that combine multiple existing widgets into interactive, multi-pane analysis workspaces. The existing individual widget sections remain untouched.

**New composite sections to add (after existing content, before the footer):**

#### A. Cross-Asset Correlation Dashboard
**New file:** `src/components/ga-widgets/GACrossAssetDashboard.tsx`
- Side-by-side mini-charts comparing Gold vs BTC, Gold vs S&P, Oil vs Gold
- Uses `useMetalPrices`, `useCryptoData`, `useOilGasPrices` 
- Correlation coefficient display between pairs
- Tabbed pair selection

#### B. Market Pulse Command Center
**New file:** `src/components/ga-widgets/GAMarketPulse.tsx`
- Combines: Fear & Greed gauge + Top Movers + Price Cards into a single dashboard card
- Three-column layout: Sentiment | Movers | Spot Prices
- All data already available from existing hooks
- Acts as a "quick glance" executive summary

#### C. Blockchain Analytics Hub
**New file:** `src/components/ga-widgets/GABlockchainHub.tsx`
- Tabbed view combining BTC, ETH, XRP, TRON network stats in one widget
- Tab per chain, showing key metrics in a compact card grid
- Reuses data from existing `GABitcoinNetwork`, `GAEthereumNetwork`, `GAXRPLedger`, `GATronNetwork` hooks

**Intelligence page changes:** Add a new tier section "COMPOSITE TOOLS" between the existing DeFi/Sentiment section and the Proprietary section. Add the three new widgets with nav links.

---

### Part 3: Oil & Gas Page -- Tool Upgrades

**Current state:** `/oil-gas` has 12 individual energy widgets in a linear showroom.

**Goal:** Add composite tools that combine energy data into richer views.

#### A. Energy Market Dashboard
**New file:** `src/components/og-widgets/OGEnergyDashboard.tsx`
- Three-panel layout: Spot Prices | Inventory Gauge | Futures Curve mini
- Uses existing `useOilGasPrices` hook data
- Quick-glance executive summary for energy traders

#### B. Risk & Spreads Analyzer
**New file:** `src/components/og-widgets/OGRiskAnalyzer.tsx`
- Combines: WTI-Brent spread + Crack spreads + Chokepoint risk levels
- Side-by-side comparison view
- Traffic-light risk indicators (green/yellow/red) for each metric

**Oil & Gas page changes:** Add a new tier section "COMPOSITE ANALYTICS" after the Infrastructure tier. Add the two new widgets with nav links.

---

### Part 4: Order Confirmation Dialog

**Current state:** Both paper and live orders submit immediately on button click with only a toast notification after the fact. No pre-submission review.

**Goal:** Build a comprehensive order confirmation dialog that surpasses what professional platforms offer.

**New file:** `src/components/trading/OrderConfirmationDialog.tsx`

The dialog shows before any order (paper or live) is executed:

**Dialog content sections:**

1. **Order Summary Header**
   - Symbol logo + name + current live price
   - BUY/SELL badge with color coding
   - Order type badge (MARKET / LIMIT / STOP / BRACKET)

2. **Cost Breakdown Table**
   - Quantity x Fill Price = Subtotal
   - Estimated spread cost
   - Commission ($0 for paper, broker fee for live)
   - **Total Order Value** (bold, large)

3. **Position Impact Preview**
   - Current portfolio equity -> New equity after fill
   - Current cash -> Cash remaining
   - Number of positions before -> after
   - Portfolio concentration % for this asset
   - Warning badges: ">25% concentration", ">50% of cash", "Margin required"

4. **Risk Assessment Strip**
   - Max loss at stop (if stop order)
   - Risk/reward ratio (if bracket)
   - Volatility indicator for the asset (High/Medium/Low based on recent price movement)
   - Account drawdown if max loss hit

5. **Execution Details**
   - Mode: PAPER or LIVE (with color badge)
   - Broker name (for live) or "SIMULATED" (for paper)
   - Time in force (GTC/DAY)
   - Estimated fill time

6. **Action Buttons**
   - "CONFIRM [BUY/SELL]" -- large, color-coded (green/red)
   - "MODIFY ORDER" -- returns to order form
   - "CANCEL" -- closes dialog

**Integration into TradingBridge.tsx:**
- In `PaperTradingPanel`, the submit button opens the confirmation dialog instead of executing directly
- The dialog receives all order parameters and the `paper.submitOrder` function
- Same pattern for `OrderForm.tsx` (live trading) -- submit opens dialog, dialog calls `submitOrder.mutateAsync`

---

### Technical Details

**Files to create (6 new files):**

| File | Purpose |
|------|---------|
| `src/components/ga-widgets/GAMarketHeatmap.tsx` | Multi-market tabbed heatmap |
| `src/components/ga-widgets/GACrossAssetDashboard.tsx` | Cross-asset correlation tool |
| `src/components/ga-widgets/GAMarketPulse.tsx` | Market pulse command center |
| `src/components/ga-widgets/GABlockchainHub.tsx` | Multi-chain analytics hub |
| `src/components/og-widgets/OGEnergyDashboard.tsx` | Energy executive dashboard |
| `src/components/og-widgets/OGRiskAnalyzer.tsx` | Spread and risk analyzer |
| `src/components/trading/OrderConfirmationDialog.tsx` | Order confirmation dialog |

**Files to modify (4 files):**

| File | Changes |
|------|---------|
| `src/pages/Intelligence.tsx` | Add composite tools tier, replace heatmap section with `GAMarketHeatmap`, add nav entries |
| `src/pages/OilGasIntelligence.tsx` | Add composite analytics tier, add nav entries |
| `src/pages/TradingBridge.tsx` | Wire confirmation dialog into `PaperTradingPanel` submit flow |
| `src/components/trading/OrderForm.tsx` | Wire confirmation dialog into live order submit flow |

**No new dependencies required.** All components use existing hooks, Recharts, Tailwind, Lucide, and Radix Dialog primitives already in the project.

