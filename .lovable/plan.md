

## Redesigned Tutorial Overlay -- In-Widget Interactive Guide

### Problem with Current Design

The current tutorial places the legend panel **below** the widget, forcing users to scroll down to read descriptions while the hotspots are up on the widget. The hotspots are passive -- they just pulse but never actually interact with or highlight the widget areas. The text is disconnected from the visual context.

### New Design: Tooltip-Style Overlay with Spotlight Dimming

The tutorial will feel like a guided product tour (similar to tools like Shepherd.js or Intro.js). Each step:

1. **Dims the entire widget** with a semi-transparent dark overlay
2. **Cuts out a spotlight** around the active hotspot area, leaving that region fully visible and bright
3. **Shows a floating tooltip card** anchored near the spotlighted area (not below the widget) with the label, description, step counter, and next/prev controls
4. **Draws a connecting line** from the tooltip to the spotlight center
5. The non-active hotspot badges remain visible but dimmed

The legend is no longer a separate panel below -- the description **is** the tooltip overlaying the widget itself.

---

### Data Model Changes

Extend `TutorialHotspot` with a spotlight radius and preferred tooltip placement:

```text
interface TutorialHotspot {
  label: string;
  description: string;
  x: number;            // hotspot center (%)
  y: number;            // hotspot center (%)
  spotlightW?: number;  // spotlight width in % (default 20)
  spotlightH?: number;  // spotlight height in % (default 15)
  tooltipSide?: 'top' | 'bottom' | 'left' | 'right';  // preferred tooltip position
}
```

The spotlight dimensions let each hotspot highlight a region (e.g., a whole row of tabs, or a single card) rather than just a point. `tooltipSide` controls where the floating description appears relative to the spotlight so it never obscures the highlighted element.

---

### New TutorialOverlay Component Behavior

```text
+-----------------------------------------------+
| [1/5] ---- progress bar ---- [<] [>] [||]     |
+-----------------------------------------------+
|                                                |
|   +-- Widget (dimmed with dark overlay) ----+  |
|   |  :::::::::::::::::::::::::::::::::::    |  |
|   |  :::  +--SPOTLIGHT--+  :::::::::::::    |  |
|   |  :::  | (bright     |  :::::::::::::    |  |
|   |  :::  |  region)    |  :::::::::::::    |  |
|   |  :::  +-------------+  :::::::::::::    |  |
|   |  ::::::::|::::::::::::::::::::::::::    |  |
|   |  ::::::::v::::::::::::::::::::::::::    |  |
|   |  ::: +-TOOLTIP CARD-----------+ :::    |  |
|   |  ::: | (1) Category Tabs      | :::    |  |
|   |  ::: | Switch between ALL,    | :::    |  |
|   |  ::: | METALS, ENERGY filters | :::    |  |
|   |  ::: +------------------------+ :::    |  |
|   |  :::::::::::::::::::::::::::::::::::    |  |
|   +-----------------------------------------+  |
|                                                |
+-----------------------------------------------+
```

Key behaviors:

- **Spotlight mask**: An SVG or CSS clip-path overlay that covers the widget in dark (navy at 70% opacity) with a rounded-rect cutout at the active hotspot position. The cutout has a soft gold border glow.
- **Tooltip card**: A compact floating panel (max-width ~280px) positioned adjacent to the spotlight. Contains the step number badge, label (bold gold), description (marble text), and navigation arrows. It uses smart positioning -- if the hotspot is near the top, tooltip goes below; if near the right edge, tooltip goes left. The `tooltipSide` field from data can override this.
- **Navigation**: Previous/Next arrow buttons on the tooltip card, plus a play/pause auto-advance. Keyboard support (left/right arrows, space for play/pause).
- **Step dots**: Small dot indicators at the top showing total steps and current position (replacing the full legend list).
- **Transition**: When advancing steps, the spotlight smoothly animates (300ms ease) to the new position. The tooltip fades out and back in (150ms).
- **Exit**: An X button or clicking outside the overlay exits the tutorial and switches back to the WIDGET tab.

---

### Interaction with the Widget

The overlay is `pointer-events-none` **except** for the spotlighted region. This means:
- The user can actually **click/interact** with the highlighted element (e.g., click a tab, hover a chart point) while the tutorial explains it
- All other widget areas stay dimmed and non-interactive, focusing attention
- After interaction, the tutorial stays in place -- the user manually advances with Next or waits for auto-advance

---

### Files to Modify

| File | Change |
|------|--------|
| `src/components/ga-widgets/TutorialOverlay.tsx` | Complete rewrite: replace legend-below design with spotlight mask + floating tooltip + smart positioning + keyboard nav |
| `src/components/ga-widgets/widgetDocContent.ts` | Update `TutorialHotspot` interface to add `spotlightW`, `spotlightH`, `tooltipSide`. Update all 42+ widget tutorial entries with spotlight dimensions and tooltip sides |
| `src/components/ga-widgets/WidgetDocWrapper.tsx` | Minor: pass a callback so TutorialOverlay can exit back to widget tab when user clicks X or clicks outside |

No new files needed. No widget code modified.

---

### Visual Design Details

- **Dimming overlay**: `background: hsla(220, 40%, 8%, 0.75)` -- navy-dark at 75% opacity
- **Spotlight cutout**: Rounded rectangle with 8px radius, `box-shadow: 0 0 0 3px hsla(43, 72%, 50%, 0.4), 0 0 30px hsla(43, 72%, 50%, 0.15)` gold glow
- **Tooltip card**: `bg-navy-dark/95 border border-gold/30 backdrop-blur-sm rounded-lg shadow-2xl` with padding 16px. Max-width 280px.
- **Tooltip arrow**: A small CSS triangle pointing toward the spotlight
- **Step badge in tooltip**: Gold circle with step number, same as current but inline with the label
- **Navigation arrows**: Chevron left/right icons, gold/40 default, gold on hover
- **Progress dots**: Row of small circles (6px), gold for visited, gold/30 for upcoming, gold with ring for active
- **Auto-advance bar**: Thin 2px gold bar animating inside the tooltip card footer (shows time remaining for current step)

### Tooltip Smart Positioning Logic

```text
if hotspot.tooltipSide is set -> use it
else:
  if y < 30%  -> tooltip below spotlight
  if y > 70%  -> tooltip above spotlight  
  if x < 30%  -> tooltip to the right
  if x > 70%  -> tooltip to the left
  else        -> tooltip below (default)
```

This ensures the tooltip never goes off-screen or covers the highlighted element.

