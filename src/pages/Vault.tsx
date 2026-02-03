import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useWallet } from '@/contexts/WalletContext';
import { useVaultHoldings, useHoldingsSummary } from '@/hooks/useVaultHoldings';
import { useLatestReserveProof } from '@/hooks/useReserveProof';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Wallet, Shield, Bitcoin, ExternalLink, AlertCircle, Lock, CheckCircle } from 'lucide-react';
import ConnectWalletButton from '@/components/wallet/ConnectWalletButton';
import vaultDoor from '@/assets/vault-door-rich.jpg';

const metalColors = {
  gold: 'text-gold',
  silver: 'text-silver',
  platinum: 'text-platinum',
};

const Vault = () => {
  const { isConnected, address } = useWallet();
  const { data: holdings, isLoading: holdingsLoading } = useVaultHoldings();
  const { summary, isLoading: summaryLoading } = useHoldingsSummary();
  const { data: latestProof, isLoading: proofLoading } = useLatestReserveProof();

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-navy">
        <Header />
        <main className="relative">
          {/* Vault Door Hero */}
          <div className="relative h-[70vh] overflow-hidden">
            <img 
              src={vaultDoor} 
              alt="Secure Vault Door" 
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-navy/60 via-navy/40 to-navy" />
            
            {/* Connect Prompt */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center max-w-lg mx-auto px-4">
                {/* Vault Lock Icon */}
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
                
                {/* Security Badges */}
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
          
          {/* Greek Key Border */}
          <div className="h-8 greek-key-border-rich" />
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-navy">
      <Header />
      <main>
        {/* Vault Header with Background */}
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
                {/* Vault Icon */}
                <div className="relative w-20 h-20">
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-gold via-gold-light to-gold-dark" />
                  <div className="absolute inset-1 rounded-full bg-navy flex items-center justify-center">
                    <Shield className="text-gold w-10 h-10" />
                  </div>
                </div>
                
                <div>
                  <h1 className="font-display text-4xl md:text-5xl text-gold tracking-wide">
                    MY VAULT
                  </h1>
                  <div className="flex items-center gap-2 text-gold/60 mt-2">
                    <Wallet size={16} />
                    <span className="font-mono text-sm">{address}</span>
                    <Badge variant="outline" className="text-green-400 border-green-400 ml-2">
                      <CheckCircle size={12} className="mr-1" /> Secured
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Greek Key Border */}
        <div className="h-6 greek-key-border-rich" />

        <div className="container mx-auto px-4 py-12">
          {/* Summary Cards - Rich Metallic Style */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {/* Gold Holdings */}
            <div className="relative gold-frame-ornate p-1">
              <div className="bg-navy p-6">
                <div className="ornate-corner ornate-corner-tl" />
                <div className="ornate-corner ornate-corner-tr" />
                <div className="ornate-corner ornate-corner-bl" />
                <div className="ornate-corner ornate-corner-br" />
                <div className="text-gold/70 text-sm mb-2 font-display tracking-wider uppercase">Gold Holdings</div>
                {summaryLoading ? (
                  <Skeleton className="h-8 w-24 bg-gold/20" />
                ) : (
                  <div className="text-gold font-display text-3xl">
                    {summary.totalGoldOz.toFixed(4)} <span className="text-lg">oz</span>
                  </div>
                )}
              </div>
            </div>

            {/* Silver Holdings */}
            <div className="relative silver-frame-ornate p-1">
              <div className="bg-navy p-6">
                <div className="ornate-corner ornate-corner-tl" style={{ borderColor: 'hsl(var(--silver))' }} />
                <div className="ornate-corner ornate-corner-tr" style={{ borderColor: 'hsl(var(--silver))' }} />
                <div className="ornate-corner ornate-corner-bl" style={{ borderColor: 'hsl(var(--silver))' }} />
                <div className="ornate-corner ornate-corner-br" style={{ borderColor: 'hsl(var(--silver))' }} />
                <div className="text-silver/70 text-sm mb-2 font-display tracking-wider uppercase">Silver Holdings</div>
                {summaryLoading ? (
                  <Skeleton className="h-8 w-24 bg-silver/20" />
                ) : (
                  <div className="text-silver font-display text-3xl">
                    {summary.totalSilverOz.toFixed(4)} <span className="text-lg">oz</span>
                  </div>
                )}
              </div>
            </div>

            {/* Platinum Holdings */}
            <div className="relative platinum-frame-ornate p-1">
              <div className="bg-navy p-6">
                <div className="ornate-corner ornate-corner-tl" style={{ borderColor: 'hsl(var(--platinum))' }} />
                <div className="ornate-corner ornate-corner-tr" style={{ borderColor: 'hsl(var(--platinum))' }} />
                <div className="ornate-corner ornate-corner-bl" style={{ borderColor: 'hsl(var(--platinum))' }} />
                <div className="ornate-corner ornate-corner-br" style={{ borderColor: 'hsl(var(--platinum))' }} />
                <div className="text-platinum/70 text-sm mb-2 font-display tracking-wider uppercase">Platinum Holdings</div>
                {summaryLoading ? (
                  <Skeleton className="h-8 w-24 bg-platinum/20" />
                ) : (
                  <div className="text-platinum font-display text-3xl">
                    {summary.totalPlatinumOz.toFixed(4)} <span className="text-lg">oz</span>
                  </div>
                )}
              </div>
            </div>

            {/* Total Value */}
            <div className="relative bg-gradient-to-br from-navy-light to-navy border-2 border-gold/40 p-6">
              <div className="ornate-corner ornate-corner-tl" />
              <div className="ornate-corner ornate-corner-tr" />
              <div className="ornate-corner ornate-corner-bl" />
              <div className="ornate-corner ornate-corner-br" />
              <div className="text-marble/70 text-sm mb-2 font-display tracking-wider uppercase">Total Value</div>
              {summaryLoading ? (
                <Skeleton className="h-8 w-32 bg-gold/20" />
              ) : (
                <div className="text-marble font-display text-3xl">
                  {formatPrice(summary.totalValue)}
                </div>
              )}
            </div>
          </div>

          {/* Proof Status - Secure Panel */}
          <div className="relative mb-12">
            <div className="absolute inset-0 bg-gradient-to-r from-green-900/20 via-navy to-green-900/20 border border-green-500/30" />
            <div className="relative p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                  <Shield className="text-green-400" size={24} />
                </div>
                <div>
                  <h2 className="font-display text-2xl text-gold">Proof-of-Reserve Status</h2>
                  <p className="text-green-400 text-sm">Cryptographically Verified</p>
                </div>
              </div>
              
              {proofLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-6 w-full bg-gold/10" />
                  <Skeleton className="h-6 w-3/4 bg-gold/10" />
                </div>
              ) : latestProof ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div>
                      <div className="text-gold/60 text-sm mb-2 uppercase tracking-wider">Merkle Root</div>
                      <div className="font-mono text-xs text-marble bg-navy/80 p-3 rounded border border-gold/20 break-all">
                        {latestProof.merkle_root}
                      </div>
                    </div>
                    <div>
                      <div className="text-gold/60 text-sm mb-2 uppercase tracking-wider">Last Verified</div>
                      <div className="text-marble text-lg">{formatDate(latestProof.created_at)}</div>
                    </div>
                  </div>
                  <div className="space-y-6">
                    <div>
                      <div className="text-gold/60 text-sm mb-2 uppercase tracking-wider">Bitcoin Anchor</div>
                      {latestProof.bitcoin_txid ? (
                        <a
                          href={`https://mempool.space/tx/${latestProof.bitcoin_txid}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-gold hover:text-gold-light bg-navy/80 p-3 rounded border border-gold/20"
                        >
                          <Bitcoin size={20} />
                          <span className="font-mono text-xs truncate">
                            {latestProof.bitcoin_txid}
                          </span>
                          <ExternalLink size={14} />
                        </a>
                      ) : (
                        <span className="text-marble/50">Pending anchoring</span>
                      )}
                    </div>
                    <div>
                      <div className="text-gold/60 text-sm mb-2 uppercase tracking-wider">Total Bars Verified</div>
                      <div className="text-marble text-lg">{latestProof.bar_count} bars in secure custody</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 text-marble/50">
                  <AlertCircle size={20} />
                  <span>No reserve proof available yet.</span>
                </div>
              )}
            </div>
          </div>

          {/* Holdings Table - Vault Ledger Style */}
          <div className="relative">
            <div className="bg-navy-light/30 border-2 border-gold/30">
              {/* Header Bar */}
              <div className="bg-gradient-to-r from-gold/20 via-gold/10 to-gold/20 p-6 border-b border-gold/30">
                <h2 className="font-display text-2xl text-gold flex items-center gap-3">
                  <Lock size={24} />
                  Your Holdings Ledger
                </h2>
              </div>
              
              <div className="p-6">
                {holdingsLoading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <Skeleton key={i} className="h-16 w-full bg-gold/10" />
                    ))}
                  </div>
                ) : holdings && holdings.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b-2 border-gold/30">
                          <th className="text-left py-4 px-4 text-gold font-display text-sm uppercase tracking-wider">
                            Serial Number
                          </th>
                          <th className="text-left py-4 px-4 text-gold font-display text-sm uppercase tracking-wider">
                            Metal
                          </th>
                          <th className="text-left py-4 px-4 text-gold font-display text-sm uppercase tracking-wider">
                            Weight
                          </th>
                          <th className="text-left py-4 px-4 text-gold font-display text-sm uppercase tracking-wider">
                            Vault Location
                          </th>
                          <th className="text-left py-4 px-4 text-gold font-display text-sm uppercase tracking-wider">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {holdings.map((holding) => (
                          <tr
                            key={holding.id}
                            className="border-b border-gold/10 hover:bg-gold/5 transition-colors"
                          >
                            <td className="py-4 px-4 font-mono text-sm text-marble">
                              {holding.bullion_bar?.serial_number}
                            </td>
                            <td className="py-4 px-4">
                              <Badge
                                className={`${
                                  holding.bullion_bar?.metal_type === 'gold' 
                                    ? 'bg-gold/20 text-gold border-gold' 
                                    : holding.bullion_bar?.metal_type === 'silver'
                                    ? 'bg-silver/20 text-silver border-silver'
                                    : 'bg-platinum/20 text-platinum border-platinum'
                                } border font-display uppercase tracking-wider`}
                              >
                                {holding.bullion_bar?.metal_type}
                              </Badge>
                            </td>
                            <td className="py-4 px-4 text-marble font-display">
                              {holding.bullion_bar?.weight_oz} oz
                            </td>
                            <td className="py-4 px-4 text-marble/70">
                              <div className="flex items-center gap-2">
                                <Lock size={14} className="text-gold/60" />
                                {holding.bullion_bar?.vault_id}
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <Badge
                                className={
                                  holding.status === 'active'
                                    ? 'bg-green-500/20 text-green-400 border-green-400'
                                    : 'bg-yellow-500/20 text-yellow-400 border-yellow-400'
                                }
                              >
                                <CheckCircle size={12} className="mr-1" />
                                {holding.status}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gold/10 flex items-center justify-center">
                      <Lock className="text-gold/40 w-12 h-12" />
                    </div>
                    <div className="text-marble/50 text-xl mb-4 font-display">
                      Your Vault is Empty
                    </div>
                    <p className="text-marble/30 text-sm">
                      Visit the Marketplace to acquire verified bullion.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Greek Key Border */}
        <div className="h-8 greek-key-border-rich-dark" />
      </main>
      <Footer />
    </div>
  );
};

export default Vault;