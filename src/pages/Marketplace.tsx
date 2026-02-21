import { useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import GAMultiTicker from '@/components/ga-widgets/GAMultiTicker';
import GAMetalChart from '@/components/ga-widgets/GAMetalChart';
import { useCertificates, MetalType, CertificateWithPartner } from '@/hooks/useCertificates';
import { useMetalPrices } from '@/hooks/useMetalPrices';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';
import { Shield, ArrowUpRight, Filter, ChevronDown, Gem, Flame, Wheat, Landmark, Beef, Building2, PaintbrushVertical, Warehouse, TrendingUp, TrendingDown, BarChart3 } from 'lucide-react';

// ─── Asset Category Definitions ──────────────────────────
interface AssetCategory {
  key: string;
  label: string;
  icon: React.ElementType;
  colorClass: string;
  gradientClass: string;
  tagClass: string;
  description: string;
}

const CATEGORIES: AssetCategory[] = [
  { key: 'all', label: 'All Assets', icon: BarChart3, colorClass: 'text-gold', gradientClass: 'from-gold/20 to-gold/5 border-gold/30', tagClass: 'bg-gold/20 text-gold', description: '' },
  { key: 'precious-metals', label: 'Precious Metals', icon: Gem, colorClass: 'text-gold', gradientClass: 'from-gold/20 to-gold/5 border-gold/30', tagClass: 'bg-gold/20 text-gold', description: 'Gold, Silver & Platinum bullion certificates' },
  { key: 'energy', label: 'Energy', icon: Flame, colorClass: 'text-amber-400', gradientClass: 'from-amber-500/20 to-amber-500/5 border-amber-500/30', tagClass: 'bg-amber-500/20 text-amber-400', description: 'Crude oil, natural gas & power commodities' },
  { key: 'agricultural', label: 'Agricultural', icon: Wheat, colorClass: 'text-emerald-400', gradientClass: 'from-emerald-500/20 to-emerald-500/5 border-emerald-500/30', tagClass: 'bg-emerald-500/20 text-emerald-400', description: 'Wheat, coffee, cotton & soft commodities' },
  { key: 'livestock', label: 'Live Stock', icon: Beef, colorClass: 'text-orange-300', gradientClass: 'from-orange-400/20 to-orange-400/5 border-orange-400/30', tagClass: 'bg-orange-400/20 text-orange-300', description: 'Cattle, hogs & feeder livestock futures' },
  { key: 'bonds', label: 'Bonds', icon: Landmark, colorClass: 'text-sky-300', gradientClass: 'from-sky-400/20 to-sky-400/5 border-sky-400/30', tagClass: 'bg-sky-400/20 text-sky-300', description: 'CDs, T-Bills, TIPS, Agency MBS & High-Yield Savings' },
  { key: 'corporate-bonds', label: 'Corporate Bonds', icon: Landmark, colorClass: 'text-indigo-300', gradientClass: 'from-indigo-400/20 to-indigo-400/5 border-indigo-400/30', tagClass: 'bg-indigo-400/20 text-indigo-300', description: 'High-grade AAA/AA corporate debt instruments' },
  { key: 'reits', label: 'REITs', icon: Building2, colorClass: 'text-rose-300', gradientClass: 'from-rose-400/20 to-rose-400/5 border-rose-400/30', tagClass: 'bg-rose-400/20 text-rose-300', description: 'Real estate investment trusts & property income' },
  { key: 'art', label: 'Art', icon: PaintbrushVertical, colorClass: 'text-fuchsia-300', gradientClass: 'from-fuchsia-400/20 to-fuchsia-400/5 border-fuchsia-400/30', tagClass: 'bg-fuchsia-400/20 text-fuchsia-300', description: 'Fine art, collectibles & cultural assets' },
  { key: 'gov-surplus', label: 'Gov. Surplus', icon: Warehouse, colorClass: 'text-purple-300', gradientClass: 'from-purple-400/20 to-purple-400/5 border-purple-400/30', tagClass: 'bg-purple-400/20 text-purple-300', description: 'Government surplus equipment, vehicles & assets' },
];

// ─── Sample Market Listings ──────────────────────────────
interface MarketListing {
  id: string;
  name: string;
  ticker: string;
  category: string;
  price: number;
  change24h: number;
  yield?: number;
  maturity?: string;
  unit?: string;
  description: string;
}

const MARKET_LISTINGS: MarketListing[] = [
  // Energy
  { id: 'wti-crude', name: 'WTI Crude Oil', ticker: 'CL', category: 'energy', price: 78.42, change24h: 1.23, unit: 'bbl', description: 'NYMEX WTI front-month futures' },
  { id: 'brent-crude', name: 'Brent Crude Oil', ticker: 'BZ', category: 'energy', price: 82.15, change24h: 0.95, unit: 'bbl', description: 'ICE Brent front-month futures' },
  { id: 'nat-gas', name: 'Natural Gas', ticker: 'NG', category: 'energy', price: 2.847, change24h: -2.14, unit: 'MMBtu', description: 'Henry Hub natural gas futures' },
  { id: 'rbob-gas', name: 'RBOB Gasoline', ticker: 'RB', category: 'energy', price: 2.4120, change24h: 0.67, unit: 'gal', description: 'NYMEX reformulated gasoline' },
  { id: 'heating-oil', name: 'Heating Oil', ticker: 'HO', category: 'energy', price: 2.5380, change24h: -0.43, unit: 'gal', description: 'NY Harbor ULSD futures' },
  { id: 'uranium', name: 'Uranium (U3O8)', ticker: 'UX', category: 'energy', price: 82.50, change24h: 3.21, unit: 'lb', description: 'Spot uranium yellowcake' },

  // Agricultural
  { id: 'wheat', name: 'Wheat', ticker: 'ZW', category: 'agricultural', price: 5.82, change24h: -0.87, unit: 'bu', description: 'CBOT soft red winter wheat' },
  { id: 'corn', name: 'Corn', ticker: 'ZC', category: 'agricultural', price: 4.45, change24h: 0.42, unit: 'bu', description: 'CBOT #2 yellow corn futures' },
  { id: 'soybeans', name: 'Soybeans', ticker: 'ZS', category: 'agricultural', price: 11.72, change24h: -0.35, unit: 'bu', description: 'CBOT #2 yellow soybeans' },
  { id: 'coffee', name: 'Coffee (Arabica)', ticker: 'KC', category: 'agricultural', price: 185.40, change24h: 2.15, unit: 'lb', description: 'ICE Coffee C arabica beans' },
  { id: 'cotton', name: 'Cotton', ticker: 'CT', category: 'agricultural', price: 76.85, change24h: -1.23, unit: 'lb', description: 'ICE cotton #2 futures' },
  { id: 'sugar', name: 'Sugar (#11)', ticker: 'SB', category: 'agricultural', price: 19.42, change24h: 0.78, unit: 'lb', description: 'ICE raw sugar world contract' },
  { id: 'cocoa', name: 'Cocoa', ticker: 'CC', category: 'agricultural', price: 8245.00, change24h: 4.32, unit: 'MT', description: 'ICE cocoa beans futures' },
  { id: 'orange-juice', name: 'Orange Juice', ticker: 'OJ', category: 'agricultural', price: 432.50, change24h: -0.92, unit: 'lb', description: 'ICE frozen concentrated OJ' },

  // Livestock
  { id: 'live-cattle', name: 'Live Cattle', ticker: 'LE', category: 'livestock', price: 186.42, change24h: 0.34, unit: 'cwt', description: 'CME live cattle futures' },
  { id: 'feeder-cattle', name: 'Feeder Cattle', ticker: 'GF', category: 'livestock', price: 248.75, change24h: -0.56, unit: 'cwt', description: 'CME feeder cattle futures' },
  { id: 'lean-hogs', name: 'Lean Hogs', ticker: 'HE', category: 'livestock', price: 89.32, change24h: 1.87, unit: 'cwt', description: 'CME lean hog futures' },
  { id: 'class-iii-milk', name: 'Class III Milk', ticker: 'DC', category: 'livestock', price: 19.85, change24h: 0.21, unit: 'cwt', description: 'CME Class III milk futures' },

  // Bonds
  { id: 'us-3mo-tbill', name: '3-Month T-Bill', ticker: 'IRX', category: 'bonds', price: 99.87, change24h: 0.01, yield: 5.21, maturity: '3M', description: 'US Treasury 3-month bill' },
  { id: 'us-2yr', name: '2-Year Treasury', ticker: 'ZT', category: 'bonds', price: 101.42, change24h: -0.08, yield: 4.68, maturity: '2Y', description: 'US Treasury 2-year note' },
  { id: 'us-10yr', name: '10-Year Treasury', ticker: 'ZN', category: 'bonds', price: 110.25, change24h: -0.23, yield: 4.42, maturity: '10Y', description: 'US Treasury 10-year note' },
  { id: 'us-30yr', name: '30-Year Treasury', ticker: 'ZB', category: 'bonds', price: 118.75, change24h: -0.45, yield: 4.58, maturity: '30Y', description: 'US Treasury 30-year bond' },
  { id: 'tips-10yr', name: '10-Year TIPS', ticker: 'TIP', category: 'bonds', price: 106.82, change24h: 0.12, yield: 2.15, maturity: '10Y', description: 'Treasury Inflation-Protected Securities' },
  { id: 'mbs-agency', name: 'Agency MBS (30Y)', ticker: 'MBB', category: 'bonds', price: 95.42, change24h: -0.18, yield: 5.85, maturity: '30Y', description: 'Fannie Mae/Freddie Mac MBS' },
  { id: 'cd-12mo', name: '12-Month CD', ticker: 'CD', category: 'bonds', price: 100.00, change24h: 0.00, yield: 5.05, maturity: '12M', description: 'FDIC-insured certificate of deposit' },

  // Corporate Bonds
  { id: 'aapl-bond', name: 'Apple Inc 2.65% 2030', ticker: 'AAPL30', category: 'corporate-bonds', price: 94.85, change24h: 0.08, yield: 3.62, maturity: '2030', description: 'Apple senior unsecured (AAA)' },
  { id: 'msft-bond', name: 'Microsoft 2.40% 2028', ticker: 'MSFT28', category: 'corporate-bonds', price: 96.42, change24h: 0.12, yield: 3.18, maturity: '2028', description: 'Microsoft senior unsecured (AAA)' },
  { id: 'jnj-bond', name: 'Johnson & Johnson 3.10% 2031', ticker: 'JNJ31', category: 'corporate-bonds', price: 93.75, change24h: -0.05, yield: 3.95, maturity: '2031', description: 'J&J senior unsecured (AAA)' },
  { id: 'pg-bond', name: 'Procter & Gamble 2.85% 2029', ticker: 'PG29', category: 'corporate-bonds', price: 95.25, change24h: 0.03, yield: 3.48, maturity: '2029', description: 'P&G senior unsecured (AA-)' },
  { id: 'brk-bond', name: 'Berkshire Hathaway 3.25% 2032', ticker: 'BRK32', category: 'corporate-bonds', price: 92.80, change24h: -0.11, yield: 4.12, maturity: '2032', description: 'Berkshire senior unsecured (AA)' },

  // REITs
  { id: 'prologis', name: 'Prologis Inc', ticker: 'PLD', category: 'reits', price: 128.45, change24h: 1.42, yield: 2.85, description: 'Global industrial logistics REIT' },
  { id: 'amt', name: 'American Tower Corp', ticker: 'AMT', category: 'reits', price: 215.80, change24h: -0.67, yield: 2.98, description: 'Communications infrastructure REIT' },
  { id: 'spg', name: 'Simon Property Group', ticker: 'SPG', category: 'reits', price: 156.30, change24h: 0.85, yield: 5.12, description: 'Premier shopping mall REIT' },
  { id: 'eqr', name: 'Equity Residential', ticker: 'EQR', category: 'reits', price: 72.15, change24h: 0.34, yield: 3.67, description: 'Urban apartment communities REIT' },
  { id: 'dlr', name: 'Digital Realty Trust', ticker: 'DLR', category: 'reits', price: 142.90, change24h: 2.15, yield: 3.22, description: 'Data center & colocation REIT' },
  { id: 'o', name: 'Realty Income Corp', ticker: 'O', category: 'reits', price: 58.42, change24h: -0.23, yield: 5.45, description: 'Monthly dividend commercial REIT' },

  // Art
  { id: 'art-contemp-index', name: 'Contemporary Art Index', ticker: 'ART-C', category: 'art', price: 1842.50, change24h: 0.45, description: 'Artnet Contemporary Art 100 Index' },
  { id: 'art-impress-index', name: 'Impressionist Index', ticker: 'ART-I', category: 'art', price: 2456.80, change24h: -0.12, description: 'Artnet Impressionist & Modern Index' },
  { id: 'art-postwar', name: 'Post-War Art Index', ticker: 'ART-PW', category: 'art', price: 3125.00, change24h: 1.28, description: 'Artnet Post-War & Contemporary' },
  { id: 'masterworks-34', name: 'Banksy "Love is in the Bin"', ticker: 'MW-34', category: 'art', price: 15250.00, change24h: 0.00, description: 'Fractional shares — Masterworks offering' },
  { id: 'masterworks-52', name: 'Basquiat "Untitled" 1982', ticker: 'MW-52', category: 'art', price: 28400.00, change24h: 0.32, description: 'Fractional shares — Masterworks offering' },

  // Gov. Surplus
  { id: 'gsa-vehicles', name: 'GSA Fleet Vehicles', ticker: 'GSA-V', category: 'gov-surplus', price: 12500.00, change24h: 0.00, description: 'General Services Administration fleet auction' },
  { id: 'dod-equipment', name: 'DoD Equipment Lots', ticker: 'DOD-E', category: 'gov-surplus', price: 8750.00, change24h: 0.00, description: 'Defense surplus equipment & materiel' },
  { id: 'usps-trucks', name: 'USPS Delivery Trucks', ticker: 'USPS-T', category: 'gov-surplus', price: 6200.00, change24h: 0.00, description: 'Retired postal service vehicles' },
  { id: 'surplus-it', name: 'IT Equipment Lots', ticker: 'GOV-IT', category: 'gov-surplus', price: 3400.00, change24h: 0.00, description: 'Federal agency surplus computers & servers' },
  { id: 'surplus-furniture', name: 'Office Furniture Lots', ticker: 'GOV-F', category: 'gov-surplus', price: 1850.00, change24h: 0.00, description: 'Government office furniture clearance' },
];

// ─── Metal Colors (for certificate cards) ────────────────
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
  active: 'text-emerald-400 border-emerald-400/50',
  frozen: 'text-sky-400 border-sky-400/50',
  revoked: 'text-red-400 border-red-400/50',
  redeemed: 'text-muted-foreground border-muted',
};

