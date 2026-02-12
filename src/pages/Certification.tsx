import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useLatestReserveProof, useAttestations } from '@/hooks/useReserveProof';
import { useAnchors } from '@/hooks/useAnchors';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Shield, Bitcoin, ExternalLink, FileCheck, Link as LinkIcon, CheckCircle2, Clock } from 'lucide-react';

const Certification = () => {
  const { data: latestProof, isLoading: proofLoading } = useLatestReserveProof();
  const { data: anchors, isLoading: anchorsLoading } = useAnchors(10);
  const { data: attestations, isLoading: attestationsLoading } = useAttestations();

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
    });

  const truncateHash = (hash: string, length = 12) =>
    hash.length <= length * 2 ? hash : `${hash.slice(0, length)}...${hash.slice(-length)}`;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-12">
        {/* Page Header */}
        <div className="text-center mb-12">
          <h1 className="font-display text-4xl md:text-5xl text-gold-light mb-4">
            VERIFICATION & CERTIFICATION
          </h1>
          <p className="text-marble/70 max-w-2xl mx-auto">
            Transparent proof of partner-signed bullion certificates through Chainlink oracles,
            authority attestations, and Bitcoin blockchain anchoring.
          </p>
        </div>

        {/* How It Works */}
        <Card className="bg-navy-light/30 border-gold/20 mb-12">
          <CardHeader>
            <CardTitle className="font-display text-xl text-gold-light">
              How Verification Works
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gold/10 flex items-center justify-center">
                  <FileCheck className="text-gold" size={28} />
                </div>
                <h3 className="font-display text-lg text-marble mb-2">1. Partner Signing</h3>
                <p className="text-marble/60 text-sm">
                  Certified vault operators and dealers cryptographically sign each bullion
                  certificate, attesting to the physical bar's existence, serial number, and fineness.
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gold/10 flex items-center justify-center">
                  <LinkIcon className="text-gold" size={28} />
                </div>
                <h3 className="font-display text-lg text-marble mb-2">2. Chainlink PoR</h3>
                <p className="text-marble/60 text-sm">
                  Chainlink Proof-of-Reserve oracles query our registry to verify that
                  issued certificates match physical reserves held by authorized partners.
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gold/10 flex items-center justify-center">
                  <Bitcoin className="text-gold" size={28} />
                </div>
                <h3 className="font-display text-lg text-marble mb-2">3. Bitcoin Anchoring</h3>
                <p className="text-marble/60 text-sm">
                  Certificate events are Merkle-batched and permanently anchored
                  to the Bitcoin blockchain via OP_RETURN commitments.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Current Reserve Status */}
        <Card className="bg-navy-light/30 border-gold/20 mb-12">
          <CardHeader>
            <CardTitle className="font-display text-xl text-gold-light flex items-center gap-2">
              <Shield className="text-green-400" size={20} />
              Current Reserve Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            {proofLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-3/4" />
              </div>
            ) : latestProof ? (
              <div className="space-y-6">
                <div className="flex items-center gap-2 text-green-400">
                  <CheckCircle2 size={20} />
                  <span className="font-display">Reserves Verified</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="bg-gradient-to-br from-gold/20 to-gold/5 p-4 rounded-lg border border-gold/30">
                    <div className="text-gold/70 text-sm mb-1">Total Gold</div>
                    <div className="text-gold font-display text-xl">
                      {Number(latestProof.total_gold_oz).toLocaleString()} oz
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-silver/20 to-silver/5 p-4 rounded-lg border border-silver/30">
                    <div className="text-silver/70 text-sm mb-1">Total Silver</div>
                    <div className="text-silver font-display text-xl">
                      {Number(latestProof.total_silver_oz).toLocaleString()} oz
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-platinum/20 to-platinum/5 p-4 rounded-lg border border-platinum/30">
                    <div className="text-platinum/70 text-sm mb-1">Total Platinum</div>
                    <div className="text-platinum font-display text-xl">
                      {Number(latestProof.total_platinum_oz).toLocaleString()} oz
                    </div>
                  </div>
                  <div className="bg-navy/50 p-4 rounded-lg border border-gold/20">
                    <div className="text-marble/70 text-sm mb-1">Verified Bars</div>
                    <div className="text-marble font-display text-xl">
                      {latestProof.bar_count}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <div className="text-marble/70 text-sm mb-2">Merkle Root</div>
                    <div className="font-mono text-xs text-marble bg-navy/50 p-3 rounded break-all">
                      {latestProof.merkle_root}
                    </div>
                  </div>
                  <div>
                    <div className="text-marble/70 text-sm mb-2">Bitcoin Anchor</div>
                    {latestProof.bitcoin_txid ? (
                      <a
                        href={`https://mempool.space/tx/${latestProof.bitcoin_txid}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-gold hover:text-gold-light font-mono text-xs bg-navy/50 p-3 rounded"
                      >
                        <Bitcoin size={16} />
                        <span className="truncate">{latestProof.bitcoin_txid}</span>
                        <ExternalLink size={14} className="flex-shrink-0" />
                      </a>
                    ) : (
                      <div className="flex items-center gap-2 text-marble/50 bg-navy/50 p-3 rounded">
                        <Clock size={16} />
                        <span>Anchoring pending...</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-marble/50">
                No reserve proof available yet.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Authority Attestations */}
        <Card className="bg-navy-light/30 border-gold/20 mb-12">
          <CardHeader>
            <CardTitle className="font-display text-xl text-gold-light flex items-center gap-2">
              <FileCheck size={20} />
              Authority Attestations
            </CardTitle>
          </CardHeader>
          <CardContent>
            {attestationsLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : attestations && attestations.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gold/20">
                      <th className="text-left py-3 px-4 text-marble/70 font-display text-sm">Authority</th>
                      <th className="text-left py-3 px-4 text-marble/70 font-display text-sm">Document Hash</th>
                      <th className="text-left py-3 px-4 text-marble/70 font-display text-sm">Valid Until</th>
                      <th className="text-left py-3 px-4 text-marble/70 font-display text-sm">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attestations.map((attestation) => {
                      const isValid = attestation.valid_until
                        ? new Date(attestation.valid_until) > new Date()
                        : true;
                      return (
                        <tr key={attestation.id} className="border-b border-gold/10 hover:bg-navy-light/20">
                          <td className="py-3 px-4 text-marble">{attestation.authority_name}</td>
                          <td className="py-3 px-4 font-mono text-xs text-marble/70">
                            {truncateHash(attestation.document_hash)}
                          </td>
                          <td className="py-3 px-4 text-marble/70">
                            {attestation.valid_until ? formatDate(attestation.valid_until) : 'Perpetual'}
                          </td>
                          <td className="py-3 px-4">
                            <Badge
                              variant="outline"
                              className={isValid ? 'text-green-400 border-green-400' : 'text-red-400 border-red-400'}
                            >
                              {isValid ? 'Active' : 'Expired'}
                            </Badge>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-marble/50">
                No attestations on record yet.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Bitcoin Anchor History (now from anchors table) */}
        <Card className="bg-navy-light/30 border-gold/20">
          <CardHeader>
            <CardTitle className="font-display text-xl text-gold-light flex items-center gap-2">
              <Bitcoin size={20} />
              Bitcoin Anchor History
            </CardTitle>
          </CardHeader>
          <CardContent>
            {anchorsLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : anchors && anchors.length > 0 ? (
              <div className="space-y-3">
                {anchors.map((anchor) => (
                  <div
                    key={anchor.anchor_id}
                    className="flex items-center justify-between p-4 bg-navy/30 rounded-lg border border-gold/10"
                  >
                    <div className="flex items-center gap-4">
                      <div className="text-marble/70 text-sm">
                        {formatDate(anchor.created_at)}
                      </div>
                      <Badge variant="outline" className="text-gold border-gold">
                        {anchor.leaf_count} events
                      </Badge>
                      <Badge
                        variant="outline"
                        className={
                          anchor.status === 'confirmed'
                            ? 'text-green-400 border-green-400'
                            : anchor.status === 'broadcast'
                            ? 'text-yellow-400 border-yellow-400'
                            : 'text-marble/50 border-marble/30'
                        }
                      >
                        {anchor.status}
                      </Badge>
                    </div>
                    {anchor.commit_txid ? (
                      <a
                        href={`https://mempool.space/tx/${anchor.commit_txid}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-gold hover:text-gold-light"
                      >
                        <span className="font-mono text-xs hidden md:inline">
                          {truncateHash(anchor.commit_txid, 8)}
                        </span>
                        <ExternalLink size={14} />
                      </a>
                    ) : (
                      <span className="text-marble/50 text-sm">Pending</span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-marble/50">
                No anchor history available.
              </div>
            )}
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default Certification;
