import { useState } from 'react';
import { useCreateSite } from '@/hooks/usePartnerSites';
import { usePartners } from '@/hooks/usePartners';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';

interface SiteFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SiteForm = ({ open, onOpenChange }: SiteFormProps) => {
  const createSite = useCreateSite();
  const { data: partners } = usePartners();
  const [form, setForm] = useState({
    partner_id: '',
    site_name: '',
    region: '',
    address_text: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createSite.mutate(
      {
        ...form,
        address_text: form.address_text || undefined,
      },
      {
        onSuccess: () => {
          toast({ title: 'Site added successfully' });
          onOpenChange(false);
          setForm({ partner_id: '', site_name: '', region: '', address_text: '' });
        },
        onError: (err) => toast({ title: 'Error', description: (err as Error).message, variant: 'destructive' }),
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-navy border-gold/30 text-marble max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-gold text-xl">Add Partner Site</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gold/70 font-display mb-1">Partner</label>
            <select
              required
              value={form.partner_id}
              onChange={(e) => setForm((f) => ({ ...f, partner_id: e.target.value }))}
              className="w-full bg-navy-light border border-gold/30 text-marble px-3 py-2 text-sm focus:border-gold outline-none"
            >
              <option value="">Select partner...</option>
              {partners?.map((p) => (
                <option key={p.partner_id} value={p.partner_id}>
                  {p.legal_name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gold/70 font-display mb-1">Site Name</label>
            <input
              required
              value={form.site_name}
              onChange={(e) => setForm((f) => ({ ...f, site_name: e.target.value }))}
              placeholder="e.g. Zurich Main Vault"
              className="w-full bg-navy-light border border-gold/30 text-marble px-3 py-2 text-sm focus:border-gold outline-none"
            />
          </div>
          <div>
            <label className="block text-sm text-gold/70 font-display mb-1">Region</label>
            <input
              required
              value={form.region}
              onChange={(e) => setForm((f) => ({ ...f, region: e.target.value }))}
              placeholder="e.g. Europe, APAC, Americas"
              className="w-full bg-navy-light border border-gold/30 text-marble px-3 py-2 text-sm focus:border-gold outline-none"
            />
          </div>
          <div>
            <label className="block text-sm text-gold/70 font-display mb-1">Address (optional)</label>
            <input
              value={form.address_text}
              onChange={(e) => setForm((f) => ({ ...f, address_text: e.target.value }))}
              className="w-full bg-navy-light border border-gold/30 text-marble px-3 py-2 text-sm focus:border-gold outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={createSite.isPending}
            className="w-full bg-gold/20 text-gold border border-gold/40 px-4 py-2 font-display hover:bg-gold/30 transition-colors disabled:opacity-50"
          >
            {createSite.isPending ? 'Adding...' : 'Add Site'}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default SiteForm;
