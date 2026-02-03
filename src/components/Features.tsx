import { Shield, Building2, Award, Lock, FileCheck, Users } from 'lucide-react';

const features = [
  {
    icon: Building2,
    title: 'Live Marketplace',
    description: 'Trade Gold, Silver, & Platinum with real-time pricing and institutional-grade execution.',
  },
  {
    icon: Lock,
    title: 'Secure Vault',
    description: 'State-of-the-art depository with full insurance and government-verified custody.',
  },
  {
    icon: Award,
    title: 'Certified Assets',
    description: 'Every bar verified, authenticated, and anchored on the Bitcoin blockchain.',
  },
  {
    icon: Shield,
    title: 'Non-Custodial',
    description: 'Your assets remain yours. Self-custody with MetaMask integration.',
  },
  {
    icon: FileCheck,
    title: 'Proof of Reserve',
    description: 'Automated Chainlink validation ensures 100% backing at all times.',
  },
  {
    icon: Users,
    title: 'Institutional Grade',
    description: 'Built for Family Offices, Sovereign Funds, and High Net Worth Individuals.',
  },
];

const Features = () => {
  return (
    <section className="py-20 navy-overlay relative">
      {/* Greek Key Border Top */}
      <div className="absolute top-0 left-0 right-0 h-2 greek-key-border" />

      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="font-display text-3xl md:text-4xl text-marble mb-4">
            The <span className="text-gradient-gold">Gold Standard</span> in Digital Bullion
          </h2>
          <p className="text-marble/70 max-w-2xl mx-auto">
            A new paradigm for precious metals verification, combining ancient trust with modern technology.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="group relative p-8 bg-navy-light/50 border border-gold/20 hover:border-gold/40 transition-all duration-300"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Corner Accents */}
              <div className="absolute top-0 left-0 w-6 h-6 border-l-2 border-t-2 border-gold/40 group-hover:border-gold transition-colors" />
              <div className="absolute bottom-0 right-0 w-6 h-6 border-r-2 border-b-2 border-gold/40 group-hover:border-gold transition-colors" />

              {/* Icon */}
              <div className="mb-6 inline-flex items-center justify-center w-14 h-14 bg-gold/10 border border-gold/30 group-hover:bg-gold/20 transition-colors">
                <feature.icon className="w-7 h-7 text-gold" />
              </div>

              {/* Content */}
              <h3 className="font-display text-xl text-marble mb-3 tracking-wide">
                {feature.title}
              </h3>
              <p className="text-marble/60 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Greek Key Border Bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-2 greek-key-border" />
    </section>
  );
};

export default Features;
