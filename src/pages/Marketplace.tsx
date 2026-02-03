import { useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useBullionBars, MetalType } from '@/hooks/useBullionBars';
import { useMetalPrices } from '@/hooks/useMetalPrices';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Shield, ArrowUpRight, Filter } from 'lucide-react';

const metalColors = {
  gold: 'from-gold/20 to-gold/5 border-gold/30',
  silver: 'from-silver/20 to-silver/5 border-silver/30',
  platinum: 'from-platinum/20 to-platinum/5 border-platinum/30',
};

const metalTextColors = {
  gold: 'text-gold',
  silver: 'text-silver',
  platinum: 'text-platinum',
};

const Marketplace = () => {
  const [selectedMetal, setSelectedMetal] = useState<MetalType | undefined>(undefined);
  const { data: bars, isLoading } = useBullionBars({ metalType: selectedMetal, custodyStatus: 'free' });
  const { data: prices } = useMetalPrices();

  const metals: { type: MetalType; label: string }[] = [
    { type: 'gold', label: 'Gold' },
    { type: 'silver', label: 'Silver' },
    { type: 'platinum', label: 'Platinum' },
  ];

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(price);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-12">
        {/* Page Header */}
        <div className="text-center mb-12">
          <h1 className="font-display text-4xl md:text-5xl text-gold-light mb-4">
            BULLION MARKETPLACE
          </h1>
          <p className="text-marble/70 max-w-2xl mx-auto">
            Browse verified bullion bars from certified vaults. Each bar is backed by 
            Chainlink Proof-of-Reserve and anchored to the Bitcoin blockchain.
          </p>
        </div>

        {/* Live Prices Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {metals.map(({ type, label }) => (
            <div
              key={type}
              className={`p-4 rounded-lg bg-gradient-to-br ${metalColors[type]} border`}
            >
              <div className="flex justify-between items-center">
                <span className={`font-display text-lg ${metalTextColors[type]}`}>
                  {label}
                </span>
                <div className="text-right">
                  <div className="text-marble font-semibold">
                    {prices?.[type]?.price_usd
                      ? formatPrice(Number(prices[type].price_usd))
                      : '—'}
                  </div>
                  {prices?.[type]?.change_24h && (
                    <div
                      className={`text-xs ${
                        Number(prices[type].change_24h) >= 0
                          ? 'text-green-400'
                          : 'text-red-400'
                      }`}
                    >
                      {Number(prices[type].change_24h) >= 0 ? '+' : ''}
                      {Number(prices[type].change_24h).toFixed(2)}%
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-8">
          <button
            onClick={() => setSelectedMetal(undefined)}
            className={`px-4 py-2 rounded-lg font-display text-sm transition-all ${
              !selectedMetal
                ? 'bg-gold text-navy'
                : 'bg-navy-light/50 text-marble hover:bg-navy-light'
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
                selectedMetal === type
                  ? 'bg-gold text-navy'
                  : 'bg-navy-light/50 text-marble hover:bg-navy-light'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Bullion Grid */}
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
        ) : bars && bars.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {bars.map((bar) => (
              <Card
                key={bar.id}
                className={`bg-gradient-to-br ${metalColors[bar.metal_type]} border hover:border-gold/50 transition-all group`}
              >
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <Badge
                        variant="outline"
                        className={`${metalTextColors[bar.metal_type]} border-current mb-2`}
                      >
                        {bar.metal_type.toUpperCase()}
                      </Badge>
                      <h3 className="font-display text-xl text-marble">
                        {bar.weight_oz} oz Bar
                      </h3>
                    </div>
                    <Shield className="text-green-400" size={20} />
                  </div>

                  <div className="space-y-2 text-sm text-marble/70 mb-4">
                    <div className="flex justify-between">
                      <span>Serial:</span>
                      <span className="font-mono text-marble">{bar.serial_number}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Purity:</span>
                      <span className="text-marble">{(Number(bar.purity) * 100).toFixed(2)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Vault:</span>
                      <span className="text-marble">{bar.vault_id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Jurisdiction:</span>
                      <span className="text-marble">{bar.jurisdiction}</span>
                    </div>
                  </div>

                  {bar.price_per_oz && prices?.[bar.metal_type] && (
                    <div className="border-t border-gold/20 pt-4 mb-4">
                      <div className="flex justify-between items-end">
                        <span className="text-marble/70 text-sm">Total Value:</span>
                        <span className="text-gold font-display text-xl">
                          {formatPrice(Number(bar.weight_oz) * Number(bar.price_per_oz))}
                        </span>
                      </div>
                    </div>
                  )}

                  <Link
                    to={`/marketplace/${bar.metal_type}/${bar.id}`}
                    className="btn-primary-gold w-full py-3 text-sm flex items-center justify-center gap-2 group-hover:bg-gold-light"
                  >
                    View Details
                    <ArrowUpRight size={16} />
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="text-marble/50 text-lg mb-4">
              No bullion bars available at this time.
            </div>
            <p className="text-marble/30 text-sm">
              Check back soon for new listings.
            </p>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Marketplace;
