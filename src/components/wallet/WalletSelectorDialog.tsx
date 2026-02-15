import { useState } from 'react';
import { useWallet } from '@/contexts/WalletContext';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Wallet, ExternalLink, Bitcoin, CheckCircle, ArrowRight, KeyRound, ShieldCheck, Download, Eye, EyeOff, AlertTriangle, Trash2 } from 'lucide-react';
import { clearWallet } from '@/lib/localWallet';

type View = 'select' | 'btc' | 'local-create' | 'local-import' | 'local-unlock' | 'backup';

const WalletSelectorDialog = () => {
  const {
    showWalletSelector, setShowWalletSelector,
    signIn, signInLocal, createLocalWallet, importWallet, exportPrivateKey,
    registerBtcAddress,
    isConnecting, isAuthenticated, btcAddress, hasLocalWallet,
  } = useWallet();

  const [view, setView] = useState<View>('select');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [privateKeyInput, setPrivateKeyInput] = useState('');
  const [btcInput, setBtcInput] = useState('');
  const [btcError, setBtcError] = useState('');
  const [error, setError] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [exportedKey, setExportedKey] = useState('');
  const [createdAddress, setCreatedAddress] = useState('');

  const hasMetaMask = typeof window !== 'undefined' && !!window.ethereum?.isMetaMask;

  const resetAll = () => {
    setView('select'); setPassword(''); setConfirmPassword(''); setPrivateKeyInput('');
    setBtcInput(''); setBtcError(''); setError(''); setShowKey(false); setExportedKey(''); setCreatedAddress('');
  };

  const handleOpenChange = (open: boolean) => {
    setShowWalletSelector(open);
    if (!open) resetAll();
  };

  const handleMetaMaskSignIn = async () => {
    await signIn();
    setView('btc');
  };

  const handleCreateWallet = async () => {
    if (password.length < 8) { setError('Password must be at least 8 characters'); return; }
    if (password !== confirmPassword) { setError('Passwords do not match'); return; }
    setError('');
    try {
      const addr = await createLocalWallet(password);
      setCreatedAddress(addr);
      setView('backup');
    } catch (err) {
      setError((err as Error).message || 'Failed to create wallet');
    }
  };

  const handleImportWallet = async () => {
    if (password.length < 8) { setError('Password must be at least 8 characters'); return; }
    if (!privateKeyInput.startsWith('0x') || privateKeyInput.length < 66) { setError('Invalid private key format (0x...)'); return; }
    setError('');
    try {
      await importWallet(privateKeyInput, password);
      setPrivateKeyInput('');
      setView('select');
    } catch (err) {
      setError((err as Error).message || 'Failed to import wallet');
    }
  };

  const handleLocalSignIn = async () => {
    if (!password) { setError('Enter your password'); return; }
    setError('');
    try {
      await signInLocal(password);
      setView('btc');
    } catch (err) {
      setError((err as Error).message || 'Incorrect password or wallet corrupted');
    }
  };

  const handleExport = async () => {
    if (!password) { setError('Enter your password'); return; }
    setError('');
    try {
      const key = await exportPrivateKey(password);
      setExportedKey(key);
    } catch {
      setError('Incorrect password');
    }
  };

  const handleBtcRegister = async () => {
    if (!btcInput.trim()) { setBtcError('Please enter a Bitcoin address'); return; }
    setBtcError('');
    await registerBtcAddress(btcInput.trim());
    setBtcInput('');
    setShowWalletSelector(false);
    resetAll();
  };

  // If authenticated and dialog opens, show BTC step
  const showingBtcStep = isAuthenticated && (view === 'btc' || !btcAddress);

  return (
    <Dialog open={showWalletSelector} onOpenChange={handleOpenChange}>
      <DialogContent className="bg-navy border-2 border-gold/30 max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl text-gold tracking-wider text-center">
            {view === 'btc' ? 'REGISTER SETTLEMENT ADDRESS'
              : view === 'local-create' ? 'CREATE VAULT WALLET'
              : view === 'local-import' ? 'IMPORT WALLET'
              : view === 'local-unlock' ? 'UNLOCK VAULT WALLET'
              : view === 'backup' ? 'BACKUP YOUR WALLET'
              : 'CONNECT YOUR VAULT'}
          </DialogTitle>
          <DialogDescription className="text-marble/60 text-center">
            {view === 'btc' ? 'Add a Bitcoin address for settlement (optional)'
              : view === 'local-create' ? 'Create an in-browser wallet — no extension needed'
              : view === 'local-import' ? 'Import an existing private key'
              : view === 'local-unlock' ? 'Enter your password to sign in'
              : view === 'backup' ? 'Save your wallet address — back up your key'
              : 'Sign in with MetaMask or use the built-in Vault Wallet'}
          </DialogDescription>
        </DialogHeader>

        {/* ─── Wallet Selection ─────────────────────────── */}
        {view === 'select' && !showingBtcStep && (
          <div className="space-y-3 mt-4">
            {/* MetaMask */}
            <button
              onClick={handleMetaMaskSignIn}
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
                  {hasMetaMask ? 'EIP-4361 · Sign-In with Ethereum' : 'Extension not detected'}
                </div>
              </div>
              {hasMetaMask && (
                <span className="text-xs text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded">Ready</span>
              )}
            </button>

            {/* Local Wallet — Unlock */}
            {hasLocalWallet && (
              <button
                onClick={() => setView('local-unlock')}
                disabled={isConnecting}
                className="w-full flex items-center gap-4 p-4 border border-gold/20 hover:border-gold/60 hover:bg-gold/5 transition-all group disabled:opacity-50"
              >
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-gold/80 to-gold-dark flex items-center justify-center flex-shrink-0">
                  <ShieldCheck className="text-navy" size={24} />
                </div>
                <div className="text-left flex-1">
                  <div className="font-display text-gold tracking-wider text-sm">Unlock Vault Wallet</div>
                  <div className="text-marble/50 text-xs mt-0.5">In-browser · Password-protected</div>
                </div>
                <span className="text-xs text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded">Stored</span>
              </button>
            )}

            {/* Create New Wallet — always visible */}
            <button
              onClick={() => setView('local-create')}
              disabled={isConnecting}
              className="w-full flex items-center gap-4 p-4 border border-gold/20 hover:border-gold/60 hover:bg-gold/5 transition-all group disabled:opacity-50"
            >
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-gold/80 to-gold-dark flex items-center justify-center flex-shrink-0">
                <KeyRound className="text-navy" size={24} />
              </div>
              <div className="text-left flex-1">
                <div className="font-display text-gold tracking-wider text-sm">Create New Wallet</div>
                <div className="text-marble/50 text-xs mt-0.5">No extension needed · Non-custodial</div>
              </div>
            </button>

            {/* Disconnect / Remove stored wallet */}
            {hasLocalWallet && (
              <button
                onClick={() => { clearWallet(); window.location.reload(); }}
                className="w-full flex items-center gap-3 p-3 border border-red-500/20 hover:border-red-500/40 hover:bg-red-500/5 transition-all text-red-400/70 hover:text-red-400"
              >
                <Trash2 size={16} />
                <span className="text-xs font-display tracking-wider">Remove Stored Wallet</span>
              </button>
            )}

            {/* Import */}
            <button
              onClick={() => setView('local-import')}
              disabled={isConnecting}
              className="w-full flex items-center gap-3 p-3 border border-gold/10 hover:border-gold/30 transition-all text-marble/40 hover:text-marble/70"
            >
              <Download size={16} />
              <span className="text-xs font-display tracking-wider">Import Existing Wallet</span>
            </button>
          </div>
        )}

        {/* ─── Create Local Wallet ─────────────────────── */}
        {view === 'local-create' && (
          <div className="space-y-4 mt-4">
            <div className="bg-amber-500/10 border border-amber-500/30 rounded p-3 text-xs text-amber-300 flex items-start gap-2">
              <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" />
              <span>Your private key is encrypted and stored in this browser only. <strong>If you lose your password, your wallet cannot be recovered.</strong></span>
            </div>
            <div className="space-y-2">
              <label className="text-gold/70 text-sm font-display tracking-wider uppercase">Password (min 8 chars)</label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••"
                className="bg-navy-light border-gold/20 text-marble" />
            </div>
            <div className="space-y-2">
              <label className="text-gold/70 text-sm font-display tracking-wider uppercase">Confirm Password</label>
              <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••"
                className="bg-navy-light border-gold/20 text-marble" />
            </div>
            {error && <p className="text-red-400 text-xs">{error}</p>}
            <div className="flex gap-3">
              <button onClick={handleCreateWallet} className="flex-1 btn-primary-gold px-4 py-2.5 text-sm flex items-center justify-center gap-2">
                <KeyRound size={16} /> Create Wallet
              </button>
              <button onClick={() => { resetAll(); }} className="px-4 py-2.5 text-sm text-marble/40 hover:text-marble border border-gold/10 rounded">Back</button>
            </div>
          </div>
        )}

        {/* ─── Backup Screen ──────────────────────────── */}
        {view === 'backup' && (
          <div className="space-y-4 mt-4">
            <div className="flex items-center gap-3 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded">
              <CheckCircle className="text-emerald-400" size={20} />
              <span className="text-emerald-400 text-sm font-display tracking-wider">WALLET CREATED</span>
            </div>
            <div className="space-y-2">
              <label className="text-gold/70 text-xs font-display tracking-wider uppercase">Your Address</label>
              <div className="bg-navy-light border border-gold/20 rounded p-3 font-mono text-xs text-marble break-all">{createdAddress}</div>
            </div>
            <div className="space-y-2">
              <label className="text-gold/70 text-xs font-display tracking-wider uppercase">Export Private Key</label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Re-enter password"
                className="bg-navy-light border-gold/20 text-marble text-xs" />
              <button onClick={handleExport} className="text-xs text-gold/60 hover:text-gold underline">Reveal Key</button>
              {exportedKey && (
                <div className="relative">
                  <div className="bg-red-500/5 border border-red-500/30 rounded p-3 font-mono text-[10px] text-red-300 break-all">
                    {showKey ? exportedKey : '•'.repeat(66)}
                  </div>
                  <button onClick={() => setShowKey(!showKey)} className="absolute right-2 top-2 text-marble/40 hover:text-gold">
                    {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              )}
            </div>
            {error && <p className="text-red-400 text-xs">{error}</p>}
            <button onClick={() => { resetAll(); setShowWalletSelector(false); }} className="w-full btn-primary-gold px-4 py-2.5 text-sm">
              Done
            </button>
          </div>
        )}

        {/* ─── Unlock Local Wallet ─────────────────────── */}
        {view === 'local-unlock' && (
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <label className="text-gold/70 text-sm font-display tracking-wider uppercase">Password</label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••"
                className="bg-navy-light border-gold/20 text-marble" />
            </div>
            {error && <p className="text-red-400 text-xs">{error}</p>}
            <div className="flex gap-3">
              <button onClick={handleLocalSignIn} disabled={isConnecting}
                className="flex-1 btn-primary-gold px-4 py-2.5 text-sm flex items-center justify-center gap-2 disabled:opacity-50">
                <ShieldCheck size={16} /> {isConnecting ? 'Signing In...' : 'Unlock & Sign In'}
              </button>
              <button onClick={() => { resetAll(); }} className="px-4 py-2.5 text-sm text-marble/40 hover:text-marble border border-gold/10 rounded">Back</button>
            </div>
          </div>
        )}

        {/* ─── Import Wallet ──────────────────────────── */}
        {view === 'local-import' && (
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <label className="text-gold/70 text-sm font-display tracking-wider uppercase">Private Key</label>
              <Input type="password" value={privateKeyInput} onChange={(e) => setPrivateKeyInput(e.target.value)} placeholder="0x..."
                className="bg-navy-light border-gold/20 text-marble font-mono text-xs" />
            </div>
            <div className="space-y-2">
              <label className="text-gold/70 text-sm font-display tracking-wider uppercase">Encryption Password</label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min 8 characters"
                className="bg-navy-light border-gold/20 text-marble" />
            </div>
            {error && <p className="text-red-400 text-xs">{error}</p>}
            <div className="flex gap-3">
              <button onClick={handleImportWallet} className="flex-1 btn-primary-gold px-4 py-2.5 text-sm flex items-center justify-center gap-2">
                <Download size={16} /> Import
              </button>
              <button onClick={() => { resetAll(); }} className="px-4 py-2.5 text-sm text-marble/40 hover:text-marble border border-gold/10 rounded">Back</button>
            </div>
          </div>
        )}

        {/* ─── BTC Registration Step ──────────────────── */}
        {showingBtcStep && view === 'btc' && (
          <div className="space-y-4 mt-4">
            <div className="flex items-center gap-3 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded">
              <CheckCircle className="text-emerald-400" size={20} />
              <span className="text-emerald-400 text-sm font-display tracking-wider">SIWE Authentication Successful</span>
            </div>
            <div className="space-y-2">
              <label className="text-gold/70 text-sm font-display tracking-wider uppercase">Bitcoin Settlement Address</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Bitcoin className="absolute left-3 top-1/2 -translate-y-1/2 text-gold/40" size={16} />
                  <Input value={btcInput} onChange={(e) => setBtcInput(e.target.value)} placeholder="bc1q... or 1... or 3..."
                    className="pl-10 bg-navy-light border-gold/20 text-marble placeholder:text-marble/30 font-mono text-xs" />
                </div>
              </div>
              {btcError && <p className="text-red-400 text-xs">{btcError}</p>}
              <p className="text-marble/40 text-xs">P2PKH, P2SH, bech32, and bech32m addresses supported</p>
            </div>
            <div className="flex gap-3">
              <button onClick={handleBtcRegister} className="flex-1 btn-primary-gold px-4 py-2.5 text-sm flex items-center justify-center gap-2">
                <Bitcoin size={16} /> Register
              </button>
              <button onClick={() => { setShowWalletSelector(false); resetAll(); }}
                className="flex-1 btn-secondary-navy px-4 py-2.5 text-sm flex items-center justify-center gap-2">
                Skip for Now <ArrowRight size={14} />
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-4 pt-4 border-t border-gold/10 text-center">
          <p className="text-marble/40 text-xs">Non-custodial · Your keys, your assets</p>
          {!hasMetaMask && view === 'select' && !showingBtcStep && (
            <a href="https://metamask.io/download/" target="_blank" rel="noopener noreferrer"
              className="text-gold/50 hover:text-gold text-xs mt-2 inline-flex items-center gap-1">
              Don't have MetaMask? Download it <ExternalLink size={10} />
            </a>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WalletSelectorDialog;
