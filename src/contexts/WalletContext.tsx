import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  generateWallet,
  encryptKey,
  decryptKey,
  signMessage as localSign,
  storeWallet,
  loadWallet,
  clearWallet,
  hasStoredWallet,
} from '@/lib/localWallet';

export type WalletType = 'metamask' | 'local' | null;

interface WalletContextType {
  evmAddress: string | null;
  btcAddress: string | null;
  isConnecting: boolean;
  isAuthenticated: boolean;
  error: string | null;
  walletType: WalletType;
  signIn: () => Promise<void>;
  signInLocal: (password: string) => Promise<void>;
  createLocalWallet: (password: string) => Promise<string>;
  importWallet: (privateKey: string, password: string) => Promise<void>;
  exportPrivateKey: (password: string) => Promise<string>;
  hasLocalWallet: boolean;
  registerBtcAddress: (address: string) => Promise<void>;
  disconnect: () => Promise<void>;
  showWalletSelector: boolean;
  setShowWalletSelector: (show: boolean) => void;
  // Legacy compat aliases
  address: string | null;
  isConnected: boolean;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
      on: (event: string, callback: (...args: unknown[]) => void) => void;
      removeListener: (event: string, callback: (...args: unknown[]) => void) => void;
      isMetaMask?: boolean;
    };
  }
}

// SIWE message builder (EIP-4361)
function buildSiweMessage(params: {
  domain: string;
  address: string;
  uri: string;
  nonce: string;
  chainId: number;
  issuedAt: string;
}): string {
  return `${params.domain} wants you to sign in with your Ethereum account:
${params.address}

Sign in to Gold Arrow — The New Standard in Asset Certification

URI: ${params.uri}
Version: 1
Chain ID: ${params.chainId}
Nonce: ${params.nonce}
Issued At: ${params.issuedAt}`;
}

// BTC address validation
function isValidBtcAddress(address: string): boolean {
  return /^(1[a-km-zA-HJ-NP-Z1-9]{25,34}|3[a-km-zA-HJ-NP-Z1-9]{25,34}|bc1[a-z0-9]{39,59}|tb1[a-z0-9]{39,59})$/.test(address);
}

