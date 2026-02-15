

## Universal Palette with Gradient Picker, Hex Code Search, and Pre-Built Themes

### What Changes

The PaletteEditor will be enhanced with three major additions:

1. **Universal Palette Mode** -- A single palette that applies to ALL widgets on the Intelligence page simultaneously, not just the one widget you opened it from
2. **Full Gradient Color Picker** -- A visual gradient strip with hex code input/search, replacing the basic HSL sliders
3. **8 Pre-Built Themes** -- Professionally designed color/font combinations users can apply instantly

---

### File Changes

| File | Action |
|------|--------|
| `src/components/ga-widgets/PaletteEditor.tsx` | Major update: add gradient color picker with hex input, universal mode toggle, 8 pre-built themes section, color code identifier |
| `src/components/ga-widgets/WidgetDocWrapper.tsx` | Add universal palette state via CSS class on document root when universal mode is active |

---

### Part 1: Gradient Color Picker with Hex Code Search

Replace the plain HSL sliders in the COLORS section with a visual color interaction system:

- **Gradient Spectrum Bar**: A horizontal 360-degree hue gradient strip. Click or drag to select hue. Below it, a saturation/lightness 2D square (like Photoshop's color picker) lets users pick exact shades.
- **Hex Code Input**: A text field where users can type or paste any hex code (e.g., `#C9973F`). It auto-converts to HSL and applies immediately. Shows the current color's hex code in real-time.
- **Color Code Identifier**: Displays the current color in multiple formats simultaneously: HEX, HSL, and RGB. Users can click any format to copy it.
- **Eyedropper-style swatches**: The 12 preset circles remain, but now each shows its hex code on hover as a tooltip.

The accent, background, and text color sections all get this treatment -- each with its own gradient picker + hex input.

### Part 2: Universal Palette Mode

A toggle at the top of the palette panel: **"APPLY TO ALL WIDGETS"**

When enabled:
- Instead of setting CSS variables on the wrapper `div`, it sets them on the `document.documentElement` (`:root`), which cascades to every widget on the page
- The palette state is saved to `localStorage` under `palette-universal` (not per-widget)
- A small gold badge appears on the PALETTE tab button indicating universal mode is active
- When disabled, it reverts to per-widget scoping (the current behavior)

### Part 3: Pre-Built Themes

Eight curated themes added to the PRESETS section, each with a visual preview card showing accent/bg/text colors and the font name:

| Theme | Accent | Background | Text | Font |
|-------|--------|------------|------|------|
| **Hellenic Gold** (default) | Gold #C9973F | Navy #1a2332 | Marble #f0ede6 | Cinzel |
| **Ocean Depths** | Teal #2dd4bf | Dark Slate #0f172a | Ice White #e2e8f0 | Inter |
| **Ruby Vault** | Ruby #dc2626 | Charcoal #1c1917 | Rose White #fef2f2 | Playfair Display |
| **Forest Reserve** | Emerald #059669 | Deep Forest #022c22 | Sage #d1fae5 | Cormorant Garamond |
| **Midnight Chrome** | Silver #94a3b8 | Pure Black #020617 | Cool Gray #e2e8f0 | Space Grotesk |
| **Desert Sand** | Amber #d97706 | Dark Sand #292524 | Warm Ivory #fef3c7 | Lora |
| **Arctic Frost** | Ice Blue #38bdf8 | Deep Blue #0c1929 | Frost #f0f9ff | DM Sans |
| **Royal Purple** | Violet #8b5cf6 | Dark Plum #1e1033 | Lavender #ede9fe | Bodoni Moda |

Each theme card is a small rectangular preview (~60px wide) showing a mini gradient of the three colors with the theme name below. Clicking applies all values (hue/sat/lit for accent, bg, text + font family) instantly.

### Part 4: Color Code Identifier Component

A new inline component (`ColorCodeDisplay`) renders below each color picker showing:

```
HEX: #C9973F  [copy icon]
HSL: 43, 72%, 50%  [copy icon]
RGB: 201, 151, 63  [copy icon]
```

Clicking any row copies that format to clipboard. The hex input field also acts as a search -- type a hex code and it instantly updates the color.

### Technical Details

**Hex to HSL conversion**: A utility function converts hex input to the H/S/L values the palette state uses:
```
hexToHsl("#C9973F") -> { h: 43, s: 72, l: 50 }
hslToHex(43, 72, 50) -> "#C9973F"
```

**Universal mode implementation**: When toggled on, the component calls `document.documentElement.style.setProperty('--gold', ...)` for each variable. On unmount or toggle off, it removes those properties to restore defaults.

**Theme application**: Each theme is a partial `PaletteState` object. Applying a theme calls `setState(prev => ({ ...prev, ...theme }))` to merge theme values while preserving user's shape/spacing/animation settings.

**Gradient bar rendering**: A canvas or CSS `linear-gradient(to right, hsl(0,100%,50%), hsl(60,100%,50%), ..., hsl(360,100%,50%))` for the hue strip. The saturation/lightness picker is a 2D div with overlapping gradients (white-to-transparent left-right, black-to-transparent bottom-top).

