import { useState } from 'react';
import { KeyRound, Eye, EyeOff, Zap } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAddBrokerConnection } from '@/hooks/useBrokerTrading';
import { useToast } from '@/hooks/use-toast';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const BrokerConnectDialog = ({ open, onOpenChange }: Props) => {
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [environment, setEnvironment] = useState<'paper' | 'live'>('paper');
  const [label, setLabel] = useState('');
  const [showSecret, setShowSecret] = useState(false);
  const addConnection = useAddBrokerConnection();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey || !apiSecret) return;

    try {
      await addConnection.mutateAsync({
        broker: 'alpaca',
        environment,
        apiKey,
        apiSecret,
        label: label || undefined,
      });
      toast({ title: 'Broker Connected', description: `Alpaca ${environment} account linked successfully.` });
      setApiKey('');
      setApiSecret('');
      setLabel('');
      onOpenChange(false);
    } catch (err) {
      toast({
        title: 'Connection Failed',
        description: err instanceof Error ? err.message : 'Failed to connect broker',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-navy border-gold/30 max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-gold-light tracking-wider flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-gold" />
            CONNECT ALPACA
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          {/* Environment toggle */}
          <div className="flex gap-2">
            {(['paper', 'live'] as const).map((env) => (
              <button
                key={env}
                type="button"
                onClick={() => setEnvironment(env)}
                className={`flex-1 py-2 px-4 rounded font-display text-xs tracking-wider transition-all ${
                  environment === env
                    ? env === 'live'
                      ? 'bg-red-500/20 border border-red-500/50 text-red-300'
                      : 'bg-gold/20 border border-gold/50 text-gold'
                    : 'bg-navy-light/50 border border-gold/10 text-marble/50 hover:border-gold/20'
                }`}
              >
                {env === 'paper' && <Zap className="w-3 h-3 inline mr-1" />}
                {env.toUpperCase()}
              </button>
            ))}
          </div>

          {environment === 'live' && (
            <div className="bg-red-500/10 border border-red-500/30 rounded p-3 text-xs text-red-300">
              ⚠️ Live trading uses real money. Gold Arrow does not custody funds — orders execute directly on your Alpaca account.
            </div>
          )}

          <div>
            <label className="text-marble/60 text-xs font-display tracking-wider mb-1 block">API KEY ID</label>
            <Input
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="PK..."
              className="bg-navy-light border-gold/20 text-marble font-mono text-sm"
              required
            />
          </div>

          <div>
            <label className="text-marble/60 text-xs font-display tracking-wider mb-1 block">API SECRET KEY</label>
            <div className="relative">
              <Input
                type={showSecret ? 'text' : 'password'}
                value={apiSecret}
                onChange={(e) => setApiSecret(e.target.value)}
                placeholder="••••••••"
                className="bg-navy-light border-gold/20 text-marble font-mono text-sm pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowSecret(!showSecret)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-marble/40 hover:text-gold"
              >
                {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="text-marble/60 text-xs font-display tracking-wider mb-1 block">LABEL (optional)</label>
            <Input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="My Paper Account"
              className="bg-navy-light border-gold/20 text-marble text-sm"
            />
          </div>

          <p className="text-marble/30 text-[10px]">
            Get your API keys from{' '}
            <a href="https://app.alpaca.markets/paper/dashboard/overview" target="_blank" rel="noreferrer" className="text-gold/60 underline">
              alpaca.markets
            </a>. Your keys are stored securely and never shared.
          </p>

          <Button
            type="submit"
            disabled={addConnection.isPending || !apiKey || !apiSecret}
            className="w-full bg-gold text-navy font-display tracking-wider hover:bg-gold-light"
          >
            {addConnection.isPending ? 'CONNECTING...' : 'CONNECT BROKER'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default BrokerConnectDialog;
