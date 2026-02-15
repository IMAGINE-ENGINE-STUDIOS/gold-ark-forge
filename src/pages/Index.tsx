import Header from '@/components/Header';
import Hero from '@/components/Hero';
import CategoryCards from '@/components/CategoryCards';
import SymbolOverview from '@/components/tradingview/SymbolOverview';
import Features from '@/components/Features';
import VaultPreview from '@/components/VaultPreview';
import ClientTypes from '@/components/ClientTypes';
import Footer from '@/components/Footer';

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <Hero />
        <CategoryCards />
        {/* Market Overview — TradingView Symbol Overview */}
        <section className="bg-navy py-16">
          <div className="container mx-auto px-4">
            <div className="text-center mb-8">
              <div className="h-1 w-24 mx-auto bg-gradient-to-r from-transparent via-gold to-transparent mb-6" />
              <h2 className="font-display text-3xl md:text-4xl text-gold-light mb-3">
                MARKET OVERVIEW
              </h2>
              <p className="text-marble/60 max-w-xl mx-auto text-sm">
                Live precious metals and Bitcoin trends — visualization only, powered by TradingView.
              </p>
            </div>
            <SymbolOverview />
          </div>
        </section>
        <Features />
        <VaultPreview />
        <ClientTypes />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
