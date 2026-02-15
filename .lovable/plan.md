

# Phase 6: Pro Trading Tools — Filling the MT5 Gap

## Overview
Instead of integrating MetaTrader 5 (which would add licensing costs, infrastructure complexity, and single-broker dependency), this phase adds the 5 missing MT5-equivalent features as native Gold Arrow widgets within the Trading Bridge.

## What This Adds

### 1. Extended Technical Indicators Widget
Add 10+ institutional-grade indicators to the proprietary chart and Technical Gauge:
- **Bollinger Bands** (20-period, 2 std dev)
- **MACD Histogram** (12/26/9)
- **ATR (Average True Range)**
- **Parabolic SAR**
- **Ichimoku Cloud** (Tenkan/Kijun/Senkou)
- **Fibonacci Retracement** (auto-detected swing highs/lows)
- **Volume Profile** (price-at-volume distribution)
- **Stochastic RSI**
- **Williams %R** (already in gauge, add to chart)
- **ADX with +DI/-DI**

These will be toggleable overlays on the existing ProprietaryChart component.

### 2. Backtesting Engine
A new "BACKTEST" tab in the Trading Bridge bottom panel:
- Select any asset from the watchlist
- Choose a strategy template (SMA crossover, RSI mean reversion, Bollinger bounce, custom rule)
- Set date range and initial capital
- Run simulation against historical price data (from CoinGecko sparklines for crypto, generated synthetic for metals/stocks)
- Display results: total return, max drawdown, Sharpe ratio, win rate, equity curve
- Compare multiple strategies side-by-side

### 3. Order Book / Depth of Market (DOM)
A new GA widget showing simulated market depth:
- Bid/ask ladder with volume at each price level
- Visual depth chart (cumulative volume)
- Spread indicator
- Integrates with broker data when available (Alpaca Level 2 for stocks)

### 4. Chart Drawing Tools
Interactive overlay system on ProprietaryChart:
- Horizontal lines (support/resistance)
- Trendlines (click two points)
- Fibonacci retracement (auto or manual)
- Price range measurement tool
- All drawings stored in local state (persist across symbol switches)

### 5. Strategy Scripting (Visual Rule Builder)
Upgrade the existing IF-THEN rule engine from static examples to a functional builder:
- Drag-and-drop condition blocks (Price above/below, RSI crosses, SMA crossover)
- Action blocks (Buy/Sell, Set stop, Alert)
- Broker routing selector
- Save/load strategy templates
- Dry-run mode (paper test against live data without execution)

## Technical Plan

### Files to Create
- `src/components/trading/IndicatorOverlay.tsx` — Bollinger, Ichimoku, MACD overlay calculations and rendering on the chart
- `src/components/trading/BacktestPanel.tsx` — Backtesting engine UI and simulation logic
- `src/components/trading/DepthOfMarket.tsx` — Order book ladder and depth chart widget
- `src/components/trading/ChartDrawingTools.tsx` — SVG-based drawing tool overlay for ProprietaryChart
- `src/components/trading/RuleBuilder.tsx` — Visual strategy builder with condition/action blocks

### Files to Modify
- `src/components/trading/ProprietaryChart.tsx` — Add indicator toggle panel, integrate IndicatorOverlay and ChartDrawingTools as layers
- `src/pages/TradingBridge.tsx` — Add "BACKTEST" tab to bottom panel, integrate DepthOfMarket into the right sidebar, wire RuleBuilder into the Strategies tab
- `src/components/ga-widgets/GATechnicalGauge.tsx` — Extend with Bollinger, MACD, ATR, Ichimoku signal computations

### Data Strategy
- **Crypto indicators**: Computed from CoinGecko 7-day sparkline data (already available via `useCryptoData`)
- **Metals indicators**: Derived from `useMetalPrices` feed with synthetic historical extension
- **Backtesting data**: Use existing sparkline arrays for crypto; generate synthetic OHLC from known price + volatility for metals/energy/stocks
- **Order book**: Simulated from current price with realistic spread modeling; real Level 2 data from Alpaca when connected

### Mobile Responsiveness
- All new panels will follow the existing mobile-first pattern
- Indicator toggles: horizontal scrollable chip bar
- Backtest results: single-column stacked cards
- DOM: simplified vertical ladder (no depth chart on mobile)
- Drawing tools: hidden on mobile (touch conflicts with scroll)
- Rule builder: vertical block stacking with tap-to-configure

## Sequencing
1. Extended indicators (most impactful, enhances existing chart)
2. Backtesting engine (high value, leverages existing data hooks)
3. Depth of Market widget (moderate complexity)
4. Chart drawing tools (SVG overlay engineering)
5. Visual rule builder (most complex, builds on strategies tab)

