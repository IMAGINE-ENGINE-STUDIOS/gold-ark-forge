# Pipeline V4 — architecture notes

## State ownership

`src/pages/PipelineV4.tsx` is the only owner of the `PipeGraph`. Every change
goes through the `mutate(fn)` helper, which clones lanes and step arrays and
stamps `updatedAt`, so React sees a new reference and persistence stays honest.

Controllers exported to children:

| Controller | Purpose |
| --- | --- |
| `addLane` / `removeLane` | lane lifecycle |
| `addStep` / `addBlock` | append a step from the block catalogue |
| `updateStep` | replace a step's `config` (and optionally its label) |
| `patchStep` | non-config fields: `label`, `note`, `enabled`, `continueOnError` |
| `changeStepKind` | swap the action via `convertStep`, keeping the step's slot |
| `duplicateStep` | copy a step directly after itself |
| `moveStep` | reorder within the lane |
| `moveStepToLane` | relocate a step to another lane |

Genius (the AI assistant) calls the same controllers through `applyActions`, so
an AI edit and a human edit are indistinguishable to the model layer.

## Data model (`src/lib/pipelineGraph.ts`)

```
PipeGraph { id, name, risk { maxDrawdownPct, maxTotalInvestmentUsd }, lanes[], updatedAt }
PipeLane  { id, name, tint, steps[], consensus?, agree? }
PipeStep  { id, kind, label, config, enabled?, note?, continueOnError? }
```

`convertStep` carries `PORTABLE_KEYS` (ticker, label, amountUsd, price,
programId, classId, limit) across an action swap, but only when the new action's
default config declares that key. That keeps the swap predictable: you never
inherit a setting the new action cannot use.

`validateGraph` returns `error`/`warn` issues per lane and per step. Muted steps
are skipped. Errors block a run; warnings do not.

Persistence: `localStorage` under `ga_pipeline_v4_graph`, with a one-shot
migration from the V2 blueprint key `ga_blueprint_v2`.

## Runtime (`src/lib/parallelEngine.ts`)

`runGraph` starts every non-consensus lane with `Promise.all`, then runs the
consensus lanes on the collected `LaneOutcome[]`.

Per step the lane loop checks, in order: operator stop → shared risk stop → lane
already halted → step muted → operator note → the action itself. Failures push an
`error` event and halt the lane unless `continueOnError` is set.

Shared state across lanes: `stoppedByRisk`, cumulative `invested`, the strategy
`budget`, and the equity at run start (for drawdown maths).

## Presentation

`PipelineScene3D` renders lanes as rows in a react-three-fiber stage.
`CameraFocus` lerps the camera to the selected step, and follows the active step
while a run is in flight. Colours come from `KIND_COLOR` in `pipelineBlocks.ts`
so the 3D stage, the flat list and the report always agree.

## Live sessions, AI agents and ruling consensus (v4.2)

A run is a **session**, not an instant pass. `graph.session` holds `durationMin`,
`tickSec` and `flattenOnStop`. `runGraph` loops: every tick it runs all parallel
lanes at once, then the consensus lanes, then manages open positions.

- **Real data end to end.** `useMarketHistory` primes each lane's ticker with genuine
  historical closes from the `market-history` edge function before the first tick.
  The engine analyses `history + live prints`, never synthetic values.
- **Managed positions.** A buy step carries `takeProfitPct`, `stopLossPct` and
  `maxHoldMin`. `manageExits` marks every open trade to the live price on each tick
  and closes it when a rule fires, recording the exit reason.
- **Entry discipline.** `maxEntries` and `cooldownMin` stop a step re-trading on
  every tick.
- **AI agents.** The `agent` step kind is a fully prompted worker (name, system
  prompt, task prompt, model, temperature, confidence floor, and which context it
  may read). It calls the `pipeline-agent` edge function and returns
  bullish/bearish/neutral/hold with a confidence and a reason.
- **Ruling consensus.** A consensus lane reads every parallel lane on each tick and
  sets the trading gate for the next tick. With `veto` it also closes positions held
  by lanes that disagree.
- **Low-level report.** `RunReport.tsx` explains the session in plain English:
  summary and P&L attribution, per-position detail (entry, exit, reason, hold time,
  fees), the decision log (what each step looked at and why it chose what it chose),
  and the raw trace.
