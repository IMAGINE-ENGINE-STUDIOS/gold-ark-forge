

# Add TradingView Partner Program Affiliate Link

Update all three TradingView widget components to include your affiliate ID (`aff_id=162505`) so that TradingView attribution links route through your partner program.

## Changes

TradingView widgets support an `affiliate_id` parameter in their configuration. This will be added to each widget's JSON config object.

### Files to Update

1. **`src/components/tradingview/TradingViewChart.tsx`** -- Add `"affiliate_id": "162505"` to the widget config JSON
2. **`src/components/tradingview/TradingViewTicker.tsx`** -- Add `"affiliate_id": "162505"` to the widget config JSON
3. **`src/components/tradingview/SymbolOverview.tsx`** -- Add `"affiliate_id": "162505"` to the widget config JSON

No other files need changes. This is a one-line addition per widget component.

