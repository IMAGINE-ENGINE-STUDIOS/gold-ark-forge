

# Intelligence Dashboard: Free-First Architecture

## Guiding Principle
Use genuinely free, no-API-key data sources for everything they cover. Use your Lovable Cloud backend ONLY for proprietary data that cannot come from anywhere else (your own bullion bars, certificates, anchors, partners, vault holdings).

---

## Data Source Map

### TIER 1 -- Completely Free (no key, no backend needed)

These sources are called directly from the browser -- zero cost, zero backend.

| Data Need | Free Source | Method |
|---|---|---|
| Metal prices (XAU, XAG, XPT) | **TradingView widgets** (already built) | Embed iframe/script -- affiliate ID 162505 |
| Advanced charting with indicators | **TradingView Advanced Chart** widget | Embed |
| Technical analysis gauges | **TradingView Technical Analysis** widget | Embed |
| Crypto prices (BTC, ETH, XRP, TRX, SOL) | **TradingView Crypto Market** widget | Embed |
| Forex cross rates + heatmap | **TradingView Forex** widgets | Embed |
| Stock heatmaps + screeners | **TradingView Heatmap/Screener** widgets | Embed |
| Market news / top stories | **TradingView Top Stories** widget | Embed |
| Economic calendar | **TradingView Economic Calendar** widget | Embed |
| Ticker tapes (all assets) | **TradingView Ticker** widget | Embed |
| Bitcoin block data + mempool | **mempool.space REST API** | `fetch()` from browser -- free, no key |
| Bitcoin TX verification (anchors) | **mempool.space** `/api/tx/{txid}` | `fetch()` -- free |
| XRP Ledger data | **XRPL WebSocket** `wss://xrplcluster.com` | Browser WebSocket -- free, public |
| TRON network data | **TronGrid REST API** `api.trongrid.io` | `fetch()` -- free tier, no key required |
| Ethereum block/gas data | **Public RPC** (e.g. `eth.llamarpc.com`) | `fetch()` JSON-RPC -- free |
| SEC EDGAR filings | **SEC EDGAR REST API** `efts.sec.gov` | `fetch()` -- free, public, rate-limited to 10 req/s with User-Agent |

### TIER 2 -- Lovable Cloud Backend (proprietary data only)

These are YOUR data tables that no external API has. Keep using existing hooks.

| Data Need | Source | Existing Hook |
|---|---|---|
| Spot prices (cached in DB) | `price_feeds` table | `useMetalPrices` |
| Bullion bar inventory | `bullion_bars` table | `useBullionBars` |
| Certificate registry | `certificates` + `certificate_events` | `useCertificates` |
| Reserve snapshots + proof | `reserve_snapshots` | `useReserveProof` |
| Bitcoin anchor status | `anchors` + `anchor_leaves` | `useAnchors` |
| Partner network | `partners` + `partner_sites` | `usePartners` |
| Vault holdings | `vault_holdings` | `useVaultHoldings` |
| Chainlink oracle endpoint | Edge Function `chainlink-oracle-endpoint` | existing |

---

## New Intelligence Page Architecture

The revamped `/intelligence` page will have these sections, each showing which data source powers it:

```text
+------------------------------------------------------------------+
|  LIVE TICKER TAPE  (TradingView Ticker widget -- free)           |
+------------------------------------------------------------------+
|                                                                  |
|  HERO BANNER  (static)                                           |
|  SECTION NAV  (scroll buttons)                                   |
|                                                                  |
+==================== MARKET DATA (all free) ======================+
|                                                                  |
|  [1] SPOT PRICES                                                 |
|      GA custom cards (gold/silver/platinum) -- DB price_feeds    |
|      + TradingView SingleTicker for BTC, ETH, XRP, TRX          |
|                                                                  |
|  [2] ADVANCED CHART                                              |
|      TradingView Advanced Chart widget (XAU, XAG, BTC, ETH)     |
|      Replaces the recharts GAMetalChart                          |
|                                                                  |
|  [3] TECHNICAL ANALYSIS                                          |
|      TradingView Technical Analysis widget (metals + crypto)     |
|      Replaces the custom GATechnicalGauge                        |
|                                                                  |
|  [4] CRYPTO MARKET                                               |
|      TradingView Crypto Market widget (BTC, ETH, XRP, TRX, SOL) |
|      NEW section                                                 |
|                                                                  |
|  [5] MARKET NEWS                                                 |
|      TradingView Top Stories widget (gold + crypto)              |
|      NEW section                                                 |
|                                                                  |
|  [6] ECONOMIC CALENDAR                                           |
|      TradingView Economic Calendar widget                        |
|      NEW section                                                 |
|                                                                  |
|  [7] STOCK HEATMAP                                               |
|      TradingView Heatmap widget                                  |
|      NEW section                                                 |
|                                                                  |
+================ BLOCKCHAIN LIVE (all free) ======================+
|                                                                  |
|  [8] BITCOIN NETWORK                                             |
|      mempool.space API -- latest block, hashrate, fees           |
|      + anchor TX verification via mempool /api/tx/{txid}         |
|      NEW component: GABitcoinNetwork.tsx                         |
|                                                                  |
|  [9] ETHEREUM NETWORK                                            |
|      Public RPC (llamarpc) -- latest block, gas price            |
|      NEW component: GAEthereumNetwork.tsx                        |
|                                                                  |
|  [10] XRP LEDGER                                                 |
|       XRPL WebSocket -- latest ledger close, XRP price, TPS     |
|       NEW component: GAXRPLedger.tsx                             |
|                                                                  |
|  [11] TRON NETWORK                                               |
|       TronGrid API -- latest block, TRX info                    |
|       NEW component: GATronNetwork.tsx                           |
|                                                                  |
|  [12] SEC EDGAR                                                  |
|       SEC EDGAR API -- latest gold/commodity ETF filings         |
|       NEW component: GASECFilings.tsx                            |
|                                                                  |
+=============== PROPRIETARY (Lovable Cloud) ======================+
|                                                                  |
|  [13] RESERVE GAUGE         -- reserve_snapshots (existing)      |
|  [14] METAL PROFILES        -- bullion_bars aggregate (existing) |
|  [15] VAULT INVENTORY       -- bullion_bars table (existing)     |
|  [16] BULLION HEATMAP       -- bullion_bars (existing)           |
|  [17] BULLION SCREENER      -- bullion_bars (existing)           |
|  [18] CERTIFICATE REGISTRY  -- certificates (existing)           |
|  [19] BITCOIN ANCHORS       -- anchors table (existing)          |
|  [20] ACTIVITY FEED         -- certificate_events (existing)     |
|  [21] PARTNER NETWORK       -- partners (existing)               |
|  [22] RESERVE TIMELINE      -- reserve_snapshots (existing)      |
|                                                                  |
+------------------------------------------------------------------+
|  FOOTER                                                          |
+------------------------------------------------------------------+
```

---

## New Components to Create

| Component | Data Source | API Call |
|---|---|---|
| `GABitcoinNetwork.tsx` | mempool.space | `fetch('https://mempool.space/api/v1/fees/recommended')`, `/api/blocks/tip/height`, `/api/v1/mining/hashrate/3d` |
| `GAEthereumNetwork.tsx` | Public RPC | `fetch('https://eth.llamarpc.com', {method:'POST', body: eth_blockNumber + eth_gasPrice})` |
| `GAXRPLedger.tsx` | XRPL public WS | `new WebSocket('wss://xrplcluster.com')` -- subscribe to `ledger` stream |
| `GATronNetwork.tsx` | TronGrid | `fetch('https://api.trongrid.io/wallet/getnowblock')` |
| `GASECFilings.tsx` | SEC EDGAR | `fetch('https://efts.sec.gov/LATEST/search-index?q="gold"&dateRange=custom&startdt=...&forms=10-K,10-Q')` |

## Existing Components -- What Changes

| Component | Change |
|---|---|
| `GAMetalChart` | **Replace** with TradingView Advanced Chart widget (free, better) |
| `GATechnicalGauge` | **Replace** with TradingView Technical Analysis widget (free, real signals) |
| `GAPriceCards` | **Keep** for metals (DB) + **add** TradingView SingleTicker row for crypto |
| `GALiveTicker` | **Replace** with TradingView Ticker Tape widget (free, all assets) |
| All other GA widgets | **Keep as-is** -- they use proprietary DB data |

## Files Changed

1. **Create** `src/components/ga-widgets/GABitcoinNetwork.tsx`
2. **Create** `src/components/ga-widgets/GAEthereumNetwork.tsx`
3. **Create** `src/components/ga-widgets/GAXRPLedger.tsx`
4. **Create** `src/components/ga-widgets/GATronNetwork.tsx`
5. **Create** `src/components/ga-widgets/GASECFilings.tsx`
6. **Edit** `src/pages/Intelligence.tsx` -- restructure into 3 tiers, add TradingView widgets inline, add 5 new blockchain/SEC sections, replace chart/analysis/ticker with free TradingView embeds

## Cost Summary

| Layer | Cost |
|---|---|
| TradingView widgets | Free (with affiliate attribution) |
| mempool.space | Free (public API, no key) |
| XRPL WebSocket | Free (public cluster) |
| TronGrid | Free (no key for basic endpoints) |
| SEC EDGAR | Free (public, 10 req/s) |
| Ethereum public RPC | Free (llamarpc, ~25 req/s) |
| Lovable Cloud (DB reads) | Included in your plan -- only for your own tables |

**Total additional cost: $0**