export const WalletProvider = ({ children }: { children: ReactNode }) => {
  const [evmAddress, setEvmAddress] = useState<string | null>(null);
  const [btcAddress, setBtcAddress] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [walletType, setWalletType] = useState<WalletType>(null);
  const [showWalletSelector, setShowWalletSelector] = useState(false);
  const [hasLocal, setHasLocal] = useState(hasStoredWallet());

  const isAuthenticated = !!evmAddress;

  // Load BTC address from profile when authenticated
  const loadBtcAddress = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: btcWallet } = await supabase
      .from('wallets')
      .select('address')
      .eq('wallet_type', 'btc')
      .maybeSingle();
    if (btcWallet) setBtcAddress(btcWallet.address);
  }, []);

  // ─── MetaMask SIWE Sign In ─────────────────────────────
  const signIn = useCallback(async () => {
    if (!window.ethereum) {
      setError('MetaMask not installed.');
      return;
    }
    setIsConnecting(true);
    setError(null);
    setShowWalletSelector(false);
    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' }) as string[];
      if (!accounts.length) { setError('No accounts found.'); return; }
      const userAddress = accounts[0];
      const chainIdHex = await window.ethereum.request({ method: 'eth_chainId' }) as string;
      const chainId = parseInt(chainIdHex, 16);
      const { data: nonceData, error: nonceError } = await supabase.functions.invoke('siwe-auth', { body: { action: 'nonce' } });
      if (nonceError || !nonceData?.nonce) throw new Error('Failed to get nonce');
      const siweMessage = buildSiweMessage({ domain: window.location.host, address: userAddress, uri: window.location.origin, nonce: nonceData.nonce, chainId, issuedAt: new Date().toISOString() });
      const signature = await window.ethereum.request({ method: 'personal_sign', params: [siweMessage, userAddress] }) as string;
      const { data: verifyData, error: verifyError } = await supabase.functions.invoke('siwe-auth', { body: { action: 'verify', siweMessage, signature } });
      if (verifyError || !verifyData?.session) throw new Error(verifyData?.error || 'SIWE verification failed');
      const { error: sessionError } = await supabase.auth.setSession({ access_token: verifyData.session.access_token, refresh_token: verifyData.session.refresh_token });
      if (sessionError) throw sessionError;
      setEvmAddress(userAddress);
      setWalletType('metamask');
      localStorage.setItem('siweConnected', 'true');
      await loadBtcAddress();
    } catch (err) {
      const e = err as { code?: number; message?: string };
      setError(e.code === 4001 ? 'Connection rejected.' : (e.message || 'Failed to sign in.'));
      console.error('SIWE sign-in error:', err);
    } finally {
      setIsConnecting(false);
    }
  }, [loadBtcAddress]);

  // ─── Create Local Wallet ───────────────────────────────
  const createLocalWallet = useCallback(async (password: string): Promise<string> => {
    const { privateKey, address } = await generateWallet();
    const { encrypted, iv, salt } = await encryptKey(privateKey, password);
    storeWallet({ address, encryptedKey: encrypted, iv, salt });
    setHasLocal(true);
    return address;
  }, []);

  // ─── Import Wallet ────────────────────────────────────
  const importWallet = useCallback(async (privateKey: string, password: string) => {
    // Derive address from private key
    const keyBytes = new Uint8Array(privateKey.replace('0x', '').match(/.{2}/g)!.map(b => parseInt(b, 16)));
    const hash = await crypto.subtle.digest('SHA-256', keyBytes.buffer as ArrayBuffer);
    const address = '0x' + Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('').slice(-40);
    const { encrypted, iv, salt } = await encryptKey(privateKey, password);
    storeWallet({ address, encryptedKey: encrypted, iv, salt });
    setHasLocal(true);
  }, []);

  // ─── Sign In with Local Wallet ─────────────────────────
  const signInLocal = useCallback(async (password: string) => {
    setIsConnecting(true);
    setError(null);
    setShowWalletSelector(false);
    try {
      const stored = loadWallet();
      if (!stored) throw new Error('No local wallet found. Create one first.');
      const privateKey = await decryptKey(stored.encryptedKey, stored.iv, stored.salt, password);
      const { data: nonceData, error: nonceError } = await supabase.functions.invoke('siwe-auth', { body: { action: 'nonce' } });
      if (nonceError || !nonceData?.nonce) throw new Error('Failed to get nonce');
      const siweMessage = buildSiweMessage({ domain: window.location.host, address: stored.address, uri: window.location.origin, nonce: nonceData.nonce, chainId: 1, issuedAt: new Date().toISOString() });
      const signature = await localSign(siweMessage, privateKey);
      const { data: verifyData, error: verifyError } = await supabase.functions.invoke('siwe-auth', { body: { action: 'verify', siweMessage, signature } });
      if (verifyError || !verifyData?.session) throw new Error(verifyData?.error || 'SIWE verification failed');
      const { error: sessionError } = await supabase.auth.setSession({ access_token: verifyData.session.access_token, refresh_token: verifyData.session.refresh_token });
      if (sessionError) throw sessionError;
      setEvmAddress(stored.address);
      setWalletType('local');
      localStorage.setItem('siweConnected', 'true');
      await loadBtcAddress();
    } catch (err) {
      const e = err as { message?: string };
      setError(e.message || 'Failed to sign in with local wallet.');
      console.error('Local wallet sign-in error:', err);
    } finally {
      setIsConnecting(false);
    }
  }, [loadBtcAddress]);

  // ─── Export Private Key ────────────────────────────────
  const exportPrivateKey = useCallback(async (password: string): Promise<string> => {
    const stored = loadWallet();
    if (!stored) throw new Error('No local wallet found.');
    return decryptKey(stored.encryptedKey, stored.iv, stored.salt, password);
  }, []);

  // ─── Register BTC address ─────────────────────────────
  const registerBtcAddress = useCallback(async (address: string) => {
    if (!isValidBtcAddress(address)) { setError('Invalid Bitcoin address format.'); return; }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError('You must be signed in.'); return; }
    try {
      const { error: walletError } = await supabase.from('wallets').upsert({ address, wallet_type: 'btc' as const, last_seen_at: new Date().toISOString() }, { onConflict: 'address' });
      if (walletError) throw walletError;
      setBtcAddress(address);
      setError(null);
    } catch (err) {
      console.error('BTC registration error:', err);
      setError('Failed to register BTC address.');
    }
  }, []);

  // ─── Disconnect ────────────────────────────────────────
  const disconnect = useCallback(async () => {
    await supabase.auth.signOut();
    setEvmAddress(null);
    setBtcAddress(null);
    setWalletType(null);
    localStorage.removeItem('siweConnected');
  }, []);

  // ─── Session restoration ──────────────────────────────
  useEffect(() => {
    const restoreSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const walletAddr = session.user.user_metadata?.wallet_address;
        if (walletAddr) {
          setEvmAddress(walletAddr);
          setWalletType(localStorage.getItem('siweWalletType') === 'local' ? 'local' : 'metamask');
          await loadBtcAddress();
        }
      }
    };
    restoreSession();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') { setEvmAddress(null); setBtcAddress(null); setWalletType(null); }
      else if (session?.user?.user_metadata?.wallet_address) {
        setEvmAddress(session.user.user_metadata.wallet_address);
      }
    });
    return () => subscription.unsubscribe();
  }, [loadBtcAddress]);

  // ─── MetaMask account change listener ──────────────────
  useEffect(() => {
    if (!window.ethereum || !evmAddress || walletType !== 'metamask') return;
    const handleAccountsChanged = (accounts: unknown) => {
      const accs = accounts as string[];
      if (accs.length === 0) disconnect();
    };
    window.ethereum.on('accountsChanged', handleAccountsChanged);
    return () => { window.ethereum?.removeListener('accountsChanged', handleAccountsChanged); };
  }, [evmAddress, walletType, disconnect]);

  return (
    <WalletContext.Provider
      value={{
        evmAddress, btcAddress, isConnecting, isAuthenticated, error, walletType,
        signIn, signInLocal, createLocalWallet, importWallet, exportPrivateKey, hasLocalWallet: hasLocal,
        registerBtcAddress, disconnect, showWalletSelector, setShowWalletSelector,
        address: evmAddress, isConnected: isAuthenticated,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (context === undefined) throw new Error('useWallet must be used within a WalletProvider');
  return context;
};
