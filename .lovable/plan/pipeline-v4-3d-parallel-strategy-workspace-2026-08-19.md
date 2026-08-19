# Pipeline V4 — 3D Parallel Strategy Workspace

The current Pipeline is a single vertical list of steps that runs top to bottom, one action at a time. You want a 3D workspace where several actions sit side by side and run simultaneously, and a Genius that actually builds, tests, remembers and explains instead of stalling on "not enough data".

## What is wrong today

- The graph is a flat ordered list, executed one node after another. Parallel branches are structurally impossible.
- Genius keeps no memory: chat lives in component state only and just the last 8 messages are sent, so a refresh or tab change wipes your objective.
- A reply with zero actions is accepted as valid, so Genius talks instead of building.
- When live samples are thin, the objective engine returns "insufficient data" and Genius stops rather than proposing a smaller, honest test.
- The block library shows two unexplained bars (ASSETS/SCREENS/ANALYSIS/ACTIONS/MY BOXES and ALL/ORDERS/GUARDS/LOGIC/ALERTS/PLAYBOOKS) with no explanation of what anything does.

## What gets built

### 1. A real 3D canvas with parallel lanes

A WebGL workspace replacing the vertical list:

- Lanes run horizontally. Each lane is one independent strategy track — for example gold, bitcoin, and an index — placed side by side in depth and executed simultaneously.
- Steps read left to right inside each lane, so a strategy reads like a sentence.
- Depth is meaningful: the front lane is your focus, lanes behind show their own live status on every block.
- Orbit, pan and zoom; click a block to configure it; drag a block into another lane to fork a strategy.
- Connections animate during execution, so you watch several branches run at once.
- A flat list view remains available for small screens and accessibility.

### 2. Parallel execution engine

- Lanes execute concurrently; steps inside a lane stay ordered.
- Each lane carries its own asset context, signal state and budget.
- A join step can wait on several lanes and act on the combined result, for example buy only when two of three lanes agree.
- Shared risk controls apply across all lanes at once: a portfolio drawdown limit halts every lane immediately.
- Every lane produces its own trace, so you see exactly which branch worked and which failed.

### 3. Genius that builds, tests, repairs and remembers

- Persistent memory: conversation, your stated goal and every decision are saved per user in the backend and restored on load, with a rolling summary of older turns sent on every request.
- Enforced action: a turn with no build and no test is rejected server-side and retried, so commentary alone is not an acceptable answer.
- Real repair loop: after building, it runs on the paper account, reads the trace, fixes what failed and runs again automatically within a bounded number of attempts, then reports what actually happened.
- Never stalls on thin data: with few samples it builds a smaller, lower-risk test, states plainly that confidence is low and why, and shows what the measured tape does support. It always returns a workflow.
- Relevant options: next steps are generated from the real graph and trace, such as "Add a gold lane" or "Tighten the stop to 2%", and passive suggestions are filtered out.

### 4. An interface that explains itself

- Noir and gold palette, Libre Baskerville headings, IBM Plex Sans body, 14px minimum text.
- One searchable library with plain names and one-line explanations: Assets, Market conditions, Analysis, Actions, Risk, Alerts, Custom logic — replacing the two cryptic bars.
- Every block states in plain English what it does and what it requires.
- "Notional (USD)" becomes Investment amount, with currency selection and live conversion.
- Persistent panels for your goal, live evidence and probability, lane status, and test results.

## Technical notes

- New `src/lib/pipelineGraph.ts`: lane-based graph model plus migration of existing saved blueprints, so nothing you built is lost.
- New `src/lib/parallelEngine.ts`: concurrent lane executor with shared risk gate, per-lane traces, join nodes and cancellation.
- New `src/components/pipeline3d/`: three.js scene, lane rig, block meshes, connection curves, camera controls, selection and inspector, built on the installed React Three Fiber 8 / drei 9 stack.
- `objectiveEngine.ts`: low-sample fallback derived from measured drift and volatility with explicit confidence labelling; no synthetic prices.
- `pipeline-v2-genius` edge function: server-side action enforcement, automatic test-and-repair cycle, conversation summarisation.
- New backend tables for Genius conversations and saved pipelines, with row-level security scoped to each user.
- Testing stays on the paper account only; no live orders.

## Verification

Build a two-lane strategy through Genius, confirm both lanes execute simultaneously with separate traces, confirm the repair loop fixes a deliberately broken lane, and confirm the conversation and graph survive a reload.