

## Live WTI-Brent Spread Tracker

### Overview
Add a dedicated widget that fetches 30 days of historical WTI and Brent spot prices from the EIA API, computes the daily spread (WTI minus Brent), and displays it as an interactive area chart with real-time updates.

### What You'll See
- A new "WTI-BRENT SPREAD" widget placed between Futures Curve and Crack Spreads on the Oil and Gas page
- An area chart showing 30 days of daily spread values (typically negative, since Brent trades at a premium)
- Summary stats: current spread, 30-day high/low, average, and trend direction
- Auto-refreshes every 30 seconds alongside existing price data
- A nav button in the section bar to jump to it

### Technical Details

**1. Update Edge Function** (`supabase/functions/fetch-commodity-prices/index.ts`)
- Add a new route/parameter `?history=30` that fetches the last 30 daily data points for both WTI (`EPCWTI`) and Brent (`EPCBRENT`) from EIA's `petroleum/pri/spt/data` endpoint using `length=35` (buffer for weekends/holidays)
- Return an array of `{ date, wti, brent, spread }` objects
- Keep the existing default behavior unchanged for the ticker/price cards

**2. Add Hook** (`src/hooks/useOilGasData.ts`)
- Add a new `useWtiBrentSpreadHistory` hook that calls the edge function with `?history=30`
- 30-second refetch interval matching existing price polling
- Fallback: generate 30 days of synthetic spread data from the existing fallback WTI/Brent prices if the live call fails

**3. Create Widget** (`src/components/og-widgets/OGWtiBrentSpread.tsx`)
- Uses `WidgetShell` with `ArrowLeftRight` icon and "LIVE" badge
- Stats row: Current Spread, 30D High, 30D Low, 30D Avg (all with `AnimatedNumber`)
- Interactive area chart (Recharts `AreaChart`) with gradient fill, color-coded: blue when spread is near average, red when widening significantly
- Tooltip showing date, WTI price, Brent price, and computed spread
- Range selector: 7D / 14D / 30D to zoom the chart
- Hover crosshair with snap-to-nearest data point

**4. Integrate into Page** (`src/pages/OilGasIntelligence.tsx`)
- Import `OGWtiBrentSpread`
- Add `{ id: 'wti-brent', label: 'WTI-BRENT', icon: GitCompareArrows }` to the sections nav array
- Place the widget between Futures Curve and Spreads sections with a `SectionDivider` labeled "WTI-BRENT SPREAD TRACKER"

### File Changes
| File | Action |
|------|--------|
| `supabase/functions/fetch-commodity-prices/index.ts` | Edit -- add historical spread endpoint |
| `src/hooks/useOilGasData.ts` | Edit -- add `useWtiBrentSpreadHistory` hook |
| `src/components/og-widgets/OGWtiBrentSpread.tsx` | Create -- new spread tracker widget |
| `src/pages/OilGasIntelligence.tsx` | Edit -- import and place widget + nav entry |

