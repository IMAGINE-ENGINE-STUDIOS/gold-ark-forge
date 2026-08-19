# Pipeline V4 — Portfolio, Performance & Trading Tools

Right now `/pipeline-v4` shows the strategy builder only: a block palette, the 3D lanes, and a Genius/Step/Report rail. The paper account exists behind the scenes (equity, cash, positions, orders, realized P&L, win rate are all already tracked) but the only thing on screen is a single "paper equity" number in the header. There are no positions, no live P&L, no funds indicators, no per-lane run performance, and no manual trading tools.

## What gets added

### 1. Account HUD (top strip, always visible)
A dedicated row of live tiles above the workspace:
- Equity, Cash available, Buying power used
- Total P&L (realized + unrealized) in $ and %, colour-coded
- Unrealized P&L from open positions only
- Win rate, trade count, total fees paid
- Budget meter: capital deployed vs the strategy budget
- Drawdown meter: current drawdown vs the loss limit, turning red as it approaches the cap

All values update every second from live prices, the same cadence used by the run engine.

### 2. Left rail becomes a tabbed workbench
Instead of only the block palette, the left column gets tabs:
- **Blocks** — the existing palette, unchanged
- **Positions** — every open position with logo, side, quantity, entry price, live price, P&L $/%, and a one-click Close button (market close at live price). Includes a Close all control.
- **Orders** — recent fills and pending orders with side, quantity, fill price, fees, and the lane that placed them
- **Trade** — manual trading desk: asset search, buy/sell, amount in dollars with the currency field, live price readout, and a market/limit toggle. Lets you trade by hand next to the automated lanes.
- **Screens** — the live asset classification board from V3 (hottest, best performing, biggest opportunity, critical risk, etc.), with click-to-add into the selected lane

### 3. Live performance of running pipelines
- Each 3D lane card gets a live status strip: running / idle / error, steps completed, trades placed by that lane, and that lane's P&L contribution
- The **Report** tab is upgraded from a plain trace list into a performance view: an equity curve since the run started, per-lane result cards (trades, wins, P&L, last event), and the filtered event trace underneath
- Run summary persists after the run finishes so results can be reviewed

### 4. V3 features carried over
- Live Screens board (above)
- Code Studio access, so custom code blocks can still be written and dropped into lanes
- Asset Universe search with company logos inside the Trade and Screens tabs

## Technical notes
- Data source is the existing `usePaperTrading` account exposed through `PipelineProvider` (`positions`, `orders`, `account`, `submitOrder`, `closePosition`, `updatePositionPrices`) — no schema changes, no new backend.
- Lane attribution: `RunEvent` already carries `laneId`/`laneName`; the engine will tag orders it places with the lane so per-lane P&L can be computed from the order book.
- New components under `src/components/pipeline4/`: `AccountHud`, `PositionsPanel`, `OrdersPanel`, `TradeDesk`, `ScreensPanel`, `RunPerformance`; left rail refactored into a tab container in `src/pages/PipelineV4.tsx`.
- Reuses existing `LivePriceIndicator`, `CurrencyAmountField`, `SymbolLogo`, `ClassifierBoard` logic and `assetClassifiers`.
- Genius context gains positions, open P&L and per-lane results so it can reason about actual performance when repairing a strategy.
- Layout keeps the three-column grid at desktop and stacks to Account HUD → stage → tabs on mobile; 13px type floor maintained.
