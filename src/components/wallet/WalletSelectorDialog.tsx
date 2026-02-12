import { useState } from 'react';
import { useWallet } from '@/contexts/WalletContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Wallet, ExternalLink, Bitcoin, CheckCircle, ArrowRight } from 'lucide-react';

const WalletSelectorDialog = () => {
  const {
    showWalletSelector,
    setShowWalletSelector,
    signIn,
    registerBtcAddress,
    isConnecting,
    isAuthenticated,
    btcAddress,
  } = useWallet();

  const [btcInput, setBtcInput] = useState('');
  const [btcError, setBtcError] = useState('');
  const [showBtcStep, setShowBtcStep] = useState(false);

  const hasMetaMask = typeof window !== 'undefined' && !!window.ethereum?.isMetaMask;

  const handleSignIn = async () => {
    await signIn();
    // After sign-in, show BTC registration step
    setShowBtcStep(true);
  };

  const handleBtcRegister = async () => {
    if (!btcInput.trim()) {
      setBtcError('Please enter a Bitcoin address');
      return;
    }
    setBtcError('');
    await registerBtcAddress(btcInput.trim());
    setBtcInput('');
    setShowWalletSelector(false);
    setShowBtcStep(false);
  };

  const handleSkipBtc = () => {
    setShowWalletSelector(false);
    setShowBtcStep(false);
    setBtcInput('');
  };

  const handleOpenChange = (open: boolean) => {
    setShowWalletSelector(open);
    if (!open) {
      setShowBtcStep(false);
      setBtcInput('');
      setBtcError('');
    }
  };

  // If authenticated and dialog opens, show BTC step
  const showingBtcStep = isAuthenticated && (showBtcStep || !btcAddress);

  return (
    <Dialog open={showWalletSelector} onOpenChange={handleOpenChange}>
      <DialogContent className="bg-navy border-2 border-gold/30 max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl text-gold tracking-wider text-center">
            {showingBtcStep ? 'REGISTER SETTLEMENT ADDRESS' : 'CONNECT YOUR VAULT'}
          </DialogTitle>
          <DialogDescription className="text-marble/60 text-center">
            {showingBtcStep
              ? 'Add a Bitcoin address for settlement (optional)'
              : 'Sign in with your Ethereum wallet via SIWE'}
          </DialogDescription>
        </DialogHeader>

        {!showingBtcStep ? (
          <div className="space-y-3 mt-4">
            {/* MetaMask SIWE Sign-In */}
            <button
              onClick={handleSignIn}
              disabled={isConnecting}
              className="w-full flex items-center gap-4 p-4 border border-gold/20 hover:border-gold/60 hover:bg-gold/5 transition-all group disabled:opacity-50"
            >
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center flex-shrink-0">
                <Wallet className="text-white" size={24} />
              </div>
              <div className="text-left flex-1">
                <div className="font-display text-gold tracking-wider text-sm">
                  {isConnecting ? 'Signing In...' : 'Sign In with MetaMask'}
                </div>
                <div className="text-marble/50 text-xs mt-0.5">
                  {hasMetaMask
                    ? 'EIP-4361 · Sign-In with Ethereum'
                    : 'Extension not detected'}
                </div>
              </div>
              {hasMetaMask && (
                <span className="text-xs text-green-400 bg-green-400/10 px-2 py-1 rounded">
                  Ready
                </span>
              )}
            </button>
          </div>
        ) : (
          <div className="space-y-4 mt-4">
            {/* Success indicator */}
            <div className="flex items-center gap-3 p-3 bg-green-500/10 border border-green-500/30 rounded">
              <CheckCircle className="text-green-400" size={20} />
              <span className="text-green-400 text-sm font-display tracking-wider">
                SIWE Authentication Successful
              </span>
            </div>

            {/* BTC Address Input */}
            <div className="space-y-2">
              <label className="text-gold/70 text-sm font-display tracking-wider uppercase">
                Bitcoin Settlement Address
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Bitcoin
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gold/40"
                    size={16}
                  />
                  <Input
                    value={btcInput}
                    onChange={(e) => setBtcInput(e.target.value)}
                    placeholder="bc1q... or 1... or 3..."
                    className="pl-10 bg-navy-light border-gold/20 text-marble placeholder:text-marble/30 font-mono text-xs"
                  />
                </div>
              </div>
              {btcError && (
                <p className="text-red-400 text-xs">{btcError}</p>
              )}
              <p className="text-marble/40 text-xs">
                P2PKH, P2SH, bech32, and bech32m addresses supported
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleBtcRegister}
                className="flex-1 btn-primary-gold px-4 py-2.5 text-sm flex items-center justify-center gap-2"
              >
                <Bitcoin size={16} />
                Register
              </button>
              <button
                onClick={handleSkipBtc}
                className="flex-1 btn-secondary-navy px-4 py-2.5 text-sm flex items-center justify-center gap-2"
              >
                Skip for Now
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        )}

        {/* Footer info */}
        <div className="mt-4 pt-4 border-t border-gold/10 text-center">
          <p className="text-marble/40 text-xs">
            Non-custodial · Your keys, your assets
          </p>
          {!hasMetaMask && !showingBtcStep && (
            <a
              href="https://metamask.io/download/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gold/50 hover:text-gold text-xs mt-2 inline-flex items-center gap-1"
            >
              Don't have a wallet? Get MetaMask <ExternalLink size={10} />
            </a>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WalletSelectorDialog;
