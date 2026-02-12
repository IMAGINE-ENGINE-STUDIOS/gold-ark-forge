import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

type WalletType = 'metamask' | null;

interface WalletContextType {
  evmAddress: string | null;
  btcAddress: string | null;
  isConnecting: boolean;
  isAuthenticated: boolean;
  error: string | null;
  walletType: WalletType;
  signIn: () => Promise<void>;
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

// BTC address validation (P2PKH, P2SH, bech32, bech32m, testnet)
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

  const isAuthenticated = !!evmAddress;

  // Load BTC address from profile when authenticated
  const loadBtcAddress = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Check wallets table for btc type
    const { data: btcWallet } = await supabase
      .from('wallets')
      .select('address')
      .eq('wallet_type', 'btc')
      .maybeSingle();

    if (btcWallet) {
      setBtcAddress(btcWallet.address);
    }
  }, []);

  // SIWE Sign In flow
  const signIn = useCallback(async () => {
    if (!window.ethereum) {
      setError('MetaMask not installed. Please install MetaMask to connect.');
      return;
    }

    setIsConnecting(true);
    setError(null);
    setShowWalletSelector(false);

    try {
      // 1. Request MetaMask accounts
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      }) as string[];

      if (accounts.length === 0) {
        setError('No accounts found. Please unlock MetaMask.');
        return;
      }

      const userAddress = accounts[0];

      // 2. Get chain ID
      const chainIdHex = await window.ethereum.request({
        method: 'eth_chainId',
      }) as string;
      const chainId = parseInt(chainIdHex, 16);

      // 3. Request nonce from edge function
      const { data: nonceData, error: nonceError } = await supabase.functions.invoke('siwe-auth', {
        body: { action: 'nonce' },
      });

      if (nonceError || !nonceData?.nonce) {
        throw new Error('Failed to get nonce from server');
      }

      // 4. Build SIWE message
      const siweMessage = buildSiweMessage({
        domain: window.location.host,
        address: userAddress,
        uri: window.location.origin,
        nonce: nonceData.nonce,
        chainId,
        issuedAt: new Date().toISOString(),
      });

      // 5. Sign message with MetaMask
      const signature = await window.ethereum.request({
        method: 'personal_sign',
        params: [siweMessage, userAddress],
      }) as string;

      // 6. Verify with edge function
      const { data: verifyData, error: verifyError } = await supabase.functions.invoke('siwe-auth', {
        body: { action: 'verify', siweMessage, signature },
      });

      if (verifyError || !verifyData?.session) {
        throw new Error(verifyData?.error || 'SIWE verification failed');
      }

      // 7. Set Supabase session
      const { error: sessionError } = await supabase.auth.setSession({
        access_token: verifyData.session.access_token,
        refresh_token: verifyData.session.refresh_token,
      });

      if (sessionError) throw sessionError;

      // 8. Update local state
      setEvmAddress(userAddress);
      setWalletType('metamask');
      localStorage.setItem('siweConnected', 'true');

      // 9. Load BTC address if registered
      await loadBtcAddress();
    } catch (err) {
      const error = err as { code?: number; message?: string };
      if (error.code === 4001) {
        setError('Connection rejected. Please approve the signature in MetaMask.');
      } else {
        setError(error.message || 'Failed to sign in. Please try again.');
        console.error('SIWE sign-in error:', err);
      }
    } finally {
      setIsConnecting(false);
    }
  }, [loadBtcAddress]);

  // Register BTC address for settlement
  const registerBtcAddress = useCallback(async (address: string) => {
    if (!isValidBtcAddress(address)) {
      setError('Invalid Bitcoin address format.');
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError('You must be signed in to register a BTC address.');
      return;
    }

    try {
      // Upsert BTC wallet record
      const { error: walletError } = await supabase
        .from('wallets')
        .upsert(
          {
            address: address,
            wallet_type: 'btc' as const,
            last_seen_at: new Date().toISOString(),
          },
          { onConflict: 'address' }
        );

      if (walletError) throw walletError;

      setBtcAddress(address);
      setError(null);
    } catch (err) {
      console.error('BTC registration error:', err);
      setError('Failed to register BTC address.');
    }
  }, []);

  // Disconnect
  const disconnect = useCallback(async () => {
    await supabase.auth.signOut();
    setEvmAddress(null);
    setBtcAddress(null);
    setWalletType(null);
    localStorage.removeItem('siweConnected');
  }, []);

  // Session restoration on mount
  useEffect(() => {
    const restoreSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const walletAddr = session.user.user_metadata?.wallet_address;
        if (walletAddr) {
          setEvmAddress(walletAddr);
          setWalletType('metamask');
          await loadBtcAddress();
        }
      }
    };

    restoreSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        setEvmAddress(null);
        setBtcAddress(null);
        setWalletType(null);
      } else if (session?.user?.user_metadata?.wallet_address) {
        setEvmAddress(session.user.user_metadata.wallet_address);
        setWalletType('metamask');
      }
    });

    return () => subscription.unsubscribe();
  }, [loadBtcAddress]);

  // MetaMask account change listener
  useEffect(() => {
    if (!window.ethereum || !evmAddress) return;

    const handleAccountsChanged = (accounts: unknown) => {
      const accs = accounts as string[];
      if (accs.length === 0) {
        disconnect();
      }
      // If account changed, user needs to re-sign in
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    return () => {
      window.ethereum?.removeListener('accountsChanged', handleAccountsChanged);
    };
  }, [evmAddress, disconnect]);

  return (
    <WalletContext.Provider
      value={{
        evmAddress,
        btcAddress,
        isConnecting,
        isAuthenticated,
        error,
        walletType,
        signIn,
        registerBtcAddress,
        disconnect,
        showWalletSelector,
        setShowWalletSelector,
        // Legacy compat
        address: evmAddress,
        isConnected: isAuthenticated,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};
