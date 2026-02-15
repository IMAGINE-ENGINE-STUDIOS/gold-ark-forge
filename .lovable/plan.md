

## Palette Tab + Tutorial Mobile Fix

Two changes: (1) a new **PALETTE** customization tab for all widgets, and (2) mobile-responsive fixes for the Tutorial overlay.

---

### Part 1: PALETTE Tab -- Widget Appearance Customizer

A fourth tab added to `WidgetDocWrapper` that renders the live widget alongside a floating control panel. Users can tweak visual properties in real-time using sliders, color pickers, and buttons. Changes are scoped per-widget and stored in React state (session-only, resets on reload).

#### Customizable Properties

| Category | Controls |
|----------|----------|
| **Colors** | Primary accent color (solid picker + 8 preset swatches), secondary color, background solid or gradient (6 preset gradients + direction picker) |
| **Text** | Font family toggle (Cinzel / Source Sans / mono), title size slider (12-24px), body size slider (10-16px), text opacity slider (30-100%) |
| **Shape** | Border radius slider (0-16px), border width slider (0-3px), border opacity slider (0-100%), padding slider (4-12 units) |
| **Background** | Solid color vs gradient toggle, gradient direction (8 compass directions), opacity slider, blur toggle |
| **Effects** | Ornate corners on/off, gold glow intensity slider (0-100%), shadow depth (none/sm/md/lg) |
| **Randomizer** | "Shuffle" button that randomizes all properties within tasteful ranges, "Reset" button to restore defaults |

#### Architecture

```text
WidgetDocWrapper
  |-- tab = 'palette'
  |-- <PaletteEditor widgetId={id}>
  |     |-- Renders {children} (live widget) wrapped in a <div> with inline style overrides
  |     |-- Floating control panel (right sidebar or bottom drawer on mobile)
  |     |     |-- Collapsible sections: Colors, Text, Shape, Background, Effects
  |     |     |-- Each section has sliders, color swatches, toggle buttons
  |     |     |-- Randomize + Reset buttons at bottom
  |     |-- CSS custom properties applied via style={{ }} on the wrapper div
  |     |-- Widget re-renders live as sliders move
  |-- </PaletteEditor>
```

The control panel uses CSS custom properties injected on the wrapper `<div>`, which cascade into the widget's existing Tailwind classes via overrides. For properties that can't be overridden via CSS variables (like border-radius on inner elements), the wrapper applies a container-level style.

#### Control Panel UI

- Navy-dark panel with gold/10 border, matching the Thesis panel aesthetic
- Collapsible accordion sections (one open at a time)
- Sliders: thin gold track with gold circle thumb
- Color swatches: 24px circles with gold ring on selected
- Gradient presets: small rectangular previews showing the gradient
- Font toggles: small text-based radio buttons showing "Aa" in each font
- Randomize button: dice icon with gold shimmer animation on click
- Reset button: refresh icon, marble/40 color

#### Mobile Layout

On screens < 768px, the control panel renders as a bottom sheet (collapsible drawer) instead of a side panel, with horizontal scroll for color swatches and compact slider rows.

---

### Part 2: Tutorial Mobile Fix

Fix tooltip cards overflowing on small viewports and improve spotlight positioning.

#### Changes to `TutorialOverlay.tsx`

1. **Tooltip max-width**: Reduce from 280px to `min(280px, calc(100vw - 32px))` so it never exceeds viewport minus padding
2. **Tooltip positioning clamp**: After computing tooltip position, clamp `left` to `[8px, containerWidth - tooltipWidth - 8px]` so it stays within bounds
3. **Spotlight dimensions on mobile**: Apply `min(spotlightW, 60)` and `min(spotlightH, 40)` so spotlights don't cover the entire small screen
4. **Navigation bar**: On mobile (`< 640px`), compact the dot indicators to show only 3 dots around the active step (with ellipsis) instead of all dots, preventing horizontal overflow
5. **Touch support**: Add touch-swipe left/right to advance/go-back steps (using `touchstart`/`touchend` delta)

---

### Files to Create (1 file)

| File | Purpose |
|------|---------|
| `src/components/ga-widgets/PaletteEditor.tsx` | Full palette customization component with control panel, CSS variable injection, and randomizer logic |

### Files to Modify (2 files)

| File | Change |
|------|--------|
| `src/components/ga-widgets/WidgetDocWrapper.tsx` | Add fourth "PALETTE" tab with `Palette` icon, import and render `PaletteEditor`, add tab state value `'palette'` |
| `src/components/ga-widgets/TutorialOverlay.tsx` | Mobile tooltip clamping, responsive spotlight sizing, compact dot navigation, touch-swipe support |

### No widget code modified. No data model changes needed (palette is purely visual, no new content entries).

---

### Technical Details: PaletteEditor State Shape

```text
interface PaletteState {
  accentColor: string;        // hex, default '#C9973F' (gold)
  secondaryColor: string;     // hex, default '#3A4A5C' (navy-light)
  bgMode: 'solid' | 'gradient';
  bgSolid: string;            // hex
  bgGradientFrom: string;
  bgGradientTo: string;
  bgGradientDir: string;      // 'to-br', 'to-r', 'to-b', etc.
  bgOpacity: number;          // 0-100
  fontFamily: 'display' | 'body' | 'mono';
  titleSize: number;          // px
  bodySize: number;           // px
  textOpacity: number;        // 30-100
  borderRadius: number;       // px
  borderWidth: number;        // px
  borderOpacity: number;      // 0-100
  padding: number;            // tailwind spacing units (4-12)
  ornateCorners: boolean;
  glowIntensity: number;      // 0-100
  shadow: 'none' | 'sm' | 'md' | 'lg';
}
```

The `randomize()` function picks values within predefined "tasteful" ranges (e.g., accent hues between 30-50 for gold tones, or 200-220 for navy tones) to ensure randomized results still look cohesive rather than garish.

