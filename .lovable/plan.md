# Reorganize TradingBridge Bottom Panel

Today the bottom panel is a flat strip of 11 tabs (TRADE · GENIUS · BOOK · BOT · AUTOMATE · BACKTEST · MARKET · ANALYTICS · RISK · STRATEGIES · SOCIAL). It mixes execution, automation, research and community into one row, so nothing tells the trader where to go for what. This plan groups them into 5 workflow categories with a two-level nav, and preserves every existing panel and behavior.

## Feature map (categorization)

| Category | Icon | Sub-tabs (existing) | What lives there |
|---|---|---|---|
| **EXECUTE** | ArrowUpDown | Trade · Book · One-Click | Manual order entry, live/paper positions, order history, pending ask/buy limits |
| **AUTOMATION** | Bot | Genius · Bot (Wave) · Automate · Strategies | AI strategist, Wave bot, schedules + price alerts, rule/strategy library + technical gauge |
| **RESEARCH** | Layers | Market · Analytics · Backtest | Heatmaps, screeners, calendar, news, cross-asset dashboards, portfolio allocator, backtester |
| **RISK** | Shield | Risk Panel · Limits · Volatility Matrix | Drawdown, exposure, RiskLimits + volatility/ratio/heatmap widgets |
| **COMMUNITY** | Users | Social | Copy-trading, leaderboard, feed |

Rationale for the splits:
- Genius, Wave Bot, Automate (schedules/alerts) and Strategies all *replace or assist* the trader — they belong together, not scattered.
- Backtest is research about a strategy, not execution — it moves next to Analytics/Market.
- Book (positions + orders) stays with Trade because closing a position is an execution action.
- Risk stays standalone because it's monitored continuously, not workflow-driven.

## UI change

Replace the single row of 11 pills with a two-level nav in the same header slot:

```text
┌──────────────────────────────────────────────────────────────────────┐
│ [EXECUTE] [AUTOMATION] [RESEARCH] [RISK] [COMMUNITY]      ← primary  │
│  ─────────                                                            │
│  Trade │ Book │ One-Click                              ← secondary    │
└──────────────────────────────────────────────────────────────────────┘
```

- Primary row: 5 category chips, gold underline on active, same visual language as current pills (font-display, tracking-wider, gold-on-navy).
- Secondary row: only the sub-tabs of the active category, smaller (text-[9px]), muted until hovered/active.
- When only one sub-tab exists (Community → Social), hide the secondary row.
- Selecting a category defaults to its first sub-tab; state is remembered per category so switching back restores the last sub-tab.
- Mobile drawer: same two-level structure inside the existing bottom sheet — category chips scroll horizontally on top, sub-tabs below.

## Technical changes (single file)

- `src/pages/TradingBridge.tsx`
  - Replace `BOTTOM_TABS` with a `BOTTOM_CATEGORIES` array of `{ key, label, icon, tabs: SubTab[] }`.
  - Add `bottomCategory` state alongside existing `bottomTab`. Derive default sub-tab from category. Keep a `Record<CategoryKey, BottomTab>` to remember last sub-tab per category.
  - Update `handleTabClick` and the two render sites (desktop ~line 1285, mobile drawer ~line 1595) to render the two-row nav. Keep every existing `{bottomTab === '...' && ...}` render block unchanged.
  - Update the "quick jump to automate" button (line 1472) to also set the category to `automation`.
  - No changes to any widget, panel component, or hook.

## Out of scope

- No changes to Trade form, Genius, WaveBot, Backtest, or any GA widget.
- No route or data-model changes.
- No new dependencies.
