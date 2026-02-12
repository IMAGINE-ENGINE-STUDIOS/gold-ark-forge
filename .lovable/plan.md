

# Phase 5: Bitcoin Anchoring Engine Upgrade and Chainlink Oracle Integration

## Overview

Upgrade the three backend functions (`generate-proof-snapshot`, `anchor-to-bitcoin`, `chainlink-oracle-endpoint`) from the legacy `bullion_bars` / `reserve_snapshots` model to the certificate-based architecture. The snapshot engine will now compute Merkle trees from `certificate_events`, populate `anchors` + `anchor_leaves`, and the Chainlink oracle endpoint will serve certificate-derived reserve data. The Certification page will be updated to show the unified certificate-based proof system.

## What Changes

### 1. Rewrite: `generate-proof-snapshot` Edge Function

**File**: `supabase/functions/generate-proof-snapshot/index.ts`

Currently reads from `bullion_bars` and writes to `reserve_snapshots`. Rewrite to:

- Query **unanchored** `certificate_events` (events not yet linked to an `anchor_leaves` row)
- SHA-256 hash each event's canonical JSON (`event_id + event_type + cert_id + created_at + event_payload`)
- Build a Merkle tree from those leaf hashes
- Insert an `anchors` row with the Merkle root, `leaf_count`, status = `pending`
- Insert corresponding `anchor_leaves` rows linking each `event_id` to its `leaf_index` and `leaf_hash`
- Also update `reserve_snapshots` table with aggregated certificate totals (for backward compat with Chainlink endpoint) -- compute totals from all active certificates' `metadata_json.weight_oz` grouped by `metadata_json.metal_type`
- Return the anchor ID, Merkle root, and leaf count

### 2. Rewrite: `anchor-to-bitcoin` Edge Function

**File**: `supabase/functions/anchor-to-bitcoin/index.ts`

Currently reads from `reserve_snapshots`. Rewrite to:

- Query the latest `anchors` row where `status = 'pending'` and `commit_txid IS NULL`
- Use the anchor's `merkle_root` (bytea) as the data to commit
- In demo mode (no `BTC_ANCHOR_API_KEY`), generate a simulated 64-char hex TXID
- Update the `anchors` row: set `commit_txid`, `status = 'broadcast'`, `commit_time = now()`
- Also update the corresponding `reserve_snapshots` row's `bitcoin_txid` if one was created in the same batch (backward compat)
- Return the anchor ID, TXID, and explorer URL

### 3. Rewrite: `chainlink-oracle-endpoint` Edge Function

**File**: `supabase/functions/chainlink-oracle-endpoint/index.ts`

Currently reads from `reserve_snapshots`. Rewrite to:

- Compute live reserve totals by querying all `certificates` with `status = 'active'`, aggregating `metadata_json->>'weight_oz'` grouped by `metadata_json->>'metal_type'`
- Count total active certificates as `bar_count`
- Fetch the latest confirmed anchor (`anchors` where `status = 'confirmed'` or `'broadcast'`) for the Bitcoin commitment reference
- Format response in Chainlink-compatible JSON with 8-decimal integer units
- Include the latest anchor's `commit_txid` as the `bitcoin_anchor` field
- Fall back to `reserve_snapshots` if no anchors exist (backward compat)

### 4. Update: Certification Page

**File**: `src/pages/Certification.tsx`

- Replace the "Current Reserve Status" section: instead of reading from `useLatestReserveProof` (which queries `reserve_snapshots`), compute reserve totals from all active certificates using a new `useCertificateReserveTotals` hook
- The "Bitcoin Anchor History" section already uses `useAnchors` -- no change needed
- Add a new "Recent Anchored Events" section showing the latest `anchor_leaves` with their linked `certificate_events`, demonstrating the inclusion proof chain
- Remove the `useLatestReserveProof` import (keep the hook file intact for backward compat)

### 5. New Hook: `useCertificateReserveTotals`

**File**: `src/hooks/useCertificateReserveTotals.ts`

- Query all certificates with `status = 'active'`, selecting only `metadata_json`
- Client-side aggregate `weight_oz` by `metal_type`
- Return `{ gold_oz, silver_oz, platinum_oz, cert_count }`
- Used by the Certification page to replace `useLatestReserveProof` for the reserve summary display

### 6. New Hook: `useAnchoredEvents`

**File**: `src/hooks/useAnchoredEvents.ts`

- Query `anchor_leaves` joined with `certificate_events` and `anchors`, ordered by `created_at` desc, limited to recent entries
- Returns event type, cert_id, leaf hash, anchor status, and commit txid
- Used by the Certification page in the new "Recent Anchored Events" section

## Files Summary

| Action | File |
|--------|------|
| Rewrite | `supabase/functions/generate-proof-snapshot/index.ts` |
| Rewrite | `supabase/functions/anchor-to-bitcoin/index.ts` |
| Rewrite | `supabase/functions/chainlink-oracle-endpoint/index.ts` |
| Update | `src/pages/Certification.tsx` |
| Create | `src/hooks/useCertificateReserveTotals.ts` |
| Create | `src/hooks/useAnchoredEvents.ts` |

## Technical Details

- The `anchors.merkle_root` column is `bytea`. The edge function will store the SHA-256 hash as raw bytes using `\\x` hex encoding in the SQL insert.
- The `anchor_leaves.leaf_hash` is also `bytea`. Same encoding approach.
- The canonical leaf format for hashing is: `SHA256(JSON.stringify({ event_id, event_type, cert_id, created_at, event_payload }))` -- this ensures deterministic reproduction of the Merkle tree.
- The Chainlink endpoint maintains backward compatibility: if no active certificates exist, it falls back to `reserve_snapshots` data. This ensures existing oracle integrations continue working during the transition.
- The `generate-proof-snapshot` function is idempotent -- if called with no new unanchored events, it returns a message indicating nothing to anchor rather than creating an empty batch.
- No database migrations are needed -- all tables (`anchors`, `anchor_leaves`, `certificate_events`, `certificates`) already exist with the correct schema.

