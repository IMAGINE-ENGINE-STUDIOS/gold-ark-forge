

# Chart Header Mobile Fix + Extended Timeframes

## Overview
Two changes: (1) fix the header so it doesn't overflow on narrow screens, and (2) add longer timeframes (3M, 6M, 1Y, YTD, ALL) for all assets.

## Part A: Header Mobile Responsiveness

**Problem**: On mobile (390px), the header row crams: logo + symbol name + LIVE badge + price + change% + drawing tools + chart mode dropdown + timeframe dropdown -- all in one row. This causes overflow/clipping.

**Solution**: Split the header into two compact rows on mobile:
- **Row 1**: Symbol logo + ticker + LIVE badge + price + change% (essential info)
- **Row 2**: Drawing tools + chart mode + timeframe dropdown (tool controls)

On desktop (lg+), keep single row as-is.

### Changes in `GALiveChart.tsx`:

1. Wrap the header in a flex-col on mobile, flex-row on lg+
2. Hide bid/ask and day range on mobile (already hidden via `hidden lg:flex` / `hidden xl:flex`)
3. Move the right-side tools (drawing, mode, timeframe) into a second row on mobile with `flex lg:hidden` / `hidden lg:flex` pattern
4. Ensure all dropdowns have `z-[60]` and solid `bg-navy-dark` backgrounds

## Part B: Extended Timeframes

Add 5 new timeframes to the chart: `3M`, `6M`, `1Y`, `YTD`, `ALL`

### Changes:

1. **Extend the `timeframes` tuple** (line 37): Add `'3M' | '6M' | '1Y' | 'YTD' | 'ALL'`
2. **Add tfConfigs entries** for each:
   - `3M`: 90 points, daily intervals, ~0.5% volatility, date labels
   - `6M`: 120 points, 2-day intervals, ~0.8% volatility
   - `1Y`: 120 points, 3-day intervals, ~1.2% volatility
   - `YTD`: dynamic points based on current date, daily intervals
   - `ALL`: 200 points, weekly intervals, ~2% volatility, year+month labels
3. **Update the timeframe dropdown** (lines 681-687): Add a new "EXTENDED" group section below "DAILY+" containing `3M`, `6M`, `1Y`, `YTD`, `ALL`

---

## Technical Details

### File: `src/components/trading/GALiveChart.tsx`

**Line 37** -- extend timeframes:
```typescript
const timeframes = ['RT','1m','5m','15m','30m','1H','2H','3H','4H','6H','8H','1D','1W','1M','3M','6M','1Y','YTD','ALL'] as const;
```

**Lines 48-63** -- add new tfConfig entries:
```typescript
'3M': { points: 90, intervalMs: 86_400_000, candleMs: 86_400_000, volatility: 0.005, labelFn: (d) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) },
'6M': { points: 120, intervalMs: 2 * 86_400_000, candleMs: 2 * 86_400_000, volatility: 0.008, labelFn: (d) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) },
'1Y': { points: 120, intervalMs: 3 * 86_400_000, candleMs: 3 * 86_400_000, volatility: 0.012, labelFn: (d) => d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }) },
'YTD': { points: Math.ceil((Date.now() - new Date(new Date().getFullYear(),0,1).getTime()) / 86_400_000), intervalMs: 86_400_000, candleMs: 86_400_000, volatility: 0.006, labelFn: (d) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) },
'ALL': { points: 200, intervalMs: 7 * 86_400_000, candleMs: 7 * 86_400_000, volatility: 0.02, labelFn: (d) => d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }) },
```

**Lines 516-692** -- restructure header:
- Wrap in a container that uses `flex-col lg:flex-row`
- First child: symbol info (logo, ticker, price, change)
- Second child: tools row (drawing, mode, timeframe)
- On mobile, second child drops below as a compact row

**Lines 681-688** -- add EXTENDED group to timeframe dropdown:
```
EXTENDED section: 3M, 6M, 1Y, YTD, ALL
```

### Files Changed

| File | Change |
|------|--------|
| `src/components/trading/GALiveChart.tsx` | Add 5 extended timeframes + mobile-responsive 2-row header |

