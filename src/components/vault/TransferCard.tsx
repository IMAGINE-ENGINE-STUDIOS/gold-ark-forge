import { Badge } from '@/components/ui/badge';
import { ArrowRightLeft, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { TransferWithCert } from '@/hooks/useTransfers';
import type { CertificateMetadata } from '@/hooks/useCertificates';

const statusStyles: Record<string, string> = {
  proposed: 'bg-blue-500/20 text-blue-400 border-blue-400',
  btc_settlement_pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-400',
  partner_review: 'bg-purple-500/20 text-purple-400 border-purple-400',
  completed: 'bg-green-500/20 text-green-400 border-green-400',
  cancelled: 'bg-red-500/20 text-red-400 border-red-400',
  expired: 'bg-muted/30 text-muted-foreground border-muted',
  disputed: 'bg-orange-500/20 text-orange-400 border-orange-400',
};

const metalBadgeStyle: Record<string, string> = {
  gold: 'bg-gold/20 text-gold border-gold',
  silver: 'bg-silver/20 text-silver border-silver',
  platinum: 'bg-platinum/20 text-platinum border-platinum',
};

interface TransferCardProps {
  transfer: TransferWithCert;
  currentWalletId: string;
}

const TransferCard = ({ transfer, currentWalletId }: TransferCardProps) => {
  const meta = transfer.certificates.metadata_json as unknown as CertificateMetadata;
  const isSeller = transfer.seller_wallet_id === currentWalletId;
  const counterparty = isSeller
    ? transfer.buyer_wallet_id
    : transfer.seller_wallet_id;

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

  return (
    <div className="relative border border-gold/20 bg-navy-light/30 p-4 hover:border-gold/40 transition-colors">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center">
            <ArrowRightLeft className="text-gold w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <Badge
                className={`border font-display uppercase tracking-wider text-xs ${
                  metalBadgeStyle[meta?.metal_type] ?? ''
                }`}
              >
                {meta?.metal_type}
              </Badge>
              <span className="text-marble font-display">
                {meta?.weight_oz} oz
              </span>
            </div>
            <div className="text-marble/50 text-xs mt-1 font-mono">
              {isSeller ? 'To' : 'From'}: {counterparty?.slice(0, 10)}…
              {counterparty?.slice(-6)}
            </div>
          </div>
        </div>

        <div className="text-right flex flex-col items-end gap-1">
          <Badge
            className={`border text-xs ${
              statusStyles[transfer.status] ?? ''
            }`}
          >
            {transfer.status.replace(/_/g, ' ')}
          </Badge>
          <span className="text-marble/40 text-xs">
            {formatDate(transfer.created_at)}
          </span>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <span className="text-marble/50 text-xs">
          {isSeller ? 'Outgoing' : 'Incoming'} •{' '}
          {transfer.certificates.partners?.legal_name}
        </span>
        <Link
          to={`/marketplace/certificate/${transfer.cert_id}`}
          className="text-gold/60 hover:text-gold text-xs flex items-center gap-1"
        >
          View Certificate <ExternalLink size={12} />
        </Link>
      </div>
    </div>
  );
};

export default TransferCard;
