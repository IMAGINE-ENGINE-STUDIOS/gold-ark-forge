import Header from '@/components/Header';
import Footer from '@/components/Footer';
import GALiveTicker from '@/components/ga-widgets/GALiveTicker';
import GAPriceCards from '@/components/ga-widgets/GAPriceCards';
import GAReserveGauge from '@/components/ga-widgets/GAReserveGauge';
import GAMetalChart from '@/components/ga-widgets/GAMetalChart';
import GAVaultMatrix from '@/components/ga-widgets/GAVaultMatrix';
import GACertificateFlow from '@/components/ga-widgets/GACertificateFlow';
import GAReserveTimeline from '@/components/ga-widgets/GAReserveTimeline';
import GABullionHeatmap from '@/components/ga-widgets/GABullionHeatmap';
import { Shield, BarChart3, Vault, FileCheck2, History, Grid3X3, TrendingUp } from 'lucide-react';
import { useRef } from 'react';

const sections = [
  { id: 'prices', label: 'PRICES', icon: TrendingUp },
  { id: 'chart', label: 'CHART', icon: BarChart3 },
  { id: 'reserves', label: 'RESERVES', icon: Shield },
  { id: 'vault', label: 'VAULT', icon: Vault },
  { id: 'heatmap', label: 'HEATMAP', icon: Grid3X3 },
  { id: 'certs', label: 'CERTS', icon: FileCheck2 },
  { id: 'timeline', label: 'TIMELINE', icon: History },
];

const Intelligence = () => {
  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="min-h-screen bg-navy">
      <Header />

      {/* Live Ticker Strip */}
      <GALiveTicker />

      {/* Hero Banner */}
      <div className="relative py-16 md:py-24 overflow-hidden">
        {/* Background grain */}
        <div className="absolute inset-0 bg-gradient-to-b from-navy-dark via-navy to-navy-light opacity-80" />
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(ellipse at 30% 50%, hsla(43, 72%, 50%, 0.06) 0%, transparent 60%), radial-gradient(ellipse at 70% 30%, hsla(210, 6%, 67%, 0.04) 0%, transparent 50%)'
        }} />

        <div className="relative container mx-auto px-6 text-center">
          <div className="divider-ornate mb-6">
            <span className="font-display text-[10px] tracking-[0.4em] text-gold/60">PROPRIETARY ANALYTICS</span>
          </div>
          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl text-marble tracking-[0.05em] mb-4">
            MARKET <span className="text-gradient-gold">INTELLIGENCE</span>
          </h1>
          <p className="text-marble/50 text-lg max-w-2xl mx-auto font-body leading-relaxed">
            Real-time institutional analytics powered by Gold Arrow's internal data streams.
            Live metal prices, vault inventory, certificate registry, and proof-of-reserve — all in one view.
          </p>

          {/* Section Nav */}
          <div className="flex flex-wrap justify-center gap-2 mt-10">
            {sections.map((s) => {
              const Icon = s.icon;
              return (
                <button
                  key={s.id}
                  onClick={() => scrollTo(s.id)}
                  className="flex items-center gap-2 px-4 py-2 rounded border border-gold/20 text-marble/50 hover:text-gold hover:border-gold/50 transition-all text-[10px] font-display tracking-[0.2em]"
                >
                  <Icon className="w-3.5 h-3.5" />
                  {s.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Greek key divider */}
      <div className="greek-key-border-rich h-2" />

      {/* Main Content */}
      <div className="container mx-auto px-6 py-12 space-y-12">
        {/* Price Cards */}
        <section id="prices">
          <div className="divider-ornate mb-8">
            <span className="font-display text-xs tracking-[0.3em] text-gold/50">SPOT PRICES</span>
          </div>
          <GAPriceCards />
        </section>

        {/* Interactive Chart */}
        <section id="chart">
          <div className="divider-ornate mb-8">
            <span className="font-display text-xs tracking-[0.3em] text-gold/50">PRICE CHART</span>
          </div>
          <GAMetalChart />
        </section>

        {/* Reserve Gauge + Timeline Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <section id="reserves">
            <div className="divider-ornate mb-8">
              <span className="font-display text-xs tracking-[0.3em] text-gold/50">RESERVE BACKING</span>
            </div>
            <GAReserveGauge />
          </section>

          <section id="timeline">
            <div className="divider-ornate mb-8">
              <span className="font-display text-xs tracking-[0.3em] text-gold/50">RESERVE HISTORY</span>
            </div>
            <GAReserveTimeline />
          </section>
        </div>

        {/* Vault Matrix + Heatmap */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <section id="vault">
            <div className="divider-ornate mb-8">
              <span className="font-display text-xs tracking-[0.3em] text-gold/50">VAULT INVENTORY</span>
            </div>
            <GAVaultMatrix />
          </section>

          <section id="heatmap">
            <div className="divider-ornate mb-8">
              <span className="font-display text-xs tracking-[0.3em] text-gold/50">BULLION HEATMAP</span>
            </div>
            <GABullionHeatmap />
          </section>
        </div>

        {/* Certificate Flow */}
        <section id="certs">
          <div className="divider-ornate mb-8">
            <span className="font-display text-xs tracking-[0.3em] text-gold/50">CERTIFICATE REGISTRY</span>
          </div>
          <GACertificateFlow />
        </section>
      </div>

      {/* Bottom divider */}
      <div className="greek-key-border-rich h-2" />

      <Footer />
    </div>
  );
};

export default Intelligence;
