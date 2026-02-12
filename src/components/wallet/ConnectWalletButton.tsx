import { useWallet } from '@/contexts/WalletContext';
import { Wallet, ChevronDown, LogOut, ExternalLink, Bitcoin } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Link } from 'react-router-dom';

const truncateAddress = (address: string) => {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

const ConnectWalletButton = () => {
  const {
    evmAddress,
    btcAddress,
    isConnecting,
    isAuthenticated,
    disconnect,
    error,
    setShowWalletSelector,
  } = useWallet();

  if (isAuthenticated && evmAddress) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-2 btn-primary-gold px-4 py-2 text-sm">
            <Wallet size={16} />
            <span>{truncateAddress(evmAddress)}</span>
            <ChevronDown size={14} />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="w-64 bg-navy border-gold/20"
        >
          <DropdownMenuItem asChild>
            <Link
              to="/vault"
              className="flex items-center gap-2 text-marble hover:text-gold cursor-pointer"
            >
              <Wallet size={16} />
              My Vault
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <a
              href={`https://etherscan.io/address/${evmAddress}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-marble hover:text-gold cursor-pointer"
            >
              <ExternalLink size={16} />
              View on Etherscan
            </a>
          </DropdownMenuItem>

          {btcAddress ? (
            <>
              <DropdownMenuSeparator className="bg-gold/20" />
              <DropdownMenuItem className="text-marble/50 text-xs cursor-default font-display tracking-wider">
                BTC Settlement
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <a
                  href={`https://mempool.space/address/${btcAddress}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-marble hover:text-gold cursor-pointer"
                >
                  <Bitcoin size={16} />
                  <span className="font-mono text-xs truncate">{truncateAddress(btcAddress)}</span>
                  <ExternalLink size={12} className="ml-auto" />
                </a>
              </DropdownMenuItem>
            </>
          ) : (
            <>
              <DropdownMenuSeparator className="bg-gold/20" />
              <DropdownMenuItem
                onClick={() => setShowWalletSelector(true)}
                className="flex items-center gap-2 text-gold/70 hover:text-gold cursor-pointer"
              >
                <Bitcoin size={16} />
                Register BTC Address
              </DropdownMenuItem>
            </>
          )}

          <DropdownMenuSeparator className="bg-gold/20" />
          <DropdownMenuItem className="text-marble/50 text-xs cursor-default">
            Authenticated via SIWE (MetaMask)
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => disconnect()}
            className="flex items-center gap-2 text-red-400 hover:text-red-300 cursor-pointer"
          >
            <LogOut size={16} />
            Disconnect
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={() => setShowWalletSelector(true)}
        disabled={isConnecting}
        className="btn-primary-gold px-6 py-2 text-sm flex items-center gap-2 disabled:opacity-50"
      >
        <Wallet size={16} />
        {isConnecting ? 'Connecting...' : 'Connect Vault'}
      </button>
      {error && (
        <span className="text-xs text-red-400 max-w-[200px] text-right">
          {error}
        </span>
      )}
    </div>
  );
};

export default ConnectWalletButton;
