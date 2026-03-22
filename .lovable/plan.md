

## Plan: Navigation Icons + Intelligence Tab-Based Layout

### Two changes requested:

---

### 1. Header Navigation — Add Gold Icons & Fix Overflow

**Problem**: Nav items are text-only and overflow beyond the screen at 1512px viewport (10 items with `gap-12` and `tracking-[0.15em]` is too wide).

**Solution** in `src/components/Header.tsx`:
- Add an `icon` property (Lucide) to each nav item in the `navItems` array
- Render the icon next to each label in the nav bar (gold colored, ~14px)
- Reduce `gap-12` between items to `gap-6` and between item+diamond to `gap-6`
- Reduce tracking from `0.15em` to `0.1em` and font size to `text-xs`
- Remove the diamond separators to save space, or replace with a thin `|` divider
- This ensures all 10 items fit within the viewport width

**Icon mapping**:
- Marketplace → `Store`, Markets → `BarChart3`, Swap → `ArrowLeftRight`, Intelligence → `Brain`, The Vault → `Vault`, Verify → `ShieldCheck`, About Us → `Info`, Oil & Gas → `Fuel`, Insights → `Lightbulb`, Admin → `Settings`

---

### 2. Intelligence Page — Category Tabs Instead of Full Page Scroll

**Problem**: All 40+ widgets render on one long page. User wants to click a category tag and see only that category's widgets below the tags, switching in-place.

**Solution** in `src/pages/Intelligence.tsx`:
- Group sections into categories (matching existing tiers): Market Data, Blockchain Live, DeFi & Sentiment, Composite Tools, Proprietary Data, Trading Tools, Oil & Gas
- Replace the current scroll-to buttons with tab-style category buttons
- Use `useState` to track the active category
- Only render the widgets belonging to the active category below the tag bar
- Default to "Market Data" on load
- Remove the `scrollTo` behavior — content appears inline below the tabs
- Keep the `TierBanner` and `SectionDivider` within each category group
- Each category maps to its existing tier block of sections

**Structure**:
```text
[Header]
[GAMultiTicker]
[Hero Banner]
  [ Market Data | Blockchain | DeFi | Composite | Proprietary | Trading | Oil & Gas ]
  ─────────────────────────────────────────────────
  [ Active category's widgets rendered here ]
[Footer]
```

---

### Files Modified
- `src/components/Header.tsx` — icons + compact spacing
- `src/pages/Intelligence.tsx` — tab-based category switching

