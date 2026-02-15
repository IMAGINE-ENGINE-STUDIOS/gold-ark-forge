import { useState } from 'react';
import { KeyRound, Eye, EyeOff, Zap, ArrowLeft, ChevronRight } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAddBrokerConnection, BROKER_META, BrokerType } from '@/hooks/useBrokerTrading';
import { useToast } from '@/hooks/use-toast';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const BROKERS: BrokerType[] = ['alpaca', 'coinbase', 'ibkr', 'tradier', 'webull', 'kraken', 'gemini', 'oanda', 'td_ameritrade'];

const BrokerConnectDialog = ({ open, onOpenChange }: Props) => {
  const [step, setStep] = useState<'pick' | 'credentials'>('pick');
  const [selectedBroker, setSelectedBroker] = useState<BrokerType>('alpaca');
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [apiPassphrase, setApiPassphrase] = useState('');
  const [environment, setEnvironment] = useState('');
  const [label, setLabel] = useState('');
  const [showSecret, setShowSecret] = useState(false);
  const addConnection = useAddBrokerConnection();
  const { toast } = useToast();

  const meta = BROKER_META[selectedBroker];

  const resetForm = () => {
    setStep('pick');
    setApiKey('');
    setApiSecret('');
    setApiPassphrase('');
    setLabel('');
    setShowSecret(false);
    setEnvironment('');
  };

  const handleOpenChange = (o: boolean) => {
    if (!o) resetForm();
    onOpenChange(o);
  };

  const selectBroker = (b: BrokerType) => {
    setSelectedBroker(b);
    setEnvironment(BROKER_META[b].environments[0].value);
    setStep('credentials');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey || !apiSecret) return;

    try {
      await addConnection.mutateAsync({
        broker: selectedBroker,
        environment,
        apiKey,
        apiSecret,
        apiPassphrase: selectedBroker === 'coinbase' ? apiPassphrase : undefined,
        label: label || undefined,
      });
      toast({ title: 'Broker Connected', description: `${meta.label} ${environment} account linked.` });
      resetForm();
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
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="bg-navy border-gold/30 max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-gold-light tracking-wider flex items-center gap-2">
            {step === 'credentials' && (
              <button onClick={() => setStep('pick')} className="text-marble/40 hover:text-gold transition-colors">
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <KeyRound className="w-5 h-5 text-gold" />
            {step === 'pick' ? 'SELECT BROKER' : `CONNECT ${meta.label.toUpperCase()}`}
          </DialogTitle>
        </DialogHeader>

        {step === 'pick' ? (
          <div className="space-y-3 mt-2">
            {BROKERS.map((b) => {
              const m = BROKER_META[b];
              return (
                <button
                  key={b}
                  onClick={() => selectBroker(b)}
                  className="w-full flex items-center justify-between p-4 rounded-lg bg-navy-light/50 border border-gold/10 hover:border-gold/30 transition-all group"
                >
                  <div className="text-left">
                    <div className="font-display text-sm tracking-wider text-marble group-hover:text-gold-light transition-colors">
                      {m.label.toUpperCase()}
                    </div>
                    <div className="text-[10px] text-marble/40 mt-0.5">{m.assets}</div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-marble/30 group-hover:text-gold transition-colors" />
                </button>
              );
            })}
            <p className="text-marble/25 text-[10px] text-center pt-2">
              Gold Arrow never touches your funds — orders execute on your broker account.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            {/* Environment toggle */}
            <div className="flex gap-2">
              {meta.environments.map((env) => (
                <button
                  key={env.value}
                  type="button"
                  onClick={() => setEnvironment(env.value)}
                  className={`flex-1 py-2 px-4 rounded font-display text-xs tracking-wider transition-all ${
                    environment === env.value
                      ? env.value === 'live' || env.value === 'production'
                        ? 'bg-red-500/20 border border-red-500/50 text-red-300'
                        : 'bg-gold/20 border border-gold/50 text-gold'
                      : 'bg-navy-light/50 border border-gold/10 text-marble/50 hover:border-gold/20'
                  }`}
                >
                  {(env.value === 'paper' || env.value === 'sandbox') && <Zap className="w-3 h-3 inline mr-1" />}
                  {env.label.toUpperCase()}
                </button>
              ))}
            </div>

            {(environment === 'live' || environment === 'production') && (
              <div className="bg-red-500/10 border border-red-500/30 rounded p-3 text-xs text-red-300">
                ⚠️ Live trading uses real money. Gold Arrow does not custody funds — orders execute directly on your {meta.label} account.
              </div>
            )}

            <div>
              <label className="text-marble/60 text-xs font-display tracking-wider mb-1 block">
                {selectedBroker === 'ibkr' ? 'CLIENT ID' : 'API KEY'}
              </label>
              <Input
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={selectedBroker === 'alpaca' ? 'PK...' : selectedBroker === 'coinbase' ? 'API Key' : 'Client ID'}
                className="bg-navy-light border-gold/20 text-marble font-mono text-sm"
                required
              />
            </div>

            <div>
              <label className="text-marble/60 text-xs font-display tracking-wider mb-1 block">
                {selectedBroker === 'ibkr' ? 'CLIENT SECRET' : 'API SECRET'}
              </label>
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

            {selectedBroker === 'coinbase' && (
              <div>
                <label className="text-marble/60 text-xs font-display tracking-wider mb-1 block">PASSPHRASE</label>
                <Input
                  type="password"
                  value={apiPassphrase}
                  onChange={(e) => setApiPassphrase(e.target.value)}
                  placeholder="Coinbase API passphrase"
                  className="bg-navy-light border-gold/20 text-marble font-mono text-sm"
                  required
                />
              </div>
            )}

            <div>
              <label className="text-marble/60 text-xs font-display tracking-wider mb-1 block">LABEL (optional)</label>
              <Input
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder={`My ${meta.label} Account`}
                className="bg-navy-light border-gold/20 text-marble text-sm"
              />
            </div>

            <p className="text-marble/30 text-[10px]">
              Your keys are stored securely and never shared. Gold Arrow acts only as a UI relay layer.
            </p>

            <Button
              type="submit"
              disabled={addConnection.isPending || !apiKey || !apiSecret || (selectedBroker === 'coinbase' && !apiPassphrase)}
              className="w-full bg-gold text-navy font-display tracking-wider hover:bg-gold-light"
            >
              {addConnection.isPending ? 'CONNECTING...' : `CONNECT ${meta.label.toUpperCase()}`}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default BrokerConnectDialog;
