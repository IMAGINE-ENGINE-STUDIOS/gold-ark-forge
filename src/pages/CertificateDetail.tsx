import { useParams, Link } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useCertificate, useCertificateEvents } from '@/hooks/useCertificates';
import { useMetalPrices } from '@/hooks/useMetalPrices';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Shield, ArrowLeft, Bitcoin, Clock, FileCheck, User, ArrowUpRight } from 'lucide-react';

const statusColors: Record<string, string> = {
  active: 'text-green-400 border-green-400',
  frozen: 'text-blue-400 border-blue-400',
  revoked: 'text-red-400 border-red-400',
  redeemed: 'text-muted-foreground border-muted',
};

const eventIcons: Record<string, typeof FileCheck> = {
  issue: FileCheck,
  freeze: Shield,
  unfreeze: Shield,
  revoke: Shield,
  transfer_intent: ArrowUpRight,
};

const CertificateDetail = () => {
  const { certId } = useParams<{ certId: string }>();
  const { data: cert, isLoading } = useCertificate(certId || '');
  const { data: events, isLoading: eventsLoading } = useCertificateEvents(certId || '');
  const { data: prices } = useMetalPrices();

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
    });

  const truncate = (s: string, len = 10) =>
    s.length <= len * 2 ? s : `${s.slice(0, len)}...${s.slice(-len)}`;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-navy">
        <Header />
        <main className="container mx-auto px-4 py-12">
          <Skeleton className="h-10 w-64 mb-8" />
          <Skeleton className="h-64 w-full mb-8" />
          <Skeleton className="h-48 w-full" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!cert) {
    return (
      <div className="min-h-screen bg-navy">
        <Header />
        <main className="container mx-auto px-4 py-12 text-center">
          <h1 className="font-display text-3xl text-marble mb-4">Certificate Not Found</h1>
          <Link to="/marketplace" className="text-gold hover:text-gold-light">
            ← Back to Marketplace
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  const meta = cert.metadata_json as any;
  const metalType = meta?.metal_type || 'gold';
  const weight = Number(meta?.weight_oz) || 0;
  const spotPrice = prices?.[metalType]?.price_usd ? Number(prices[metalType].price_usd) : null;

  return (
    <div className="min-h-screen bg-navy">
      <Header />
      <main className="container mx-auto px-4 py-12">
        <Link to="/marketplace" className="inline-flex items-center gap-2 text-gold hover:text-gold-light mb-8">
          <ArrowLeft size={16} /> Back to Marketplace
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="bg-navy-light/30 border-gold/20">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="font-display text-2xl text-gold-light">
                    {weight} oz {metalType.charAt(0).toUpperCase() + metalType.slice(1)} Certificate
                  </CardTitle>
                  <Badge variant="outline" className={statusColors[cert.status] || ''}>
                    {cert.status.toUpperCase()}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-marble/60">Serial Number</span>
                    <p className="font-mono text-marble">{meta?.serial_number || '—'}</p>
                  </div>
                  <div>
                    <span className="text-marble/60">Refiner Stamp</span>
                    <p className="text-marble">{meta?.refiner_stamp || '—'}</p>
                  </div>
                  <div>
                    <span className="text-marble/60">Fineness</span>
                    <p className="text-marble">{meta?.fineness ? `${(Number(meta.fineness) * 100).toFixed(2)}%` : '—'}</p>
                  </div>
                  <div>
                    <span className="text-marble/60">Weight</span>
                    <p className="text-marble">{weight} troy oz</p>
                  </div>
                  <div>
                    <span className="text-marble/60">Jurisdiction</span>
                    <p className="text-marble">{meta?.jurisdiction || '—'}</p>
                  </div>
                  <div>
                    <span className="text-marble/60">Certificate Version</span>
                    <p className="text-marble">v{cert.cert_version}</p>
                  </div>
                </div>

                {spotPrice && weight > 0 && (
                  <div className="mt-6 p-4 bg-navy/30 rounded-lg border border-gold/20">
                    <div className="flex justify-between items-end">
                      <span className="text-marble/70">Estimated Value (spot)</span>
                      <span className="text-gold font-display text-2xl">
                        {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(weight * spotPrice)}
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Event Timeline */}
            <Card className="bg-navy-light/30 border-gold/20">
              <CardHeader>
                <CardTitle className="font-display text-xl text-gold-light flex items-center gap-2">
                  <Clock size={18} /> Event Timeline
                </CardTitle>
              </CardHeader>
              <CardContent>
                {eventsLoading ? (
                  <div className="space-y-3">
                    {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
                  </div>
                ) : events && events.length > 0 ? (
                  <div className="space-y-3">
                    {events.map((event) => {
                      const Icon = eventIcons[event.event_type] || Clock;
                      return (
                        <div key={event.event_id} className="flex items-start gap-4 p-4 bg-navy/20 rounded-lg border border-gold/10">
                          <div className="w-8 h-8 rounded-full bg-gold/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <Icon className="text-gold" size={16} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-display text-sm text-marble capitalize">{event.event_type.replace('_', ' ')}</span>
                              <span className="text-marble/50 text-xs">{formatDate(event.created_at)}</span>
                            </div>
                            {event.actor_wallet_id && (
                              <p className="text-xs text-marble/60 font-mono">
                                Wallet: {truncate(event.actor_wallet_id, 6)}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-marble/50 text-center py-4">No events recorded.</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Partner Info */}
            <Card className="bg-navy-light/30 border-gold/20">
              <CardHeader>
                <CardTitle className="font-display text-lg text-gold-light flex items-center gap-2">
                  <Shield size={16} /> Issuing Partner
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <span className="text-marble/60">Legal Name</span>
                  <p className="text-marble">{cert.partners.legal_name}</p>
                </div>
                <div>
                  <span className="text-marble/60">Jurisdiction</span>
                  <p className="text-marble">{cert.partners.jurisdiction}</p>
                </div>
                <div>
                  <span className="text-marble/60">Type</span>
                  <p className="text-marble capitalize">{cert.partners.partner_type}</p>
                </div>
              </CardContent>
            </Card>

            {/* Owner */}
            <Card className="bg-navy-light/30 border-gold/20">
              <CardHeader>
                <CardTitle className="font-display text-lg text-gold-light flex items-center gap-2">
                  <User size={16} /> Current Owner
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-mono text-xs text-marble break-all">
                  {cert.owner_wallet_id}
                </p>
              </CardContent>
            </Card>

            {/* Signature */}
            <Card className="bg-navy-light/30 border-gold/20">
              <CardHeader>
                <CardTitle className="font-display text-lg text-gold-light flex items-center gap-2">
                  <Bitcoin size={16} /> Cryptographic Proof
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <span className="text-marble/60">Signature Algorithm</span>
                  <p className="text-marble">{cert.partner_sig_alg}</p>
                </div>
                <div>
                  <span className="text-marble/60">Issued</span>
                  <p className="text-marble">{formatDate(cert.issued_at)}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default CertificateDetail;
