

# Admin Dashboard, Persistence, and Default Asset System

## Overview
This plan covers four major areas: (1) creating a main admin account, (2) building a comprehensive admin dashboard, (3) implementing platform-wide persistence/caching, and (4) setting Gold/USD as the default trading asset.

---

## 1. Admin Account for Ricardo Font

- Create the admin user via the authentication system with email `ricardofont@gmail.com` and password `12345678`
- Insert the admin role into `user_roles` table for this user
- This will be done through database operations after the user signs up, or by seeding the account via an edge function

**Note:** Since Lovable Cloud requires email verification by default, we will enable auto-confirm temporarily for this seed account, or create a dedicated edge function to provision the admin.

---

## 2. Admin Dashboard (Replaces current Admin page)

The current `/admin` page only has Partners, Sites, and Certificates tabs. We will expand it into a full dashboard with these tabs:

### Tab: Overview
- Key platform metrics cards (total certificates, active partners, vault holdings summary, total users)
- Recent activity feed from `audit_logs`
- Quick-action buttons

### Tab: Registries
- Sub-tabs for: Forecast Log Registry 1, Forecast Log Registry 2, Audit Logs, Certificate Events
- Embedded views pulling data from existing pages/localStorage

### Tab: Performance
- Platform performance dashboard: certificate issuance over time, transfer volume, reserve snapshot trends
- Charts using Recharts (already installed)

### Tab: API Keys
- Form to configure broker API keys (Alpaca, Coinbase, IBKR)
- Data feed API keys (EIA, metal prices, crypto feeds)
- Reads/writes to `broker_connections` table for the admin
- Secure secret management UI for edge function secrets

### Tab: Partners (existing)
### Tab: Sites (existing)
### Tab: Certificates (existing)

---

## 3. Platform Persistence and Caching

### 3a. User Preferences Table
Create a new `user_preferences` table:
```
user_preferences
- id (uuid, PK)
- user_id (uuid, FK to auth.users, unique)
- last_symbol_key (text) -- e.g. "gold"
- last_timeframe (text) -- e.g. "1D"
- default_symbol_key (text, default "gold")
- platform_config (jsonb) -- general config blob
- updated_at (timestamptz)
```

RLS: Users can read/update only their own row.

### 3b. Paper Trading Persistence
- Move paper trading state from `localStorage` to a `paper_portfolios` table:
```
paper_portfolios
- id (uuid, PK)
- user_id (uuid, FK)
- cash (numeric, default 100000)
- positions (jsonb)
- orders (jsonb)
- updated_at (timestamptz)
```

### 3c. Auto-Save System
- Create a `useAutoSave` hook that debounces writes to `user_preferences` on changes
- On page load, read preferences and restore last viewed symbol, timeframe, configurations
- Falls back to localStorage for unauthenticated users

### 3d. Cache Layer
- Use React Query's built-in cache with `staleTime` and `gcTime` for API responses
- Store last-known prices in localStorage as fallback for offline/startup

---

## 4. Default Asset: Gold/USD

- `ALL_SYMBOLS[0]` is already `gold` (XAU/USD), so the Trading Bridge already defaults to it
- Enhance: when user preferences exist, load `last_symbol_key` from preferences on mount
- When no preferences exist, explicitly default to the gold entry
- Save the user's last selected symbol whenever they switch assets

---

## Files to Create
1. `src/pages/AdminDashboard.tsx` -- new comprehensive admin dashboard page
2. `src/components/admin/AdminOverview.tsx` -- overview metrics tab
3. `src/components/admin/AdminRegistries.tsx` -- all registries in one view
4. `src/components/admin/AdminPerformance.tsx` -- performance charts
5. `src/components/admin/AdminAPIKeys.tsx` -- API key configuration
6. `src/hooks/useUserPreferences.ts` -- preferences CRUD hook
7. `src/hooks/useAutoSave.ts` -- debounced auto-save hook
8. `supabase/functions/seed-admin/index.ts` -- edge function to create the admin account

## Files to Modify
1. `src/App.tsx` -- update `/admin` route to use new dashboard
2. `src/pages/TradingBridge.tsx` -- integrate preferences for default symbol, auto-save last symbol
3. `src/hooks/usePaperTrading.ts` -- optionally sync to database for authenticated users
4. `src/components/Header.tsx` -- add Admin Dashboard link for admin users

## Database Migrations
1. Create `user_preferences` table with RLS
2. Create `paper_portfolios` table with RLS
3. Seed admin user account

## Technical Details

### Admin Seeding Edge Function
```typescript
// supabase/functions/seed-admin/index.ts
// Uses service role to create user + assign admin role
// POST with { email, password }
// Creates auth user, inserts into user_roles with role='admin'
```

### Auto-Save Hook Pattern
```typescript
const useAutoSave = (key: string, value: any, delay = 2000) => {
  // Debounce writes to user_preferences.platform_config[key]
  // Falls back to localStorage for anonymous users
};
```

### Preferences Loading in TradingBridge
```typescript
const { data: prefs } = useUserPreferences();
const defaultSymbol = ALL_SYMBOLS.find(s => s.key === prefs?.last_symbol_key) ?? ALL_SYMBOLS[0]; // gold
const [activeSymbol, setActiveSymbol] = useState(defaultSymbol);
```

