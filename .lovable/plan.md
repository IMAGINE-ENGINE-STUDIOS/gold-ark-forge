

## Enhanced Palette Editor: Deep CSS Variable Override + 80 Fonts + Save/Export

### Core Problem

The current PaletteEditor sets CSS custom properties like `--palette-accent` and `--palette-secondary`, but no widget reads those variables. All widgets use Tailwind classes (`text-gold`, `bg-navy`, `border-gold/30`) which resolve to `hsl(var(--gold))`, `hsl(var(--navy))`, etc. The palette wrapper styles only affect the outer container div, not the widget internals.

### Solution: Override the actual CSS variables

Instead of inventing new CSS variables, the palette wrapper will **override the real design-system variables** (`--gold`, `--navy`, `--navy-dark`, `--marble`, etc.) on the wrapper `<div>`. Since Tailwind resolves these at runtime via `hsl(var(--gold))`, overriding them on a parent element cascades into every child widget automatically. No widget code changes needed.

---

### Changes Overview

| File | Action |
|------|--------|
| `src/components/ga-widgets/PaletteEditor.tsx` | Complete rewrite with CSS variable overrides, 80 Google Fonts, save/export, new sections, overlay layout |
| `src/components/ga-widgets/WidgetDocWrapper.tsx` | Minor: add sticky positioning for palette to keep controls in view |

---

### Part 1: CSS Variable Override Strategy

The wrapper div's `style` will set:

```text
--gold: H S% L%          (from accent color picker)
--gold-light: H S+4% L+12%
--gold-dark: H-3 S-4% L-12%
--gold-shine: H+2 85% L+22%
--navy: H S% L%          (from background color)
--navy-light: H S-4% L+8%
--navy-dark: H S+3% L-6%
--marble: H S% L%        (from text color)
```

This means every `text-gold`, `bg-navy`, `border-gold/30`, gradient, shadow, and ornate corner inside the widget will automatically respond to palette changes.

### Part 2: Expanded PaletteState

New properties added to the state:

| Property | Control | Range |
|----------|---------|-------|
| `accentHue`, `accentSat`, `accentLit` | HSL sliders for accent | 0-360, 0-100, 0-100 |
| `bgHue`, `bgSat`, `bgLit` | HSL sliders for background | 0-360, 0-100, 0-100 |
| `textColor` | Text/marble color override | hex picker |
| `fontFamily` | Searchable dropdown of 80 Google Fonts | string |
| `letterSpacing` | Slider for tracking | 0-0.3em |
| `lineHeight` | Slider | 1.0-2.0 |
| `gap` | Internal spacing multiplier | 0.5x-2x |
| `backdropBlur` | Blur intensity | 0-20px |
| `saturationBoost` | Global saturation filter | 50-150% |
| `contrastBoost` | Global contrast filter | 80-150% |
| `animationSpeed` | CSS transition duration multiplier | 0-3x |

### Part 3: 80 Font Options

A curated list of 80 Google Fonts loaded dynamically (only when selected) via `@import` injected into a `<style>` tag. Categories:

- **Serif** (20): Cinzel, Playfair Display, Cormorant Garamond, Merriweather, Lora, EB Garamond, Crimson Pro, Spectral, Libre Baskerville, Old Standard TT, Cardo, Sorts Mill Goudy, Vollkorn, Domine, Noto Serif, PT Serif, Bitter, Source Serif 4, Alegreya, Unna
- **Sans-Serif** (30): Source Sans 3, Inter, Roboto, Open Sans, Lato, Poppins, Montserrat, Nunito, Raleway, Work Sans, DM Sans, Manrope, Outfit, Sora, Space Grotesk, Plus Jakarta Sans, Urbanist, Figtree, Geist Sans, Archivo, Barlow, IBM Plex Sans, Karla, Mulish, Overpass, Red Hat Display, Rubik, Lexend, Cabin, Quicksand
- **Display** (15): Cinzel Decorative, Berkshire Swash, Poiret One, Forum, Tenor Sans, Marcellus, Josefin Sans, Italiana, Megrim, Bodoni Moda, Yeseva One, Oranienbaum, Cormorant SC, Abril Fatface, Baskervville
- **Monospace** (15): JetBrains Mono, Fira Code, Source Code Pro, IBM Plex Mono, Space Mono, Roboto Mono, Inconsolata, Ubuntu Mono, Courier Prime, Anonymous Pro, Noto Sans Mono, Red Hat Mono, Azeret Mono, Martian Mono, Geist Mono

The font selector will be a searchable scrollable list grouped by category, with a live "Aa" preview in each font.

### Part 4: Save/Export Feature

Three export actions in the palette header:

1. **Copy CSS** -- Copies all overridden CSS variables as a `:root {}` block to clipboard
2. **Copy JSON** -- Copies the full `PaletteState` object as JSON
3. **Save Preset** -- Stores to `localStorage` keyed by `widgetId`, auto-loads on next visit

A "Load Preset" dropdown shows saved presets with delete option.

### Part 5: Overlay Layout (Controls Within Reach)

The current layout places controls to the right of the widget (desktop) or below (mobile). This means you can't see changes while scrolling the control panel. The new layout:

**Desktop**: The control panel becomes a **floating overlay panel** anchored to the top-right of the widget container. It uses `position: sticky; top: 16px` so it stays in view as the user scrolls. Width: 280px. Semi-transparent backdrop with blur. A collapse/expand toggle minimizes it to a small palette icon.

**Mobile**: The control panel renders as a **fixed bottom sheet** (position: fixed, bottom: 0) with a drag handle. 40vh height, scrollable. The widget remains fully visible above it.

### Part 6: New Control Sections

Expanding from 5 to 8 collapsible sections:

1. **COLORS** -- Accent HSL sliders, secondary picker, 12 preset swatches
2. **BACKGROUND** -- Background HSL sliders, solid/gradient toggle, gradient presets + direction, opacity, backdrop blur
3. **TYPOGRAPHY** -- Font family (80-font searchable list), title size, body size, letter spacing, line height, text opacity
4. **SHAPE** -- Border radius, border width, border opacity, padding, ornate corners toggle
5. **EFFECTS** -- Glow intensity, shadow depth, saturation boost, contrast boost
6. **ANIMATION** -- Transition speed multiplier, disable animations toggle
7. **SPACING** -- Gap multiplier, internal padding scale
8. **PRESETS** -- Save/Load/Delete presets, Copy CSS, Copy JSON, Reset, Shuffle

---

### Technical Details

**Font loading**: When user selects a new font, inject:
```html
<link href="https://fonts.googleapis.com/css2?family=Font+Name:wght@400;500;600;700&display=swap" rel="stylesheet">
```
into document head dynamically. Cache loaded fonts in a Set to avoid duplicate loads.

**CSS variable conversion**: Convert hex/HSL input to the HSL format Tailwind expects (space-separated without `hsl()`):
```text
Input: #C9973F
Output: --gold: 43 72% 50%
```

**localStorage schema**:
```text
palette-preset:{widgetId}:{presetName} -> JSON string of PaletteState
palette-presets:{widgetId} -> JSON array of preset names
```

**Filter-based effects**: `saturationBoost` and `contrastBoost` apply via CSS `filter: saturate() contrast()` on the wrapper div, affecting the entire widget without touching individual elements.
