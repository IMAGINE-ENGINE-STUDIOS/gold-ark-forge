import { useState } from 'react';
import { useCreatePartner } from '@/hooks/usePartners';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';

interface PartnerFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PartnerForm = ({ open, onOpenChange }: PartnerFormProps) => {
  const createPartner = useCreatePartner();
  const [form, setForm] = useState({
    legal_name: '',
    partner_type: 'vault' as 'vault' | 'dealer' | 'custodian' | 'arbiter',
    jurisdiction: '',
    api_base_url: '',
    mtls_spki_fingerprint: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createPartner.mutate(
      {
        ...form,
        mtls_spki_fingerprint: form.mtls_spki_fingerprint || undefined,
      },
      {
        onSuccess: () => {
          toast({ title: 'Partner onboarded successfully' });
          onOpenChange(false);
          setForm({ legal_name: '', partner_type: 'vault', jurisdiction: '', api_base_url: '', mtls_spki_fingerprint: '' });
        },
        onError: (err) => toast({ title: 'Error', description: (err as Error).message, variant: 'destructive' }),
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-navy border-gold/30 text-marble max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-gold text-xl">Onboard New Partner</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gold/70 font-display mb-1">Legal Name</label>
            <input
              required
              value={form.legal_name}
              onChange={(e) => setForm((f) => ({ ...f, legal_name: e.target.value }))}
              className="w-full bg-navy-light border border-gold/30 text-marble px-3 py-2 text-sm focus:border-gold outline-none"
            />
          </div>
          <div>
            <label className="block text-sm text-gold/70 font-display mb-1">Partner Type</label>
            <select
              value={form.partner_type}
              onChange={(e) => setForm((f) => ({ ...f, partner_type: e.target.value as any }))}
              className="w-full bg-navy-light border border-gold/30 text-marble px-3 py-2 text-sm focus:border-gold outline-none"
            >
              <option value="vault">Vault Operator</option>
              <option value="dealer">Dealer</option>
              <option value="custodian">Custodian</option>
              <option value="arbiter">Arbiter</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gold/70 font-display mb-1">Jurisdiction</label>
            <input
              required
              value={form.jurisdiction}
              onChange={(e) => setForm((f) => ({ ...f, jurisdiction: e.target.value }))}
              placeholder="e.g. CH, US, SG"
              className="w-full bg-navy-light border border-gold/30 text-marble px-3 py-2 text-sm focus:border-gold outline-none"
            />
          </div>
          <div>
            <label className="block text-sm text-gold/70 font-display mb-1">API Base URL</label>
            <input
              required
              value={form.api_base_url}
              onChange={(e) => setForm((f) => ({ ...f, api_base_url: e.target.value }))}
              placeholder="https://api.partner.com"
              className="w-full bg-navy-light border border-gold/30 text-marble px-3 py-2 text-sm focus:border-gold outline-none"
            />
          </div>
          <div>
            <label className="block text-sm text-gold/70 font-display mb-1">mTLS SPKI Fingerprint (optional)</label>
            <input
              value={form.mtls_spki_fingerprint}
              onChange={(e) => setForm((f) => ({ ...f, mtls_spki_fingerprint: e.target.value }))}
              className="w-full bg-navy-light border border-gold/30 text-marble px-3 py-2 text-sm focus:border-gold outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={createPartner.isPending}
            className="w-full bg-gold/20 text-gold border border-gold/40 px-4 py-2 font-display hover:bg-gold/30 transition-colors disabled:opacity-50"
          >
            {createPartner.isPending ? 'Onboarding...' : 'Onboard Partner'}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default PartnerForm;
