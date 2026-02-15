

## Palette Background Presets, Shuffle Integration, Swipe-Down Close, and Tutorial Fix

### Part 1: Background Presets in UI and Shuffle

The 12 `BG_PRESETS` (Deep Space, Aurora Gradient, etc.) were added to the code but never wired into the UI or shuffle logic.

**Changes to `src/components/ga-widgets/PaletteEditor.tsx`:**

**A. Background Presets Grid in the BACKGROUND section (after the existing controls):**
- Render a "BACKGROUND THEMES" label followed by a scrollable grid of preset cards
- Each card shows a small color swatch (solid or gradient preview) plus the preset name
- Clicking a card applies its `bgMode`, `bgGradientDir`, `bgOpacity`, `backdropBlur`, `bgHue`, `bgSat`, `bgLit` values to the state
- Active preset gets a gold border highlight

**B. Shuffle includes a random BG_PRESET:**
- In the `randomize()` function, after generating mood colors, also pick a random `BG_PRESETS` entry
- Override the background properties (`bgMode`, `bgGradientDir`, `bgOpacity`, `backdropBlur`) from the selected preset
- Keep the mood-generated `bgHue/bgSat/bgLit` or blend with the preset values (50/50 chance of using mood bg vs preset bg for variety)

---

### Part 2: Swipe-Down-to-Close for Mobile Palette

Add touch gesture handling to the mobile bottom sheet so swiping down on the drag handle closes it.

**Changes to `src/components/ga-widgets/PaletteEditor.tsx`:**

- Track `touchStartY` on the drag handle bar (the `w-10 h-1 rounded-full bg-gold/30` element and the header area)
- On `touchEnd`, if vertical delta > 60px downward, call `setMobileOpen(false)`
- Add a visual feedback: translate the sheet down slightly during the drag gesture for a natural feel

---

### Part 3: Tutorial Approach Change

The current tutorial system uses hardcoded percentage-based `x`/`y` coordinates that attempt to guess where widget elements are. Since widget content is dynamic (API data, responsive layout), these coordinates often miss. 

**New approach -- Replace spotlight with a sequential card-based tutorial:**

Instead of trying to aim a spotlight at an element inside a live widget (which requires DOM measurement or perfect coordinate guesses), switch to a **numbered annotation card list** overlaid on the widget. This approach:

- Removes the SVG spotlight mask entirely
- Shows a numbered step card (1, 2, 3...) anchored to the TOP of the widget area, not positioned over specific coordinates
- Each card displays the label and description from the hotspot data
- Auto-advances with the same timer, or user clicks next/prev
- The widget beneath remains fully visible (dimmed slightly) -- no spotlight aiming needed
- This eliminates the "random area highlighting" problem entirely since nothing tries to point at specific pixel positions

**Changes to `src/components/ga-widgets/TutorialOverlay.tsx`:**

- Remove the SVG mask, spotlight rect, gold glow div, and inactive badges
- Replace with a floating annotation card that sits at the bottom of the widget container
- Keep the existing navigation controls (play/pause, prev/next, dots)
- Keep keyboard and swipe navigation
- Add a semi-transparent overlay (no cutout) so the widget is visible but the tutorial card has contrast
- The card shows the step number, label, and description in the same gold/navy styling

---

### Technical Details

**Background preset card rendering:**
Each card renders a 40x24px div with either a solid `hsl(bgHue, bgSat%, bgLit%)` fill, or a CSS `linear-gradient` in the preset's direction using the preset's HSL color. A `backdrop-blur` CSS property note is shown for presets with blur > 0.

**Swipe gesture implementation:**
```
onTouchStart: record e.touches[0].clientY
onTouchMove: calculate delta, apply translateY(delta) if delta > 0
onTouchEnd: if delta > 60 close, else snap back to translateY(0)
```

**Tutorial card-based approach:**
The annotation card uses `position: absolute; bottom: 0; left: 0; right: 0` inside the container, with the same `bg-navy-dark/95 border border-gold/30 backdrop-blur-sm` styling. The widget gets a simple `opacity: 0.6` overlay instead of the complex SVG mask. This is simpler, more reliable, and works regardless of widget content or layout.
