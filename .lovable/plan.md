

## Trading Bridge Enhancement Plan

### Problem Summary
Three issues need fixing:
1. **Candlestick/OHLC modes lack the price path line** - switching away from Area mode loses the visible price trajectory
2. **Symbol logos are fake** (emojis and colored letter badges) - need real logos from internet CDNs
3. **11 new MT5 indicators have compute functions but are never rendered** - they're missing from both `enrichChartData` and `getIndicatorLines`

---

### 1. Add Price Line to Candlestick and OHLC Modes

**File:** `src/components/trading/ProprietaryChart.tsx`

In candlestick and OHLC modes, add a thin semi-transparent `Line` component for the close price alongside the candle/bar SVG layer. This gives users the continuous price path that the area chart provides, overlaid on the candle bodies.

- Add a `<Line dataKey="value" stroke={color} strokeWidth={1} strokeOpacity={0.4} dot={false} />` inside both the candlestick and OHLC render blocks
- Keep the existing transparent Area for hover tooltip functionality

---

### 2. Replace Fake Logos With Real CDN Logos

**File:** `src/components/trading/SymbolLogo.tsx`

Replace emojis and colored badges with real logos sourced from public CDNs:

- **Crypto (30 coins):** Already uses CoinGecko CDN -- keep as-is, these are real logos
- **Stocks (40+ tickers):** Use logo.clearbit.com or logo.dev for company logos (e.g., `https://logo.clearbit.com/apple.com`). Build a domain map for each stock ticker (AAPL -> apple.com, MSFT -> microsoft.com, etc.)
- **Forex (15 pairs):** Use flagcdn.com for country flag SVGs (e.g., `https://flagcdn.com/w40/eu.png` for EUR)
- **Energy commodities:** Use sector-specific icons or the ETF company logos where applicable
- **Bonds/ETFs:** Use the ETF provider logos (e.g., iShares/BlackRock, Vanguard)
- **Metals:** Use commodity-specific icons or small gold/silver/platinum bar images from a public source
- **Indices (SPY, QQQ, etc.):** Use the exchange or ETF provider logos

Implementation approach:
- Create a comprehensive `LOGO_URLS` map covering all 200+ symbols
- Primary source: `logo.clearbit.com` for companies, `flagcdn.com` for forex flags, CoinGecko for crypto
- Keep the colored badge as a graceful fallback (onError handler) when a CDN image fails to load

---

### 3. Complete All 11 Missing MT5 Indicators

**File:** `src/components/trading/IndicatorOverlay.tsx`

The compute functions exist but `enrichChartData` and `getIndicatorLines` don't process them. Add full support for:

**Oscillators needing enrichment + rendering:**

| Indicator | Data Key(s) | Rendering |
|-----------|-------------|-----------|
| CCI | `cci` | Dashed line, oscillator scale |
| Momentum | `momentum` | Solid line |
| OBV | `obv` | Solid line (separate scale) |
| MFI | `mfi` | Dashed line, 0-100 scale |
| Awesome Oscillator | `ao` | Solid line |
| Std Dev | `stddev` | Dashed line |
| DeMarker | `demarker` | Dashed line, 0-1 scale |
| Force Index | `force` | Solid line |
| Bulls Power | `bulls` | Solid line, green |
| Bears Power | `bears` | Solid line, red |
| OsMA | `osma` | Solid line |

For each indicator:
1. **`enrichChartData`:** Call the existing compute function and inject values into chart data points
2. **`getIndicatorLines`:** Add corresponding `<Line>` components with proper styling (color, dash pattern, width)

Since these are oscillators operating on different scales (CCI: +/-200, RSI: 0-100, OBV: cumulative volume), they'll be rendered as overlay lines on the price chart using their computed values -- matching how the existing MACD/StochRSI/Williams%R/ADX/ATR indicators work.

---

### Technical Details

**Files modified:**
- `src/components/trading/ProprietaryChart.tsx` -- add price path line in candle/OHLC modes
- `src/components/trading/SymbolLogo.tsx` -- replace emojis/badges with real CDN logos + domain map
- `src/components/trading/IndicatorOverlay.tsx` -- add enrichment and rendering for 11 missing indicators

**No new dependencies required.** All logos come from public CDNs via `<img>` tags. All indicator math already exists in the codebase.

