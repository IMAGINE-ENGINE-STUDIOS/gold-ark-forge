import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface WalletContextType {
  address: string | null;
  chainId: string | null;
  isConnecting: boolean;
  isConnected: boolean;
  error: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
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

export const WalletProvider = ({ children }: { children: ReactNode }) => {
  const [address, setAddress] = useState<string | null>(null);
  const [chainId, setChainId] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isConnected = !!address;

  // Save wallet address to profile
  const saveWalletToProfile = useCallback(async (walletAddress: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from('profiles')
        .update({ wallet_address: walletAddress })
        .eq('user_id', user.id);
    }
  }, []);

  // Handle account changes
  const handleAccountsChanged = useCallback((accounts: unknown) => {
    const accountsArray = accounts as string[];
    if (accountsArray.length === 0) {
      setAddress(null);
      localStorage.removeItem('walletConnected');
    } else {
      const newAddress = accountsArray[0];
      setAddress(newAddress);
      localStorage.setItem('walletConnected', 'true');
      saveWalletToProfile(newAddress);
    }
  }, [saveWalletToProfile]);

  // Handle chain changes
  const handleChainChanged = useCallback((newChainId: unknown) => {
    setChainId(newChainId as string);
  }, []);

  // Connect wallet
  const connect = useCallback(async () => {
    if (!window.ethereum) {
      setError('MetaMask not installed. Please install MetaMask to connect your Vault.');
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      }) as string[];

      if (accounts.length > 0) {
        setAddress(accounts[0]);
        localStorage.setItem('walletConnected', 'true');
        await saveWalletToProfile(accounts[0]);
      }

      const chainIdHex = await window.ethereum.request({
        method: 'eth_chainId',
      }) as string;
      setChainId(chainIdHex);
    } catch (err) {
      const error = err as { code?: number; message?: string };
      if (error.code === 4001) {
        setError('Connection rejected. Please approve the connection in MetaMask.');
      } else {
        setError('Failed to connect wallet. Please try again.');
      }
    } finally {
      setIsConnecting(false);
    }
  }, [saveWalletToProfile]);

  // Disconnect wallet
  const disconnect = useCallback(() => {
    setAddress(null);
    setChainId(null);
    localStorage.removeItem('walletConnected');
  }, []);

  // Check for existing connection on mount
  useEffect(() => {
    const checkConnection = async () => {
      if (window.ethereum && localStorage.getItem('walletConnected') === 'true') {
        try {
          const accounts = await window.ethereum.request({
            method: 'eth_accounts',
          }) as string[];

          if (accounts.length > 0) {
            setAddress(accounts[0]);
            const chainIdHex = await window.ethereum.request({
              method: 'eth_chainId',
            }) as string;
            setChainId(chainIdHex);
          }
        } catch (err) {
          console.error('Failed to check wallet connection:', err);
        }
      }
    };

    checkConnection();
  }, []);

  // Set up event listeners
  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

      return () => {
        window.ethereum?.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum?.removeListener('chainChanged', handleChainChanged);
      };
    }
  }, [handleAccountsChanged, handleChainChanged]);

  return (
    <WalletContext.Provider
      value={{
        address,
        chainId,
        isConnecting,
        isConnected,
        error,
        connect,
        disconnect,
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
