

## Phase 2: Multi-Broker Trading Expansion

### Overview
Expand the trading infrastructure beyond Alpaca to support **Coinbase** (crypto) and **Interactive Brokers** (commodities/futures), while adding a broker selector UI, multi-connection management, and a dedicated Trading page with a richer layout.

### What Changes

**1. Broker Selector in Connect Dialog**
- Redesign `BrokerConnectDialog` to include a broker picker step (Alpaca, Coinbase, Interactive Brokers)
- Each broker shows its supported asset classes (Stocks/Crypto, Crypto-only, Commodities/Futures)
- API key fields adapt per broker (Coinbase uses API Key + Secret + Passphrase; IBKR uses Client ID + Client Secret)
- Environment toggle remains for Alpaca (paper/live); Coinbase has sandbox/production; IBKR has paper/live

**2. Multi-Connection Support in TradingPanel**
- Add a broker/connection dropdown at the top of `TradingPanel` when multiple connections exist
- Users can switch between connected brokers without disconnecting
- Account summary adapts to show broker-specific fields (e.g., Coinbase shows available balances per coin)

**3. Expand Edge Function (`broker-proxy`)**
- Add Coinbase Pro API support: account, place order, list orders, cancel order, positions
  - Coinbase auth uses HMAC-SHA256 signed requests (timestamp + method + path + body)
- Add Interactive Brokers Client Portal API support: account, orders, positions
  - IBKR uses session-based auth with Client Portal Gateway
- Route requests based on the `broker` field from the connection record
- Each broker handler follows the same action pattern: account, positions, order, orders, cancel

**4. Update Database**
- Alter `broker_connections` to add an optional `api_passphrase` column (needed for Coinbase)
- No other schema changes needed -- existing `broker` and `environment` columns already support multi-broker

**5. Update Hook Layer (`useBrokerTrading`)**
- `useAddBrokerConnection` accepts broker-specific fields (passphrase for Coinbase)
- All query/mutation hooks remain broker-agnostic since the edge function handles routing

**6. Enhanced Markets Page**
- Add more asset tabs: Ethereum, Oil (WTI), S&P 500
- Symbol mapping per broker so the correct ticker is sent (e.g., "BTC-USD" for Coinbase vs "BTC/USD" for Alpaca)
- Show which broker will execute the trade based on the selected asset

**7. Portfolio Overview Widget**
- New `PortfolioSummary` component showing aggregated holdings across all connected brokers
- Pie chart breakdown by asset class
- Total portfolio value with combined P&L

### Technical Details

| File | Action | Details |
|------|--------|---------|
| `supabase/migrations/...` | Create | Add `api_passphrase` column to `broker_connections` |
| `supabase/functions/broker-proxy/index.ts` | Edit | Add Coinbase HMAC auth + IBKR session auth handlers |
| `src/hooks/useBrokerTrading.ts` | Edit | Support passphrase param, keep hooks broker-agnostic |
| `src/components/trading/BrokerConnectDialog.tsx` | Edit | Multi-step: pick broker then enter credentials |
| `src/components/trading/TradingPanel.tsx` | Edit | Connection selector dropdown, broker-aware account display |
| `src/components/trading/OrderForm.tsx` | Edit | Broker-specific symbol format hints |
| `src/components/trading/PortfolioSummary.tsx` | Create | Aggregated cross-broker portfolio view |
| `src/pages/Markets.tsx` | Edit | More asset tabs, broker-asset mapping |

### Implementation Order
1. Database migration (add `api_passphrase`)
2. Edge function expansion (Coinbase + IBKR handlers)
3. Hook updates (passphrase support)
4. BrokerConnectDialog redesign (broker picker)
5. TradingPanel multi-connection selector
6. Markets page expanded tabs
7. PortfolioSummary widget

### Compliance Note
All three brokers are licensed entities. Gold Arrow continues to act purely as a UI relay layer -- no funds, securities, or crypto are custodied. Order instructions flow from the user's browser through the proxy to the broker's API, and the user's own broker account holds all assets.
