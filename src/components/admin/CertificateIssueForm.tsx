import { useState } from 'react';
import { usePartners } from '@/hooks/usePartners';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

interface CertificateIssueFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CertificateIssueForm = ({ open, onOpenChange }: CertificateIssueFormProps) => {
  const { data: partners } = usePartners();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    partner_id: '',
    owner_wallet_id: '',
    metal_type: 'gold' as 'gold' | 'silver' | 'platinum',
    serial_number: '',
    weight_oz: '',
    fineness: '0.9999',
    jurisdiction: 'CH',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { data, error } = await supabase.functions.invoke('certificate-registry', {
        body: {
          action: 'create',
          partner_id: form.partner_id,
          owner_wallet_id: form.owner_wallet_id,
          partner_sig: '\\x' + Array.from(crypto.getRandomValues(new Uint8Array(32))).map(b => b.toString(16).padStart(2, '0')).join(''),
          partner_sig_alg: 'ed25519',
          metadata_json: {
            metal_type: form.metal_type,
            serial_number: form.serial_number,
            weight_oz: parseFloat(form.weight_oz),
            fineness: parseFloat(form.fineness),
            jurisdiction: form.jurisdiction,
          },
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast({ title: 'Certificate issued', description: `Cert ID: ${data.cert_id?.slice(0, 8)}...` });
      queryClient.invalidateQueries({ queryKey: ['certificates'] });
      queryClient.invalidateQueries({ queryKey: ['certificate-reserve-totals'] });
      onOpenChange(false);
      setForm({ partner_id: '', owner_wallet_id: '', metal_type: 'gold', serial_number: '', weight_oz: '', fineness: '0.9999', jurisdiction: 'CH' });
    } catch (err) {
      toast({ title: 'Error', description: (err as Error).message, variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-navy border-gold/30 text-marble max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-gold text-xl">Issue Certificate</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gold/70 font-display mb-1">Issuing Partner</label>
            <select
              required
              value={form.partner_id}
              onChange={(e) => setForm((f) => ({ ...f, partner_id: e.target.value }))}
              className="w-full bg-navy-light border border-gold/30 text-marble px-3 py-2 text-sm focus:border-gold outline-none"
            >
              <option value="">Select partner...</option>
              {partners?.filter(p => p.status === 'active').map((p) => (
                <option key={p.partner_id} value={p.partner_id}>
                  {p.legal_name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gold/70 font-display mb-1">Owner Wallet ID</label>
            <input
              required
              value={form.owner_wallet_id}
              onChange={(e) => setForm((f) => ({ ...f, owner_wallet_id: e.target.value }))}
              placeholder="UUID of the wallet"
              className="w-full bg-navy-light border border-gold/30 text-marble px-3 py-2 text-sm font-mono focus:border-gold outline-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gold/70 font-display mb-1">Metal Type</label>
              <select
                value={form.metal_type}
                onChange={(e) => setForm((f) => ({ ...f, metal_type: e.target.value as any }))}
                className="w-full bg-navy-light border border-gold/30 text-marble px-3 py-2 text-sm focus:border-gold outline-none"
              >
                <option value="gold">Gold</option>
                <option value="silver">Silver</option>
                <option value="platinum">Platinum</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gold/70 font-display mb-1">Weight (oz)</label>
              <input
                required
                type="number"
                step="0.0001"
                min="0.0001"
                value={form.weight_oz}
                onChange={(e) => setForm((f) => ({ ...f, weight_oz: e.target.value }))}
                className="w-full bg-navy-light border border-gold/30 text-marble px-3 py-2 text-sm focus:border-gold outline-none"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gold/70 font-display mb-1">Serial Number</label>
              <input
                required
                value={form.serial_number}
                onChange={(e) => setForm((f) => ({ ...f, serial_number: e.target.value }))}
                placeholder="e.g. AU-2026-002"
                className="w-full bg-navy-light border border-gold/30 text-marble px-3 py-2 text-sm focus:border-gold outline-none"
              />
            </div>
            <div>
              <label className="block text-sm text-gold/70 font-display mb-1">Fineness</label>
              <input
                required
                type="number"
                step="0.0001"
                min="0"
                max="1"
                value={form.fineness}
                onChange={(e) => setForm((f) => ({ ...f, fineness: e.target.value }))}
                className="w-full bg-navy-light border border-gold/30 text-marble px-3 py-2 text-sm focus:border-gold outline-none"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm text-gold/70 font-display mb-1">Jurisdiction</label>
            <input
              required
              value={form.jurisdiction}
              onChange={(e) => setForm((f) => ({ ...f, jurisdiction: e.target.value }))}
              className="w-full bg-navy-light border border-gold/30 text-marble px-3 py-2 text-sm focus:border-gold outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-gold/20 text-gold border border-gold/40 px-4 py-2 font-display hover:bg-gold/30 transition-colors disabled:opacity-50"
          >
            {isSubmitting ? 'Issuing...' : 'Issue Certificate'}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CertificateIssueForm;
