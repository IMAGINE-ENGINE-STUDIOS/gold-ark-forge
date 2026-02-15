

## Widget Thesis & Instructions System

### Overview

Build a reusable tab wrapper component that surrounds every widget and tool on the Intelligence page with two tabs: **WIDGET** (the live widget, unchanged) and **THESIS & GUIDE** (a rich description of what the widget does, why it exists, and how to use it). No existing widget code is modified -- this is purely additive wrapping.

---

### Architecture

**1. New file: `src/components/ga-widgets/WidgetDocWrapper.tsx`**

A generic wrapper component that accepts:
- `children` (the widget itself)
- `widgetId` (string key to look up content)

Renders two styled tab buttons at the top: **WIDGET** (default active) and **THESIS & GUIDE**. When WIDGET is selected, the children render normally. When THESIS & GUIDE is selected, the widget is hidden and a rich documentation panel appears in its place.

Tab styling matches the existing Hellenic gold/navy button pattern used in `GACommodityRadar` and other widgets (gold border, tracking, font-display).

The documentation panel layout:
- **Thesis header**: Widget name, one-line purpose, data source badges (e.g. "CoinGecko", "mempool.space", "Internal DB")
- **Thesis body**: 2-3 paragraph institutional description of what the widget measures, why it matters for traders/analysts, and what edge it provides
- **Key Metrics section**: Bullet list of the specific data points the widget displays
- **Instructions section**: Step-by-step numbered guide on how to read and interact with the widget (tabs, filters, hover tooltips, etc.)
- **Data Source & Refresh**: Source API, refresh interval, data freshness indicator

---

**2. New file: `src/components/ga-widgets/widgetDocContent.ts`**

A single content registry (TypeScript object map) keyed by widget ID, containing thesis and instruction content for every widget on the Intelligence page. This keeps all copy in one maintainable file, separate from component logic.

Structure per entry:

```text
{
  name: string,
  purpose: string (one line),
  sources: string[] (e.g. ["CoinGecko", "Free API"]),
  refreshInterval: string (e.g. "30s"),
  thesis: string (2-3 paragraphs),
  metrics: string[] (bullet points),
  instructions: string[] (numbered steps),
  tier: "MARKET DATA" | "BLOCKCHAIN" | "DeFi" | "COMPOSITE" | "PROPRIETARY"
}
```

Complete content for all widgets (35+ entries):

| Widget ID | Name |
|-----------|------|
| `prices` | Spot Price Cards |
| `crypto-prices` | Crypto Price Cards |
| `mini-charts` | Compact Mini Charts |
| `overview` | Multi-Asset Overview |
| `chart` | Advanced Metal Chart |
| `analysis` | Technical Analysis Gauge |
| `market-summary` | Global Market Summary |
| `quotes` | Market Quotes |
| `movers` | Top Movers |
| `news` | Market Intelligence Feed |
| `forex` | Forex Intelligence Matrix |
| `heatmap` | Multi-Market Heatmap |
| `calendar` | Economic Calendar |
| `bitcoin` | Bitcoin Network Monitor |
| `ethereum` | Ethereum Network Monitor |
| `xrp` | XRP Ledger Monitor |
| `tron` | TRON Network Monitor |
| `sec` | SEC EDGAR Filings |
| `whales` | Whale Watch |
| `crypto-market` | Crypto Market Overview |
| `sentiment` | Fear & Greed Index |
| `defi` | DeFi TVL Dashboard |
| `pulse` | Market Pulse Command Center |
| `correlation` | Cross-Asset Correlation |
| `chain-hub` | Blockchain Analytics Hub |
| `commodity-radar` | Commodity Radar |
| `forex-room` | Forex War Room |
| `volatility` | Volatility Matrix |
| `portfolios` | Portfolio Allocator |
| `yields` | DeFi Yield Monitor |
| `ratios` | Metal Ratios (Gold/Silver) |
| `reserves` | Reserve Backing Gauge |
| `timeline` | Reserve History Timeline |
| `profiles` | Metal Profiles |
| `vault` | Vault Inventory Matrix |
| `bullion-heatmap` | Bullion Heatmap |
| `screener` | Bullion Screener |
| `certs` | Certificate Registry Flow |
| `anchors` | Bitcoin Anchor Status |
| `activity` | Anchored Activity Feed |
| `partners` | Partner Network |

---

**3. Modified file: `src/pages/Intelligence.tsx`**

Wrap each widget render with `WidgetDocWrapper`:

Before:
```jsx
<section id="prices">
  <SectionDivider label="SPOT PRICES" />
  <GAPriceCards />
</section>
```

After:
```jsx
<section id="prices">
  <SectionDivider label="SPOT PRICES" />
  <WidgetDocWrapper widgetId="prices">
    <GAPriceCards />
  </WidgetDocWrapper>
</section>
```

Every widget and tool section gets wrapped this way. The `SectionDivider` stays outside the wrapper (it's navigation chrome, not part of the widget). For sections with two widgets side-by-side in a grid (e.g. XRP + TRON), each widget gets its own wrapper independently.

For the `prices` section which has both `GAPriceCards` and `GACryptoPriceCards`, they share one wrapper with widgetId `prices` (the thesis covers both metal and crypto spot prices together).

---

### Visual Design of the Thesis & Guide Tab

The documentation panel follows the Hellenic aesthetic:

- Dark navy background with subtle gold/5 gradient overlay
- Gold ornate divider between thesis and instructions sections
- Data source badges rendered as small pill shapes with gold/20 borders
- Metrics displayed with small gold bullet markers
- Instructions displayed as numbered steps with gold step numbers
- Tier badge in the corner showing which data tier (MARKET DATA, BLOCKCHAIN, etc.)
- Smooth fade transition between tabs (150ms opacity)

---

### Technical Details

| Item | Detail |
|------|--------|
| Files to create | `src/components/ga-widgets/WidgetDocWrapper.tsx`, `src/components/ga-widgets/widgetDocContent.ts` |
| Files to modify | `src/pages/Intelligence.tsx` (wrap each widget) |
| Dependencies | None new -- uses React useState, existing Tailwind classes, Lucide icons |
| Widget modifications | Zero -- all widgets remain completely untouched |
| Performance | Thesis content is static text, no API calls. Tab state is local per wrapper instance. Hidden tab content is not rendered (conditional rendering, not CSS hide). |

