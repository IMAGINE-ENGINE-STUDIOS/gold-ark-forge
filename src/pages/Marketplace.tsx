import { useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import TradingViewTicker from '@/components/tradingview/TradingViewTicker';
import TradingViewChart from '@/components/tradingview/TradingViewChart';
import { useCertificates, MetalType, CertificateWithPartner } from '@/hooks/useCertificates';
import { useMetalPrices } from '@/hooks/useMetalPrices';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';
import { Shield, ArrowUpRight, Filter, ChevronDown } from 'lucide-react';

const metalColors: Record<string, string> = {
  gold: 'from-gold/20 to-gold/5 border-gold/30',
  silver: 'from-silver/20 to-silver/5 border-silver/30',
  platinum: 'from-platinum/20 to-platinum/5 border-platinum/30',
};

const metalTextColors: Record<string, string> = {
  gold: 'text-gold',
  silver: 'text-silver',
  platinum: 'text-platinum',
};

const statusColors: Record<string, string> = {
  active: 'text-green-400 border-green-400',
  frozen: 'text-blue-400 border-blue-400',
  revoked: 'text-red-400 border-red-400',
  redeemed: 'text-muted-foreground border-muted',
};

const Marketplace = () => {
  const [selectedMetal, setSelectedMetal] = useState<MetalType | undefined>(undefined);
  const { data: certs, isLoading } = useCertificates({ metalType: selectedMetal });
  const { data: prices } = useMetalPrices();

  const metals: { type: MetalType; label: string }[] = [
    { type: 'gold', label: 'Gold' },
    { type: 'silver', label: 'Silver' },
    { type: 'platinum', label: 'Platinum' },
  ];

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(price);

  const getMetalType = (cert: CertificateWithPartner): string =>
    (cert.metadata_json as any)?.metal_type || 'gold';

  const getWeightOz = (cert: CertificateWithPartner): number =>
    Number((cert.metadata_json as any)?.weight_oz) || 0;

  const getSerialNumber = (cert: CertificateWithPartner): string =>
    (cert.metadata_json as any)?.serial_number || '—';

  const getFineness = (cert: CertificateWithPartner): number =>
    Number((cert.metadata_json as any)?.fineness) || 0;

  const getJurisdiction = (cert: CertificateWithPartner): string =>
    (cert.metadata_json as any)?.jurisdiction || '—';

  const [chartSymbol, setChartSymbol] = useState('OANDA:XAUUSD');
  const [chartOpen, setChartOpen] = useState(false);

  const chartSymbols = [
    { key: 'OANDA:XAUUSD', label: 'Gold' },
    { key: 'OANDA:XAGUSD', label: 'Silver' },
    { key: 'OANDA:XPTUSD', label: 'Platinum' },
    { key: 'BITSTAMP:BTCUSD', label: 'Bitcoin' },
  ];

  return (
    <div className="min-h-screen bg-navy">
      <Header />
      <TradingViewTicker />
      <main className="container mx-auto px-4 py-12">
        {/* Page Header */}
        <div className="text-center mb-12">
          <div className="h-1 w-24 mx-auto bg-gradient-to-r from-transparent via-gold to-transparent mb-6" />
          <h1 className="font-display text-4xl md:text-5xl text-gold-light mb-4">
            CERTIFICATE MARKETPLACE
          </h1>
          <p className="text-marble/70 max-w-2xl mx-auto">
            Browse partner-signed bullion certificates from certified vaults. Each certificate is
            cryptographically signed and anchored to the Bitcoin blockchain.
          </p>
        </div>

        {/* Live Prices Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {metals.map(({ type, label }) => (
            <div key={type} className={`p-4 rounded-lg bg-gradient-to-br ${metalColors[type]} border`}>
              <div className="flex justify-between items-center">
                <span className={`font-display text-lg ${metalTextColors[type]}`}>{label}</span>
                <div className="text-right">
                  <div className="text-marble font-semibold">
                    {prices?.[type]?.price_usd ? formatPrice(Number(prices[type].price_usd)) : '—'}
                  </div>
                  {prices?.[type]?.change_24h && (
                    <div className={`text-xs ${Number(prices[type].change_24h) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {Number(prices[type].change_24h) >= 0 ? '+' : ''}
                      {Number(prices[type].change_24h).toFixed(2)}%
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Collapsible Advanced Chart */}
        <Collapsible open={chartOpen} onOpenChange={setChartOpen} className="mb-8">
          <CollapsibleTrigger className="flex items-center gap-2 text-gold font-display text-sm tracking-wider hover:text-gold-light transition-colors mb-3">
            <ChevronDown size={16} className={`transition-transform ${chartOpen ? 'rotate-180' : ''}`} />
            Advanced Chart
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="flex flex-wrap gap-2 mb-3">
              {chartSymbols.map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setChartSymbol(key)}
                  className={`px-3 py-1.5 rounded text-xs font-display transition-all ${
                    chartSymbol === key ? 'bg-gold text-navy' : 'bg-navy-light/50 text-marble hover:bg-navy-light border border-gold/20'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <TradingViewChart symbol={chartSymbol} height={450} />
            <p className="text-marble/40 text-xs text-center mt-2">
              Visualization only — powered by TradingView. No trading or order execution.
            </p>
          </CollapsibleContent>
        </Collapsible>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-8">
          <button
            onClick={() => setSelectedMetal(undefined)}
            className={`px-4 py-2 rounded-lg font-display text-sm transition-all ${
              !selectedMetal ? 'bg-gold text-navy' : 'bg-navy-light/50 text-marble hover:bg-navy-light'
            }`}
          >
            <Filter size={14} className="inline mr-2" />
            All Metals
          </button>
          {metals.map(({ type, label }) => (
            <button
              key={type}
              onClick={() => setSelectedMetal(type)}
              className={`px-4 py-2 rounded-lg font-display text-sm transition-all ${
                selectedMetal === type ? 'bg-gold text-navy' : 'bg-navy-light/50 text-marble hover:bg-navy-light'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Certificate Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="bg-navy-light/30 border-gold/10">
                <CardContent className="p-6">
                  <Skeleton className="h-6 w-3/4 mb-4" />
                  <Skeleton className="h-4 w-1/2 mb-2" />
                  <Skeleton className="h-4 w-2/3 mb-4" />
                  <Skeleton className="h-10 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : certs && certs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {certs.map((cert) => {
              const metal = getMetalType(cert);
              const weight = getWeightOz(cert);
              const spotPrice = prices?.[metal]?.price_usd ? Number(prices[metal].price_usd) : null;

              return (
                <Card
                  key={cert.cert_id}
                  className={`bg-gradient-to-br ${metalColors[metal] || metalColors.gold} border hover:border-gold/50 transition-all group`}
                >
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <Badge variant="outline" className={`${metalTextColors[metal] || 'text-gold'} border-current mb-2`}>
                          {metal.toUpperCase()}
                        </Badge>
                        <h3 className="font-display text-xl text-navy">{weight} oz Bar</h3>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={statusColors[cert.status] || ''}>
                          {cert.status}
                        </Badge>
                        <Shield className="text-green-400" size={18} />
                      </div>
                    </div>

                    <div className="space-y-2 text-sm text-navy/50 mb-4">
                      <div className="flex justify-between">
                        <span>Partner:</span>
                        <span className="text-navy font-medium">{cert.partners.legal_name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Serial:</span>
                        <span className="font-mono text-navy">{getSerialNumber(cert)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Fineness:</span>
                        <span className="text-navy">{(getFineness(cert) * 100).toFixed(2)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Jurisdiction:</span>
                        <span className="text-navy">{getJurisdiction(cert)}</span>
                      </div>
                    </div>

                    {spotPrice && weight > 0 && (
                      <div className="border-t border-gold/20 pt-4 mb-4">
                        <div className="flex justify-between items-end">
                          <span className="text-navy/50 text-sm">Est. Value:</span>
                          <span className="text-gold-dark font-display text-xl">
                            {formatPrice(weight * spotPrice)}
                          </span>
                        </div>
                      </div>
                    )}

                    <Link
                      to={`/marketplace/certificate/${cert.cert_id}`}
                      className="btn-primary-gold w-full py-3 text-sm flex items-center justify-center gap-2 group-hover:bg-gold-light rounded"
                    >
                      View Certificate
                      <ArrowUpRight size={16} />
                    </Link>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="text-marble/60 text-lg mb-4 font-display">No certificates available at this time.</div>
            <p className="text-marble/40 text-sm">Check back soon for new listings.</p>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Marketplace;
