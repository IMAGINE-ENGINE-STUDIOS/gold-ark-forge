

# Deck Redesign — Next-Generation Greek & Gold Pitch

## Summary
Redesign all 9 investor deck slides to be visually dynamic, elegant, and filled with the Greek/gold aesthetic from the main website. Each slide will use the full 1920x1080 canvas with ornate borders, gold gradients, larger icons, and richer layouts. The Asset Classes slide will use the actual category images from the homepage.

## Slides to Redesign

### 1. TitleSlide (Cover)
- Add radial gold glow background effect behind the title
- Larger greek-key borders (full width)
- Add subtle gold dot-grid pattern overlay (matching homepage)
- Increase title to 120px, add shimmer animation class

### 2. AboutSlide — "What is Gold Arrow?"
- Split into two-column layout: left = mission text with gold accents, right = 3 vertical pillars (Tokenize/Trade/Trust) with larger icons (80px)
- List all 9 asset classes inline with gold bullet separators
- Add greek-key divider between sections
- Gold gradient accent line under heading
- More dynamic typography hierarchy

### 3. ProblemSlide — "The Institutional Crisis"
- Retitle to emphasize multinational institutional urgency: "A $85 Trillion Crisis"
- Make icons larger (80px) in gold-bordered circles
- Use dramatic two-row layout with each problem as a "card" with gold border glow
- Add a bold stat callout bar at bottom: "$85T+ in assets with no digital chain-of-custody"
- More aggressive color: red/amber warning accents mixed with gold

### 4. SolutionSlide
- Rename subtitle to emphasize tokenization
- Three pillars with much larger icons (96px), gold-glowing icon containers
- Add connecting gold lines between the three pillars (visual flow)
- Greek key border divider

### 5. AssetClassesSlide — "Nine Tokenizable Asset Classes"
- Replace icon-only cards with image cards using the actual `category-*.jpg` assets from `src/assets/`
- 3×3 grid of cards, each with the category image (aspect 16:9), dark overlay, gold border, ornate corners
- Market size badge in gold on each card
- Matching the homepage CategoryCards design but adapted for the slide canvas
- Bottom bar: "$85T+ Combined Addressable Market"

### 6. PlatformSlide — Tokenization Platform
- Rewrite feature descriptions to focus on: tokenization of assets, certificates, trading, real-time verification, international platform
- 6 features in 2×3 grid with larger icons (64px)
- Each card gets a gold left-border accent
- Add greek-key border divider under title

### 7. MarketSlide — Keep mostly as-is but:
- Add greek-key divider
- Gold gradient on bar chart bars
- Larger TAM/SAM/SOM stat boxes with ornate corners

### 8. AskSlide — Keep mostly as-is but:
- Add gold ornate borders on fund allocation cards
- Greek-key divider

### 9. TeamSlide — Keep mostly as-is but:
- Gold ring borders on avatars
- Greek-key divider

## Files to Modify
1. `src/components/deck/slides/TitleSlide.tsx` — enhanced cover
2. `src/components/deck/slides/AboutSlide.tsx` — full redesign with 9 asset classes listed
3. `src/components/deck/slides/ProblemSlide.tsx` — dramatic institutional crisis framing
4. `src/components/deck/slides/SolutionSlide.tsx` — larger icons, tokenization focus
5. `src/components/deck/slides/AssetClassesSlide.tsx` — image cards from homepage assets
6. `src/components/deck/slides/PlatformSlide.tsx` — tokenization narrative rewrite
7. `src/components/deck/slides/MarketSlide.tsx` — gold accents
8. `src/components/deck/slides/AskSlide.tsx` — gold accents
9. `src/components/deck/slides/TeamSlide.tsx` — gold accents

## Technical Notes
- All category images already exist in `src/assets/` (category-energy.jpg, category-art.jpg, etc.)
- Reuse CSS classes from index.css: `text-gradient-gold`, `greek-key-border-rich`, `ornate-corner-*`, gold dot-grid pattern
- All slides remain at fixed 1920×1080 within `SlideLayout`
- No changes to Deck.tsx routing or navigation logic

