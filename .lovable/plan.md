

# Phase 4: Vault Rewrite and Transfer Flow

## Overview

Rewrite the Vault page from legacy `bullion_bars` / `vault_holdings` model to certificate-based holdings, and build the transfer initiation UI so certificate owners can propose transfers to other wallets.

## What Changes

### 1. New Hook: `useWalletCertificates`

**File**: `src/hooks/useWalletCertificates.ts`

Query certificates owned by the connected wallet. The `certificates` table has `owner_wallet_id` which references a `wallets.wallet_id`. The hook needs to:

- Look up the user's wallet_id from the `wallets` table using their EVM address
- Query `certificates` where `owner_wallet_id` matches, joined with `partners`
- Compute holdings summary (total oz by metal type, estimated value using `price_feeds`)
- Also provide a `useWalletTransfers` hook to show pending/completed transfers for the wallet

### 2. New Hook: `useTransfers`

**File**: `src/hooks/useTransfers.ts`

- `useWalletTransfers(walletId)` -- Query `transfers` table where `seller_wallet_id` or `buyer_wallet_id` matches, with certificate join
- `useTransfer(transferId)` -- Single transfer detail with certificate and counterparty info

### 3. Vault Page Rewrite

**File**: `src/pages/Vault.tsx`

Replace legacy `useVaultHoldings` / `useReserveProof` with certificate-based data:

- **Summary Cards**: Show total gold/silver/platinum oz computed from owned certificates' `metadata_json.weight_oz`, grouped by `metadata_json.metal_type`
- **Holdings Ledger**: Each row is a certificate the user owns, showing serial number, metal type, weight, partner name, status, and a link to the certificate detail page
- **Transfer Section**: Show pending incoming/outgoing transfers from the `transfers` table
- **Proof Status**: Replace `reserve_snapshots` with the latest anchor from `anchors` table (already available via `useAnchors`)
- Keep the existing vault door hero and locked state when wallet is not connected

### 4. Transfer Initiation Component

**File**: `src/components/vault/TransferInitiateDialog.tsx`

A dialog that allows certificate owners to propose a transfer:

- Select a certificate from owned holdings
- Enter buyer wallet address (EVM address)
- Optional terms JSON (price, conditions)
- Calls `certificate-registry` edge function with `action: "transfer_intent"`
- Shows confirmation with transfer ID

### 5. Transfer Status Cards

**File**: `src/components/vault/TransferCard.tsx`

A card component displaying transfer details:

- Certificate info (metal type, weight, serial)
- Counterparty wallet (truncated)
- Status badge (proposed, btc_settlement_pending, partner_review, completed, cancelled, expired, disputed)
- Transfer creation date
- Link to certificate detail

### 6. Route Updates

No new routes needed -- the Vault page already exists at `/vault`.

## Files Summary

| Action | File |
|--------|------|
| Create | `src/hooks/useWalletCertificates.ts` |
| Create | `src/hooks/useTransfers.ts` |
| Create | `src/components/vault/TransferInitiateDialog.tsx` |
| Create | `src/components/vault/TransferCard.tsx` |
| Rewrite | `src/pages/Vault.tsx` |

## Technical Details

- The `wallets` table maps `address` (EVM string) to `wallet_id` (UUID). The Vault hooks first resolve the connected EVM address to a `wallet_id`, then query `certificates.owner_wallet_id`.
- If the user has no wallet record yet (first-time visitor), the hooks return empty arrays gracefully.
- The transfer initiation calls the existing `certificate-registry` edge function's `transfer_intent` action, which validates ownership and creates both a `transfers` record and a `certificate_events` entry.
- The existing `useVaultHoldings` and `useReserveProof` hooks remain intact (not deleted) but are no longer imported by the Vault page.
- The Vault page keeps its current visual design language (vault door hero, ornate gold frames, Greek key borders) but replaces the data source entirely.
- Holdings summary is computed client-side from the certificates array, combining `metadata_json.weight_oz` values grouped by `metadata_json.metal_type`, and multiplied by spot prices from `price_feeds` for estimated total value.

