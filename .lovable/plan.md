

# Phase 3: Add 6 New Indicators to IndicatorOverlay.tsx

## What Changes

6 new professional-grade indicators added to `IndicatorOverlay.tsx`, following the exact same patterns already established in the file:

| Indicator | Type | Data Keys | Reference Lines |
|-----------|------|-----------|-----------------|
| VWAP | Overlay | `vwap` | None (single line on price axis) |
| Pivot Points | Overlay | `pivotP`, `pivotR1`, `pivotR2`, `pivotR3`, `pivotS1`, `pivotS2`, `pivotS3` | None (7 horizontal lines) |
| Donchian Channels | Overlay | `donchianUpper`, `donchianMiddle`, `donchianLower` | None (3 lines like Bollinger) |
| Keltner Channels | Overlay | `keltnerUpper`, `keltnerMiddle`, `keltnerLower` | None (3 lines like Envelopes) |
| CMF | Oscillator | `cmf` | y=0 zero line |
| A/D Line | Oscillator | `adLine` | None (cumulative line) |

## Technical Details -- Single File: `src/components/trading/IndicatorOverlay.tsx`

### 1. Add 6 computation functions (after line ~309, before the indicator definitions)

**`computeVWAP`** -- Volume Weighted Average Price
- Takes closes and volumes (simulated if unavailable)
- Cumulative (typicalPrice * volume) / cumulative(volume)
- Resets concept: since we don't have session boundaries, runs cumulatively over the data window

**`computePivotPoints`** -- Standard Pivot Points
- Takes the previous bar's high, low, close to compute:
  - Pivot (P) = (H + L + C) / 3
  - R1 = 2P - L, S1 = 2P - H
  - R2 = P + (H - L), S2 = P - (H - L)
  - R3 = H + 2(P - L), S3 = L - 2(H - P)
- Draws 7 horizontal reference lines across the chart

**`computeDonchian`** -- Donchian Channels (period=20)
- Upper = highest high over N periods
- Lower = lowest low over N periods
- Middle = (Upper + Lower) / 2

**`computeKeltner`** -- Keltner Channels (EMA=20, ATR multiplier=1.5)
- Middle = EMA(close, 20)
- Upper = Middle + 1.5 * ATR(10)
- Lower = Middle - 1.5 * ATR(10)

**`computeCMF`** -- Chaikin Money Flow (period=20)
- Money Flow Multiplier = ((C - L) - (H - C)) / (H - L)
- Money Flow Volume = MFM * Volume
- CMF = Sum(MFV, N) / Sum(Vol, N)
- Range: roughly -1 to +1

**`computeADLine`** -- Accumulation/Distribution Line
- A/D = prev A/D + ((C - L) - (H - C)) / (H - L) * Volume
- Cumulative, no period parameter

### 2. Expand the `IndicatorKey` type (line 313-317)

Add 6 new keys:
```
'vwap' | 'pivotPoints' | 'donchian' | 'keltner' | 'cmf' | 'adLine'
```

### 3. Add to `INDICATORS` array (line 326-354)

4 new overlays (after `envelopes`, before `fibonacci`):
- `{ key: 'vwap', label: 'VWAP', color: 'hsl(45,85%,55%)', category: 'overlay' }`
- `{ key: 'pivotPoints', label: 'Pivots', color: 'hsl(200,70%,60%)', category: 'overlay' }`
- `{ key: 'donchian', label: 'Donchian', color: 'hsl(160,65%,50%)', category: 'overlay' }`
- `{ key: 'keltner', label: 'Keltner', color: 'hsl(320,60%,55%)', category: 'overlay' }`

2 new oscillators (after `osma`):
- `{ key: 'cmf', label: 'CMF', color: 'hsl(180,70%,45%)', category: 'oscillator' }`
- `{ key: 'adLine', label: 'A/D Line', color: 'hsl(90,55%,50%)', category: 'oscillator' }`

### 4. Add enrichment blocks in `enrichChartData` (after line 531, before oscillator section)

6 new `if (activeIndicators.has(...))` blocks following the exact pattern of the existing ones -- compute the values, iterate, assign to `enriched[i].dataKey`.

### 5. Add overlay lines in `getIndicatorLines` (after line 641)

- VWAP: single solid line
- Pivot Points: 7 reference lines (P, R1-R3, S1-S3) with labels, dashed
- Donchian: 3 lines (upper, middle dashed, lower)
- Keltner: 3 lines (upper, middle, lower)

### 6. Add oscillator configs in `OSCILLATOR_CONFIGS` (after line 670)

- CMF: domain [-1, 1], zero reference line
- A/D Line: auto domain, no reference lines

### 7. Add to `OSCILLATOR_KEYS` array (line 607)

Append `'cmf'` and `'adLine'`.

### No Other Files Changed

All 6 indicators are self-contained within `IndicatorOverlay.tsx`. They automatically appear in the indicator toggle bar (visible or in the MORE dropdown) and work with both the price chart overlays and the oscillator sub-panel.

