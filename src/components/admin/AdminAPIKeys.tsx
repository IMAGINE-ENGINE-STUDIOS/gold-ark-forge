import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Key, Plus, Trash2, Eye, EyeOff } from 'lucide-react';

const BROKER_TYPES = [
  { value: 'alpaca', label: 'Alpaca' },
  { value: 'coinbase', label: 'Coinbase' },
  { value: 'ibkr', label: 'Interactive Brokers' },
];

const AdminAPIKeys = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [newKey, setNewKey] = useState({ broker: 'alpaca', label: '', api_key: '', api_secret: '', api_passphrase: '', environment: 'paper' });

  const { data: connections } = useQuery({
    queryKey: ['admin-broker-connections'],
    queryFn: async () => {
      const { data } = await supabase.from('broker_connections').select('*').order('created_at', { ascending: false });
      return data ?? [];
    },
  });

  const addConnection = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase.from('broker_connections').insert({
        ...newKey,
        user_id: user.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-broker-connections'] });
      setNewKey({ broker: 'alpaca', label: '', api_key: '', api_secret: '', api_passphrase: '', environment: 'paper' });
      toast({ title: 'API Key Added' });
    },
    onError: (err) => toast({ title: 'Error', description: err.message, variant: 'destructive' }),
  });

  const deleteConnection = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('broker_connections').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-broker-connections'] });
      toast({ title: 'API Key Removed' });
    },
  });

  const toggleSecret = (id: string) => setShowSecrets(s => ({ ...s, [id]: !s[id] }));
  const mask = (val: string) => val.slice(0, 4) + '••••••••';

  return (
    <div className="space-y-6">
      {/* Add New Key */}
      <div className="bg-navy-dark/60 border border-gold/20 rounded-lg p-5">
        <div className="flex items-center gap-2 mb-4">
          <Plus className="w-4 h-4 text-gold" />
          <h3 className="font-display text-sm tracking-widest text-gold uppercase">Add Broker API Key</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <select
            value={newKey.broker}
            onChange={e => setNewKey(k => ({ ...k, broker: e.target.value }))}
            className="bg-navy border border-gold/20 rounded-lg px-3 py-2 text-marble/80 text-sm"
          >
            {BROKER_TYPES.map(b => <option key={b.value} value={b.value}>{b.label}</option>)}
          </select>
          <Input
            placeholder="Label (e.g. My Paper Account)"
            value={newKey.label}
            onChange={e => setNewKey(k => ({ ...k, label: e.target.value }))}
            className="bg-navy border-gold/20 text-marble/80"
          />
          <Input
            placeholder="API Key"
            value={newKey.api_key}
            onChange={e => setNewKey(k => ({ ...k, api_key: e.target.value }))}
            className="bg-navy border-gold/20 text-marble/80"
          />
          <Input
            placeholder="API Secret"
            type="password"
            value={newKey.api_secret}
            onChange={e => setNewKey(k => ({ ...k, api_secret: e.target.value }))}
            className="bg-navy border-gold/20 text-marble/80"
          />
          <Input
            placeholder="Passphrase (Coinbase only)"
            type="password"
            value={newKey.api_passphrase}
            onChange={e => setNewKey(k => ({ ...k, api_passphrase: e.target.value }))}
            className="bg-navy border-gold/20 text-marble/80"
          />
          <select
            value={newKey.environment}
            onChange={e => setNewKey(k => ({ ...k, environment: e.target.value }))}
            className="bg-navy border border-gold/20 rounded-lg px-3 py-2 text-marble/80 text-sm"
          >
            <option value="paper">Paper</option>
            <option value="live">Live</option>
          </select>
        </div>
        <Button
          onClick={() => addConnection.mutate()}
          disabled={!newKey.api_key || !newKey.api_secret}
          className="mt-4 bg-gold/20 text-gold border border-gold/30 hover:bg-gold/30"
        >
          <Key className="w-4 h-4 mr-2" /> Add Key
        </Button>
      </div>

      {/* Existing Keys */}
      <div className="bg-navy-dark/60 border border-gold/20 rounded-lg p-5">
        <h3 className="font-display text-sm tracking-widest text-gold uppercase mb-4">Configured API Keys</h3>
        <div className="space-y-3">
          {connections?.length === 0 && <p className="text-marble/40 text-sm">No API keys configured</p>}
          {connections?.map(conn => (
            <div key={conn.id} className="flex items-center justify-between py-3 px-4 bg-navy/60 rounded-lg border border-gold/10">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-gold font-display text-sm uppercase">{conn.broker}</span>
                  <span className="text-marble/40 text-xs">{conn.environment}</span>
                  {conn.label && <span className="text-marble/50 text-xs">— {conn.label}</span>}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-marble/40 font-mono text-xs">
                    {showSecrets[conn.id] ? conn.api_key : mask(conn.api_key)}
                  </span>
                  <button onClick={() => toggleSecret(conn.id)} className="text-marble/30 hover:text-marble/60">
                    {showSecrets[conn.id] ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${conn.is_active ? 'bg-emerald-400' : 'bg-red-400'}`} />
                <button
                  onClick={() => deleteConnection.mutate(conn.id)}
                  className="text-red-400/60 hover:text-red-400 p-1"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Data Feed Keys Info */}
      <div className="bg-navy-dark/60 border border-gold/20 rounded-lg p-5">
        <h3 className="font-display text-sm tracking-widest text-gold uppercase mb-3">Data Feed Secrets</h3>
        <p className="text-marble/50 text-sm mb-2">
          Platform data feed API keys (EIA, metal prices, crypto) are managed as backend secrets.
          Contact the system administrator to update these keys.
        </p>
        <div className="space-y-1">
          {['EIA_API_KEY', 'LOVABLE_API_KEY'].map(name => (
            <div key={name} className="flex items-center gap-2 py-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="text-marble/60 font-mono text-xs">{name}</span>
              <span className="text-marble/30 text-xs">configured</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminAPIKeys;
