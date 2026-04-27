## Add Ethereum Network to Wallet & Vault

Bring live Ethereum data (balance, tokens, network telemetry) into both the wallet dropdown and the Vault page. All data pulled from free public RPCs and CoinGecko — no API keys, no synthetic data.

### 1. Shared hook — `src/hooks/useEthereumWallet.ts`

A single React Query hook that, given an EVM address, returns:

- **ETH balance** via `eth_getBalance` (multi-RPC fallback: llamarpc, ankr, publicnode, 1rpc, cloudflare)
- **ERC-20 token balances** via `eth_call` (`balanceOf`) for a curated list:
  - USDC, USDT, DAI, WETH, WBTC, LINK, UNI (mainnet contract addresses hardcoded)
- **USD valuation** via CoinGecko `/simple/price` (free, no key)
- **Network status** (block number, gas price, base fee) — reuse the same RPC helper from `GAEthereumNetwork.tsx`

Refresh: 15s interval, react-query cache. On full RPC failure: return empty + show inline warning (zero-fake-data mandate).

### 2. Reusable panel — `src/components/wallet/EthereumNetworkPanel.tsx`

A compact "Roman PAX" panel rendering:

```text
┌─ ETHEREUM · MAINNET ──────────────── LIVE ●─┐
│ Balance         1.2453 ETH    $4,210.55     │
│ ─────────────────────────────────────────── │
│ TOKENS                                       │
│  ◉ USDC   1,250.00      $1,250.00           │
│  ◉ USDT     430.20        $430.18           │
│  ◉ WBTC     0.0150      $1,580.00           │
│ ─────────────────────────────────────────── │
│ NETWORK   Block 24,458,855  Gas 12 Gwei     │
│ [View on Etherscan ↗]                        │
└──────────────────────────────────────────────┘
```

- Two density modes via prop: `compact` (dropdown) and `full` (vault tab)
- Hides zero-balance tokens by default; toggle to show all
- Gold accents, `bg-card/40`, `text-[10px]–text-xs`, ornate corners on full mode

### 3. Wallet dropdown integration — `src/components/wallet/ConnectWalletButton.tsx`

Add a new collapsible section after the wallet info, before BTC:

```text
ETHEREUM NETWORK
  Balance: 1.2453 ETH · $4,210
  Tokens: 3 active                    [Show ▾]
```

When expanded, render `<EthereumNetworkPanel mode="compact" address={evmAddress} />` inline in the dropdown.

### 4. Vault page integration — `src/pages/Vault.tsx`

Two placements:

- **New top-level category**: add `{ key: 'ethereum', label: 'Ethereum', icon: <Ξ glyph> }` to `VAULT_CATEGORIES`
- **Nested in Crypto tab**: when `activeCategory === 'crypto'`, render the same `<EthereumNetworkPanel mode="full" />` at the top of the crypto section, above existing crypto holdings

Both surfaces use the shared component so they stay consistent.

### Technical Notes

- **No backend changes**: pure client-side using public RPCs + CoinGecko. No new tables, no edge functions, no secrets.
- **Address source**: `useWallet().evmAddress`. If null, panel renders an empty "Connect to view" state.
- **ERC-20 calls**: batch via `Promise.all` of `eth_call` with encoded `balanceOf(address)` selector `0x70a08231`.
- **Resilience**: reuse the `rpcCall` multi-fallback pattern already proven in `GAEthereumNetwork.tsx`. On total failure, show "RPC unavailable — retrying" banner; never inject fake numbers (zero-fake-data rule).
- **Etherscan link**: deep-link to `https://etherscan.io/address/{evmAddress}` for full holdings exploration.

### Files

- Created: `src/hooks/useEthereumWallet.ts`, `src/components/wallet/EthereumNetworkPanel.tsx`
- Edited: `src/components/wallet/ConnectWalletButton.tsx`, `src/pages/Vault.tsx`
