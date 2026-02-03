import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useWallet } from '@/contexts/WalletContext';
import { useVaultHoldings, useHoldingsSummary } from '@/hooks/useVaultHoldings';
import { useLatestReserveProof } from '@/hooks/useReserveProof';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Wallet, Shield, Bitcoin, ExternalLink, AlertCircle } from 'lucide-react';
import ConnectWalletButton from '@/components/wallet/ConnectWalletButton';

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
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-24">
          <div className="max-w-md mx-auto text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-navy-light/50 flex items-center justify-center">
              <Wallet className="text-gold" size={40} />
            </div>
            <h1 className="font-display text-3xl text-gold-light mb-4">
              CONNECT YOUR VAULT
            </h1>
            <p className="text-marble/70 mb-8">
              Connect your MetaMask wallet to access your bullion holdings, 
              verification status, and redemption options.
            </p>
            <ConnectWalletButton />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-12">
        {/* Page Header */}
        <div className="mb-12">
          <h1 className="font-display text-4xl md:text-5xl text-gold-light mb-4">
            MY VAULT
          </h1>
          <div className="flex items-center gap-2 text-marble/70">
            <Wallet size={16} />
            <span className="font-mono text-sm">{address}</span>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <Card className="bg-gradient-to-br from-gold/20 to-gold/5 border-gold/30">
            <CardContent className="p-6">
              <div className="text-gold/70 text-sm mb-2">Gold Holdings</div>
              {summaryLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <div className="text-gold font-display text-2xl">
                  {summary.totalGoldOz.toFixed(4)} oz
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-silver/20 to-silver/5 border-silver/30">
            <CardContent className="p-6">
              <div className="text-silver/70 text-sm mb-2">Silver Holdings</div>
              {summaryLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <div className="text-silver font-display text-2xl">
                  {summary.totalSilverOz.toFixed(4)} oz
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-platinum/20 to-platinum/5 border-platinum/30">
            <CardContent className="p-6">
              <div className="text-platinum/70 text-sm mb-2">Platinum Holdings</div>
              {summaryLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <div className="text-platinum font-display text-2xl">
                  {summary.totalPlatinumOz.toFixed(4)} oz
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-navy-light/30 border-gold/20">
            <CardContent className="p-6">
              <div className="text-marble/70 text-sm mb-2">Total Value</div>
              {summaryLoading ? (
                <Skeleton className="h-8 w-32" />
              ) : (
                <div className="text-marble font-display text-2xl">
                  {formatPrice(summary.totalValue)}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Proof Status */}
        <Card className="bg-navy-light/30 border-gold/20 mb-12">
          <CardHeader>
            <CardTitle className="font-display text-xl text-gold-light flex items-center gap-2">
              <Shield className="text-green-400" size={20} />
              Proof-of-Reserve Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            {proofLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-3/4" />
              </div>
            ) : latestProof ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <div className="text-marble/70 text-sm mb-1">Merkle Root</div>
                    <div className="font-mono text-xs text-marble bg-navy/50 p-2 rounded break-all">
                      {latestProof.merkle_root}
                    </div>
                  </div>
                  <div>
                    <div className="text-marble/70 text-sm mb-1">Last Verified</div>
                    <div className="text-marble">{formatDate(latestProof.created_at)}</div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <div className="text-marble/70 text-sm mb-1">Bitcoin Anchor</div>
                    {latestProof.bitcoin_txid ? (
                      <a
                        href={`https://mempool.space/tx/${latestProof.bitcoin_txid}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-gold hover:text-gold-light"
                      >
                        <Bitcoin size={16} />
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
                    <div className="text-marble/70 text-sm mb-1">Total Bars Verified</div>
                    <div className="text-marble">{latestProof.bar_count} bars</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 text-marble/50">
                <AlertCircle size={20} />
                <span>No reserve proof available yet.</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Holdings Table */}
        <Card className="bg-navy-light/30 border-gold/20">
          <CardHeader>
            <CardTitle className="font-display text-xl text-gold-light">
              Your Holdings
            </CardTitle>
          </CardHeader>
          <CardContent>
            {holdingsLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : holdings && holdings.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gold/20">
                      <th className="text-left py-3 px-4 text-marble/70 font-display text-sm">
                        Serial Number
                      </th>
                      <th className="text-left py-3 px-4 text-marble/70 font-display text-sm">
                        Metal
                      </th>
                      <th className="text-left py-3 px-4 text-marble/70 font-display text-sm">
                        Weight
                      </th>
                      <th className="text-left py-3 px-4 text-marble/70 font-display text-sm">
                        Vault
                      </th>
                      <th className="text-left py-3 px-4 text-marble/70 font-display text-sm">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {holdings.map((holding) => (
                      <tr
                        key={holding.id}
                        className="border-b border-gold/10 hover:bg-navy-light/20"
                      >
                        <td className="py-3 px-4 font-mono text-sm text-marble">
                          {holding.bullion_bar?.serial_number}
                        </td>
                        <td className="py-3 px-4">
                          <Badge
                            variant="outline"
                            className={`${
                              metalColors[holding.bullion_bar?.metal_type as keyof typeof metalColors]
                            } border-current`}
                          >
                            {holding.bullion_bar?.metal_type?.toUpperCase()}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-marble">
                          {holding.bullion_bar?.weight_oz} oz
                        </td>
                        <td className="py-3 px-4 text-marble/70">
                          {holding.bullion_bar?.vault_id}
                        </td>
                        <td className="py-3 px-4">
                          <Badge
                            variant="outline"
                            className={
                              holding.status === 'active'
                                ? 'text-green-400 border-green-400'
                                : 'text-yellow-400 border-yellow-400'
                            }
                          >
                            {holding.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-marble/50 text-lg mb-4">
                  No holdings found
                </div>
                <p className="text-marble/30 text-sm">
                  Visit the Marketplace to acquire verified bullion.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default Vault;
