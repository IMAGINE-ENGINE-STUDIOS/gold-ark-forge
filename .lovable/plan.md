

# Add More Brokers, Built-in Wallet, and UI Testing

## Overview
This plan adds 6 new brokers (for a total of 15), integrates a built-in Web3 wallet system that removes the MetaMask dependency, and ensures the broker dialog + chart searcher work correctly from the Trading Bridge UI.

---

## 1. Add 6 New Brokers

Expand `BrokerType` and `BROKER_META` in `src/hooks/useBrokerTrading.ts` with these free/popular brokers:

| Broker | Assets | Why |
|--------|--------|-----|
| **Binance** | Crypto, Futures | Largest crypto exchange, free API |
| **Bybit** | Crypto, Derivatives | Popular derivatives platform |
| **Bitfinex** | Crypto | Advanced trading, free API |
| **eToro** | Stocks, Crypto, Forex, CFDs | Multi-asset, popular retail |
| **Robinhood** | Stocks, ETFs, Crypto, Options | Commission-free, widely used |
| **Saxo Bank** | Stocks, Forex, Bonds, Options, Futures | Institutional-grade, multi-asset |

Update `BrokerConnectDialog.tsx` to include all 15 brokers in the picker list with a scrollable layout.

---

## 2. Built-in Web Wallet (No Extension Required)

Currently the platform requires MetaMask browser extension. This adds an **in-app wallet** option so users can authenticate and manage keys without downloading anything.

### Approach
- Add a **"Create Vault Wallet"** option alongside MetaMask in `WalletSelectorDialog.tsx`
- Generate a local keypair using the Web Crypto API (non-custodial -- private key stays in browser localStorage, encrypted with a user-set password)
- Use the same SIWE flow but sign locally instead of via MetaMask
- Add key export/backup functionality (show seed phrase or private key behind password confirmation)
- Keep MetaMask as the recommended option but offer the built-in wallet as a lightweight alternative

### New Files
- `src/lib/localWallet.ts` -- Key generation, encryption/decryption, local storage, SIWE message signing

### Modified Files
- `src/contexts/WalletContext.tsx` -- Add `walletType: 'local'` support, `createLocalWallet()`, `importWallet()` methods
- `src/components/wallet/WalletSelectorDialog.tsx` -- Add "Create Vault Wallet" and "Import Wallet" options with password setup UI

---

## 3. Make Broker Button Clickable from Top Bar

Currently the "0 BROKERS" badge in the TradingBridge top bar is a static `span`. Make it a clickable button that opens the `BrokerConnectDialog` directly.

### Modified File
- `src/pages/TradingBridge.tsx` -- Add `BrokerConnectDialog` state + import, wire the badge as a button

---

## 4. Verify Chart Symbol Searcher (`/` key)

The `/` keyboard shortcut for symbol search is already implemented in `ProprietaryChart.tsx`. This plan verifies it works and ensures the search overlay is properly wired to update the active symbol in the parent `TradingBridge`.

---

## Technical Details

### `src/hooks/useBrokerTrading.ts` Changes
- Add to `BrokerType`: `'binance' | 'bybit' | 'bitfinex' | 'etoro' | 'robinhood' | 'saxo'`
- Add corresponding entries to `BROKER_META` with environments, fields, and asset descriptions

### `src/components/trading/BrokerConnectDialog.tsx` Changes
- Update `BROKERS` array to include all 15 brokers
- Add `max-h-[60vh] overflow-y-auto` to the broker picker list for scrollability
- Add `DialogDescription` for accessibility

### `src/lib/localWallet.ts` (New)
- `generateWallet()`: Create Ethereum keypair using Web Crypto / ethers-compatible logic
- `encryptKey(privateKey, password)`: AES-256-GCM encryption
- `decryptKey(encrypted, password)`: Decryption
- `signMessage(message, privateKey)`: EIP-191 personal_sign equivalent
- `storeWallet(encrypted)` / `loadWallet()`: localStorage operations

### `src/contexts/WalletContext.tsx` Changes
- Add `WalletType = 'metamask' | 'local'`
- Add `createLocalWallet(password)` and `importWallet(privateKey, password)` to context
- Local wallet sign-in follows same SIWE flow but uses local signing instead of `window.ethereum.request`

### `src/components/wallet/WalletSelectorDialog.tsx` Changes
- Add second option card: "Create Vault Wallet" with password setup
- Add third option: "Import Existing Wallet" with private key input
- Show wallet backup/export option after creation

### `src/pages/TradingBridge.tsx` Changes
- Import `BrokerConnectDialog`, add `brokerDialogOpen` state
- Convert the "0 BROKERS" badge to a clickable button that sets `brokerDialogOpen(true)`
- Render `<BrokerConnectDialog>` in the desktop and mobile layouts

### Security Considerations
- Private keys are encrypted at rest in localStorage with user password
- Keys never leave the browser -- non-custodial mandate maintained
- Password is never stored -- used only for encryption/decryption
- Export flow requires password re-entry
- Clear warning that losing password = losing access (no recovery)

