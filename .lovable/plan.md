## Verdict on the previous plan

**Strategy: correct.** Three-pillar model (Bots · Agents · Pipelines) is the right shape and matches best-in-class precedents (3Commas templates, QuantConnect Alpha Framework, Composer symphonies, LangGraph/n8n typed-node graphs).

**Architecture: mostly correct — with 3 material corrections** the audit surfaced:

1. **The blast radius is small (safe to replace).** Tab keys `'genius'|'bot'|'automate'|'strategies'` are used *only* inside `src/pages/TradingBridge.tsx` — ~10 sites, all compiler-checked via the `BottomTab` union. Zero deep-links, zero persisted prefs, zero widget dependency. Good to proceed.
2. **Current "automation" is paper-only + one dead button.** WaveBot loop, Genius `autoExecute`, and Schedule/Alerts all touch **paper** state; `RuleBuilder`'s CREATE button is hard-disabled; `useScheduledOrders` never actually places orders. So the *pattern* to not inherit is client-side loops that call `submitOrder` directly.
3. **The real risk boundary is `broker-proxy`, not the automation UI.** It runs `verify_jwt=false` (with in-code auth), forwards `action`+`...params` to Alpaca/Coinbase/IBKR **with no server-side action allow-list, no notional cap, no idempotency key**, and `broker_connections.api_key/api_secret` are stored **plaintext**. Any live-automation phase must fix this *first* — the new UI must never be able to auto-place broker orders without a server gate.

## Revised, safe plan

### Phase 0 — Preserve (this PR)

**Widget Gallery** — new file `src/components/trading/automation/WidgetGallery.tsx` that re-exports the 5 existing components untouched (`GeniusPanel`, `WaveBotPanel`, `SchedulePanel`, `PriceAlerts`, `RuleBuilder`) plus a `<LegacyAutomationGallery/>` composition wired to the same hooks (`useWaveBot`, `useGeniusTrader`, `usePriceAlerts`, self-contained `SchedulePanel`/`RuleBuilder`). Zero behavior change; nothing is lost, everything is remountable.

**Refactor duplicated render trees.** Extract the mobile+desktop automation render blocks (currently duplicated at lines ~1358-1502 and ~1697-1859) into a single `<AutomationRouter sub=... />` component so the mobile/desktop drift risk goes away in the same pass.

### Phase 1 — Bots MVP (paper only, ship-ready)

New `src/components/trading/automation/AutomationBots.tsx` — template gallery of deterministic strategies with canonical formulas (all citations in the research brief):

| Template | Formula | Default params |
|---|---|---|
| Grid | `Pᵢ = P₀·(1±r)^i`, ATR-scaled `Δ` | 10 levels, ATR·0.5 spacing |
| DCA / Value Averaging | Edleson (1988): `order = V_target − V_actual`, capped | monthly, cap = 3× base |
| Momentum 12-1 | Jegadeesh-Titman (1993): rank 12m ret, skip 1m | long-only, top decile, hold 3m |
| Mean-Reversion | Bollinger z-score, entry `|z|>2`, exit `z→0` | window 20, k=2, regime-gated by ADX |
| Trend-Following | Donchian 20/10 + Turtle N-unit sizing | risk 1%/unit, stop 2N |
| Pairs / Stat-Arb | Engle-Granger cointegration + rolling ADF re-test | lookback 90d, entry z=2, stop z=3.5 |
| Wave (existing) | mounted from Gallery | unchanged |

Each card: deterministic **TypeScript-only** strategy fn (no LLM), a Deploy sheet, and mandatory risk overlay (fixed-fractional 0.5–1% risk/trade + ATR stop + ≤ Half-Kelly cap + per-strategy 15-20% max-DD circuit breaker). Execution goes through `paper.submitOrder` only; live is feature-flagged OFF for this phase.

### Phase 2 — Agents (proposal-only, with approvals)

New `src/components/trading/automation/AutomationAgents.tsx` + edge fn `supabase/functions/automation-agent/index.ts` built with the **Vercel AI SDK**, not raw fetch:

- Read-only tools: `getQuote`, `getIndicators`, `getPositions`, `getNews`. **No** write tools are registered on the research agent instance (defense-in-depth, not just a prompt).
- Proposal tool `proposeTrade` uses `Output.object` / `generateObject` with a **strict Zod schema** whose `symbol` is a Zod enum from the allow-listed universe → hallucinated tickers are rejected before the UI sees them.
- Any state-changing tool (`placeOrder`, `pauseBot`) is registered with `needsApproval: true` — loop pauses, UI renders an approval card, resumes only after `addToolResult`.
- `stopWhen: stepCountIs(25)` **plus** server-side wall-clock + per-run cost budget (kill mid-loop on breach).
- Per-user rate limit + daily token cost quota on the edge function.
- Prompt-injection defense for news/web tool outputs: wrap in `<untrusted_content>` blocks, instruct model to ignore embedded directives, strip suspicious ones.
- Models (from Lovable AI catalog): fast per-tick reasoning `google/gemini-3.5-flash`; deep research `google/gemini-3.1-pro-preview`; structured proposal extraction `openai/gpt-5.4-mini`. (These are the current-generation ids; existing GeniusPanel stays on its own model until migrated.)
- Genius v1 continues to run from the Gallery, unchanged, alongside the new agents until parity is proven.

### Phase 3 — Pipeline Builder (safe interpreter, no `eval`)

`src/components/trading/automation/AutomationPipelines.tsx` + `pipelineNodes.ts`:

