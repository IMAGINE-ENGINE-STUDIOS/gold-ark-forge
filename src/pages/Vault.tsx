import { useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useWallet } from '@/contexts/WalletContext';
import { useWalletId, useWalletCertificates, useWalletHoldingsSummary } from '@/hooks/useWalletCertificates';
import { useWalletTransfers } from '@/hooks/useTransfers';
import { useAnchors } from '@/hooks/useAnchors';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Wallet,
  Shield,
  Bitcoin,
  ExternalLink,
  AlertCircle,
  Lock,
  CheckCircle,
  ArrowRightLeft,
  Gem,
  Coins,
  Fuel,
  BarChart3,
  DollarSign,
  Landmark,
  Atom,
  Wheat,
  Beef,
  Building2,
  Palette,
  Package,
} from 'lucide-react';
import ConnectWalletButton from '@/components/wallet/ConnectWalletButton';
import TransferInitiateDialog from '@/components/vault/TransferInitiateDialog';
import TransferCard from '@/components/vault/TransferCard';
import EthereumNetworkPanel from '@/components/wallet/EthereumNetworkPanel';
import { Link } from 'react-router-dom';
import vaultDoor from '@/assets/vault-door-rich.jpg';
import type { CertificateMetadata } from '@/hooks/useCertificates';

/* ─── Asset Category Types ─── */

type VaultCategory = 'metals' | 'ethereum' | 'crypto' | 'energy' | 'rare-earth' | 'agriculture' | 'livestock' | 'equities' | 'forex' | 'bonds' | 'reits' | 'art' | 'gov-surplus';

const VAULT_CATEGORIES: { key: VaultCategory; label: string; icon: any }[] = [
  { key: 'metals', label: 'Precious Metals', icon: Gem },
  { key: 'ethereum', label: 'Ethereum', icon: Coins },
  { key: 'crypto', label: 'Crypto', icon: Coins },
  { key: 'energy', label: 'Energy', icon: Fuel },
  { key: 'rare-earth', label: 'Rare Earth', icon: Atom },
  { key: 'agriculture', label: 'Agriculture', icon: Wheat },
  { key: 'livestock', label: 'Livestock', icon: Beef },
  { key: 'equities', label: 'Equities', icon: BarChart3 },
  { key: 'forex', label: 'Forex', icon: DollarSign },
  { key: 'bonds', label: 'Bonds', icon: Landmark },
  { key: 'reits', label: 'REITs', icon: Building2 },
  { key: 'art', label: 'Art', icon: Palette },
  { key: 'gov-surplus', label: 'Gov. Surplus', icon: Package },
];

/* ─── Empty Inventory Placeholder ─── */

const EmptyInventory = ({ label }: { label: string }) => (
  <div className="text-center py-20">
    <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gold/5 border border-gold/20 flex items-center justify-center">
      <Lock className="text-gold/30 w-10 h-10" />
    </div>
    <div className="text-marble/50 text-lg mb-2 font-display tracking-wider">
      {label} INVENTORY
    </div>
    <p className="text-marble/30 text-sm max-w-md mx-auto">
      No tokenized {label.toLowerCase()} assets in your vault yet. Visit the Marketplace to acquire verified certificates.
    </p>
  </div>
);

/* ─── Helpers ─── */

