import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent } from '@/components/ui/card';
import { Shield, Bitcoin, Link as LinkIcon, Building2, Users, Lock } from 'lucide-react';

const About = () => {
  return (
    <div className="min-h-screen bg-navy">
      <Header />
      <main className="container mx-auto px-4 py-12">
        {/* Page Header */}
        <div className="text-center mb-16">
          <h1 className="font-display text-4xl md:text-5xl text-gold-light mb-4">
            ABOUT GOLD ARROW
          </h1>
          <p className="text-marble/70 max-w-2xl mx-auto text-lg">
            The New Standard in Asset Certification
          </p>
        </div>

        {/* Mission */}
        <div className="max-w-4xl mx-auto mb-16">
          <div className="greek-key-border h-1 mb-8" />
          <h2 className="font-display text-2xl text-gold mb-6 text-center">
            Our Mission
          </h2>
          <p className="text-marble/80 text-lg leading-relaxed text-center">
            Gold Arrow bridges the ancient stability of precious metals with 
            cutting-edge blockchain verification. We provide institutional-grade 
            bullion ownership through a non-custodial platform backed by 
            cryptographic proof and government attestations.
          </p>
          <div className="greek-key-border h-1 mt-8" />
        </div>

        {/* Core Principles */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <Card className="bg-navy-light/30 border-gold/20">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gold/10 flex items-center justify-center">
                <Lock className="text-gold" size={28} />
              </div>
              <h3 className="font-display text-xl text-gold-light mb-4">
                Non-Custodial
              </h3>
              <p className="text-marble/60">
                You maintain complete control of your assets. We never hold 
                private keys or custody funds. Your MetaMask wallet is your 
                Vault—directly connected to verified bullion.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-navy-light/30 border-gold/20">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gold/10 flex items-center justify-center">
                <Shield className="text-gold" size={28} />
              </div>
              <h3 className="font-display text-xl text-gold-light mb-4">
                Fully Verified
              </h3>
              <p className="text-marble/60">
                Every bar is attested by government authorities, verified by 
                Chainlink Proof-of-Reserve oracles, and anchored immutably 
                to the Bitcoin blockchain.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-navy-light/30 border-gold/20">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gold/10 flex items-center justify-center">
                <Building2 className="text-gold" size={28} />
              </div>
              <h3 className="font-display text-xl text-gold-light mb-4">
                Institutional Grade
              </h3>
              <p className="text-marble/60">
                Built for family offices, wealth managers, and high-net-worth 
                individuals who demand the highest standards of security 
                and verification.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Technology Stack */}
        <div className="max-w-4xl mx-auto mb-16">
          <h2 className="font-display text-2xl text-gold mb-8 text-center">
            Technology Stack
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-start gap-4 p-6 bg-navy-light/20 rounded-lg border border-gold/10">
              <LinkIcon className="text-gold flex-shrink-0 mt-1" size={24} />
              <div>
                <h4 className="font-display text-lg text-marble mb-2">
                  Chainlink Proof-of-Reserve
                </h4>
                <p className="text-marble/60 text-sm">
                  Decentralized oracles continuously verify that tokenized 
                  bullion matches physical reserves in certified vaults.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-6 bg-navy-light/20 rounded-lg border border-gold/10">
              <Bitcoin className="text-gold flex-shrink-0 mt-1" size={24} />
              <div>
                <h4 className="font-display text-lg text-marble mb-2">
                  Bitcoin Anchoring
                </h4>
                <p className="text-marble/60 text-sm">
                  Reserve Merkle roots are permanently inscribed on the 
                  Bitcoin blockchain, providing immutable proof of reserves.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-6 bg-navy-light/20 rounded-lg border border-gold/10">
              <svg
                viewBox="0 0 24 24"
                className="w-6 h-6 text-gold flex-shrink-0 mt-1"
                fill="currentColor"
              >
                <path d="M11.944 17.97L4.58 13.62 11.943 24l7.37-10.38-7.372 4.35h.003zM12.056 0L4.69 12.223l7.365 4.354 7.365-4.35L12.056 0z" />
              </svg>
              <div>
                <h4 className="font-display text-lg text-marble mb-2">
                  Ethereum Integration
                </h4>
                <p className="text-marble/60 text-sm">
                  MetaMask wallet connection for seamless, secure access 
                  to your bullion holdings without custody risk.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-6 bg-navy-light/20 rounded-lg border border-gold/10">
              <Shield className="text-gold flex-shrink-0 mt-1" size={24} />
              <div>
                <h4 className="font-display text-lg text-marble mb-2">
                  Government Attestations
                </h4>
                <p className="text-marble/60 text-sm">
                  Physical bullion verified by Swiss, Singaporean, and 
                  other jurisdictional authorities with cryptographic signatures.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Client Types */}
        <div className="max-w-4xl mx-auto">
          <h2 className="font-display text-2xl text-gold mb-8 text-center">
            Who We Serve
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-6">
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-gold/10 flex items-center justify-center">
                <Users className="text-gold" size={20} />
              </div>
              <h4 className="font-display text-marble mb-2">Family Offices</h4>
              <p className="text-marble/50 text-sm">
                Multi-generational wealth preservation
              </p>
            </div>
            <div className="text-center p-6">
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-gold/10 flex items-center justify-center">
                <Building2 className="text-gold" size={20} />
              </div>
              <h4 className="font-display text-marble mb-2">Institutions</h4>
              <p className="text-marble/50 text-sm">
                Pension funds and sovereign wealth
              </p>
            </div>
            <div className="text-center p-6">
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-gold/10 flex items-center justify-center">
                <Shield className="text-gold" size={20} />
              </div>
              <h4 className="font-display text-marble mb-2">HNWI</h4>
              <p className="text-marble/50 text-sm">
                High-net-worth portfolio diversification
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default About;
