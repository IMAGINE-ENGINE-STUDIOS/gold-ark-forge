

# Gold Arrow Trading Bridge: MT5/MT6 Competitive Feature Roadmap

## Current State Assessment

The Trading Bridge already has a strong foundation:
- 25+ technical indicators (SMA, EMA, Bollinger, MACD, RSI, Stoch RSI, Ichimoku, Parabolic SAR, ADX, CCI, OBV, MFI, Alligator, Envelopes, etc.)
- 4 chart modes (Candlestick, Line, Area, OHLC) across 6 timeframes
- Drawing tools (H-Line, Trendline, Fibonacci, Measure)
- Paper + Live multi-broker trading with order confirmation
- Depth of Market, Backtesting, Rule Builder, DCA Bot, Grid Trading
- Risk management, Analytics, Social trading, Price Alerts
- 200+ symbols with real-time WebSocket streaming

## Missing Features (Grouped by Priority)

### PHASE 1: Core Trading Parity (High Impact)

**1. One-Click Trading Widget** `GAOneClickTrading`
MT5's signature feature. A compact floating bar showing BUY/SELL buttons with live bid/ask prices and a quantity field. One tap executes immediately without confirmation dialog. Toggled on/off via a button in the chart header.

**2. Trailing Stop Orders** `TrailingStopConfig`
Add trailing stop as a 5th order type alongside market/limit/stop/stop-limit. User sets a trail distance in $ or %. The stop price follows the market automatically. Display trailing stops as dashed lines on the chart.

**3. OCO Orders (One-Cancels-Other)** `OCOOrderForm`
Bracket orders: place a profit target + stop loss together. When one fills, the other cancels. Essential for professional risk management. Add as a toggle inside the existing order form.

**4. Partial Position Close** + **Modify Open Orders**
Add "Close 25%/50%/75%" buttons on each position row. Add inline SL/TP editing directly on position cards. Currently positions only have a "CLOSE" button with no partial or modification options.

**5. Trade Journal** `GATradeJournal`
Log every trade with automatic P&L capture, plus user-added notes, tags (e.g., "breakout", "scalp", "news event"), screenshots, and emotion tracking. Show win/loss streaks, best/worst trades, and pattern analysis. This is the #1 feature MT5 lacks that serious traders want.

**6. Time & Sales (Tape Reader)** `GATimeSales`
Real-time transaction feed showing individual trades as they happen: price, size, aggressor side (buy/sell), time. Color-coded rows (green for buys at ask, red for sells at bid). Essential for reading order flow.

### PHASE 2: Advanced Charting (Visual Edge)

**7. Multi-Chart Layout** `MultiChartGrid`
Split the chart area into 2x1, 2x2, 3x1, or 1x3 grids, each showing a different symbol or timeframe. MT5's multi-window approach. Crosshair sync across charts optional.

**8. Additional Timeframes**
Add: 1M (1 minute), 5M, 15M, 30M, 2H, 3H, 6H, 8H. Currently only RT/1H/4H/1D/1W/1M. Professional traders need the full spectrum, especially 5M and 15M for day trading.

**9. Heikin-Ashi & Renko Chart Types** `HeikinAshiRenderer`, `RenkoRenderer`
Heikin-Ashi smooths noise for trend identification. Renko ignores time, showing only price movement. Add as additional chart mode options alongside Candlestick/Line/Area/OHLC.

**10. Log Scale Toggle**
Add a button to switch the Y-axis between linear and logarithmic scale. Critical for long-term crypto/stock analysis where price has moved 10x+.

**11. Chart Snapshot Export**
One-click export chart as PNG with watermark "Gold Arrow LIVE". Share-ready for social trading integration.

**12. Chart Templates (Save/Load Indicator Presets)**
Save current indicator + drawing configuration as a named template. Load templates with one click. E.g., "Scalping Setup" = RSI + Bollinger + 5M timeframe.

### PHASE 3: Missing Indicators (6 new)

**13. VWAP** (Volume Weighted Average Price) - overlay
The most requested institutional indicator. Shows the average price weighted by volume. Day traders live and die by VWAP.

**14. Pivot Points** (Standard, Fibonacci, Camarilla) - overlay
Auto-calculated support/resistance levels based on previous session's high/low/close. Shows S1/S2/S3 and R1/R2/R3.

**15. Donchian Channels** - overlay
Upper = highest high over N periods, Lower = lowest low. Used for breakout strategies (Turtle Trading).

**16. Keltner Channels** - overlay
EMA-based bands using ATR for width. Cleaner than Bollinger for trend-following.

**17. Chaikin Money Flow (CMF)** - oscillator
Measures accumulation/distribution pressure. Confirms trend strength with volume.

**18. Accumulation/Distribution Line** - oscillator
Cumulative volume-based indicator showing whether money is flowing into or out of an asset.

### PHASE 4: Professional Analytics

**19. Performance Dashboard** `GAPerformanceDashboard`
Comprehensive trade analytics beyond the current basic panel:
- Daily/Weekly/Monthly P&L breakdown with calendar heatmap
- Drawdown chart (underwater plot)
- Sharpe, Sortino, Calmar ratios
- Win rate by asset class, by day of week, by hour
- Average winner vs average loser size
- Expectancy calculation
- Longest winning/losing streak

**20. Margin Calculator** `GAMarginCalc`
Input symbol + lot size, see required margin, pip value, swap rates, and max position size for your account. Essential for leveraged trading.

**21. Trading Sessions Clock** `GATradingSessions`
Visual world clock showing which markets are open now: Tokyo, London, New York, Sydney. Shows overlap periods (highest liquidity). Color-coded timeline.