// ─── Certificate Card (Precious Metals) ──────────────────
const CertificateCard = ({ cert, prices }: { cert: CertificateWithPartner; prices: any }) => {
  const metal = (cert.metadata_json as any)?.metal_type || 'gold';
  const weight = Number((cert.metadata_json as any)?.weight_oz) || 0;
  const serial = (cert.metadata_json as any)?.serial_number || '—';
  const fineness = Number((cert.metadata_json as any)?.fineness) || 0;
  const jurisdiction = (cert.metadata_json as any)?.jurisdiction || '—';
  const spotPrice = prices?.[metal]?.price_usd ? Number(prices[metal].price_usd) : null;
  const formatPrice = (p: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(p);

  return (
    <Card className={`bg-gradient-to-br ${metalColors[metal] || metalColors.gold} border hover:border-gold/50 transition-all group`}>
      <CardContent className="p-5">
        <div className="flex justify-between items-start mb-3">
          <div>
            <Badge variant="outline" className={`${metalTextColors[metal] || 'text-gold'} border-current mb-1.5 text-[10px]`}>
              {metal.toUpperCase()}
            </Badge>
            <h3 className="font-display text-lg text-marble">{weight} oz Bar</h3>
          </div>
          <div className="flex items-center gap-1.5">
            <Badge variant="outline" className={`text-[10px] ${statusColors[cert.status] || ''}`}>
              {cert.status}
            </Badge>
            <Shield className="text-emerald-400" size={14} />
          </div>
        </div>
        <div className="space-y-1.5 text-xs text-marble/50 mb-3">
          <div className="flex justify-between"><span>Partner:</span><span className="text-marble/80 font-medium">{cert.partners.legal_name}</span></div>
          <div className="flex justify-between"><span>Serial:</span><span className="font-mono text-marble/70">{serial}</span></div>
          <div className="flex justify-between"><span>Fineness:</span><span className="text-marble/70">{(fineness * 100).toFixed(2)}%</span></div>
          <div className="flex justify-between"><span>Jurisdiction:</span><span className="text-marble/70">{jurisdiction}</span></div>
        </div>
        {spotPrice && weight > 0 && (
          <div className="border-t border-gold/20 pt-3 mb-3">
            <div className="flex justify-between items-end">
              <span className="text-marble/40 text-xs">Est. Value:</span>
              <span className="text-gold font-display text-lg">{formatPrice(weight * spotPrice)}</span>
            </div>
          </div>
        )}
        <Link to={`/marketplace/certificate/${cert.cert_id}`}
          className="block text-center bg-gold/10 hover:bg-gold/20 border border-gold/30 text-gold py-2.5 text-xs font-display tracking-wider rounded transition-all group-hover:border-gold/50">
          View Certificate <ArrowUpRight size={12} className="inline ml-1" />
        </Link>
      </CardContent>
    </Card>
  );
};

// ─── Generic Asset Card ──────────────────────────────────
const AssetCard = ({ listing, category }: { listing: MarketListing; category: AssetCategory }) => {
  const formatPrice = (p: number) => {
    if (p >= 1000) return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(p);
    return `$${p.toFixed(p < 10 ? 4 : 2)}`;
  };

  return (
    <Card className={`bg-gradient-to-br ${category.gradientClass} border hover:border-opacity-70 transition-all group`}>
      <CardContent className="p-5">
        <div className="flex justify-between items-start mb-3">
          <div>
            <Badge variant="outline" className={`${category.tagClass} border-current mb-1.5 text-[10px]`}>
              {listing.ticker}
            </Badge>
            <h3 className="font-display text-sm md:text-base text-marble">{listing.name}</h3>
          </div>
          <div className="text-right">
            <div className="text-marble font-mono text-sm font-semibold">{formatPrice(listing.price)}</div>
            <div className={`text-[11px] font-mono flex items-center justify-end gap-0.5 ${listing.change24h >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {listing.change24h >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
              {listing.change24h >= 0 ? '+' : ''}{listing.change24h.toFixed(2)}%
            </div>
          </div>
        </div>

        <p className="text-marble/40 text-[11px] mb-3 leading-relaxed">{listing.description}</p>

        <div className="space-y-1.5 text-[11px] text-marble/50">
          {listing.unit && (
            <div className="flex justify-between"><span>Unit:</span><span className="text-marble/70">per {listing.unit}</span></div>
          )}
          {listing.yield !== undefined && (
            <div className="flex justify-between"><span>Yield:</span><span className="text-emerald-400 font-mono">{listing.yield.toFixed(2)}%</span></div>
          )}
          {listing.maturity && (
            <div className="flex justify-between"><span>Maturity:</span><span className="text-marble/70 font-mono">{listing.maturity}</span></div>
          )}
        </div>

        <div className="mt-3 pt-3 border-t border-white/5">
          <button className={`w-full text-center border py-2 text-[10px] font-display tracking-wider rounded transition-all ${category.tagClass} border-current/30 hover:opacity-80`}>
            VIEW DETAILS <ArrowUpRight size={10} className="inline ml-1" />
          </button>
        </div>
      </CardContent>
    </Card>
  );
};

// ═══════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════
const Marketplace = () => {
  const [activeCategory, setActiveCategory] = useState('all');
  const [selectedMetal, setSelectedMetal] = useState<MetalType | undefined>(undefined);
  const { data: certs, isLoading } = useCertificates({ metalType: selectedMetal });
  const { data: prices } = useMetalPrices();
  const [chartOpen, setChartOpen] = useState(false);

  const activeCatDef = CATEGORIES.find(c => c.key === activeCategory) || CATEGORIES[0];
  const showCertificates = activeCategory === 'all' || activeCategory === 'precious-metals';
  const filteredListings = activeCategory === 'all'
    ? MARKET_LISTINGS
    : MARKET_LISTINGS.filter(l => l.category === activeCategory);

  const metals: { type: MetalType; label: string }[] = [
    { type: 'gold', label: 'Gold' },
    { type: 'silver', label: 'Silver' },
    { type: 'platinum', label: 'Platinum' },
  ];

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(price);

  // Category counts
  const categoryCounts = CATEGORIES.reduce<Record<string, number>>((acc, cat) => {
    if (cat.key === 'all') {
      acc[cat.key] = MARKET_LISTINGS.length + (certs?.length || 0);
    } else if (cat.key === 'precious-metals') {
      acc[cat.key] = certs?.length || 0;
    } else {
      acc[cat.key] = MARKET_LISTINGS.filter(l => l.category === cat.key).length;
    }
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-navy">
      <Header />
      <GAMultiTicker />
      <main className="container mx-auto px-4 py-12">
        {/* Page Header */}
        <div className="text-center mb-12">
          <div className="h-1 w-24 mx-auto bg-gradient-to-r from-transparent via-gold to-transparent mb-6" />
          <h1 className="font-display text-4xl md:text-5xl text-gold-light mb-4">
            ASSET MARKETPLACE
          </h1>
          <p className="text-marble/70 max-w-2xl mx-auto">
            Institutional-grade access across nine core asset classes. Browse certificates, commodities,
            fixed-income instruments, real estate, fine art, and government surplus.
          </p>
        </div>

        {/* Category Tabs */}
        <div className="flex flex-wrap gap-2 mb-8 justify-center">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            return (
              <button
                key={cat.key}
                onClick={() => { setActiveCategory(cat.key); setSelectedMetal(undefined); }}
                className={`px-3 md:px-4 py-2 rounded-lg font-display text-[10px] md:text-xs tracking-wider transition-all flex items-center gap-1.5 ${
                  activeCategory === cat.key
                    ? 'bg-gold text-navy'
                    : 'bg-navy-light/50 text-marble hover:bg-navy-light border border-gold/20'
                }`}
              >
                <Icon size={12} />
                {cat.label}
                <span className="text-[8px] opacity-60">({categoryCounts[cat.key] || 0})</span>
              </button>
            );
          })}
        </div>

        {/* Active Category Description */}
        {activeCatDef.description && (
          <div className={`text-center mb-8 py-3 px-6 rounded-lg bg-gradient-to-r ${activeCatDef.gradientClass} border inline-flex mx-auto w-full justify-center`}>
            <p className={`text-sm ${activeCatDef.colorClass}`}>{activeCatDef.description}</p>
          </div>
        )}

        {/* Precious Metals Section */}
        {showCertificates && (
          <>
            {/* Live Prices Bar */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {metals.map(({ type, label }) => (
                <div key={type} className={`p-4 rounded-lg bg-gradient-to-br ${metalColors[type]} border`}>
                  <div className="flex justify-between items-center">
                    <span className={`font-display text-lg ${metalTextColors[type]}`}>{label}</span>
                    <div className="text-right">
                      <div className="text-marble font-semibold">
                        {prices?.[type]?.price_usd ? formatPrice(Number(prices[type].price_usd)) : '—'}
                      </div>
                      {prices?.[type]?.change_24h && (
                        <div className={`text-xs ${Number(prices[type].change_24h) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {Number(prices[type].change_24h) >= 0 ? '+' : ''}
                          {Number(prices[type].change_24h).toFixed(2)}%
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Chart */}
            <Collapsible open={chartOpen} onOpenChange={setChartOpen} className="mb-6">
              <CollapsibleTrigger className="flex items-center gap-2 text-gold font-display text-sm tracking-wider hover:text-gold-light transition-colors mb-3">
                <ChevronDown size={16} className={`transition-transform ${chartOpen ? 'rotate-180' : ''}`} />
                Advanced Chart
              </CollapsibleTrigger>
              <CollapsibleContent>
                <GAMetalChart />
                <p className="text-marble/40 text-xs text-center mt-2">
                  Visualization only — powered by Gold Arrow proprietary analytics.
                </p>
              </CollapsibleContent>
            </Collapsible>

            {/* Metal Filters */}
            {activeCategory === 'precious-metals' && (
              <div className="flex flex-wrap gap-3 mb-6">
                <button onClick={() => setSelectedMetal(undefined)}
                  className={`px-4 py-2 rounded-lg font-display text-sm transition-all ${!selectedMetal ? 'bg-gold text-navy' : 'bg-navy-light/50 text-marble hover:bg-navy-light'}`}>
                  <Filter size={14} className="inline mr-2" />All Metals
                </button>
                {metals.map(({ type, label }) => (
                  <button key={type} onClick={() => setSelectedMetal(type)}
                    className={`px-4 py-2 rounded-lg font-display text-sm transition-all ${selectedMetal === type ? 'bg-gold text-navy' : 'bg-navy-light/50 text-marble hover:bg-navy-light'}`}>
                    {label}
                  </button>
                ))}
              </div>
            )}

            {/* Certificate Cards */}
            <div className="mb-12">
              <h3 className="font-display text-lg text-gold-light mb-4 tracking-wider flex items-center gap-2">
                <Gem size={16} /> BULLION CERTIFICATES
              </h3>
              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {[...Array(6)].map((_, i) => (
                    <Card key={i} className="bg-navy-light/30 border-gold/10">
                      <CardContent className="p-5">
                        <Skeleton className="h-6 w-3/4 mb-4" />
                        <Skeleton className="h-4 w-1/2 mb-2" />
                        <Skeleton className="h-4 w-2/3 mb-4" />
                        <Skeleton className="h-10 w-full" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : certs && certs.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {certs.map((cert) => (
                    <CertificateCard key={cert.cert_id} cert={cert} prices={prices} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 border border-gold/10 rounded-lg bg-navy-light/20">
                  <div className="text-marble/50 text-sm mb-2 font-display">No certificates available</div>
                  <p className="text-marble/30 text-xs">Check back soon for new bullion listings.</p>
                </div>
              )}
            </div>
          </>
        )}

        {/* Market Listings Grid */}
        {filteredListings.length > 0 && (
          <div>
            {activeCategory === 'all' && (
              <h3 className="font-display text-lg text-gold-light mb-4 tracking-wider flex items-center gap-2">
                <BarChart3 size={16} /> MARKET INSTRUMENTS
              </h3>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredListings.map((listing) => {
                const cat = CATEGORIES.find(c => c.key === listing.category) || CATEGORIES[0];
                return <AssetCard key={listing.id} listing={listing} category={cat} />;
              })}
            </div>
          </div>
        )}

        {/* Empty state for categories with no listings */}
        {!showCertificates && filteredListings.length === 0 && (
          <div className="text-center py-16">
            <div className="text-marble/50 text-lg mb-4 font-display">No listings in this category yet.</div>
            <p className="text-marble/30 text-sm">New instruments are added regularly.</p>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Marketplace;
