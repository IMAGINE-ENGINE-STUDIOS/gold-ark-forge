import Header from '@/components/Header';
import Footer from '@/components/Footer';

import OGMultiTicker from '@/components/og-widgets/OGMultiTicker';
import OGPriceCards from '@/components/og-widgets/OGPriceCards';
import OGInventoryGauge from '@/components/og-widgets/OGInventoryGauge';
import OGRigCount from '@/components/og-widgets/OGRigCount';
import OGCrackSpreads from '@/components/og-widgets/OGCrackSpreads';
import OGFuturesCurve from '@/components/og-widgets/OGFuturesCurve';
import OGOPECTracker from '@/components/og-widgets/OGOPECTracker';
import OGNewsFeed from '@/components/og-widgets/OGNewsFeed';
import OGSupplyDemand from '@/components/og-widgets/OGSupplyDemand';
import OGPipelineFlow from '@/components/og-widgets/OGPipelineFlow';
import OGProductionMap from '@/components/og-widgets/OGProductionMap';

import {
  Fuel, BarChart3, Database, Drill, ArrowLeftRight, TrendingUp,
  Globe, Newspaper, Network, MapPin,
} from 'lucide-react';

const sections = [
  { id: 'prices', label: 'PRICES', icon: Fuel },
  { id: 'futures', label: 'FUTURES', icon: TrendingUp },
  { id: 'spreads', label: 'SPREADS', icon: ArrowLeftRight },
  { id: 'inventory', label: 'INVENTORY', icon: Database },
  { id: 'rigs', label: 'RIG COUNT', icon: Drill },
  { id: 'supply-demand', label: 'S/D BALANCE', icon: BarChart3 },
  { id: 'opec', label: 'OPEC+', icon: Globe },
  { id: 'production', label: 'PRODUCERS', icon: MapPin },
  { id: 'pipelines', label: 'PIPELINES', icon: Network },
  { id: 'news', label: 'NEWS', icon: Newspaper },
];

const SectionDivider = ({ label }: { label: string }) => (
  <div className="divider-ornate mb-8">
    <span className="font-display text-xs tracking-[0.3em] text-gold/50">{label}</span>
  </div>
);

const TierBanner = ({ label, sub }: { label: string; sub: string }) => (
  <div className="relative py-6 mb-8">
    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gold/5 to-transparent" />
    <div className="relative text-center">
      <h2 className="font-display text-2xl tracking-[0.2em] text-gold-light">{label}</h2>
      <p className="text-[10px] font-display tracking-[0.3em] text-marble/30 mt-1">{sub}</p>
    </div>
  </div>
);

const OilGasIntelligence = () => {
  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="min-h-screen bg-navy">
      <Header />

      {/* Live Energy Ticker */}
      <OGMultiTicker />

      {/* Hero Banner */}
      <div className="relative py-16 md:py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-navy-dark via-navy to-navy-light opacity-80" />
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(ellipse at 30% 50%, hsla(25, 80%, 50%, 0.06) 0%, transparent 60%), radial-gradient(ellipse at 70% 30%, hsla(210, 60%, 50%, 0.04) 0%, transparent 50%)'
        }} />

        <div className="relative container mx-auto px-6 text-center">
          <div className="divider-ornate mb-6">
            <span className="font-display text-[10px] tracking-[0.4em] text-gold/60">ENERGY ANALYTICS</span>
          </div>
          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl text-marble tracking-[0.05em] mb-4">
            OIL &amp; GAS <span className="text-gradient-gold">INTELLIGENCE</span>
          </h1>
          <p className="text-marble/50 text-lg max-w-2xl mx-auto font-body leading-relaxed">
            Real-time institutional energy analytics powered by EIA, Baker Hughes, IEA, and OPEC data streams — WTI, Brent, Natural Gas, inventories, rig counts, and refinery margins.
          </p>

          {/* Section Nav */}
          <div className="mt-10 -mx-6 px-6 overflow-x-auto scrollbar-thin">
            <div className="flex flex-nowrap md:flex-wrap md:justify-center gap-2 min-w-max md:min-w-0">
              {sections.map((s) => {
                const Icon = s.icon;
                return (
                  <button
                    key={s.id}
                    onClick={() => scrollTo(s.id)}
                    className="flex items-center gap-2 px-4 py-2 rounded border border-gold/20 text-marble/50 hover:text-gold hover:border-gold/50 transition-all text-[10px] font-display tracking-[0.2em] whitespace-nowrap shrink-0 md:shrink"
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {s.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="greek-key-border-rich h-2" />

      {/* ═══════════════ TIER 1: MARKET DATA ═══════════════ */}
      <div className="container mx-auto px-6 py-12 space-y-12">
        <TierBanner label="ENERGY MARKET DATA" sub="LIVE AUTO-REFRESH · EIA · CME · ICE" />

        <section id="prices">
          <SectionDivider label="SPOT & FUTURES PRICES" />
          <OGPriceCards />
        </section>

        <section id="futures">
          <SectionDivider label="FUTURES CURVE" />
          <OGFuturesCurve />
        </section>

        <section id="spreads">
          <SectionDivider label="SPREADS & MARGINS" />
          <OGCrackSpreads />
        </section>
      </div>

      <div className="greek-key-border-rich h-2" />

      {/* ═══════════════ TIER 2: FUNDAMENTALS ═══════════════ */}
      <div className="container mx-auto px-6 py-12 space-y-12">
        <TierBanner label="SUPPLY FUNDAMENTALS" sub="EIA · BAKER HUGHES · IEA · OPEC" />

        <section id="inventory">
          <SectionDivider label="EIA CRUDE OIL INVENTORY" />
          <OGInventoryGauge />
        </section>

        <section id="rigs">
          <SectionDivider label="BAKER HUGHES RIG COUNT" />
          <OGRigCount />
        </section>

        <section id="supply-demand">
          <SectionDivider label="GLOBAL SUPPLY / DEMAND BALANCE" />
          <OGSupplyDemand />
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <section id="opec">
            <SectionDivider label="OPEC+ COMPLIANCE" />
            <OGOPECTracker />
          </section>
          <section id="production">
            <SectionDivider label="TOP PRODUCERS" />
            <OGProductionMap />
          </section>
        </div>
      </div>

      <div className="greek-key-border-rich h-2" />

      {/* ═══════════════ TIER 3: INFRASTRUCTURE & NEWS ═══════════════ */}
      <div className="container mx-auto px-6 py-12 space-y-12">
        <TierBanner label="INFRASTRUCTURE & INTELLIGENCE" sub="PIPELINE FLOW · NEWS · GEOPOLITICS" />

        <section id="pipelines">
          <SectionDivider label="GLOBAL PIPELINE FLOW" />
          <OGPipelineFlow />
        </section>

        <section id="news">
          <SectionDivider label="ENERGY INTELLIGENCE FEED" />
          <OGNewsFeed />
        </section>
      </div>

      <div className="greek-key-border-rich h-2" />
      <Footer />
    </div>
  );
};

export default OilGasIntelligence;
