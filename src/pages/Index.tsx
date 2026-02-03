import Header from '@/components/Header';
import Hero from '@/components/Hero';
import MetalCards from '@/components/MetalCards';
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
        <MetalCards />
        <Features />
        <VaultPreview />
        <ClientTypes />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
