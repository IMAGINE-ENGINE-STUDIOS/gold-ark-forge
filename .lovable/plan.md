

# Fix All Broken Palette Editor Tools and Features

## Problems Identified

After thorough investigation of the PaletteEditor component (1020 lines), I found **7 features** that are broken or have no visual effect:

### 1. Background Never Renders
The Background section (color picker, gradient toggle, opacity, backdrop blur, 12 background theme presets) all modify state values but the wrapper `div` never receives a `background` CSS property. The sliders and pickers work in the UI but produce zero visual change.

### 2. Title Size Has No Effect
The `titleSize` slider (10-28px) is tracked in state but never applied to any CSS property. Only `bodySize` is applied as `fontSize` on the wrapper.

### 3. Text Opacity Has No Effect
The `textOpacity` slider (30-100%) updates state but is never applied to the wrapper or any CSS variable.

### 4. Font Family Doesn't Override Widget Fonts
Setting `fontFamily` on the wrapper via inline `style` cannot override Tailwind utility classes like `font-display` (Cinzel) and `font-body` (Source Sans 3) because class-based styles have higher specificity than inherited font-family.

### 5. Eyedropper Tool Imported But Not Used
The `Pipette` icon from lucide-react is imported but never rendered. The native browser EyeDropper API could be wired up to allow picking colors from anywhere on screen.

### 6. Ornate Corners May Not Render
The ornate corner `span` elements are added but depend on global CSS classes that may not style correctly inside the palette wrapper's overflow context.

### 7. Gap Multiplier Applied Wrong
The `gap` CSS property is set on the wrapper div, but the wrapper only has a single child (the widget), so gap has no effect. It should be applied recursively or via a CSS variable.

---

## Implementation Plan

### File: `src/components/ga-widgets/PaletteEditor.tsx`

**Fix 1 - Background Rendering** (lines 680-696)
Add a `background` property to `wrapperStyle` that renders the selected bg color/gradient:
- Solid mode: `background: hsl(bgHue, bgSat%, bgLit% / bgOpacity%)`
- Gradient mode: `background: linear-gradient(bgGradientDir, hsl(...), hsl(darker variant))`
- This makes all 12 background theme presets, the gradient toggle, direction picker, and opacity slider functional

**Fix 2 - Title Size**
Apply `titleSize` via a CSS custom property `--palette-title-size` on the wrapper. Add a small `style` tag or use descendant selector logic so headings (`h1-h6`, `.font-display`) inside the widget pick up this size.

**Fix 3 - Text Opacity**
Apply `textOpacity` as a CSS custom property `--palette-text-opacity` and add an `opacity` or `color` modifier to text elements. Alternatively, apply it via the `--marble` CSS variable by including the opacity in the HSL value (e.g., `hsl(h s% l% / opacity)`).

**Fix 4 - Font Family Override**
Instead of just setting `fontFamily` on the wrapper (which gets overridden by Tailwind classes), set a CSS custom property `--palette-font` and inject a scoped `style` element that forces `font-family: var(--palette-font) !important` on all descendants. This ensures it overrides `font-display` and `font-body` utility classes.

**Fix 5 - Eyedropper Tool**
Add an eyedropper button next to each color picker's hex input. Wire it to the native `EyeDropper` API (available in Chrome/Edge). On click, it opens the system eyedropper, and the picked color is converted from hex to HSL and applied to the active color channel.

**Fix 6 - Ornate Corners**
Ensure the ornate corner spans render above the background by adding `z-10` positioning and `pointer-events-none`. The existing `ornate-corner` CSS classes from `index.css` should work; just ensure they're not clipped by the `overflow: hidden` on the wrapper.

**Fix 7 - Gap/Spacing**
Replace the `gap` CSS property with a CSS custom property `--palette-gap` applied via a scoped style that targets flex/grid containers within the widget (e.g., `.space-y-* > *` margin overrides or a `gap` override on flex containers).

---

## Technical Summary

Only one file is modified: `src/components/ga-widgets/PaletteEditor.tsx`

All fixes are in the `wrapperStyle` builder section (lines 679-708) and the JSX return (lines 956-1017):

- Add background rendering logic to wrapperStyle
- Add scoped style injection for font override, title size, text opacity, and gap
- Add EyeDropper API integration to GradientColorPicker
- Fix ornate corner z-index and overflow handling
- Wire titleSize and textOpacity to actual CSS output

