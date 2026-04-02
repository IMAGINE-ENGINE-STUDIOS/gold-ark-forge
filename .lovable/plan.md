

## Plan: Cesium Globe — Geospatial Energy & Asset Intelligence

### Overview
Create a new `/globe` page with a full-screen Cesium 3D Earth (realistic Bing Maps tiles via Cesium Ion) that plots all tradeable assets, chokepoints, producers, and energy infrastructure at their real-world coordinates. Clicking a pin opens a Gold Arrow-styled info panel with live price signals, description cards, risk indices, and news feeds — reusing existing OG and GA widgets.

### Dependencies
- `cesium` + `resium` (React wrapper for CesiumJS)
- Cesium Ion access token stored as a runtime secret (`CESIUM_ION_TOKEN`) — will prompt you to enter it

### New Files

**1. `src/pages/Globe.tsx`** — Main page component
- Full-viewport Cesium `Viewer` with no header/footer (immersive mode)
- Floating Gold Arrow logo top-left, nav button to return home
- Dark theme matching navy/gold palette (custom Cesium CSS overrides)
- Camera starts with a slow globe spin, stops on interaction

**2. `src/components/globe/GlobeViewer.tsx`** — Cesium viewer setup
- Cesium Ion token loaded from env (`VITE_CESIUM_ION_TOKEN`)
- Bing Maps Aerial imagery for realistic tiles
- Cesium terrain for 3D elevation
- Custom dark atmosphere/sky styling
- Disable default Cesium UI (timeline, animation, credits minimal)

**3. `src/components/globe/GlobeMarkers.tsx`** — Entity layer
- Plots all geolocated data as Cesium `Entity` billboards/points:
  - **Chokepoints** (8 locations from `OGChokepoints.tsx` data — Hormuz, Suez, Malacca, Bab el-Mandeb, Cape, Panama, Turkish Straits, Danish Straits)
  - **Top Producers** (10 countries with HQ coordinates — US, Saudi, Russia, Canada, Iraq, China, UAE, Brazil, Kuwait, Norway)
  - **Venezuela** special marker with full indicator panel
  - **Major exchanges / asset HQs** (COMEX NY, LME London, Binance global, CME Chicago, ICE Atlanta)
- Color-coded pins by category (red=critical chokepoints, orange=elevated, green=low risk, blue=producers, gold=exchanges)
- Risk-level pulsing animation on chokepoint markers

**4. `src/components/globe/GlobeInfoPanel.tsx`** — Slide-in detail panel
- Right-side panel (400px) that opens when a marker is clicked
- Renders contextual content based on marker type:
  - **Chokepoint**: Risk score gauge, throughput chart, vessel count, insurance premium, closure probability, military presence, key commodities, weekly throughput sparkline, incident notes — all data from existing `CHOKEPOINTS` array
  - **Producer**: Country flag, production (mbpd), YoY change, bar chart, percentage of global supply
  - **Venezuela**: Full 8-indicator dashboard (production, exports, revenue, refining, heavy crude price, Chevron JV, dark fleet, sanctions) — reuses data from `OGChokepoints.tsx`
  - **Exchange/Asset HQ**: Live price card (reuses `OGPriceCards` data), sparkline, change %
- Gold Arrow styling (navy background, gold accents, Greek key borders)

**5. `src/components/globe/GlobeLegend.tsx`** — Floating legend overlay
- Bottom-left legend showing marker color meanings
- Category filter toggles (Chokepoints / Producers / Exchanges / Venezuela)

**6. `src/components/globe/GlobeNewsTicker.tsx`** — Bottom news bar
- Horizontal scrolling energy news ticker (reuses `OGNewsFeed` data)
- Semi-transparent navy bar at bottom of globe

**7. `src/data/globeLocations.ts`** — Centralized coordinate registry
- All marker coordinates, metadata, and category assignments
- Links to existing data hooks (`useOilGasPrices`, chokepoint data, production data)

### Data Sources (all existing)
- Chokepoints: `OGChokepoints.tsx` CHOKEPOINTS array (8 locations with lat/lng)
- Venezuela: `OGChokepoints.tsx` VENEZUELA_INDICATORS array
- Producers: `OGProductionMap.tsx` production data (will add lat/lng coordinates)
- Live prices: `useOilGasPrices()` hook
- News: `OGNewsFeed` component data

### Route
- Add `/globe` route in `App.tsx`
- Add "Globe" nav link in `Header.tsx` with a `Globe` lucide icon

### Technical Details

```text
┌─────────────────────────────────────────────────┐
│  [GA Logo]  GOLD ARROW GLOBE    [Home] [Filter] │
│                                                  │
│         ┌──────────────────────┐                 │
│         │                      │  ┌────────────┐ │
│         │    CESIUM 3D EARTH   │  │ INFO PANEL │ │
│         │                      │  │            │ │
│         │  🔴 Hormuz           │  │ Risk: 68   │ │
│         │  🟡 Suez             │  │ Flow: 20.5 │ │
│         │  🔵 Saudi Arabia     │  │ Vessels:42 │ │
│         │  ⭐ COMEX            │  │ [Charts]   │ │
│         │                      │  │            │ │
│         └──────────────────────┘  └────────────┘ │
│  [Legend: ● Chokepoint ● Producer ● Exchange]    │
│  ═══ ENERGY NEWS TICKER ════════════════════════ │
└─────────────────────────────────────────────────┘
```

- Cesium Ion token: stored via `add_secret` tool, exposed as `VITE_CESIUM_ION_TOKEN` for client-side use (publishable key pattern)
- Resium provides React components: `<Viewer>`, `<Entity>`, `<BillboardGraphics>`, `<PointGraphics>`
- Camera fly-to animation when clicking markers
- All data is client-side (no new edge functions needed)

### Files Modified
- `src/App.tsx` — add `/globe` route
- `src/components/Header.tsx` — add Globe nav link
- `package.json` — add `cesium`, `resium` dependencies

### Files Created
- `src/pages/Globe.tsx`
- `src/components/globe/GlobeViewer.tsx`
- `src/components/globe/GlobeMarkers.tsx`
- `src/components/globe/GlobeInfoPanel.tsx`
- `src/components/globe/GlobeLegend.tsx`
- `src/components/globe/GlobeNewsTicker.tsx`
- `src/data/globeLocations.ts`

