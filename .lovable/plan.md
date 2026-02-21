

# Phase 2: New Timeframes + Heikin-Ashi & Renko Chart Types

## What Changes

1. **8 new timeframes** added to GALiveChart: 1M (1 minute), 5M, 15M, 30M, 2H, 3H, 6H, 8H
2. **2 new chart types** added to CandlestickRenderer: Heikin-Ashi and Renko
3. Chart mode selector updated to show 5 modes instead of 3

## Technical Details

### File 1: `src/components/trading/GALiveChart.tsx`

**Timeframes array** (line 37): Expand from 6 to 14 entries:
```
['RT', '1m', '5m', '15m', '30m', '1H', '2H', '3H', '4H', '6H', '8H', '1D', '1W', '1M']
```

**tfConfigs** (lines 48-55): Add 8 new config entries with appropriate point counts, intervals, volatility, and label functions:

| TF | Points | Interval | Volatility | Label |
|----|--------|----------|-----------|-------|
| 1m | 60 | 1 min | 0.00015 | HH:MM:SS |
| 5m | 60 | 5 min | 0.0003 | HH:MM |
| 15m | 48 | 15 min | 0.00035 | HH:MM |
| 30m | 48 | 30 min | 0.0004 | HH:MM |
| 2H | 48 | 2 hr | 0.0006 | HH:MM |
| 3H | 40 | 3 hr | 0.0008 | HH:MM |
| 6H | 28 | 6 hr | 0.0012 | Weekday HH |
| 8H | 21 | 8 hr | 0.0015 | Weekday HH |

**Chart mode selector** (lines 592-608): Add `heikinashi` and `renko` modes with appropriate icons (use existing `BarChart3` for HA and `BarChart2` variant for Renko). Since 5 buttons is tight, group them compactly.

**Chart rendering** (lines 674-702): Add two new branches in the `Customized` rendering section:
- `chartMode === 'heikinashi'` renders `HeikinAshiLayer`
- `chartMode === 'renko'` renders `RenkoLayer`

**Timeframe selector** (lines 631-640): Since 14 timeframes won't fit in a single row, group them with a scrollable horizontal strip or use the same overflow menu pattern already used on mobile. On desktop, show a compact flex-wrap row with smaller buttons. On mobile, keep the dropdown menu but with all 14 options.

**Bottom info bar** (line 719): Update the timeframe label to handle new values.

### File 2: `src/components/trading/CandlestickRenderer.tsx`

**ChartMode type** (line 3): Expand to include new modes:
```typescript
export type ChartMode = 'area' | 'candlestick' | 'ohlc' | 'heikinashi' | 'renko';
```

**HeikinAshiLayer** (new export): Transforms raw OHLC data into Heikin-Ashi candles before rendering. The HA formula:
- HA Close = (Open + High + Low + Close) / 4
- HA Open = (prev HA Open + prev HA Close) / 2
- HA High = max(High, HA Open, HA Close)
- HA Low = min(Low, HA Open, HA Close)

Then renders using the same candlestick visual style (wicks + body) but with the smoothed values.

**RenkoLayer** (new export): Converts OHLC data into Renko bricks. Takes a `brickSize` computed as ATR(14) or a percentage of price. Each brick is a fixed-height rectangle -- green (up) or red (down). No wicks. Bricks only form when price moves by the brick size. Renders as a staircase of equal-height colored rectangles.

### No New Dependencies

All rendering uses existing SVG primitives within Recharts `Customized` components, same pattern as the current CandlestickLayer and OHLCLayer.

