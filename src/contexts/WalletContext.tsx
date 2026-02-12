import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

// WalletConnect Project ID - Replace with your own from https://cloud.walletconnect.com
const WALLETCONNECT_PROJECT_ID = '782e84f4b218dd6d081f40e92354847c';

type WalletType = 'metamask' | 'walletconnect' | null;

interface WalletContextType {
  address: string | null;
  chainId: string | null;
  isConnecting: boolean;
  isConnected: boolean;
  error: string | null;
  walletType: WalletType;
  connect: (type: WalletType) => Promise<void>;
  disconnect: () => void;
  showWalletSelector: boolean;
  setShowWalletSelector: (show: boolean) => void;
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
  const [walletType, setWalletType] = useState<WalletType>(null);
  const [wcProvider, setWcProvider] = useState<any>(null);
  const [showWalletSelector, setShowWalletSelector] = useState(false);

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

  // Handle account changes (MetaMask)
  const handleAccountsChanged = useCallback((accounts: unknown) => {
    const accountsArray = accounts as string[];
    if (accountsArray.length === 0) {
      setAddress(null);
      setWalletType(null);
      localStorage.removeItem('walletConnected');
      localStorage.removeItem('walletType');
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

  // Connect via MetaMask
  const connectMetaMask = useCallback(async () => {
    if (!window.ethereum) {
      setError('MetaMask not installed. Please install MetaMask to connect.');
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
        setWalletType('metamask');
        localStorage.setItem('walletConnected', 'true');
        localStorage.setItem('walletType', 'metamask');
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

  // Connect via WalletConnect
  const connectWalletConnect = useCallback(async () => {

    setIsConnecting(true);
    setError(null);

    try {
      const { default: EthereumProvider } = await import('@walletconnect/ethereum-provider');

      const provider = await EthereumProvider.init({
        projectId: WALLETCONNECT_PROJECT_ID,
        chains: [1], // Ethereum Mainnet
        optionalChains: [137, 10, 42161], // Polygon, Optimism, Arbitrum
        showQrModal: true,
        metadata: {
          name: 'Gold Arrow',
          description: 'The New Standard in Asset Certification',
          url: window.location.origin,
          icons: [`${window.location.origin}/favicon.ico`],
        },
      });

      await provider.connect();

      const accounts = provider.accounts;
      if (accounts.length > 0) {
        setAddress(accounts[0]);
        setWalletType('walletconnect');
        setWcProvider(provider);
        localStorage.setItem('walletConnected', 'true');
        localStorage.setItem('walletType', 'walletconnect');
        await saveWalletToProfile(accounts[0]);
      }

      setChainId(`0x${provider.chainId.toString(16)}`);

      // WalletConnect event listeners
      provider.on('accountsChanged', (accs: string[]) => {
        if (accs.length === 0) {
          setAddress(null);
          setWalletType(null);
          localStorage.removeItem('walletConnected');
          localStorage.removeItem('walletType');
        } else {
          setAddress(accs[0]);
          saveWalletToProfile(accs[0]);
        }
      });

      provider.on('chainChanged', (newChainId: string | number) => {
        const id = typeof newChainId === 'number' ? `0x${newChainId.toString(16)}` : String(newChainId);
        setChainId(id);
      });

      provider.on('disconnect', () => {
        setAddress(null);
        setWalletType(null);
        setWcProvider(null);
        localStorage.removeItem('walletConnected');
        localStorage.removeItem('walletType');
      });
    } catch (err) {
      console.error('WalletConnect error:', err);
      setError('Failed to connect via WalletConnect. Please try again.');
    } finally {
      setIsConnecting(false);
    }
  }, [saveWalletToProfile]);

  // Unified connect function
  const connect = useCallback(async (type: WalletType) => {
    setShowWalletSelector(false);
    if (type === 'metamask') {
      await connectMetaMask();
    } else if (type === 'walletconnect') {
      await connectWalletConnect();
    }
  }, [connectMetaMask, connectWalletConnect]);

  // Disconnect wallet
  const disconnect = useCallback(async () => {
    if (walletType === 'walletconnect' && wcProvider) {
      try {
        await wcProvider.disconnect();
      } catch (err) {
        console.error('WalletConnect disconnect error:', err);
      }
    }
    setAddress(null);
    setChainId(null);
    setWalletType(null);
    setWcProvider(null);
    localStorage.removeItem('walletConnected');
    localStorage.removeItem('walletType');
  }, [walletType, wcProvider]);

  // Check for existing connection on mount
  useEffect(() => {
    const checkConnection = async () => {
      const savedType = localStorage.getItem('walletType') as WalletType;
      if (localStorage.getItem('walletConnected') === 'true' && savedType === 'metamask' && window.ethereum) {
        try {
          const accounts = await window.ethereum.request({
            method: 'eth_accounts',
          }) as string[];

          if (accounts.length > 0) {
            setAddress(accounts[0]);
            setWalletType('metamask');
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

  // Set up MetaMask event listeners
  useEffect(() => {
    if (window.ethereum && walletType === 'metamask') {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

      return () => {
        window.ethereum?.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum?.removeListener('chainChanged', handleChainChanged);
      };
    }
  }, [handleAccountsChanged, handleChainChanged, walletType]);

  return (
    <WalletContext.Provider
      value={{
        address,
        chainId,
        isConnecting,
        isConnected,
        error,
        walletType,
        connect,
        disconnect,
        showWalletSelector,
        setShowWalletSelector,
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
