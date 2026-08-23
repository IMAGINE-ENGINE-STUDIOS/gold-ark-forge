# Pipeline V4

Pipeline V4 is the visual strategy builder at `/pipeline-v4`. An operator assembles
**lanes** of **steps** (blocks), presses Play, and every lane executes at the same
time against live market data and the paper-trading account.

## Vocabulary

| Term | Meaning |
| --- | --- |
| Graph | The whole strategy: lanes + a shared risk envelope. |
| Lane | An ordered list of steps. Lanes run concurrently. |
| Consensus lane | Runs *after* the parallel lanes and acts on their combined signals. |
| Step | One block: pick an asset, run an analysis, buy, alert, run custom code… |
| Block | The catalogue entry a step is created from (`src/lib/pipelineBlocks.ts`). |

## Files

```
src/pages/PipelineV4.tsx                 page shell, all graph controllers, run loop
src/components/pipeline4/
  StepInspector.tsx                      every control for a single step
  PipelineScene3D.tsx                    3D stage, camera focus, lane rendering
  GeniusPanel.tsx                        AI assistant (reads + mutates the graph)
  AccountHud.tsx / PositionsPanel.tsx / OrdersPanel.tsx / RunPerformance.tsx
src/lib/
  pipelineGraph.ts                       data model, validation, persistence
  pipelineBlocks.ts                      block catalogue + plain-language copy
  parallelEngine.ts                      concurrent runtime
  analysisPrograms.ts / assetClassifiers.ts / customBlocks.ts
docs/pipeline-v4/ARCHITECTURE.md         how the pieces fit together
```

## Step controls

The inspector (right rail → **Step**) exposes:

- **Action** — swap what the step does in place; compatible settings (asset,
  amount, price, program) are carried over by `convertStep`.
- **Step name** — free rename, used in the 3D stage and the run report.
- **Lane** — move the step into another lane.
- **Mute / duplicate / reorder / delete** — icon row at the top.
- **Advanced** — operator note (echoed into the run trace) and
  "keep the lane running if this step fails".

## Runtime rules

1. Muted steps (`enabled === false`) are skipped and are not validated.
2. A failing step halts its lane unless `continueOnError` is set.
3. The shared risk gate can stop every lane at once.
4. Nothing is simulated: all prices come from the live feed; orders go to the
   paper-trading account.
