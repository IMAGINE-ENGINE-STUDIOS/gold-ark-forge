import { Link } from 'react-router-dom';
import heroTemple from '@/assets/hero-temple-rich.jpg';
import columnLeft from '@/assets/column-left.png';
import columnRight from '@/assets/column-right.png';

const Hero = () => {
  return (
    <section className="relative min-h-[75vh] flex items-center justify-center overflow-hidden bg-marble">
      {/* Left Column - Real Image */}
      <div className="absolute left-0 top-0 bottom-0 w-24 md:w-40 lg:w-56 z-20 hidden md:block">
        <img 
          src={columnLeft} 
          alt="Greek Column" 
          className="w-full h-full object-cover object-right"
          style={{ 
            filter: 'drop-shadow(8px 0 20px rgba(26, 35, 48, 0.3))',
          }}
        />
        {/* Inner shadow overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-marble/30" />
      </div>

      {/* Right Column - Real Image */}
      <div className="absolute right-0 top-0 bottom-0 w-24 md:w-40 lg:w-56 z-20 hidden md:block">
        <img 
          src={columnRight} 
          alt="Greek Column" 
          className="w-full h-full object-cover object-left"
          style={{ 
            filter: 'drop-shadow(-8px 0 20px rgba(26, 35, 48, 0.3))',
          }}
        />
        {/* Inner shadow overlay */}
        <div className="absolute inset-0 bg-gradient-to-l from-transparent via-transparent to-marble/30" />
      </div>

      {/* Background Image - Temple */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${heroTemple})` }}
      >
        {/* Lighter overlay to show more temple detail */}
        <div className="absolute inset-0 bg-gradient-to-b from-marble/10 via-marble/30 to-marble/80" />
      </div>

      {/* Content */}
      <div className="relative z-30 container mx-auto px-4 text-center py-16">
        <div className="max-w-4xl mx-auto">
          {/* Temple Icon with Rich Gold Shimmer */}
          <div className="flex items-center justify-center mb-8">
            <div className="relative">
              <svg viewBox="0 0 100 75" className="w-28 h-20 gold-shimmer" fill="currentColor">
                {/* Roof */}
                <polygon points="50,2 98,28 2,28" />
                {/* Frieze with detail */}
                <rect x="5" y="28" width="90" height="6" />
                <rect x="5" y="34" width="90" height="3" opacity="0.7" />
                {/* Columns */}
                <rect x="10" y="37" width="8" height="32" />
                <rect x="26" y="37" width="8" height="32" />
                <rect x="46" y="37" width="8" height="32" />
                <rect x="66" y="37" width="8" height="32" />
                <rect x="82" y="37" width="8" height="32" />
                {/* Base */}
                <rect x="3" y="69" width="94" height="6" />
              </svg>
              {/* Glow effect */}
              <div className="absolute inset-0 blur-xl bg-gold/30 -z-10" />
            </div>
          </div>

          {/* Main Headline */}
          <h1 className="font-display text-4xl md:text-5xl lg:text-7xl tracking-wide text-navy mb-6">
            Your Gateway to{' '}
            <span className="text-gradient-gold">Precious Metals</span>
          </h1>

          {/* Tagline with decorative elements */}
          <div className="flex items-center justify-center gap-4 mb-10">
            <div className="w-12 md:w-24 h-1 bg-gradient-to-r from-transparent via-gold to-gold" />
            <p className="font-display text-sm md:text-lg tracking-[0.2em] text-navy/80 uppercase">
              ★ Secure • Verified • Certified ★
            </p>
            <div className="w-12 md:w-24 h-1 bg-gradient-to-l from-transparent via-gold to-gold" />
          </div>

          {/* CTA Button - Rich Metallic */}
          <Link
            to="/marketplace"
            className="inline-block px-10 py-5 bg-navy text-gold font-display text-lg tracking-[0.15em] uppercase border-4 border-gold hover:bg-gold hover:text-navy transition-all shadow-xl hover:shadow-gold/30"
          >
            Enter Marketplace
          </Link>
        </div>
      </div>

      {/* Greek Key Border Bottom */}
      <div className="absolute bottom-0 left-0 right-0 z-30">
        <div className="h-6 greek-key-border-rich" />
      </div>
    </section>
  );
};

export default Hero;
