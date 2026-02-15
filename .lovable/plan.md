

## Add Thesis & Guide Tabs to All Oil & Gas Intelligence Widgets

Replicate the same `WidgetDocWrapper` system already working on the Intelligence page to every widget on the `/oil-gas` page. No widget code is modified -- only additive wrapping and new content entries.

---

### What Changes

**1. `src/components/ga-widgets/widgetDocContent.ts` -- Add 14 new entries**

New Oil & Gas widget doc entries appended to the existing registry. Each entry uses a new tier value `"ENERGY"` to distinguish them visually from the GA widgets:

| Widget ID | Name | Sources |
|-----------|------|---------|
| `og-prices` | Energy Spot Prices | EIA, CME, ICE |
| `og-futures` | Futures Curve | CME, ICE |
| `og-wti-brent` | WTI-Brent Spread Tracker | EIA, CME |
| `og-spreads` | Crack Spreads & Margins | EIA, CME |
| `og-inventory` | EIA Crude Inventory | EIA v2 API |
| `og-rigs` | Baker Hughes Rig Count | Baker Hughes |
| `og-supply-demand` | Global Supply/Demand Balance | IEA, EIA, OPEC |
| `og-opec` | OPEC+ Compliance Monitor | OPEC MOMR |
| `og-production` | Top Producers | EIA, IEA |
| `og-pipelines` | Global Pipeline Flow | EIA, FERC |
| `og-chokepoints` | Geopolitical Chokepoint Risk | Shipping Telemetry, EIA |
| `og-news` | Energy Intelligence Feed | Public RSS, EIA |
| `og-energy-dashboard` | Energy Executive Dashboard | EIA, CME, ICE |
| `og-risk-analyzer` | Risk & Spreads Analyzer | EIA, CME, Shipping |

Each entry includes 2-3 paragraph institutional thesis, key metrics list, and step-by-step instructions -- following the same structure and depth as the existing GA entries.

The tier color map in `WidgetDocWrapper.tsx` will be updated to include `"ENERGY"` with an orange/amber color scheme to match the Oil & Gas branding.

---

**2. `src/pages/OilGasIntelligence.tsx` -- Wrap all 14 widgets**

Import `WidgetDocWrapper` and wrap each widget:

- `OGPriceCards` -> `<WidgetDocWrapper widgetId="og-prices">`
- `OGFuturesCurve` -> `<WidgetDocWrapper widgetId="og-futures">`
- `OGWtiBrentSpread` -> `<WidgetDocWrapper widgetId="og-wti-brent">`
- `OGCrackSpreads` -> `<WidgetDocWrapper widgetId="og-spreads">`
- `OGInventoryGauge` -> `<WidgetDocWrapper widgetId="og-inventory">`
- `OGRigCount` -> `<WidgetDocWrapper widgetId="og-rigs">`
- `OGSupplyDemand` -> `<WidgetDocWrapper widgetId="og-supply-demand">`
- `OGOPECTracker` -> `<WidgetDocWrapper widgetId="og-opec">`
- `OGProductionMap` -> `<WidgetDocWrapper widgetId="og-production">`
- `OGPipelineFlow` -> `<WidgetDocWrapper widgetId="og-pipelines">`
- `OGChokepoints` -> `<WidgetDocWrapper widgetId="og-chokepoints">`
- `OGNewsFeed` -> `<WidgetDocWrapper widgetId="og-news">`
- `OGEnergyDashboard` -> `<WidgetDocWrapper widgetId="og-energy-dashboard">`
- `OGRiskAnalyzer` -> `<WidgetDocWrapper widgetId="og-risk-analyzer">`

The `SectionDivider` stays outside the wrapper (navigation chrome). For the side-by-side grid (OPEC + Production), each widget gets its own independent wrapper.

---

**3. `src/components/ga-widgets/WidgetDocWrapper.tsx` -- Add ENERGY tier color**

Add one line to the `tierColors` map:

```
'ENERGY': 'text-amber-400 border-amber-400/30 bg-amber-400/5'
```

---

### Files Modified (3 files)

| File | Change |
|------|--------|
| `src/components/ga-widgets/widgetDocContent.ts` | Append 14 new `WidgetDocEntry` objects |
| `src/pages/OilGasIntelligence.tsx` | Import `WidgetDocWrapper`, wrap all 14 widgets |
| `src/components/ga-widgets/WidgetDocWrapper.tsx` | Add `ENERGY` to tier color map |

### No new files created. No widget code modified.

