

# Redesign: Move Right Sidebar into Trade Tab + Clean UX Overhaul

## What Changes

The right sidebar (PortfolioSummary, GATechnicalGauge, GAFearGreed, GAPriceCards) gets **removed entirely** from the desktop layout. All those tools move into the **TRADE tab** in the bottom panel. The chart gets full width. The Trade tab gets a complete UX redesign with a multi-section collapsible layout for easy navigation.

## New Desktop Layout

```text
Before:                              After:
+----------+----------+------+       +----------+------------------+
| Watchlist | Chart    | Right|       | Watchlist | Chart (FULL)    |
|          |          | Side |       |          |                  |
+----------+----------+------+       +----------+------------------+
| Bottom Tabs (trade, book...)  |       | Bottom Tabs (trade, book...) |
+-------------------------------+       +------------------------------+
```

The chart panel expands from ~70% to 100% of the main area -- no more horizontal split with a right panel.

## New TRADE Tab Design: Collapsible Card Sections

Instead of a long vertical scroll of dense forms, the TRADE tab uses **collapsible accordion-style cards** so users can expand what they need and collapse the rest. This keeps every tool accessible without visual clutter.

### Section Layout (horizontal grid on desktop, stacked on mobile):

**Column 1 -- Order Execution**
- Paper/Live trading form (existing PaperTradingPanel or TradingPanel)
- Depth of Market (collapsed by default)

**Column 2 -- Market Context**
- GAPriceCards (compact strip)
- GAFearGreed (compact)
- GATechnicalGauge

**Column 3 -- Portfolio**
- PortfolioSummary
- Quick positions list (from paper.positions or broker positions)

On screens below `lg` breakpoint, this collapses to a single scrollable column with each section as a collapsible card.

### Collapsible Card Pattern

Each section gets a header bar with:
- Icon + title (e.g., "ORDER TICKET", "MARKET PULSE", "PORTFOLIO")
- Collapse/expand chevron
- Optional badge (PAPER/LIVE, position count)
- Gold accent left border for visual hierarchy

Users can collapse sections they don't need, making the dense terminal manageable.

### Mobile TRADE Tab

Same collapsible card pattern, single column. The order form starts expanded, everything else starts collapsed so the user sees the most important action first.

## Technical Details

### File: `src/pages/TradingBridge.tsx`

**1. Remove right sidebar panel (desktop)**
- Delete the `ResizableHandle` and second `ResizablePanel` (lines 766-774) that contain PortfolioSummary, GATechnicalGauge, GAFearGreed, GAPriceCards
- The chart `ResizablePanel` becomes `defaultSize={100}` filling the full width
- Remove the outer horizontal `ResizablePanelGroup` wrapper since there's only one panel now

**2. Create `TradeTabContent` component**
A new inline component that renders the redesigned trade tab with a 3-column grid layout:

```
<div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
  <CollapsibleSection title="ORDER TICKET" icon={ArrowUpDown} defaultOpen>
    {tradingMode === 'paper' ? <PaperTradingPanel .../> : <TradingPanel .../>}
  </CollapsibleSection>

  <CollapsibleSection title="DEPTH" icon={BarChart3}>
    <DepthOfMarket .../>
  </CollapsibleSection>

  <div className="space-y-3">
    <CollapsibleSection title="MARKET PULSE" icon={Activity} defaultOpen>
      <GAPriceCards />
      <GAFearGreed />
    </CollapsibleSection>

    <CollapsibleSection title="TECHNICALS" icon={LineChartIcon}>
      <GATechnicalGauge />
    </CollapsibleSection>
  </div>

  <CollapsibleSection title="PORTFOLIO" icon={Briefcase} defaultOpen>
    <PortfolioSummary />
  </CollapsibleSection>
</div>
```

**3. Create `CollapsibleSection` helper component**
A small reusable component (defined in-file) using Radix `Collapsible`:

- Gold left-border accent bar
- Header: icon + title + badge + chevron toggle
- Smooth expand/collapse animation
- `defaultOpen` prop for sections that should start expanded
- Compact styling matching the terminal aesthetic

**4. Update mobile TRADE tab (line 511-526)**
Replace the current simple stack with the same collapsible card pattern:
- Order form: expanded by default
- Depth of Market: collapsed
- Price Cards + Fear & Greed: collapsed under "MARKET PULSE"
- Technical Gauge: collapsed
- Portfolio Summary: collapsed

**5. Update mobile TOOLS > TRADE sub-tab (line 559-574)**
Same treatment as mobile TRADE tab.

### Components Used (all existing, no new imports needed beyond Collapsible)
- `Collapsible`, `CollapsibleTrigger`, `CollapsibleContent` from `@/components/ui/collapsible`
- `ChevronDown` icon (already imported)
- All GA widgets and trading components already imported

### Performance
- Collapsed sections still mount their children (React standard) but the visual footprint is minimal
- No new dependencies or packages needed
- The chart getting full width improves rendering performance since the right panel widgets no longer compete for space

