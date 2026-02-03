
# GOLD ARROW - Backend Integration Plan

## Overview
This plan transforms the static landing page into a fully functional non-custodial bullion marketplace with MetaMask wallet connection (called "Vault" on this platform), real-time pricing, Chainlink Proof-of-Reserve verification, and Bitcoin blockchain anchoring.

---

## Phase 1: Database Foundation

### 1.1 Core Tables
Create the essential database tables for the bullion registry and verification system:

```text
+-------------------+     +--------------------+     +----------------------+
|   bullion_bars    |     |  vault_holdings    |     |  reserve_snapshots   |
+-------------------+     +--------------------+     +----------------------+
| serial_number     |---->| bar_id (FK)        |     | snapshot_id          |
| metal_type        |     | wallet_address     |     | merkle_root          |
| weight_oz         |     | acquired_at        |     | total_gold_oz        |
| purity            |     | status             |     | total_silver_oz      |
| vault_id          |     +--------------------+     | total_platinum_oz    |
| custody_status    |                               | bar_count            |
| last_verified_at  |     +--------------------+     | bitcoin_txid         |
+-------------------+     |  attestations      |     | created_at           |
                          +--------------------+     +----------------------+
                          | bar_id (FK)        |
                          | authority_name     |
                          | document_hash      |
                          | valid_until        |
                          +--------------------+
```

### 1.2 Tables to Create
- **profiles** - User identity linked to wallet addresses
- **bullion_bars** - Physical bullion registry (Gold, Silver, Platinum)
- **vault_holdings** - Links wallet addresses to their bullion
- **attestations** - Government/authority verification records
- **reserve_snapshots** - Merkle root proofs for Chainlink
- **price_feeds** - Cached metal spot prices

---

## Phase 2: Wallet Connection (The Vault)

### 2.1 Wallet Context & Provider
Create a React context for wallet state management:
- `src/contexts/WalletContext.tsx` - Global wallet state
- Stores connected address, chain ID, connection status
- Handles MetaMask events (accountsChanged, chainChanged)

### 2.2 Connect Wallet Button
Add a "Connect Vault" button in the Header:
- Replaces Login/Register for non-custodial flow
- Shows truncated wallet address when connected
- Dropdown with disconnect option

### 2.3 Wallet Connection Flow
```text
User clicks "Connect Vault"
       |
       v
MetaMask popup appears
       |
       v
User approves connection
       |
       v
Wallet address stored in context
       |
       v
Profile auto-created in database
       |
       v
User can access Vault page
```

---

## Phase 3: Core Pages

### 3.1 Marketplace Page (`/marketplace`)
Full bullion marketplace with:
- **Bullion Grid** - Display available bars from database
- **Filters** - Metal type, weight range, price range
- **Real-time Prices** - From price_feeds table
- **Order Book Display** - Buy/sell interface (non-custodial)
- Sub-routes: `/marketplace/gold`, `/marketplace/silver`, `/marketplace/platinum`

### 3.2 Vault Page (`/vault`)
Personal holdings dashboard:
- **Holdings Overview** - User's bullion by wallet address
- **Proof Status** - Chainlink verification status
- **Bitcoin Anchoring** - Link to blockchain explorer for TXIDs
- **Redemption Requests** - Form to request physical delivery

### 3.3 Certification Page (`/certification`)
Verification transparency:
- **How It Works** - Explanation of the verification system
- **Live Merkle Proof** - Current reserve snapshot
- **Authority Attestations** - List of government/auditor verifications
- **Bitcoin Anchor History** - All anchored proofs with TXIDs

---

## Phase 4: Chainlink Proof-of-Reserve Integration

### 4.1 Edge Function: `generate-proof-snapshot`
Backend function that:
- Queries all bullion bars and attestations
- Builds Merkle tree from normalized data
- Generates reserve snapshot with totals
- Stores in reserve_snapshots table
- Returns Merkle root for oracle consumption

### 4.2 Edge Function: `chainlink-oracle-endpoint`
Read-only API for Chainlink nodes:
- Returns current reserve totals
- Exposes Merkle root for verification
- Used by Proof-of-Reserve feeds

### 4.3 Frontend Integration
- Display current PoR status on Vault page
- Show last verification timestamp
- Visual indicator: "Reserves Verified" badge

---

## Phase 5: Bitcoin Blockchain Anchoring

### 5.1 Edge Function: `anchor-to-bitcoin`
Uses a third-party service to:
- Take Merkle root from latest snapshot
- Create OP_RETURN transaction with hash
- Store resulting TXID in reserve_snapshots
- Triggered manually or on schedule

