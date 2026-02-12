import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { ArrowRightLeft, CheckCircle, Loader2 } from 'lucide-react';
import type { CertificateWithPartner, CertificateMetadata } from '@/hooks/useCertificates';
import { useQueryClient } from '@tanstack/react-query';

interface TransferInitiateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  certificates: CertificateWithPartner[];
  sellerWalletId: string;
}

const TransferInitiateDialog = ({
  open,
  onOpenChange,
  certificates,
  sellerWalletId,
}: TransferInitiateDialogProps) => {
  const [selectedCertId, setSelectedCertId] = useState('');
  const [buyerAddress, setBuyerAddress] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ transfer_id: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const activeCerts = certificates.filter((c) => c.status === 'active');

  const handleSubmit = async () => {
    if (!selectedCertId || !buyerAddress) return;
    setSubmitting(true);
    setError(null);

    try {
      // Resolve buyer wallet_id from address
      const { data: buyerWallet } = await supabase
        .from('wallets')
        .select('wallet_id')
        .eq('address', buyerAddress.toLowerCase())
        .eq('wallet_type', 'evm')
        .maybeSingle();

      if (!buyerWallet) {
        setError('Buyer wallet address not found in registry.');
        setSubmitting(false);
        return;
      }

      const { data, error: fnError } = await supabase.functions.invoke(
        'certificate-registry',
        {
          body: {
            action: 'transfer_intent',
            cert_id: selectedCertId,
            seller_wallet_id: sellerWalletId,
            buyer_wallet_id: buyerWallet.wallet_id,
          },
        }
      );

      if (fnError) throw fnError;
      if (data?.error) {
        setError(data.error);
      } else {
        setResult(data);
        queryClient.invalidateQueries({ queryKey: ['wallet-transfers'] });
        queryClient.invalidateQueries({ queryKey: ['wallet-certificates'] });
      }
    } catch (err: any) {
      setError(err.message || 'Transfer failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setSelectedCertId('');
    setBuyerAddress('');
    setResult(null);
    setError(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-navy border-gold/30 text-marble max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-gold flex items-center gap-2">
            <ArrowRightLeft size={20} />
            Propose Transfer
          </DialogTitle>
          <DialogDescription className="text-marble/60">
            Initiate a peer-to-peer certificate transfer to another wallet.
          </DialogDescription>
        </DialogHeader>

        {result ? (
          <div className="text-center py-6">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
              <CheckCircle className="text-green-400 w-8 h-8" />
            </div>
            <p className="text-marble font-display text-lg mb-2">
              Transfer Proposed
            </p>
            <p className="text-marble/50 text-sm font-mono break-all">
              ID: {result.transfer_id}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Certificate Select */}
            <div>
              <label className="text-gold/70 text-sm font-display tracking-wider uppercase block mb-2">
                Certificate
              </label>
              <select
                value={selectedCertId}
                onChange={(e) => setSelectedCertId(e.target.value)}
                className="w-full bg-navy-light border border-gold/20 text-marble p-3 font-mono text-sm focus:border-gold/50 outline-none"
              >
                <option value="">Select a certificate…</option>
                {activeCerts.map((cert) => {
                  const meta = cert.metadata_json as CertificateMetadata;
                  return (
                    <option key={cert.cert_id} value={cert.cert_id}>
                      {meta.metal_type?.toUpperCase()} — {meta.weight_oz} oz —{' '}
                      {meta.serial_number}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Buyer Address */}
            <div>
              <label className="text-gold/70 text-sm font-display tracking-wider uppercase block mb-2">
                Buyer Wallet Address (EVM)
              </label>
              <input
                type="text"
                placeholder="0x…"
                value={buyerAddress}
                onChange={(e) => setBuyerAddress(e.target.value)}
                className="w-full bg-navy-light border border-gold/20 text-marble p-3 font-mono text-sm focus:border-gold/50 outline-none"
              />
            </div>

            {error && (
              <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 p-3">
                {error}
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          {result ? (
            <button onClick={handleClose} className="btn-primary-gold px-6 py-2">
              Close
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!selectedCertId || !buyerAddress || submitting}
              className="btn-primary-gold px-6 py-2 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {submitting && <Loader2 size={16} className="animate-spin" />}
              Propose Transfer
            </button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TransferInitiateDialog;
