
# Fix All Broken Indicators on Gold Arrow LIVE Chart

## Problem Summary

Most indicators are broken or invisible on the chart:
- **Envelopes** use a 10% deviation, creating bands so far from the price that the chart zooms out and the price line looks flat
- **All oscillators** (MACD, RSI, Stoch RSI, Williams %R, ADX, CCI, Momentum, OBV, MFI, Awesome Oscillator, StdDev, DeMarker, Force Index, Bulls/Bears Power, OsMA) render on the same Y-axis as price -- a value of 50 (RSI) is invisible next to $2,350 (gold)
- **Fibonacci** levels work but can distort the Y-axis scaling

## Solution: Oscillator Sub-Panel + Fix Envelopes

Professional charting platforms (TradingView, MetaTrader 5) solve this by rendering oscillators in a **separate panel below the main price chart**, with its own Y-axis. We will implement the same architecture.

### Changes Overview

**1. Fix Envelopes deviation** (`IndicatorOverlay.tsx`)
- Change default deviation from `0.1` (10%) to `0.002` (0.2%) so the bands hug the price line properly

**2. Split indicator rendering into overlay vs oscillator** (`IndicatorOverlay.tsx`)
- Add a new `getOscillatorLines()` function that returns JSX for oscillator-only indicators
- Modify `getIndicatorLines()` to only return overlay indicators (SMA, EMA, Bollinger, Ichimoku, SAR, Alligator, Envelopes)
- Add a `getOscillatorYDomain()` helper to calculate proper min/max for the oscillator panel
- Export a new `OscillatorPanel` component: a small `ResponsiveContainer` + `ComposedChart` with its own Y-axis, rendered below the main chart

**3. Add oscillator sub-panel to GALiveStandalone** (`GALiveStandalone.tsx`)
- Below the main chart area, conditionally render the `OscillatorPanel` when any oscillator indicator is active
- Main chart keeps 70% height, oscillator panel gets 30% height (auto-adjusts when no oscillators are active)

**4. Add oscillator sub-panel to GALiveChart** (`GALiveChart.tsx`)
- Same pattern: split the chart area to show the oscillator sub-panel below the main chart when oscillators are active

**5. Fix Fibonacci Y-axis domain** (`GALiveStandalone.tsx` + `GALiveChart.tsx`)
- When Fibonacci is active, expand the Y-axis domain to include all fib levels so they're always visible

### Technical Details

**Oscillator panel will display:**
- RSI / Stoch RSI: Y-axis 0-100
- MACD / OsMA: auto-scaled
- Williams %R: Y-axis -100 to 0
- CCI: auto-scaled (typically -300 to +300)
- ADX: Y-axis 0-100
- Momentum / Force Index / Bulls / Bears Power: auto-scaled
- MFI: Y-axis 0-100
- DeMarker: Y-axis 0-1
- StdDev / OBV / Awesome Oscillator: auto-scaled

**Oscillator panel features:**
- Shared X-axis aligned with the main chart
- Reference lines at key levels (RSI 30/70, Williams -20/-80, CCI +/-100)
- Labels showing which oscillator is displayed
- Same dark theme styling as the main chart

**Files modified:**
1. `src/components/trading/IndicatorOverlay.tsx` -- Fix envelopes, add OscillatorPanel component, split overlay vs oscillator line generators
2. `src/components/ga-widgets/GALiveStandalone.tsx` -- Integrate OscillatorPanel, fix Y-axis for Fibonacci
3. `src/components/trading/GALiveChart.tsx` -- Same integration as GALiveStandalone
