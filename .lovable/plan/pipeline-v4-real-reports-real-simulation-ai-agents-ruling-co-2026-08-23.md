# Pipeline V4: real reports, real simulation, AI agents, ruling consensus

Four problems to fix, in order of impact.

## 1. Runs are instant, so they can never make money

Today a run walks every step once and finishes in under a second. It buys at the current price and stops — there is no time for a position to move, so P&L is always ~zero minus fees.

Change the run into a **live session**:

- A run has a duration and a tick interval the operator sets (for example: run for 30 minutes, re-evaluate every 15 seconds). Defaults: 15 min / 10 s.
- Each tick re-reads the real live feed, re-runs analysis on the lane's real price series, and can enter, add, trim or exit.
- Every buy step gets take-profit, stop-loss and max-hold settings. When a level is hit on real prices, the engine closes the position and logs why.
- Positions stay open and mark to market between ticks; equity is sampled continuously into the run curve.
- Stop button ends the session; an option decides whether open positions are flattened or left running.

## 2. Simulation must use real data end to end

- New backend endpoint returns **real historical closes** (1-minute for the last day, plus daily bars) for any ticker from the same providers already used for quotes.
- On run start each lane's asset is seeded with that real history, so analysis programs have enough real prints immediately instead of reporting "needs more live prints".
- Live ticks append real observed prices onto that real history. Nothing synthetic anywhere.
- Fills keep the existing paper model (real price + spread, slippage, commission) so the simulated cost of trading matches reality.

## 3. A real, low-level report a human can read

Replace the current one-line trace list with a **Run report** with two levels:

- **Plain summary** at the top: what the strategy tried to do, how long it ran, what it bought and sold, what each trade made or lost, total fees, net result, and one honest sentence on why it did or did not make money (no signal, condition blocked it, stop hit, not enough time, fees ate the move).
- **Step-by-step detail**, grouped by lane and by tick: for each step the inputs it saw (price, indicator values, thresholds), the decision it made, and the reason in plain English. Trades expand into entry price, exit price, quantity, fees, holding time and P&L.
- Per-trade table and a per-lane contribution breakdown, so it is obvious which lane made or lost the money.
- Export the whole report as text so it can be shared or pasted back into Genius.

## 4. Agent step + consensus that actually rules

**New step kind: Agent.** A configurable AI worker inside a lane.

- Fully editable: name, system prompt, task prompt, model, temperature, and what it is allowed to see (price, series, indicators, screen results, positions, other lanes' outputs).
- Returns a structured verdict (bullish / bearish / neutral / hold), a confidence number and a short reason, which flows into the lane signal exactly like an analysis step, so branch, buy and consensus steps can act on it.
- Runs on a backend function using the existing AI gateway; the operator sees the agent's reasoning line in the report.

**Consensus lanes become the ruling layer.**

- A consensus lane sees every parallel lane's full output: signal, confidence, ticker, agent reasoning, analysis values, and what each lane traded.
- Its agree rule (all / any / majority / count, with confidence weighting) decides whether trading continues, and it can veto and flatten positions opened by lanes that disagree.
- A consensus lane can itself contain agent steps with prompts, so an operator can write "only allow risk-on when at least two lanes are bullish and the dollar is not rallying" and have the agent arbitrate across all lane reports.
- Consensus verdicts and vetoes are first-class entries in the report.

## Technical notes

- `src/lib/parallelEngine.ts`: session loop (duration, tick interval, per-tick lane pass), position tracking with TP/SL/max-hold, structured `RunEvent` payloads (inputs, decision, reason) plus a new `TradeRecord[]` and per-lane attribution in `RunResult`.
- New `supabase/functions/market-history/index.ts` returning real close series; new hook to seed `useLiveSeries` with it.
- New `supabase/functions/pipeline-agent/index.ts` for agent steps (AI gateway, structured verdict output).
- `src/lib/pipelineGraph.ts` + `src/lib/pipelineBlocks.ts`: add `agent` step kind, TP/SL config on trade steps, session settings on the graph.
- `src/components/pipeline4/StepInspector.tsx`: agent configuration panel (prompts, model, context toggles) and trade exit rules.
- New `src/components/pipeline4/RunReport.tsx` replacing/absorbing `RunPerformance.tsx`; run controls in `src/pages/PipelineV4.tsx` gain duration and interval.
- Docs in `docs/pipeline-v4/` updated for the session runtime, agents and consensus rules.
