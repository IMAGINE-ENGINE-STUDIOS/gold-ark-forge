

# Institutional Non-Custodial Bullion Certificate Platform -- Implementation Plan

## Current State vs. Target

The existing codebase has a basic bullion marketplace with simplified tables (`bullion_bars`, `vault_holdings`, `reserve_snapshots`, `attestations`, `price_feeds`, `profiles`). The wallet integration uses MetaMask/WalletConnect as if this were an EVM token project. The spec demands a fundamentally different architecture:

- **Identity**: Wallet-only (EVM for SIWE auth + Bitcoin addresses for settlement)
- **Core model**: Partner-signed certificates (not bearer tokens), event-sourced
- **Settlement**: Bitcoin PSBT-based, non-custodial
- **Anchoring**: Merkle-batched OP_RETURN commitments to Bitcoin
- **Partners**: Vault/dealer systems as issuers; platform is evidence plane only

This is too large for a single implementation pass. The plan is broken into **5 phases**, each deliverable independently.

---

## Phase 1: Database Schema Overhaul

Migrate from the current simplified schema to the spec's institutional data model. Existing tables (`bullion_bars`, `vault_holdings`, `attestations`) will be replaced or restructured.

### New Tables

1. **`partners`** -- Certified vault/dealer entities (partner_id, legal_name, jurisdiction, partner_type, status, api_base_url, mtls_spki_fingerprint)
2. **`partner_sites`** -- Physical vault locations linked to partners
3. **`wallets`** -- Wallet-only identities (wallet_type: evm|btc, address, last_seen_at)
4. **`certificates`** -- Partner-signed certificate records with metadata_json (bar identifiers, weight, fineness, refiner stamp), partner_sig, status (active|frozen|revoked|redeemed)
5. **`certificate_events`** -- Append-only event log (issue, transfer_intent, transfer_exec, freeze, unfreeze, revoke, redeem) with partner signatures
6. **`transfers`** -- Transfer workflow objects with PSBT storage (psbt_base64, btc_txid, status lifecycle)
7. **`anchors`** -- Bitcoin commitment records (merkle_root, commit_txid, commit_height, status: pending|broadcast|confirmed|reorged)
8. **`anchor_leaves`** -- Mapping events to Merkle leaves (leaf_hash, leaf_index)
9. **`disputes`** -- Optional dispute resolution for transfers
10. **`audit_logs`** -- Security and operations audit trail (actor_type, action, resource_type, ip_addr)

### Migration Strategy

- Keep `price_feeds` (still needed for reference pricing)
- Keep `profiles` and `user_roles` (for admin portal access)
- Drop or deprecate `bullion_bars`, `vault_holdings`, `reserve_snapshots`, `attestations` after migrating any test data
- Add new enums: `wallet_type` (evm, btc), `cert_status` (active, frozen, revoked, redeemed), `transfer_status` (proposed, btc_settlement_pending, partner_review, completed, cancelled, expired, disputed), `anchor_status` (pending, broadcast, confirmed, reorged, abandoned), `partner_type` (vault, dealer, custodian, arbiter), `partner_status` (active, suspended, offboarded)

### RLS Policies

- Certificates: publicly viewable (SELECT), partner-managed (INSERT/UPDATE via admin role + partner checks)
- Certificate events: publicly viewable, append-only by admin/partner
- Transfers: viewable by involved wallets, creatable by authenticated wallets
- Anchors and anchor_leaves: publicly viewable, managed by system/admin
- Partners and partner_sites: publicly viewable, admin-managed
- Wallets: self-viewable, auto-created on first auth
- Audit logs: admin-only read, system-only write

---

## Phase 2: Wallet Identity and SIWE Authentication

Replace the current EVM-only wallet connection with a dual-wallet identity system.

### Changes

1. **WalletContext rewrite**: Support both EVM (MetaMask for SIWE login) and Bitcoin wallet addresses
   - MetaMask remains for session authentication via SIWE (Sign-In with Ethereum, EIP-4361)
   - Add Bitcoin address registration (user provides their BTC address for settlement)
   - Remove WalletConnect dependency (or keep as secondary EVM auth option)

2. **SIWE Auth Edge Function** (`siwe-auth`):
   - `POST /v1/auth/nonce` -- Generate one-time nonce
   - `POST /v1/auth/siwe` -- Verify SIWE signature, create/find wallet record, issue session JWT
   - Wallet-only identity: no email/password, no PII stored

3. **Wallet registration flow**:
   - On SIWE login, auto-create `wallets` record (type: evm)
   - Allow user to register a BTC address for settlement (stored in `wallets` table, type: btc)
   - Link both wallet types to user profile

