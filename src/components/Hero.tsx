import { Link } from 'react-router-dom';
import heroTemple from '@/assets/hero-temple.jpg';

const Hero = () => {
  return (
    <section className="relative min-h-[80vh] flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${heroTemple})` }}
      >
        {/* Overlay Gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-navy/60 via-navy/40 to-navy/80" />
      </div>

      {/* Decorative Columns Left */}
      <div className="absolute left-0 top-0 bottom-0 w-20 md:w-32 bg-gradient-to-r from-marble/10 to-transparent column-shadow hidden lg:block" />
      
      {/* Decorative Columns Right */}
      <div className="absolute right-0 top-0 bottom-0 w-20 md:w-32 bg-gradient-to-l from-marble/10 to-transparent column-shadow hidden lg:block" />

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 text-center">
        <div className="max-w-4xl mx-auto">
          {/* Ornamental Top */}
          <div className="flex items-center justify-center gap-4 mb-8 fade-in-up">
            <div className="w-16 md:w-24 h-px bg-gradient-to-r from-transparent to-gold" />
            <svg viewBox="0 0 40 30" className="w-10 h-8 text-gold" fill="currentColor">
              <polygon points="20,2 38,12 2,12" />
              <rect x="3" y="12" width="34" height="2" />
              <rect x="6" y="14" width="3" height="14" />
              <rect x="14" y="14" width="3" height="14" />
              <rect x="23" y="14" width="3" height="14" />
              <rect x="31" y="14" width="3" height="14" />
              <rect x="2" y="28" width="36" height="2" />
            </svg>
            <div className="w-16 md:w-24 h-px bg-gradient-to-l from-transparent to-gold" />
          </div>

          {/* Main Headline */}
          <h1 className="font-display text-4xl md:text-5xl lg:text-7xl tracking-wide text-marble mb-6 fade-in-up fade-in-up-delay-1">
            <span className="block mb-2">Your Gateway to</span>
            <span className="text-gradient-gold">Precious Metals</span>
          </h1>

          {/* Tagline */}
          <div className="flex items-center justify-center gap-3 mb-8 fade-in-up fade-in-up-delay-2">
            <div className="w-3 h-3 rotate-45 border border-gold bg-gold/20" />
            <p className="font-display text-lg md:text-xl tracking-[0.15em] text-gold-light uppercase">
              Secure • Verified • Certified
            </p>
            <div className="w-3 h-3 rotate-45 border border-gold bg-gold/20" />
          </div>

          {/* Description */}
          <p className="text-lg md:text-xl text-marble/80 max-w-2xl mx-auto mb-10 font-body leading-relaxed fade-in-up fade-in-up-delay-3">
            The new institutional standard for digital bullion verification. 
            Trade Gold, Silver, and Platinum with blockchain-anchored proof of reserves.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center fade-in-up fade-in-up-delay-4">
            <Link
              to="/marketplace"
              className="btn-primary-gold px-8 py-4 text-base md:text-lg inline-flex items-center justify-center gap-2 group"
            >
              <span>Enter Marketplace</span>
              <svg 
                className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
            <Link
              to="/vault"
              className="btn-secondary-navy px-8 py-4 text-base md:text-lg inline-flex items-center justify-center gap-2"
            >
              <span>Access The Vault</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Bottom Gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-marble to-transparent" />
    </section>
  );
};

export default Hero;
