

## Interactive Tutorial Tab for All Widgets

### Overview

Add a third tab -- **TUTORIAL** -- to the existing `WidgetDocWrapper`. When active, it renders the live widget with an animated overlay of numbered callout hotspots. Each hotspot pulses, highlights a region of the widget, and displays a legend describing that element. A step-by-step animation auto-advances through all hotspots with a progress indicator.

No existing widget code is modified. The tutorial content is purely data-driven from `widgetDocContent.ts`.

---

### How It Works

When the user clicks the TUTORIAL tab:
1. The actual widget renders normally (live, interactive, with real data)
2. A semi-transparent overlay sits on top of it (`pointer-events-none`)
3. Animated numbered callout badges appear at predefined positions, each with a gold pulsing ring
4. A legend panel sits below the widget listing all annotated elements
5. The current "active" hotspot has a brighter pulse and its legend entry is highlighted
6. Auto-advance cycles through hotspots every 4 seconds (with play/pause control)
7. Users can also click any legend entry to jump to that hotspot

```text
+-----------------------------------------------+
| [WIDGET]  [THESIS & GUIDE]  [TUTORIAL]        |
+-----------------------------------------------+
|                                                |
|   +-- Live Widget (rendered normally) ------+  |
|   |                                         |  |
|   |   (1) <-- pulsing gold circle           |  |
|   |          at 15%, 10% position           |  |
|   |                                         |  |
|   |              (2) <-- another hotspot    |  |
|   |                                         |  |
|   |   (3)                        (4)        |  |
|   +-----------------------------------------+  |
|                                                |
|   LEGEND:                                      |
|   > 1. Category Tabs -- Switch between ALL,    |
|        METALS, ENERGY, CRYPTO filters           |
|     2. Performance Chart -- 24h ranked bars     |
|     3. Leaders & Laggards -- Best/worst movers  |
|     4. Price Grid -- Scrollable asset list      |
+-----------------------------------------------+
```

---

### Data Model

Add a `tutorial` field to the `WidgetDocEntry` interface:

```text
tutorial?: {
  label: string;           // e.g. "Category Tabs"
  description: string;     // e.g. "Click ALL, METALS, ENERGY, or CRYPTO to filter the radar"
  x: number;               // percentage position (0-100) from left
  y: number;               // percentage position (0-100) from top
}[]
```

Each widget gets 3-6 hotspots describing its key interactive elements: tabs, charts, legends, buttons, data panels, sparklines, filters, scrollable areas, links, etc.

---

### New Component: `TutorialOverlay.tsx`

**File**: `src/components/ga-widgets/TutorialOverlay.tsx`

A component that wraps `children` (the widget) inside a `position: relative` container, then renders:

- **Hotspot badges**: Absolutely positioned gold circles with the step number, a CSS pulsing ring animation (`@keyframes tutorial-pulse`), and a subtle connecting line to the legend below
- **Active hotspot**: The currently highlighted step has a brighter gold glow and slightly larger ring
- **Legend panel**: Below the widget, a styled list of all hotspots with number, label, and description. The active entry has a gold left-border highlight
- **Progress bar**: A thin gold bar at the top that fills as the auto-advance cycles through steps
- **Play/Pause button**: Small control to pause/resume the auto-cycle
- **Step counter**: "2 / 5" indicator

Animation details:
- Hotspot rings use a CSS pulse animation (gold ring expanding and fading, 2s loop)
- Active hotspot has a brighter pulse and a subtle spotlight gradient behind it
- Legend entries fade in sequentially on mount (staggered 100ms)
- When active step changes, previous entry slides out, next slides in (150ms transition)
- Auto-advance timer: 4 seconds per step, loops continuously

---

### Files to Create (1 file)

| File | Purpose |
|------|---------|
| `src/components/ga-widgets/TutorialOverlay.tsx` | Overlay component with hotspots, legend, and auto-advance logic |

### Files to Modify (2 files)

| File | Change |
|------|--------|
| `src/components/ga-widgets/widgetDocContent.ts` | Add `tutorial` array to the `WidgetDocEntry` interface and populate for all 42+ widgets (Intelligence + Oil & Gas) |
| `src/components/ga-widgets/WidgetDocWrapper.tsx` | Add third "TUTORIAL" tab, import and render `TutorialOverlay` when active |

---

### Tutorial Content Per Widget (All 42+ Entries)

Every widget gets 3-6 positioned hotspots. Examples:

**Spot Price Cards (`prices`)** -- 4 hotspots:
- Symbol badge (top-left) -- "Asset identifier showing the trading pair"
- Price display (center) -- "Live spot price in USD, updated every 30s"
- Change badge (top-right) -- "24h percentage change with color coding"
- Sparkline (bottom) -- "Intraday price trend visualization"

**Commodity Radar (`commodity-radar`)** -- 5 hotspots:
- Category tabs -- "Filter by ALL, METALS, ENERGY, or CRYPTO"
- Bar chart -- "24h performance ranking sorted by magnitude"
- Leaders panel -- "Strongest performer with percentage gain"
- Laggards panel -- "Weakest performer with percentage loss"
- Price grid -- "Scrollable list of all assets with live prices"

**Bitcoin Network (`bitcoin`)** -- 5 hotspots:
- Block height card -- "Current Bitcoin blockchain height"
- Last block timer -- "Minutes since the last mined block"
- Hashrate gauge -- "Network security measured in exahashes"
- Fee estimate bars -- "Priority, Standard, Economy fee tiers"
- Mempool counter -- "Unconfirmed transactions awaiting inclusion"

**EIA Crude Inventory (`og-inventory`)** -- 4 hotspots:
- Gauge dial -- "Current inventory level relative to 5-year range"
- Weekly change -- "Barrels added or drawn from storage"
- Historical chart -- "52-week inventory trend line"
- API vs EIA -- "Compare API estimate with official EIA release"

All 42+ widgets will receive similar treatment with position-calibrated hotspots targeting their specific interactive and informational elements.

---

### Visual Design

- Hotspot badge: 24px gold circle with white number, CSS `box-shadow: 0 0 0 4px hsla(43, 72%, 50%, 0.3)` pulsing outward
- Active hotspot: `box-shadow: 0 0 0 8px hsla(43, 72%, 50%, 0.5)` with brighter gold fill
- Legend panel: Navy background with gold/10 border, matching the Thesis panel aesthetic
- Legend active entry: Left gold border (3px), text brightens from marble/40 to marble
- Progress bar: 2px height, gold fill, smooth width transition
- Tab button: Uses `GraduationCap` icon from Lucide with "TUTORIAL" label, same styling as existing tabs

