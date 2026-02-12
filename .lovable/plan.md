

# Phase 3: Certificate Registry and Marketplace Rewrite

## Overview

Replace the legacy bullion-bars-based Marketplace with a certificate-centric view. Create a `certificate-registry` edge function for certificate lifecycle management, new React hooks for querying certificates, and rewrite the Marketplace and Certification pages to use the new data model.

## What Changes

### 1. New Edge Function: `certificate-registry`

**File**: `supabase/functions/certificate-registry/index.ts`

A single edge function handling certificate lifecycle operations via an `action` parameter:

- **`list`** -- Public: list active certificates with joined partner info, filterable by metal type (extracted from `metadata_json`)
- **`get`** -- Public: get single certificate with full partner info and event history
- **`create`** -- Admin/partner only: create a new certificate with partner signature, insert matching `certificate_events` (type: `issue`)
- **`freeze` / `unfreeze` / `revoke`** -- Admin/partner only: state transitions with event logging
- **`transfer_intent`** -- Authenticated wallet: propose a transfer (creates `transfers` record + `certificate_events` entry)

Config update in `supabase/config.toml`:
```toml
[functions.certificate-registry]
verify_jwt = false
```

### 2. New React Hook: `useCertificates`

**File**: `src/hooks/useCertificates.ts`

- `useCertificates(options?)` -- Query certificates table with partner join, filter by metal type (via metadata_json->>metal_type), status
- `useCertificate(certId)` -- Single certificate with partner info
- `useCertificateEvents(certId)` -- Event timeline for a certificate

These hooks query the database directly (certificates are publicly viewable via RLS) rather than going through the edge function, for read performance.

### 3. Marketplace Page Rewrite

**File**: `src/pages/Marketplace.tsx`

Replace `useBullionBars` with `useCertificates`. Each card now shows:
- Partner name (from joined `partners` table)
- Certificate status badge (active/frozen/revoked/redeemed)
- Bar metadata from `metadata_json`: serial number, refiner stamp, fineness, weight, metal type
- Computed value using `price_feeds` spot price
- Link to certificate detail page (`/marketplace/certificate/:certId`)

Keep the existing live prices bar and metal filter UI (gold/silver/platinum), but filter by `metadata_json->>metal_type` instead of `bullion_bars.metal_type`.

### 4. New Certificate Detail Page

**File**: `src/pages/CertificateDetail.tsx`

New page at route `/marketplace/certificate/:certId` showing:
- Full bar metadata (serial, refiner, fineness, weight, jurisdiction)
- Partner attribution (legal name, jurisdiction, type)
- Certificate status and version
- Event timeline (from `certificate_events`) showing issue, transfers, freezes, etc.
- Anchor proof link (if events have been anchored -- from `anchor_leaves` join)
- Owner wallet address (truncated)

### 5. Route Update

**File**: `src/App.tsx`

Add route: `/marketplace/certificate/:certId` pointing to `CertificateDetail` component. Keep existing `/marketplace` and `/marketplace/:metal` routes.

### 6. Certification Page Update

**File**: `src/pages/Certification.tsx`

Update "How Verification Works" section to reference partner-signed certificates instead of "tokenized bullion". Keep the anchor history section but source it from the `anchors` table instead of `reserve_snapshots`. Add a section showing recent certificate events that have been anchored.

### 7. New Hook: `useAnchors`

**File**: `src/hooks/useAnchors.ts`

- `useAnchors(limit?)` -- Query anchors table ordered by created_at desc
- `useAnchorForEvent(eventId)` -- Find anchor + leaf for a specific certificate event

Replaces the `useReserveHistory` hook usage on the Certification page.

## Files Summary

| Action | File |
|--------|------|
| Create | `supabase/functions/certificate-registry/index.ts` |
| Create | `src/hooks/useCertificates.ts` |
| Create | `src/hooks/useAnchors.ts` |
| Create | `src/pages/CertificateDetail.tsx` |
| Rewrite | `src/pages/Marketplace.tsx` |
| Update | `src/pages/Certification.tsx` |
| Update | `src/App.tsx` (add route) |
| Update | `supabase/config.toml` (add function config) |

## Technical Notes

- The `metadata_json` JSONB column on certificates stores bar-level data: `{ metal_type, serial_number, refiner_stamp, fineness, weight_oz, jurisdiction }`. Filtering by metal type uses Supabase's `->>'metal_type'` JSONB accessor.
- The `useBullionBars` hook and old `bullion_bars` table remain intact (not deleted) for backward compatibility, but are no longer referenced by the Marketplace.
- Certificate cards link to `/marketplace/certificate/:certId` instead of the old `/marketplace/:metal/:id` pattern.
- The edge function uses `SUPABASE_SERVICE_ROLE_KEY` for write operations (admin-gated) and validates the caller's role before allowing mutations.