- **Closed enum** of node kinds: `signal.rsi | signal.macd | signal.bollinger | signal.wave | signal.apex | filter.regime | filter.session | risk.atrStop | risk.halfKelly | risk.maxPositionPct | risk.maxDD | execution.orderIntent | monitor.drawdownAlert | monitor.log`.
- Graph stored as JSON `{ nodes: [{ id, kind, params, inputs[] }], version: 1 }`. `params` = primitives only (numbers, enums, strings) validated by per-kind Zod schema — **never code strings**.
- Compile: Kahn topo-sort, explicit DFS cycle check, hard caps (≤50 nodes, depth ≤12).
- Evaluate: fixed `NodeRegistry: Record<NodeKind, PureFn>` — no `eval`, no `new Function`. Execution nodes emit `OrderIntent` objects; they never call broker APIs directly (compile/evaluate strictly separated from execute).
- Ships 3 presets: "Half-Kelly Trend", "Bollinger Reversion + Regime Filter", "News-Aware Momentum".

### Phase 4 — Live-broker gating (do NOT ship until §Broker hardening below is done)

Two allowed live modes, both server-enforced:
- **Per-order approval** via `agent_approvals` (5-min TTL), OR
- **Signed policy** (max USD/order, max orders/day, symbol allow-list, max daily loss) validated deterministically server-side.

Both live behind a feature flag. Client cannot enable live automation until the broker-proxy hardening (below) is deployed and verified in a broker sandbox.

## Broker hardening (prereq for any live automation — separate PR, tracked but not started here)

- Add server-side `action` allow-list and per-action Zod validation in `broker-proxy`.
- Add hard notional/qty caps derived from `automation_configs.risk_policy`.
- Idempotency key on every order intent (hash of `run_id+ts+signal`); proxy dedupes.
- Move `broker_connections.api_key/api_secret` to Supabase Vault (or `pgcrypto` column-level encryption); rotate any keys after migration.
- Per-user rate limit on the proxy independent of AI edge fn.
- Kill-switch checked at the top of every proxy handler.

## Persistence — new tables (single migration)

`automation_configs`, `automation_runs`, `automation_events`, `agent_approvals` (schema and RLS in the research brief). RLS scoped to `auth.uid()`; explicit `GRANT` to `authenticated` and `service_role` per Lovable Cloud rules; client `automation_events` inserts routed through a SECURITY DEFINER RPC that forces `user_id = auth.uid()` and validates `event_type` — prevents users forging system/agent events. Consolidates the current fragmented localStorage keys (`ga_wave_bot_v1`, `ga_wave_trades_v1`, `ga_scheduled_orders`, `ga_price_alerts`) with cross-device sync.

## Vulnerabilities the new engine must NOT inherit (from audit)

1. Client-side `setInterval` loops that call `submitOrder` for real money — replaced by server-mediated intents in Phase 4.
2. No zod validation on AI edge functions — new `automation-agent` fn validates every input.
3. Direct interpolation of user text into system prompts — use delimited untrusted blocks.
4. Fragmented localStorage as source of truth — consolidated into `automation_configs`.
5. Advisory LLM output being treated as final risk arbiter — deterministic risk gate always sits between agent proposal and execution.

## Files

**New (Phase 0-1 in this PR)**
- `src/components/trading/automation/WidgetGallery.tsx`
- `src/components/trading/automation/AutomationRouter.tsx` (mobile+desktop deduplication)
- `src/components/trading/automation/AutomationBots.tsx`
- `src/components/trading/automation/strategies/{grid,dca,momentum,meanReversion,trendFollowing,pairs}.ts`
- `src/components/trading/automation/risk/{fixedFractional,halfKelly,atrStop,drawdownGate}.ts`
- `src/hooks/useAutomationConfigs.ts`

**New (Phase 2)**
- `src/components/trading/automation/AutomationAgents.tsx`
- `supabase/functions/automation-agent/index.ts`
- migration for `automation_configs / automation_runs / automation_events / agent_approvals`

**New (Phase 3)**
- `src/components/trading/automation/AutomationPipelines.tsx`
- `src/components/trading/automation/pipelineNodes.ts` (registry + topo + validator)

**Edited**
- `src/pages/TradingBridge.tsx` — `BOTTOM_CATEGORIES.automation.tabs = ['bots','agents','pipelines']`; `lastTabByCat.automation = 'bots'`; header bell `selectSubTab('automate')` → `selectSubTab('bots')` or a new alerts tab; delete the 8 duplicated automation render blocks in favor of `<AutomationRouter/>`.

**Untouched (preserved via Gallery)**
- `GeniusPanel.tsx`, `WaveBotPanel.tsx`, `SchedulePanel.tsx`, `PriceAlerts.tsx`, `RuleBuilder.tsx` and their hooks — no edits, no removed exports.

## Top 10 non-negotiables (from the research brief)

1. No broker secrets on client — server proxy only.
2. Every AI-authored order requires human approval OR a pre-signed, hard-capped policy.
3. Hard step + wall-clock + cost caps on every LLM loop, enforced server-side.
4. Only schema-validated proposals with symbol allow-list enum.
5. Deterministic risk gate (ATR stop, ≤ Half-Kelly, DD cap) between any signal and any order.
6. Pipelines compiled to typed JSON + fixed node registry — never `eval`/`new Function`.
7. Single fast kill-switch checked at every execution path.
8. Immutable per-user audit log for every signal / decision / approval / order.
9. Untrusted content = data, never instructions; research agents get no write tools.
10. Paper is default and visually distinct; explicit Backtest → Paper → Approval-Live → Signed-Auto promotion; no guaranteed-return language.

## Out of scope (this plan)

- Changes to WAVE / APEX math, paper trading engine, or other tab categories.
- Live broker execution (blocked until broker-proxy hardening ships).
- New external UI dependencies (proprietary GA widgets only).