**22. Pip/Profit Calculator** `GAPipCalculator`
Enter entry price, exit price, lot size -- see pip count, dollar P&L, and percentage return. Quick mental math replacement.

### PHASE 5: Advanced Automation

**23. Strategy Optimizer (Walk-Forward Testing)** `GAStrategyOptimizer`
Extend the existing BacktestPanel: run the same strategy across multiple parameter combinations (e.g., SMA period 10-50 step 5). Show optimization surface as a heatmap. Walk-forward validation to prevent overfitting.

**24. Monte Carlo Simulation** `GAMonteCarloSim`
Take a set of historical trades, randomly reshuffle the order 1000x, plot the distribution of outcomes. Shows probability of drawdown and expected return range. Institutional-grade risk assessment.

**25. Custom Indicator Builder (Visual)** `GAIndicatorBuilder`
Drag-and-drop blocks: "EMA(close, 20) crosses above SMA(close, 50)" to create custom signals. No coding required. Save as custom indicators that appear in the indicator bar.

### PHASE 6: UX Polish

**26. Keyboard Shortcuts Panel** `KeyboardShortcuts`
B = Buy, S = Sell, Esc = Cancel, Tab = Switch tabs, +/- = Zoom chart, Space = Pan mode. Show a discoverable shortcuts overlay (press "?").

**27. Workspace Layouts (Save/Restore)**
Save the entire panel configuration (which tabs are open, sidebar width, chart timeframe, indicators) as a named workspace. Quick-switch between "Scalping", "Swing", "Analysis" layouts.

**28. Session Highlights on Chart**
Overlay vertical bands showing Tokyo/London/New York session boundaries on intraday charts. Shows where each session opens/closes with labeled zones.

---

## Implementation Details

### File Structure

All new widgets go into `src/components/trading/` or `src/components/ga-widgets/`:

```text
src/components/trading/
  OneClickTrading.tsx          (Phase 1)
  TrailingStopConfig.tsx       (Phase 1)
  OCOOrderForm.tsx             (Phase 1)
  MultiChartGrid.tsx           (Phase 2)

src/components/ga-widgets/
  GATradeJournal.tsx           (Phase 1)
  GATimeSales.tsx              (Phase 1)
  GAPerformanceDashboard.tsx   (Phase 4)
  GAMarginCalc.tsx             (Phase 4)
  GATradingSessions.tsx        (Phase 4)
  GAPipCalculator.tsx          (Phase 4)
  GAMonteCarloSim.tsx          (Phase 5)
  GAStrategyOptimizer.tsx      (Phase 5)
  GAIndicatorBuilder.tsx       (Phase 5)
```

### Trading Bridge Integration

Each feature slots into the existing tab structure:

| Feature | Tab Location |
|---------|-------------|
| One-Click Trading | Floating overlay on chart |
| Trailing Stop, OCO, Partial Close | TRADE tab (order form) |
| Trade Journal | New JOURNAL sub-section in BOOK tab |
| Time & Sales | TRADE tab (collapsible section) |
| Multi-Chart | Chart area (layout selector in chart header) |
| Heikin-Ashi, Renko, Log Scale | Chart header mode selector |
| Chart Templates | Chart header (save/load buttons) |
| Performance Dashboard | ANALYTICS tab (replace/extend current) |
| Margin/Pip Calculators | RISK tab (new collapsible sections) |
| Trading Sessions Clock | MARKET tab |
| Strategy Optimizer, Monte Carlo | BACKTEST tab (extend) |
| Indicator Builder | STRATEGIES tab |
| Keyboard Shortcuts | Global overlay (press "?") |

### Intelligence Page Copies

Every new `GA*` widget also gets imported into `src/pages/Intelligence.tsx` as a standalone showroom item, following the existing pattern of adding widgets to the appropriate category section.

### Indicator Additions (IndicatorOverlay.tsx)

Add 6 new computation functions and indicator definitions to the existing file:
- `computeVWAP()` -- needs volume data, will use simulated volume for non-crypto
- `computePivotPoints()` -- standard, fibonacci, camarilla variants
- `computeDonchian()` -- simple high/low channel
- `computeKeltner()` -- EMA + ATR bands
- `computeCMF()` -- uses volume + close position in range
- `computeADLine()` -- cumulative A/D calculation

### Chart Enhancements (GALiveChart.tsx)

- Add 8 new timeframes to `timeframes` array and `tfConfigs`
- Add Heikin-Ashi and Renko renderers to CandlestickRenderer.tsx
- Add log scale Y-axis toggle
- Add chart screenshot export (html2canvas or native canvas)
- Add multi-chart grid wrapper component

### No New Dependencies Required

All features can be built with existing packages:
- Recharts for all charts/visualizations
- Radix UI for dialogs/collapsibles
- Lucide for icons
- React state for local logic
- Existing Supabase integration for persistence (journal entries, templates, workspaces)

### Database Tables Needed

- `trade_journal_entries` -- for trade notes, tags, screenshots
- `chart_templates` -- saved indicator/drawing configurations
- `workspace_layouts` -- saved panel arrangements
- `custom_indicators` -- user-built indicator definitions

All with RLS policies scoped to `auth.uid() = user_id`.

---

## Summary: 28 Features Across 6 Phases

This roadmap closes every gap with MT5 and surpasses MT6 with features like Trade Journal with emotion tracking, Monte Carlo simulation, Visual Indicator Builder, and Social Trading (already started). The implementation reuses existing architecture patterns and requires no new external dependencies.

