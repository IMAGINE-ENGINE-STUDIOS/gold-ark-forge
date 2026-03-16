

## Plan: Gold Arrow Investor Deck at `/deck`

### What we're building

A full-screen slide presentation editor/viewer at `/deck` following the architecture from the slides-app pattern — fixed 1920x1080 resolution with CSS scale transform, thumbnail sidebar, fullscreen presentation mode, and keyboard navigation.

The deck will be pre-populated with Gold Arrow investor slides covering the company pitch.

### Slides content (pre-built)

1. **Title** — Gold Arrow logo, tagline, "Investor Presentation 2026"
2. **Problem** — Opacity in bullion markets, lack of digital certification
3. **Solution** — Blockchain-anchored asset certification platform
4. **Market Opportunity** — TAM/SAM/SOM for digital bullion & commodity certification
5. **Product** — Platform overview: Marketplace, Vault, Intelligence, Trading Bridge
6. **How It Works** — Certificate lifecycle: mint → anchor → verify → transfer
7. **Business Model** — Revenue streams: certification fees, trading commissions, API licensing
8. **Traction** — Key metrics pulled live from the database (certificates issued, vault holdings, partners)
9. **Technology** — Stack overview: blockchain anchoring, real-time pricing, AI analysis
10. **Team** — Leadership placeholders
11. **Roadmap** — 2026-2027 milestones
12. **Ask** — Funding round details, contact CTA

### Architecture

**New files:**
- `src/pages/Deck.tsx` — Main deck page with slide navigation, scaling logic, sidebar thumbnails, fullscreen mode
- `src/components/deck/SlideLayout.tsx` — 1920x1080 scaled wrapper component
- `src/components/deck/slides/` — One component per slide (TitleSlide, ProblemSlide, etc.)
- `src/components/deck/DeckSidebar.tsx` — Thumbnail strip sidebar
- `src/components/deck/DeckToolbar.tsx` — Top bar with present/grid/nav controls

**Modified files:**
- `src/App.tsx` — Add `/deck` route
- `src/index.css` — Add scoped `.slide-content` font scaling rules

### Technical approach

- All slides render at fixed **1920x1080** and scale via `transform: scale()` to fit viewport
- Slide wrapper centers absolutely with `left:50%; top:50%; margin-left:-960px; margin-top:-540px`
- Gold Arrow design system (navy, gold, Cinzel font) applied throughout
- Keyboard navigation: arrow keys, Space, Escape from fullscreen
- Fullscreen via `document.documentElement.requestFullscreen()`
- Slide 8 (Traction) will pull live data from existing hooks (`useCertificateReserveTotals`, `useBullionBars`, `usePartners`)
- Ornate corners and greek-key borders reused from existing GA widget patterns
- No external slide libraries — fully proprietary

### Styling

Navy/gold theme matching the rest of Gold Arrow. Each slide uses the brand's ornate aesthetic with gold accents, Cinzel display font, and subtle gradients. Professional investor-deck formatting with clean typography hierarchy.

