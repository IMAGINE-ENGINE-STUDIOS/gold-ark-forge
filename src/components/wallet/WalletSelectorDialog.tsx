import { useWallet } from '@/contexts/WalletContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Wallet, Smartphone, ExternalLink } from 'lucide-react';

const WalletSelectorDialog = () => {
  const { showWalletSelector, setShowWalletSelector, connect, isConnecting } = useWallet();

  const hasMetaMask = typeof window !== 'undefined' && !!window.ethereum?.isMetaMask;

  return (
    <Dialog open={showWalletSelector} onOpenChange={setShowWalletSelector}>
      <DialogContent className="bg-navy border-2 border-gold/30 max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl text-gold tracking-wider text-center">
            CONNECT YOUR VAULT
          </DialogTitle>
          <DialogDescription className="text-marble/60 text-center">
            Choose how you'd like to connect your wallet
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 mt-4">
          {/* MetaMask */}
          <button
            onClick={() => connect('metamask')}
            disabled={isConnecting}
            className="w-full flex items-center gap-4 p-4 border border-gold/20 hover:border-gold/60 hover:bg-gold/5 transition-all group disabled:opacity-50"
          >
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center flex-shrink-0">
              <Wallet className="text-white" size={24} />
            </div>
            <div className="text-left flex-1">
              <div className="font-display text-gold tracking-wider text-sm">MetaMask</div>
              <div className="text-marble/50 text-xs mt-0.5">
                {hasMetaMask ? 'Browser extension detected' : 'Extension not detected'}
              </div>
            </div>
            {hasMetaMask && (
              <span className="text-xs text-green-400 bg-green-400/10 px-2 py-1 rounded">
                Ready
              </span>
            )}
          </button>

          {/* WalletConnect */}
          <button
            onClick={() => connect('walletconnect')}
            disabled={isConnecting}
            className="w-full flex items-center gap-4 p-4 border border-gold/20 hover:border-gold/60 hover:bg-gold/5 transition-all group disabled:opacity-50"
          >
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center flex-shrink-0">
              <Smartphone className="text-white" size={24} />
            </div>
            <div className="text-left flex-1">
              <div className="font-display text-gold tracking-wider text-sm">WalletConnect</div>
              <div className="text-marble/50 text-xs mt-0.5">
                Mobile wallets & 300+ wallets
              </div>
            </div>
          </button>
        </div>

        {/* Footer info */}
        <div className="mt-4 pt-4 border-t border-gold/10 text-center">
          <p className="text-marble/40 text-xs">
            Non-custodial · Your keys, your assets
          </p>
          <a
            href="https://metamask.io/download/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gold/50 hover:text-gold text-xs mt-2 inline-flex items-center gap-1"
          >
            Don't have a wallet? Get MetaMask <ExternalLink size={10} />
          </a>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WalletSelectorDialog;
