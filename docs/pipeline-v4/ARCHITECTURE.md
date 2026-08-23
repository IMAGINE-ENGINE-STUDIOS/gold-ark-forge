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
