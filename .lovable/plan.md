
# Gold Arrow · Real-Time Data Supremacy Plan

Goal: match or beat TradingView on real-time coverage using only free, official, or publicly-licensed feeds — no paid vendors, no scraping of licensed data.

---

## 1. The Unified Feed Layer

One hook, one contract, every widget in the app pulls from it.

```text
useMarketFeed(symbol) ──▶ FeedRouter
                           ├─ crypto  ─▶ Binance WS + Coinbase WS + Kraken WS (aggregated)
                           ├─ fx      ─▶ Yahoo 1m + ECB reference (fallback)
                           ├─ metals  ─▶ gold-api WS-poll + LBMA fix
                           ├─ energy  ─▶ EIA + ICE public settlements
                           ├─ stocks  ─▶ Yahoo/Stooq 1m (delayed 15m, official free tier)
                           ├─ macro   ─▶ FRED, ECB SDW, BLS, BEA (event-driven)
                           └─ onchain ─▶ mempool.space WS, Blockstream, Etherscan free
```

Every stream normalizes into one `Tick { symbol, bid, ask, last, ts, source, latencyMs }`.

---

## 2. Coverage Matrix (all free & official)

| Asset class | Primary (real-time) | Fallback | Depth / History |
|---|---|---|---|
| Crypto spot | Binance WS, Coinbase WS, Kraken WS | Bybit, OKX, Bitfinex | Full L2 book, 1s klines, trades |
| Crypto derivs | Binance Futures WS, Deribit WS | OKX Futures | Funding, OI, liquidations |
| FX majors | Yahoo Finance 1m unofficial | ECB SDW daily, Frankfurter | 20y history via Stooq |
| Metals | gold-api.com (XAU/XAG/XPT/XPD) | LBMA AM/PM fix | Stooq EOD |
| Oil & gas | EIA.gov (already wired) | ICE Report Center free CSV | Weekly + daily |
| Ags | USDA NASS + World Bank Pink Sheet | FAO GIEWS | Monthly |
| US equities | Yahoo 1m (15m delay), Stooq EOD | Alpha Vantage 25/day, Finnhub free | SEC EDGAR fundamentals |
| ETFs / indices | Yahoo, Stooq | investing.com RSS | 30y history |
| Rates & bonds | US Treasury XML, FRED, ECB SDW | BoE, RBA | Full curve |
| Futures (EOD) | CME settlement CSV, ICE public | Barchart free-tier RSS | Daily |
| Options chains | CBOE delayed feed (free official) | Yahoo options endpoint | 15m delayed |
| On-chain BTC | mempool.space WS | Blockstream Esplora, Bitnodes | Real-time blocks + mempool |
| On-chain ETH | Etherscan free, ethgas.watch | Blocknative gas | Gas, txs, mempool |
| Macro/econ | FRED, BLS, BEA, ECB, IMF, World Bank | OECD, Eurostat | 800k+ series |
| News | GDELT 2.0 (15m refresh), SEC EDGAR RSS | Reuters/Bloomberg RSS, Fed RSS | Global with tone/sentiment |
| Corporate events | SEC EDGAR 8-K/10-Q live RSS | Nasdaq calendar RSS | Real-time filings |
| Weather (energy trading) | NOAA, OpenWeather free | Meteostat | Real-time |

---

## 3. Speed & Realtime Architecture

**Layer 1 · Direct WebSocket in browser** (zero latency, zero cost)
- Binance, Coinbase, Kraken, mempool.space, Deribit — all allow browser WS.
- Multiplex all crypto pairs over 1 WS per exchange, fan-out via a shared context.

**Layer 2 · Edge-function relay** for feeds that block browsers (CORS, auth)
- Supabase Edge Functions in Deno stream Server-Sent Events to the client.
- One function per source (`stream-yahoo`, `stream-fred`, `stream-eia`, `stream-sec-edgar`).
- Functions cache in `price_feeds` table + broadcast via Supabase Realtime.

**Layer 3 · Realtime fan-out via Postgres**
- `price_feeds` already exists. Add `ALTER PUBLICATION supabase_realtime ADD TABLE price_feeds`.
- Every widget subscribes once; server writes once → all clients get sub-100ms updates.
- Cost: near-zero (Realtime free tier = 2M messages/mo).

