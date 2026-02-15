

## Trading Bridge Premium UX Overhaul

### Problem Analysis

From the screenshot and code review, there are several critical issues:

1. **Chart loads at $0**: The Y-axis shows $0-$2,400 with price data crammed at the top. This happens because `generateChartData` receives `basePrice=0` before API data loads, producing a flat line at zero. The live candle engine then inherits these zero-value candles.

2. **Order form lacks total cost**: The paper trading panel only shows "Qty" and price, but doesn't calculate or display the total order value, margin impact, or position sizing assistance.

3. **Overall UX is too basic** compared to professional platforms like TradingView, MetaTrader, Thinkorswim, or cTrader.

---

### Fix 1: Eliminate $0 Chart on Load

**File:** `src/components/trading/ProprietaryChart.tsx`

- Add a loading gate: if `price === 0`, show a "LOADING MARKET DATA..." skeleton instead of rendering an empty chart
- In `historicalData` memo, skip generation when `basePrice` is 0 -- return empty array
- In `useLiveCandleEngine`, don't initialize candles until `historicalData` has non-zero values
- Set YAxis domain to `['dataMin', 'dataMax']` with padding so the chart auto-zooms to the actual price range instead of starting from $0

---

### Fix 2: Enhanced Paper Trading Order Panel

**File:** `src/pages/TradingBridge.tsx` (PaperTradingPanel)

Add professional order ticket features:

- **Estimated Total Cost**: Auto-calculate `qty x price` and display prominently before the submit button
- **Quick-size Buttons**: "25% / 50% / 75% / MAX" buttons that auto-fill quantity based on available cash
- **Position Impact Preview**: Show what the new equity, cash, and position count will be after the trade
- **Percentage of Portfolio**: Show what % of portfolio this trade represents
- **Spread indicator**: Show simulated bid/ask spread
- **Market/Limit/Stop/StopLimit** order types for paper mode too (currently only market and limit)
- **Fees estimate line**: Show estimated commission (even if $0 for paper, shows professional UX)

---

### Fix 3: Professional Trading UX Enhancements

**File:** `src/pages/TradingBridge.tsx` + `src/components/trading/ProprietaryChart.tsx`

#### A. Chart Header Improvements
- Add **Bid/Ask** display next to the price
- Add **Day High/Low** range bar (visual horizontal bar showing where current price sits between day's high and low)
- Add **Volume** indicator in the header
- Add **Spread** display

#### B. Watchlist Enhancements  
- Add **live mini-sparkline** next to each symbol in the watchlist (tiny 40px wide line chart)
- Add **live price + change%** next to each symbol name
- Color the **entire row** based on positive/negative change (subtle green/red tint)
- Themed scrollbar already uses `watchlist-scroll` class -- ensure consistent gold accent colors

#### C. Order Ticket Improvements (both Paper and Live)
- Add **total value calculation** displayed prominently: `10 shares x $2,350.00 = $23,500.00`
- Add **buying power remaining** after order preview
- Add **quick quantity buttons**: 1, 5, 10, 25, 50, 100, MAX
- Add **price ladder**: +/- buttons to increment limit price by tick size
- Add **order confirmation dialog** before submission (with full cost breakdown)

#### D. Bottom Panel Polish
- Book tab: Show **paper positions** when in paper mode (currently only shows broker positions)
- Add paper order history to the Book tab when in paper mode
- Analytics tab: Show paper trading analytics when in paper mode

#### E. Status Bar Enhancement
- Show **current spread** in the status bar
- Show **data source** (WS for crypto, Simulated for others)
- Show **connection latency** indicator

---

### Fix 4: Symbol Logos for All Company Stocks

**File:** `src/components/trading/SymbolLogo.tsx`

Ensure every stock ticker in the `STOCK_DOMAINS` map resolves to a real company logo via Clearbit. Verify the full domain mapping covers all symbols in the watchlist. Add missing mappings for any stocks that don't have entries.

---

### Technical Implementation Details

**Files to modify:**

| File | Changes |
|------|---------|
| `src/components/trading/ProprietaryChart.tsx` | Fix $0 loading, add bid/ask/spread/high-low to header, YAxis domain fix |
| `src/pages/TradingBridge.tsx` | Enhanced PaperTradingPanel with cost calc, quick-size buttons, position impact preview. Watchlist with live prices/sparklines. Bottom panel paper mode integration. |
| `src/components/trading/SymbolLogo.tsx` | Verify and complete stock domain mappings |

**No new dependencies required.** All enhancements use existing Recharts, Tailwind, and Lucide components.

