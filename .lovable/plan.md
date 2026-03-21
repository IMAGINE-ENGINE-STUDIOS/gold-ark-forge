

# Deck Slide Redesign: About Slide + Solution Slide

## 1. AboutSlide — Pillar Cards as Image Squares + Hover Animations

**Current**: Three pillars (Tokenize/Trade/Trust) on the right column are circular icons with text beneath — static and plain.

**Change**: Replace the three circular pillar icons with **square image cards** matching the CategoryCards style from the homepage:
- Each card is a square with a background image, dark gradient overlay, ornate gold corner brackets, and a gold bottom accent line
- Images: use thematic assets (gold-bars-rich.jpg for Tokenize, a relevant asset for Trade, another for Trust) or use solid radial-gradient backgrounds with large icons
- On hover (CSS transitions): scale up slightly (`transform: scale(1.05)`), increase gold border glow (`box-shadow` brightens), and the icon pulses
- Title overlaid on card in Cinzel with `text-gradient-gold`
- Description below the card
- Add `transition-all duration-500` and `group-hover` classes for smooth interaction

**Layout stays**: Left column = mission text + 9 asset class grid. Right column = 3 square pillar cards stacked vertically with hover effects.

## 2. SolutionSlide — Animated Infrastructure Pipeline

**Current**: Three static pillars side-by-side with a connecting gold line. Boring.

**Change**: Redesign as a **step-by-step infrastructure animation** showing how the platform builds the tokenization pipeline. Use CSS `@keyframes` with staggered `animation-delay` to reveal each step sequentially:

**5 pipeline steps** (vertical or diagonal flow):
1. **Connect** — "Institutional Onboarding" — connecting with banks, vaults, custodians
2. **Digitize** — "Asset Digitization" — physical assets scanned, verified, catalogued
3. **Tokenize** — "Blockchain Certification" — mint tokens, anchor to Bitcoin
4. **Trade** — "Global Trading" — T+0 settlement, 24/7 market access
5. **Monitor** — "Real-Time Surveillance" — live verification, proof-of-reserves

**Visual structure**:
- Left-to-right horizontal pipeline with gold connecting lines that "draw" in via CSS (`stroke-dashoffset` animation or width transition)
- Each step is a numbered node (gold circle with step number) connected by animated gold lines
- Below each node: icon + title + short description
- Steps fade in sequentially with `animation-delay: 0s, 0.4s, 0.8s, 1.2s, 1.6s`
- A gold "pulse" travels along the connecting line after all steps appear
- Background: subtle grid pattern overlay for "infrastructure" feel

**CSS approach**: Define keyframes in inline styles or use Tailwind's `animate-fade-in` with custom delays via `style={{ animationDelay }}`. The connecting lines use `transition: width 1s` triggered by a state that sets on mount.

## Files Modified
1. `src/components/deck/slides/AboutSlide.tsx` — square pillar cards with hover animations
2. `src/components/deck/slides/SolutionSlide.tsx` — 5-step animated infrastructure pipeline

