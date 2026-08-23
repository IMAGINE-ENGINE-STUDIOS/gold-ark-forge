# Real live price indicator in the Step Inspector

Today the inspector shows a frozen number (e.g. "Use live price 0.2182"). That value is computed once when a step is selected and never refreshes, and it comes straight from the pipeline's in-page price map — not from the shared Gold Arrow live-price widget used elsewhere in the app.

## What changes

Replace the raw number with the existing `LivePriceIndicator` widget (the same one used in Swap, Pipeline, and the Blueprint canvas), so the inspector shows a genuinely live, pulsing quote for the step's asset, backed by the unified market-quotes feed with no synthetic fallback.

Where it appears:
- Asset step: live pill under the asset picker instead of the static "Live price: …" line.
- Alert / price-condition step: "Use live price" button pulls the current streaming value at the moment it is clicked, and a live pill sits next to it.
- Trade step: the "about N units" hint recalculates as the price ticks.

If no asset is defined earlier in the lane, the widget shows its standard "NO SYMBOL CONTEXT" state instead of a misleading zero.

## Technical notes

- `src/pages/PipelineV4.tsx`: pass the resolved `ticker` for the selected step (walk back through the lane, same logic as the current `selectedPrice` memo) plus the `resolvePriceForTicker` resolver into `StepInspector`. Keep `price` as an initial value for backwards compatibility.
- `src/components/pipeline4/StepInspector.tsx`: import `LivePriceIndicator` from `@/components/trading/LivePriceIndicator`, render it with `ticker` and `getPriceByTicker={resolvePriceForTicker}`, and hold the streamed value in local state via its `onPrice` callback. Use that state (not the stale prop) for the "Use live price" button and the units hint.
- No engine, graph, or backend changes; presentation only.
