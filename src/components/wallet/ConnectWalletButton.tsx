import { useState } from 'react';
import { useWallet } from '@/contexts/WalletContext';
import { Wallet, ChevronDown, LogOut, ExternalLink, Bitcoin, KeyRound, Link2Off, Loader2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Link } from 'react-router-dom';
import { useBrokerConnections, useDeleteBrokerConnection, BROKER_META, BrokerType } from '@/hooks/useBrokerTrading';
import BrokerConnectDialog from '@/components/trading/BrokerConnectDialog';

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
    walletType,
    error,
    setShowWalletSelector,
  } = useWallet();

  const { data: brokerConnections } = useBrokerConnections();
  const deleteBroker = useDeleteBrokerConnection();
  const [brokerDialogOpen, setBrokerDialogOpen] = useState(false);

  const handleDisconnectBroker = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    await deleteBroker.mutateAsync(id);
  };

  if (isAuthenticated && evmAddress) {
    return (
      <>
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
            className="w-72 bg-navy border-gold/20"
          >
            {/* Wallet Info */}
            <DropdownMenuItem className="text-marble/50 text-[10px] cursor-default font-display tracking-wider">
              {walletType === 'metamask' ? 'METAMASK · SIWE' : 'VAULT WALLET · LOCAL'}
            </DropdownMenuItem>

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

            {/* BTC Address */}
            {btcAddress ? (
              <>
                <DropdownMenuSeparator className="bg-gold/20" />
                <DropdownMenuItem className="text-marble/50 text-[10px] cursor-default font-display tracking-wider">
                  BTC SETTLEMENT
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

            {/* Broker Connections */}
            <DropdownMenuSeparator className="bg-gold/20" />
            <DropdownMenuItem className="text-marble/50 text-[10px] cursor-default font-display tracking-wider">
              BROKER ACCOUNTS
            </DropdownMenuItem>

            {brokerConnections && brokerConnections.length > 0 ? (
              brokerConnections.map((conn) => {
                const label = BROKER_META[conn.broker as BrokerType]?.label || conn.broker;
                return (
                  <DropdownMenuItem
                    key={conn.id}
                    className="flex items-center justify-between text-marble cursor-default"
                    onSelect={(e) => e.preventDefault()}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span className="text-xs">{label}</span>
                      <span className="text-[9px] text-marble/30">{conn.environment}</span>
                    </div>
                    <button
                      onClick={(e) => handleDisconnectBroker(conn.id, e)}
                      disabled={deleteBroker.isPending}
                      className="text-red-400/60 hover:text-red-400 p-1 rounded hover:bg-red-500/10 transition-colors"
                    >
                      {deleteBroker.isPending ? <Loader2 size={12} className="animate-spin" /> : <Link2Off size={12} />}
                    </button>
                  </DropdownMenuItem>
                );
              })
            ) : (
              <DropdownMenuItem className="text-marble/30 text-xs cursor-default">
                No brokers connected
              </DropdownMenuItem>
            )}

            <DropdownMenuItem
              onClick={() => setBrokerDialogOpen(true)}
              className="flex items-center gap-2 text-gold/70 hover:text-gold cursor-pointer"
            >
              <KeyRound size={14} />
              <span className="text-xs">Connect Broker</span>
            </DropdownMenuItem>

            {/* Disconnect Wallet */}
            <DropdownMenuSeparator className="bg-gold/20" />
            <DropdownMenuItem
              onClick={() => disconnect()}
              className="flex items-center gap-2 text-red-400 hover:text-red-300 cursor-pointer"
            >
              <LogOut size={16} />
              Disconnect Wallet
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <BrokerConnectDialog open={brokerDialogOpen} onOpenChange={setBrokerDialogOpen} />
      </>
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