### 5.2 Verification Display
- Show Bitcoin TXID on Certification page
- Direct link to blockchain explorer (mempool.space)
- Historical list of all anchored proofs

---

## Phase 6: Real-Time Price Feeds

### 6.1 Edge Function: `fetch-metal-prices`
Fetches spot prices from public API:
- Gold, Silver, Platinum prices in USD
- Updates price_feeds table
- Called on interval (e.g., every 5 minutes)

### 6.2 Frontend Integration
- MetalCards component fetches from database
- Live price updates on Marketplace
- Price change indicators (+/-%)

---

## File Structure Summary

```text
src/
├── contexts/
│   └── WalletContext.tsx        # MetaMask wallet state
├── hooks/
│   ├── useWallet.ts             # Wallet connection hook
│   ├── useBullionBars.ts        # Query bullion registry
│   ├── useVaultHoldings.ts      # User holdings query
│   ├── useReserveProof.ts       # Proof-of-Reserve data
│   └── useMetalPrices.ts        # Real-time price feed
├── pages/
│   ├── Marketplace.tsx          # Bullion marketplace
│   ├── MarketplaceMetal.tsx     # Single metal view
│   ├── Vault.tsx                # User vault/holdings
│   ├── Certification.tsx        # Verification transparency
│   └── About.tsx                # Company info
├── components/
│   ├── wallet/
│   │   ├── ConnectWalletButton.tsx
│   │   └── WalletDropdown.tsx
│   ├── marketplace/
│   │   ├── BullionGrid.tsx
│   │   ├── BullionCard.tsx
│   │   ├── MarketplaceFilters.tsx
│   │   └── OrderBook.tsx
│   ├── vault/
│   │   ├── HoldingsTable.tsx
│   │   ├── ProofStatus.tsx
│   │   └── RedemptionForm.tsx
│   └── certification/
│       ├── MerkleProofDisplay.tsx
│       ├── AttestationList.tsx
│       └── BitcoinAnchorHistory.tsx
supabase/
├── functions/
│   ├── generate-proof-snapshot/
│   │   └── index.ts
│   ├── chainlink-oracle-endpoint/
│   │   └── index.ts
│   ├── anchor-to-bitcoin/
│   │   └── index.ts
│   └── fetch-metal-prices/
│       └── index.ts
└── config.toml                   # Edge function config
```

---

## Database Schema (SQL Preview)

### bullion_bars
```sql
- id (uuid, primary key)
- serial_number (text, unique)
- metal_type (enum: gold, silver, platinum)
- weight_oz (decimal)
- purity (decimal, e.g., 0.9999)
- vault_id (text)
- jurisdiction (text)
- custody_status (enum: free, pledged, redeemed)
- last_verified_at (timestamp)
- created_at (timestamp)
```

### vault_holdings
```sql
- id (uuid, primary key)
- wallet_address (text)
- bar_id (uuid, FK to bullion_bars)
- acquired_at (timestamp)
- status (enum: active, pending_redemption, redeemed)
```

### reserve_snapshots
```sql
- id (uuid, primary key)
- snapshot_id (text, unique)
- merkle_root (text)
- total_gold_oz (decimal)
- total_silver_oz (decimal)
- total_platinum_oz (decimal)
- bar_count (integer)
- bitcoin_txid (text, nullable)
- created_at (timestamp)
```

---

## Security Considerations

1. **Non-Custodial Architecture**
   - Platform never holds private keys
   - All transactions signed by user wallets
   - Database stores wallet addresses, not keys

2. **Row-Level Security (RLS)**
   - vault_holdings: Users see only their own holdings
   - bullion_bars: Public read, admin write
   - reserve_snapshots: Public read only

3. **Edge Function Authentication**
   - Public endpoints for oracle/price feeds
   - Protected endpoints for user-specific actions
   - Admin endpoints for proof generation

---

## Implementation Priority

| Priority | Task | Complexity |
|----------|------|------------|
| 1 | Database tables + RLS | Medium |
| 2 | Wallet connection (Vault) | Medium |
| 3 | Marketplace page | Medium |
| 4 | Vault page (holdings) | Medium |
| 5 | Price feed edge function | Low |
| 6 | Certification page | Low |
| 7 | Proof snapshot generation | High |
| 8 | Chainlink oracle endpoint | Medium |
| 9 | Bitcoin anchoring | High |

---

## Technical Notes

- **MetaMask Integration**: Uses `window.ethereum` API directly (no extra libraries needed)
- **Chainlink**: Oracle nodes will call the public edge function endpoint
- **Bitcoin**: Requires external service (e.g., OpenTimestamps or custom anchoring service) with API key
- **Price Feeds**: Will use free public API initially (e.g., metals-api.com)