const formatPrice = (price: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(price);

const formatDate = (dateString: string) =>
  new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

/* ─── Vault Page ─── */

const Vault = () => {
  const { isConnected, address } = useWallet();
  const [demoMode, setDemoMode] = useState(false);

  const effectiveConnected = isConnected || demoMode;
  const effectiveAddress = address || (demoMode ? '0xDemo...ViewOnly' : null);

  const { data: walletId, isLoading: walletIdLoading } = useWalletId(effectiveAddress);
  const { data: certificates, isLoading: certsLoading } = useWalletCertificates(walletId ?? null);
  const { summary, isLoading: summaryLoading } = useWalletHoldingsSummary(certificates);
  const { data: transfers, isLoading: transfersLoading } = useWalletTransfers(walletId ?? null);
  const { data: anchors, isLoading: anchorsLoading } = useAnchors(1);
  const [transferOpen, setTransferOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<VaultCategory>('metals');

  const dataLoading = walletIdLoading || certsLoading;
  const latestAnchor = anchors?.[0] ?? null;

  /* ── Disconnected state ── */
  if (!effectiveConnected) {
    return (
      <div className="min-h-screen bg-navy">
        <Header />
        <main className="relative">
          <div className="relative h-[70vh] overflow-hidden">
            <img
              src={vaultDoor}
              alt="Secure Vault Door"
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-navy/60 via-navy/40 to-navy" />

            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center max-w-lg mx-auto px-4">
                <div className="relative w-32 h-32 mx-auto mb-8">
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-gold via-gold-light to-gold-dark animate-pulse" />
                  <div className="absolute inset-2 rounded-full bg-navy flex items-center justify-center">
                    <Lock className="text-gold w-14 h-14" />
                  </div>
                </div>

                <h1 className="font-display text-4xl md:text-5xl text-gold mb-4 tracking-wide">
                  THE VAULT
                </h1>
                <p className="font-display text-lg text-gold/60 tracking-[0.2em] uppercase mb-2">
                  Institutional Grade Security
                </p>
                <div className="w-32 h-1 mx-auto bg-gradient-to-r from-transparent via-gold to-transparent mb-8" />

                <p className="text-marble/70 mb-10 text-lg">
                  Connect your wallet to access your secured bullion holdings,
                  verification status, and redemption options.
                </p>

                <ConnectWalletButton />

                <button
                  onClick={() => setDemoMode(true)}
                  className="mt-4 block mx-auto font-display text-sm tracking-wider text-gold/50 hover:text-gold transition-colors underline underline-offset-4"
                >
                  Preview Vault (Read-Only Demo)
                </button>

                <div className="flex items-center justify-center gap-8 mt-12">
                  <div className="flex items-center gap-2 text-gold/60">
                    <Shield size={20} />
                    <span className="text-sm uppercase tracking-wider">Insured</span>
                  </div>
                  <div className="flex items-center gap-2 text-gold/60">
                    <Lock size={20} />
                    <span className="text-sm uppercase tracking-wider">Encrypted</span>
                  </div>
                  <div className="flex items-center gap-2 text-gold/60">
                    <CheckCircle size={20} />
                    <span className="text-sm uppercase tracking-wider">Verified</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="h-8 greek-key-border-rich" />
        </main>
        <Footer />
      </div>
    );
  }

  /* ── Connected state ── */
  return (
    <div className="min-h-screen bg-navy">
      <Header />
      <main>
        {/* Vault Header */}
        <div className="relative h-64 overflow-hidden">
          <img
            src={vaultDoor}
            alt="Secure Vault"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-navy/70 via-navy/50 to-navy" />

          <div className="absolute inset-0 flex items-center">
            <div className="container mx-auto px-4">
              <div className="flex items-center gap-6">
                <div className="relative w-20 h-20">
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-gold via-gold-light to-gold-dark" />
                  <div className="absolute inset-1 rounded-full bg-navy flex items-center justify-center">
                    <Shield className="text-gold w-10 h-10" />
                  </div>
                </div>

                <div>
                  <h1 className="font-display text-4xl md:text-5xl text-gold tracking-wide">
                    {demoMode ? 'VAULT PREVIEW' : 'MY VAULT'}
                  </h1>
                  <div className="flex items-center gap-2 text-gold/60 mt-2">
                    <Wallet size={16} />
                    <span className="font-mono text-sm">{effectiveAddress}</span>
                    <Badge variant="outline" className={`ml-2 ${demoMode ? 'text-yellow-400 border-yellow-400' : 'text-green-400 border-green-400'}`}>
                      <CheckCircle size={12} className="mr-1" /> {demoMode ? 'Demo' : 'Secured'}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="h-6 greek-key-border-rich" />

        {/* ── Asset Class Category Tabs ── */}
        <div className="container mx-auto px-4 pt-8">
          <div className="overflow-x-auto scrollbar-thin -mx-4 px-4">
            <div className="flex flex-nowrap md:flex-wrap md:justify-center gap-2 min-w-max md:min-w-0">
              {VAULT_CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                const isActive = activeCategory === cat.key;
                return (
                  <button
                    key={cat.key}
                    onClick={() => setActiveCategory(cat.key)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded border transition-all text-[10px] font-display tracking-[0.2em] whitespace-nowrap shrink-0 md:shrink ${
                      isActive
                        ? 'border-gold bg-gold/10 text-gold shadow-[0_0_12px_hsla(43,72%,50%,0.15)]'
                        : 'border-gold/20 text-marble/50 hover:text-gold hover:border-gold/50'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {cat.label.toUpperCase()}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Category Content ── */}
        <div className="container mx-auto px-4 py-12">
          {activeCategory === 'metals' ? (
            <>
              {/* ── Summary Cards ── */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                <SummaryCard
                  label="Gold Holdings"
                  value={summary.totalGoldOz}
                  loading={summaryLoading || dataLoading}
                  frameClass="gold-frame-ornate"
                  textClass="text-gold"
                />
                <SummaryCard
                  label="Silver Holdings"
                  value={summary.totalSilverOz}
                  loading={summaryLoading || dataLoading}
                  frameClass="silver-frame-ornate"
                  textClass="text-silver"
                  cornerColor="hsl(var(--silver))"
                />
                <SummaryCard
                  label="Platinum Holdings"
                  value={summary.totalPlatinumOz}
                  loading={summaryLoading || dataLoading}
                  frameClass="platinum-frame-ornate"
                  textClass="text-platinum"
                  cornerColor="hsl(var(--platinum))"
                />
                <div className="relative bg-gradient-to-br from-navy-light to-navy border-2 border-gold/40 p-6">
                  <div className="ornate-corner ornate-corner-tl" />
                  <div className="ornate-corner ornate-corner-tr" />
                  <div className="ornate-corner ornate-corner-bl" />
                  <div className="ornate-corner ornate-corner-br" />
                  <div className="text-marble/70 text-sm mb-2 font-display tracking-wider uppercase">
                    Total Value
                  </div>
                  {summaryLoading || dataLoading ? (
                    <Skeleton className="h-8 w-32 bg-gold/20" />
                  ) : (
                    <div className="text-marble font-display text-3xl">
                      {formatPrice(summary.totalValue)}
                    </div>
                  )}
                </div>
              </div>

              {/* ── Anchor / Proof Status ── */}
              <div className="relative mb-12">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-900/20 via-navy to-emerald-900/20 border border-emerald-500/30" />
                <div className="relative p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center">
                      <Shield className="text-emerald-400" size={24} />
                    </div>
                    <div>
                      <h2 className="font-display text-2xl text-gold">
                        Proof-of-Reserve Status
                      </h2>
                      <p className="text-emerald-400 text-sm">
                        Bitcoin-Anchored Verification
                      </p>
                    </div>
                  </div>

                  {anchorsLoading ? (
                    <div className="space-y-4">
                      <Skeleton className="h-6 w-full bg-gold/10" />
                      <Skeleton className="h-6 w-3/4 bg-gold/10" />
                    </div>
                  ) : latestAnchor ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-6">
                        <div>
                          <div className="text-gold/60 text-sm mb-2 uppercase tracking-wider">Merkle Root</div>
                          <div className="font-mono text-xs text-marble bg-navy/80 p-3 rounded border border-gold/20 break-all">
                            {latestAnchor.merkle_root}
                          </div>
                        </div>
                        <div>
                          <div className="text-gold/60 text-sm mb-2 uppercase tracking-wider">Created</div>
                          <div className="text-marble text-lg">{formatDate(latestAnchor.created_at)}</div>
                        </div>
                      </div>
                      <div className="space-y-6">
                        <div>
                          <div className="text-gold/60 text-sm mb-2 uppercase tracking-wider">Bitcoin Anchor</div>
                          {latestAnchor.commit_txid ? (
                            <a
                              href={`https://mempool.space/tx/${latestAnchor.commit_txid}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 text-gold hover:text-gold-light bg-navy/80 p-3 rounded border border-gold/20"
                            >
                              <Bitcoin size={20} />
                              <span className="font-mono text-xs truncate">{latestAnchor.commit_txid}</span>
                              <ExternalLink size={14} />
                            </a>
                          ) : (
                            <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-400 border">
                              {latestAnchor.status}
                            </Badge>
                          )}
                        </div>
                        <div>
                          <div className="text-gold/60 text-sm mb-2 uppercase tracking-wider">Events Anchored</div>
                          <div className="text-marble text-lg">{latestAnchor.leaf_count} leaves committed</div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 text-marble/50">
                      <AlertCircle size={20} />
                      <span>No anchor proofs available yet.</span>
                    </div>
                  )}
                </div>
              </div>

              {/* ── Holdings Ledger ── */}
              <div className="relative mb-12">
                <div className="bg-navy-light/30 border-2 border-gold/30">
                  <div className="bg-gradient-to-r from-gold/20 via-gold/10 to-gold/20 p-6 border-b border-gold/30 flex items-center justify-between">
                    <h2 className="font-display text-2xl text-gold flex items-center gap-3">
                      <Lock size={24} />
                      Your Certificate Ledger
                    </h2>
                    <button
                      onClick={() => setTransferOpen(true)}
                      className="btn-primary-gold px-4 py-2 text-sm flex items-center gap-2"
                    >
                      <ArrowRightLeft size={16} />
                      Propose Transfer
                    </button>
                  </div>

                  <div className="p-6">
                    {dataLoading ? (
                      <div className="space-y-4">
                        {[...Array(3)].map((_, i) => (
                          <Skeleton key={i} className="h-16 w-full bg-gold/10" />
                        ))}
                      </div>
                    ) : certificates && certificates.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b-2 border-gold/30">
                              {['Serial Number', 'Metal', 'Weight', 'Partner', 'Status', ''].map(
                                (h) => (
                                  <th key={h} className="text-left py-4 px-4 text-gold font-display text-sm uppercase tracking-wider">{h}</th>
                                )
                              )}
                            </tr>
                          </thead>
                          <tbody>
                            {certificates.map((cert) => {
                              const meta = cert.metadata_json as CertificateMetadata;
                              return (
                                <tr key={cert.cert_id} className="border-b border-gold/10 hover:bg-gold/5 transition-colors">
                                  <td className="py-4 px-4 font-mono text-sm text-marble">{meta?.serial_number}</td>
                                  <td className="py-4 px-4">
                                    <Badge className={`border font-display uppercase tracking-wider ${
                                      meta?.metal_type === 'gold' ? 'bg-gold/20 text-gold border-gold'
                                      : meta?.metal_type === 'silver' ? 'bg-silver/20 text-silver border-silver'
                                      : 'bg-platinum/20 text-platinum border-platinum'
                                    }`}>{meta?.metal_type}</Badge>
                                  </td>
                                  <td className="py-4 px-4 text-marble font-display">{meta?.weight_oz} oz</td>
                                  <td className="py-4 px-4 text-marble/70">{cert.partners?.legal_name}</td>
                                  <td className="py-4 px-4">
                                    <Badge className={
                                      cert.status === 'active' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-400'
                                      : cert.status === 'frozen' ? 'bg-blue-500/20 text-blue-400 border-blue-400'
                                      : 'bg-red-500/20 text-red-400 border-red-400'
                                    }>
                                      <CheckCircle size={12} className="mr-1" />{cert.status}
                                    </Badge>
                                  </td>
                                  <td className="py-4 px-4">
                                    <Link to={`/marketplace/certificate/${cert.cert_id}`} className="text-gold/60 hover:text-gold text-sm flex items-center gap-1">
                                      Details <ExternalLink size={14} />
                                    </Link>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="text-center py-16">
                        <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gold/10 flex items-center justify-center">
                          <Lock className="text-gold/40 w-12 h-12" />
                        </div>
                        <div className="text-marble/50 text-xl mb-4 font-display">Your Vault is Empty</div>
                        <p className="text-marble/30 text-sm">Visit the Marketplace to acquire verified bullion certificates.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* ── Transfers ── */}
              <div className="relative">
                <div className="bg-navy-light/30 border-2 border-gold/30">
                  <div className="bg-gradient-to-r from-gold/20 via-gold/10 to-gold/20 p-6 border-b border-gold/30">
                    <h2 className="font-display text-2xl text-gold flex items-center gap-3">
                      <ArrowRightLeft size={24} />
                      Transfer Activity
                    </h2>
                  </div>
                  <div className="p-6">
                    {transfersLoading ? (
                      <div className="space-y-4">
                        {[...Array(2)].map((_, i) => (
                          <Skeleton key={i} className="h-20 w-full bg-gold/10" />
                        ))}
                      </div>
                    ) : transfers && transfers.length > 0 ? (
                      <div className="space-y-3">
                        {transfers.map((t) => (
                          <TransferCard key={t.transfer_id} transfer={t} currentWalletId={walletId!} />
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12 text-marble/40">
                        <ArrowRightLeft size={32} className="mx-auto mb-3 opacity-40" />
                        <p className="font-display">No transfer activity yet.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          ) : (
            activeCategory === 'ethereum' ? (
              <EthereumNetworkPanel address={effectiveAddress} mode="full" />
            ) : activeCategory === 'crypto' ? (
              <div className="space-y-6">
                <EthereumNetworkPanel address={effectiveAddress} mode="full" />
                <EmptyInventory label="Other Crypto" />
              </div>
            ) : (
              <EmptyInventory label={VAULT_CATEGORIES.find(c => c.key === activeCategory)?.label ?? activeCategory} />
            )
          )}
        </div>

        <div className="h-8 greek-key-border-rich-dark" />
      </main>
      <Footer />

      {/* Transfer Dialog */}
      {walletId && certificates && (
        <TransferInitiateDialog
          open={transferOpen}
          onOpenChange={setTransferOpen}
          certificates={certificates}
          sellerWalletId={walletId}
        />
      )}
    </div>
  );
};

/* ─── Summary Card Sub-component ─── */

interface SummaryCardProps {
  label: string;
  value: number;
  loading: boolean;
  frameClass: string;
  textClass: string;
  cornerColor?: string;
}

const SummaryCard = ({
  label,
  value,
  loading,
  frameClass,
  textClass,
  cornerColor,
}: SummaryCardProps) => {
  const style = cornerColor ? { borderColor: cornerColor } : undefined;
  return (
    <div className={`relative ${frameClass} p-1`}>
      <div className="bg-navy p-6">
        <div className="ornate-corner ornate-corner-tl" style={style} />
        <div className="ornate-corner ornate-corner-tr" style={style} />
        <div className="ornate-corner ornate-corner-bl" style={style} />
        <div className="ornate-corner ornate-corner-br" style={style} />
        <div
          className={`${textClass}/70 text-sm mb-2 font-display tracking-wider uppercase`}
        >
          {label}
        </div>
        {loading ? (
          <Skeleton className={`h-8 w-24 ${textClass}/20`} />
        ) : (
          <div className={`${textClass} font-display text-3xl`}>
            {value.toFixed(4)} <span className="text-lg">oz</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default Vault;