**Layer 4 · Aggregation & smart routing**
- Best bid/ask across exchanges (crypto NBBO).
- Latency tracker per source → auto-failover in `<500ms`.
- Freshness heartbeat: if a source is stale >3s, router promotes fallback.

---

## 4. What beats TradingView

| Capability | TradingView Free | Gold Arrow (this plan) |
|---|---|---|
| Crypto L2 depth | delayed | live full book, 3-exchange NBBO |
| Multi-exchange aggregation | ❌ | ✅ built-in |
| Macro data | limited | full FRED/ECB/BLS/BEA |
| On-chain BTC/ETH | ❌ | ✅ real-time |
| Options chains | Pro-only | free CBOE 15m delayed |
| Real-time SEC filings | ❌ | ✅ EDGAR RSS |
| News with sentiment | curated | GDELT global tone scoring |
| Cross-asset correlation live | Pro-only | ✅ built-in via unified feed |
| Custom alerts | limited free | unlimited (our engine) |
| Backtesting | Pro-only | free (paper engine already built) |
| Weather-linked energy trading | ❌ | ✅ NOAA integrated |

Free US equities remain 15m-delayed for everyone (SIP licensing) — TradingView included. Not a real gap.

---

## 5. Implementation Phases

**Phase 1 · Feed foundation (Week 1)**
- `src/lib/feeds/router.ts` — routing + normalization.
- `src/hooks/useMarketFeed.ts` — replace scattered price hooks.
- Edge functions: `stream-yahoo`, `stream-fred`, `stream-sec-edgar`, `stream-cboe`.
- Enable Realtime on `price_feeds`; add sources column.

**Phase 2 · Depth & derivatives (Week 2)**
- Direct browser WS: Binance depth, Coinbase L2, Kraken book.
- Deribit for BTC/ETH options; Binance Futures for funding/OI.
- New table `orderbook_snapshots` (1s snapshots for chart replay).

**Phase 3 · Macro + on-chain (Week 3)**
- FRED event-driven fetcher (releases calendar → auto-refresh).
- mempool.space WS integration (already partially wired).
- Etherscan + gas oracle for ETH.
- NOAA weather overlay for energy.

**Phase 4 · News & filings (Week 4)**
- GDELT 2.0 poller (15m) → `news_events` table.
- SEC EDGAR RSS → `filings` table with symbol tagging.
- Sentiment scoring via Lovable AI (free during promo).

**Phase 5 · Aggregation intelligence (Week 5)**
- Crypto NBBO calculator.
- Cross-source latency dashboard.
- Auto-failover engine with health SLA per source.
- Widget migration: swap every `useMetalPrices`, `useSimulatedStream`, ad-hoc fetch to `useMarketFeed`.

---

## 6. Files to create / touch

**New**
- `src/lib/feeds/router.ts`, `sources/*.ts` (one per source), `types.ts`
- `src/hooks/useMarketFeed.ts`, `useOrderBook.ts`, `useNewsFeed.ts`
- `supabase/functions/stream-yahoo/index.ts`
- `supabase/functions/stream-fred/index.ts`
- `supabase/functions/stream-sec-edgar/index.ts`
- `supabase/functions/stream-cboe-options/index.ts`
- `supabase/functions/stream-gdelt/index.ts`
- `supabase/functions/stream-noaa/index.ts`
- Migration: `orderbook_snapshots`, `news_events`, `filings`, `macro_releases`; add `source`, `latency_ms` to `price_feeds`; enable Realtime.

**Modify**
- All GA widgets currently importing `useMetalPrices`, `useWebSocketPrices`, ad-hoc fetches → route through `useMarketFeed`.
- `TradeCommandDeck`, `GALiveChart`, `EagleView`, `SymbolRanker` → single feed source.

---

## 7. Non-goals

- No paid vendors (Polygon, Databento, Finnhub paid).
- No scraping of licensed TradingView data or feeds requiring SIP licensing.
- No fake data anywhere — sources that fail return empty, never synthetic.
- No changes to existing UI/UX beyond swapping the data source under widgets.

---

## 8. Success criteria

- Every symbol in the app has a live tick ≤1s from at least one official source.
- Failover between sources happens in <500ms with a visible source badge.
- Zero synthetic prices anywhere (grep confirms no `Math.random` in feed paths).
- On-chain, macro, options, and filings data available that TradingView free does not offer.
- Single API (`useMarketFeed`) powers every price shown in every widget.
