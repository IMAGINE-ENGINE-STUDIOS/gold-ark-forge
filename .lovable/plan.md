

## Palette Editor Fixes and Enhancements

### Issues Identified

1. **Mobile bottom sheet uses `animate-slide-in-up`** which does not exist in the Tailwind config keyframes -- the animation class is undefined, causing potential rendering issues
2. **Font preview not rendering** -- fonts are set via inline `style` but Google Fonts are not pre-loaded for the dropdown list, so the `Aa` previews all render in the fallback system font
3. **Shuffle does not randomize ALL properties** -- missing: `bgMode`, `bgGradientDir`, `bgOpacity`, `titleSize`, `bodySize`, `letterSpacing`, `lineHeight`, `textOpacity`, `borderOpacity`, `padding`, `ornateCorners`, `saturationBoost`, `contrastBoost`, `backdropBlur`, `animationSpeed`, `gap`
4. **No global "Apply to All" button** -- the Universal toggle exists but there is no explicit "Apply this theme to all widgets now" action button for the pre-built themes
5. **Font list does not preload** -- all 80 fonts rely on dynamic loading triggered only on selection; the dropdown shows `Aa` in system font for every entry
6. **Missing `animate-fade-in` keyframe** -- used in section content but not defined in Tailwind config
7. **The glassmorphism/transparency style** the user likes needs to be applied more broadly across the app UI

---

### Changes

#### File 1: `tailwind.config.ts`
- Add `slide-in-up` keyframe and animation for the mobile bottom sheet
- Add `fade-in` keyframe and animation for section expand

#### File 2: `src/components/ga-widgets/PaletteEditor.tsx` (Major Update)

**Font Preview Fix:**
- Preload fonts in batches when the TYPOGRAPHY section opens (not all 80 at once -- load the first visible category, then lazy-load others on scroll)
- On section open, call `loadFont()` for the currently visible category batch so the `Aa` preview renders in the actual typeface
- Add a loading indicator per font until Google Fonts delivers it

**Shuffle Fix -- Randomize ALL Properties:**
- Expand the `randomize()` function to include every property in PaletteState:
  - `bgMode`: randomly 'solid' or 'gradient'
  - `bgGradientDir`: random from `dirOptions`
  - `bgOpacity`: 70-100 range
  - `titleSize`: 12-24 range
  - `bodySize`: 10-16 range
  - `letterSpacing`: 0-0.15 range
  - `lineHeight`: 1.2-1.8 range
  - `textOpacity`: 60-100 range
  - `borderOpacity`: 10-60 range
  - `padding`: 2-10 range
  - `ornateCorners`: random boolean
  - `saturationBoost`: 80-130 range
  - `contrastBoost`: 85-120 range
  - `backdropBlur`: 0-8 range
  - `animationSpeed`: 0.5-2 range
  - `gap`: 0.5-2 range

**Global Preset Themes:**
- Add an "APPLY GLOBALLY" button next to each theme card that sets the theme on `:root` (same as universal mode) and persists it
- Add a top-level "GLOBAL PRESETS" section header above the themes grid when Universal mode is active
- Add a prominent gold button: "APPLY TO ALL WIDGETS" that explicitly sets the current palette state onto `:root`

**More Pre-Built Themes (expand from 8 to 12):**
- Add: **Copper Forge** (warm copper tones, Bitter font), **Obsidian** (pure dark with white accents, Outfit font), **Emerald Trading** (emerald green + dark, Manrope font), **Champagne** (soft gold + cream, Cormorant Garamond font)

**Glassmorphism UI Enhancement:**
- Apply `backdrop-blur-md bg-navy-dark/90` styling to the control panel consistently
- Add subtle `bg-white/5` frosted overlays to section headers
- Ensure all borders use soft opacity (`border-gold/10` to `border-gold/15`)

#### File 3: `src/index.css`
- Add a new `.glass-panel` utility class: `backdrop-blur-md bg-navy-dark/90 border border-gold/10 rounded-lg`
- Add `.glass-card` utility: `backdrop-blur-sm bg-navy/80 border border-gold/8`
- These will be available app-wide for the frosted transparency aesthetic

#### File 4: `src/components/ga-widgets/WidgetShell.tsx`
- Apply the glass transparency style to the widget shell background -- change from opaque `bg-gradient-to-br from-navy via-navy to-navy-light` to a softer `bg-navy/85 backdrop-blur-sm` variant
- Keep the ornate corners and gold border behavior

---

### Technical Details

**Font batch preloading strategy:**
When the TYPOGRAPHY section opens, immediately call `loadFont()` for the first 15 fonts (Serif category). As the user scrolls through the font list, use an IntersectionObserver on each category header to trigger loading that category's fonts. This keeps the initial load reasonable (~15 requests) while ensuring fonts are visually accurate by the time the user sees them.

**Global apply mechanism:**
The "APPLY TO ALL WIDGETS" button will:
1. Enable universal mode (`setUniversal(true)`)
2. Apply current `buildCSSVars(state)` to `document.documentElement`
3. If a font is selected, set it on `:root` as well
4. Save to `localStorage` under `palette-universal`
5. Show a toast confirmation

**Shuffle coherence:**
The shuffle will pick one of 6 "mood" profiles (warm, cool, dark, light, vivid, muted) to keep the random result aesthetically coherent rather than fully chaotic. Each mood constrains the hue/sat/lit ranges for accent, bg, and text to complementary zones.

