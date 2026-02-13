
# Phase 7: TradingView Widgets + Public Verification API

## Part A -- TradingView Market Visualization

Embed free TradingView widgets for real-time market data visualization. No data proxying, no trading buttons -- purely read-only chart visualization.

### New Components

1. **`src/components/tradingview/TradingViewChart.tsx`**
   - Reusable component that renders the TradingView Advanced Chart widget via an iframe/script embed
   - Accepts a `symbol` prop (e.g., `OANDA:XAUUSD`, `OANDA:XAGUSD`, `OANDA:XPTUSD`, `BITSTAMP:BTCUSD`)
   - Dark theme to match the navy palette
   - Responsive height/width

2. **`src/components/tradingview/TradingViewTicker.tsx`**
   - Horizontal ticker tape widget showing live prices for Gold, Silver, Platinum, and BTC
   - Placed at the top of the Marketplace page

3. **`src/components/tradingview/SymbolOverview.tsx`**
   - Mini symbol overview cards for the homepage MetalCards section or a new dashboard section
   - Shows sparkline + price for each metal

### Page Changes

- **`src/pages/Marketplace.tsx`**: Add the TradingView ticker tape above the existing prices bar. Add a collapsible Advanced Chart section below the prices bar (default symbol: XAUUSD, switchable to XAGUSD/XPTUSD/BTCUSD).
- **`src/pages/Index.tsx`**: Add a "Market Overview" section between MetalCards and Features using the SymbolOverview widget.
- **New page: `src/pages/Markets.tsx`**: Dedicated full-page charts view with tabbed Advanced Charts for all four symbols, plus the ticker tape. Add `/markets` route and nav link.

### Nav Update

- **`src/components/Header.tsx`**: Add "Markets" link to the navigation bar between Marketplace and The Vault.

### TradingView Widget Rules (Compliance)
- Free widget embed only (no API keys needed)
- No trading buttons or order execution
- Charts are visualization-only with TradingView attribution
- No data reselling or proxying

---

## Part B -- Public Verification API

A new edge function exposing read-only endpoints for independent certificate verification.

### New Edge Function

**`supabase/functions/public-verify/index.ts`**

Actions (all read-only, using anon client):

| Action | Input | Output |
|--------|-------|--------|
| `verify` | `cert_id` | Certificate data + partner info + status + issued_at |
| `history` | `cert_id` | Full ownership/event history (append-only timeline) |
| `anchor_proof` | `cert_id` or `event_id` | Merkle leaf hash, branch, root, Bitcoin TXID |
| `reserve_snapshot` | (none, or `snapshot_id`) | Latest reserve totals + merkle root + BTC anchor |

All responses include cache headers (`Cache-Control: public, max-age=60`).

### Config Update

**`supabase/config.toml`**: Add `[functions.public-verify]` with `verify_jwt = false`.

### New Frontend Page

**`src/pages/Verify.tsx`**: Simple public verification tool where anyone can paste a certificate ID and see its authenticity, event history, and anchor proof. Accessible at `/verify`.

### Frontend Hook

**`src/hooks/usePublicVerify.ts`**: Hook wrapping calls to the `public-verify` edge function for the Verify page.

### Route + Nav Updates

- **`src/App.tsx`**: Add `/verify` route.
- **`src/components/Header.tsx`**: Add "Verify" link to navigation.

---

## Technical Details

### TradingView Embed Pattern

Each widget component will:
1. Create a `div` with a unique `ref`
2. Inject a `<script>` tag from `s3.tradingview.com/external-embedding/embed-widget-*.js`
3. Clean up the script on unmount
4. Use `useEffect` with the symbol as a dependency to re-render on changes

### Public Verify Edge Function Security
- Uses anon key (read-only, respects RLS)
- No writes, no service role key needed for reads
- Rate limiting via standard edge function limits
- Zero secret exposure

### File Summary

| Action | File |
|--------|------|
| Create | `src/components/tradingview/TradingViewChart.tsx` |
| Create | `src/components/tradingview/TradingViewTicker.tsx` |
| Create | `src/components/tradingview/SymbolOverview.tsx` |
| Create | `src/pages/Markets.tsx` |
| Create | `src/pages/Verify.tsx` |
| Create | `src/hooks/usePublicVerify.ts` |
| Create | `supabase/functions/public-verify/index.ts` |
| Update | `src/pages/Marketplace.tsx` (add ticker + chart) |
| Update | `src/pages/Index.tsx` (add market overview section) |
| Update | `src/components/Header.tsx` (add Markets + Verify nav links) |
| Update | `src/App.tsx` (add /markets and /verify routes) |
| Update | `supabase/config.toml` (add public-verify function) |
