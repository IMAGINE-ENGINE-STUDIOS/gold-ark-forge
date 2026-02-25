

# Swap Terminal: Auth, Cloud Persistence, Sell Notifications & Live Position Pricing

## Problem Summary

1. **No login/register for paper accounts** -- Paper trading data is stored only in `localStorage`. There is no auth gate or user account system for the Swap terminal. The `paper_portfolios` table exists in the database with RLS but is never used.

2. **Paper positions not persisted to cloud** -- `usePaperTrading` reads/writes `localStorage` only. If the user clears their browser or switches devices, all positions and order history are lost.

3. **No sell notification** -- When closing a position via the SELL button on `PositionMiniCard`, `paper.closePosition()` calls `submitOrder()` but the sell path never calls `showTradeRecap()`. Only the `PaperTradingPanel` form calls `showTradeRecap()` after buy/sell, but direct position closes skip it entirely.

4. **PositionMiniCard prices are not truly live** -- For non-crypto assets, the card uses `useSimulatedStream` which applies random 0.03% jitter to the `currentPrice` prop. This is not the real resolved price from the metal/energy/forex feeds. The card should use the same price infrastructure as the Intelligence page (`GALivePriceNotice` widget pattern) rather than synthetic noise.

---

## Implementation Plan

### Step 1: Create Auth Pages (Login & Register)

Create a `/login` page with email/password login and registration forms. This uses the existing Supabase auth system (profiles table + `handle_new_user` trigger already exist).

- **New file: `src/pages/Login.tsx`** -- A dual-mode form (Sign In / Register) styled in the Gold Arrow aesthetic (navy/gold). Includes email + password fields, toggle between modes, and error display.
- **Edit `src/App.tsx`** -- Add `/login` route. No forced redirect; the Swap page itself will gate paper trading behind authentication.
- **Edit `src/components/Header.tsx`** -- Add a "Sign In" link in the nav when not authenticated.

Authentication uses standard email/password via `supabase.auth.signUp()` and `supabase.auth.signInWithPassword()`. The existing `handle_new_user` trigger auto-creates a profile and assigns the `user` role.

**Note:** Email confirmation will be required (not auto-confirmed) per security guidelines.

### Step 2: Persist Paper Portfolios to Cloud

Upgrade `usePaperTrading` to sync with the existing `paper_portfolios` table (which has `user_id`, `cash`, `positions` (jsonb), `orders` (jsonb) columns with proper RLS).

- **Edit `src/hooks/usePaperTrading.ts`**:
  - Accept an optional `userId` parameter
  - On mount, if authenticated, load from `paper_portfolios` table (falling back to localStorage)
  - On every state change (after `persist()`), debounce-upsert to the `paper_portfolios` table
  - Keep localStorage as a fast local cache and offline fallback
  - Use `useAutoSave` pattern (already in the codebase) for the cloud sync debounce

### Step 3: Gate Paper Trading Behind Auth in Swap

- **Edit `src/pages/TradingBridge.tsx`**:
  - Import Supabase auth state via `supabase.auth.getUser()` or a new `useAuth` hook
  - Pass the user ID to `usePaperTrading`
  - When not authenticated and trying to trade, show a prompt: "Sign in to save your paper trading progress" with a link to `/login`
  - Still allow viewing the charts and market data without auth

### Step 4: Add Sell Notification on Position Close

- **Edit `src/pages/TradingBridge.tsx`**:
  - Wrap the `paper.closePosition()` calls (in both desktop BOOK tab and mobile PORTFOLIO/BOOK) with a notification:
    ```typescript
    const handleClosePosition = (posId: string, price: number) => {
      const pos = paper.positions.find(p => p.id === posId);
      paper.closePosition(posId, price);
      if (pos) {
        const pnl = (price - pos.entryPrice) * pos.qty * (pos.side === 'buy' ? 1 : -1);
        showTradeRecap({ side: pos.side === 'buy' ? 'sell' : 'buy', qty: pos.qty, symbol: pos.symbol, price });
        toast({
          title: pnl >= 0 ? '🟢 Position Closed — Profit' : '🔴 Position Closed — Loss',
          description: `${pos.symbol}: ${pnl >= 0 ? '+' : ''}$${pnl.toFixed(2)} (${((pnl / (pos.entryPrice * pos.qty)) * 100).toFixed(2)}%)`,
        });
      }
    };
    ```
  - Replace all `onClose={(id, price) => paper.closePosition(id, price)}` with `onClose={handleClosePosition}`

### Step 5: Fix PositionMiniCard to Use Real Live Prices

The current `PositionMiniCard` uses `useSimulatedStream` (random jitter) for non-crypto and only uses WebSocket for crypto. Instead, it should accept a `resolvedPrice` prop from the parent (which already has the unified price resolver) and use `GALivePriceNotice` styling for the price display.

- **Edit `src/components/trading/PositionMiniCard.tsx`**:
  - Add a new prop `resolvedPrice: number` -- the real price from the parent's `resolveSymbolPrice()` function
  - Remove `useSimulatedStream` usage entirely
  - For crypto: keep the WebSocket integration (it works correctly)
  - For non-crypto: use `resolvedPrice` as the live price instead of simulated jitter
  - Replace the plain price text with an inline `GALivePriceNotice` component (size="sm") showing the real-time price with tick-flash animations (green/red on change)
  - Keep the sparkline but seed it from real price ticks, not simulated noise

- **Edit `src/pages/TradingBridge.tsx`**:
  - Pass `resolvedPrice={resolvePriceForTicker(pos.symbol)}` to every `PositionMiniCard` instance (desktop BOOK, mobile BOOK, mobile PORTFOLIO)

---

## Technical Details

### Files to Create
| File | Purpose |
|------|---------|
| `src/pages/Login.tsx` | Email/password auth page (sign in + register) |
| `src/hooks/useAuth.ts` | Lightweight auth state hook wrapping Supabase session |

### Files to Modify
| File | Changes |
|------|---------|
| `src/App.tsx` | Add `/login` route |
| `src/components/Header.tsx` | Add Sign In nav link |
| `src/hooks/usePaperTrading.ts` | Add cloud persistence via `paper_portfolios` table, accept userId |
| `src/pages/TradingBridge.tsx` | Auth gate for trading, sell notification wrapper, pass resolvedPrice to cards |
| `src/components/trading/PositionMiniCard.tsx` | Accept `resolvedPrice` prop, remove simulated stream, embed `GALivePriceNotice` |

### Database
No schema changes needed -- `paper_portfolios` table already exists with correct columns and RLS policies.

### No new dependencies required