4. **UI updates**:
   - WalletSelectorDialog: show MetaMask for "Sign In" (SIWE), plus a "Register BTC Address" field
   - ConnectWalletButton: display both EVM and BTC addresses when connected
   - Remove Etherscan links, replace with mempool.space for BTC

---

## Phase 3: Certificate Registry and Partner Integration

Build the core certificate lifecycle.

### Edge Functions

1. **`certificate-registry`** -- CRUD operations:
   - `CreateCertificateDraft` (admin/partner) -> stores draft with partner signature
   - `ActivateCertificate` (partner signs) -> status: active
   - `TransferIntent` (user-signed) -> creates transfer record
   - `Freeze/Unfreeze/Revoke` (partner-only actions)
   - `AttachEvidence` (hash pointer to assay/audit docs)

2. **`partner-adapter`** -- Standardized interface for partner vault APIs:
   - Push mode: webhook receiver for partner events
   - Pull mode: scheduled polling of partner endpoints
   - Signature verification for partner-signed payloads

### UI Pages

- **Marketplace rewrite**: Show certificates (not raw bars), with partner attribution, bar metadata (serial, refiner stamp, fineness, weight), and verification status
- **Certificate Detail page**: Full certificate history, event timeline, Merkle proofs, partner info
- **Certification page update**: Show certificate-level proofs instead of simple reserve snapshots

---

## Phase 4: Bitcoin Anchor Service (Enhanced)

Upgrade the current mock anchoring to production-ready Merkle batching.

### Edge Function Updates

1. **`generate-proof-snapshot` rewrite** -> **`anchor-batch`**:
   - Collect unanchored certificate_events
   - Build Merkle tree with canonical leaf hashes: `SHA256("BULLCERTv1" || partner_id || cert_id || event_id || event_hash || partner_sig_hash)`
   - Store anchor record + anchor_leaves mapping
   - Output unsigned PSBT with OP_RETURN (protocol tag + version + 32-byte root)
   - Status lifecycle: pending -> broadcast -> confirmed (with reorg detection)

2. **`anchor-to-bitcoin` rewrite**:
   - Accept anchor_id, construct OP_RETURN tx
   - Keep OP_RETURN payload minimal and stable
   - Support RBF for fee bumping
   - Track confirmation depth (1=soft, 6=confirmed, 30=final)

3. **Proof retrieval edge function** (`get-proof`):
   - Given event_id, return: Merkle branch + index + root + Bitcoin txid + block metadata
   - Verifiable by any third party

### Cadence

- Default: every 10 minutes OR 5,000 events, whichever first (configurable)

---

## Phase 5: PSBT Transfer Engine and Escrow

Build the Bitcoin settlement coordination layer.

### Edge Functions

1. **`psbt-transfer`** -- Non-custodial transfer coordination:
   - Construct unsigned PSBTs (BIP-174 v0)
   - Template A: Simple BTC settlement (buyer UTXOs -> seller payout + optional fee + change)
   - Platform NEVER signs customer inputs
   - Store psbt_base64 in transfers table
   - Track btc_txid once user broadcasts

2. **`escrow-coordinator`** -- Optional multisig patterns:
   - Template B: 2-of-3 P2WSH (buyer + seller + arbiter)
   - Template C: CLTV refund paths (BIP-65)
   - Template D: CSV relative timelock refunds (BIP-112)

### UI

- Transfer proposal flow: seller lists certificate, buyer creates transfer intent
- PSBT signing UX: display unsigned PSBT, user signs in their Bitcoin wallet
- Escrow status tracking with timelock countdown

---

## Technical Considerations

- **No Bitcoin Core RPC in Lovable Cloud**: Edge functions cannot run a Bitcoin node. For Phase 4-5, the platform will need an external Bitcoin API (e.g., mempool.space API, Blockstream Esplora API) for UTXO lookups, fee estimation, and broadcast. This is a "delivery service" pattern consistent with the non-custodial mandate.
- **PSBT construction in edge functions**: Use a lightweight JS Bitcoin library (e.g., `bitcoinjs-lib` via esm.sh import in Deno) for PSBT construction. Platform constructs but never signs customer inputs.
- **Partner API simulation**: Until real partners onboard, the admin portal will simulate partner-signed events for testing.
- **MetaMask Bitcoin support**: MetaMask announced native BTC support (Dec 2025). The SIWE flow uses EVM signatures for auth; BTC addresses are registered separately for settlement.

## Recommended Starting Point

**Phase 1 (Database Schema)** is the foundation everything else depends on. I recommend starting there, then Phase 2 (auth), then Phase 3 (certificates), with Phases 4-5 building on top.

Shall I begin with Phase 1?

