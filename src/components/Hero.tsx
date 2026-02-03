import { Link } from 'react-router-dom';
import heroTemple from '@/assets/hero-temple-new.jpg';

const Hero = () => {
  return (
    <section className="relative min-h-[70vh] flex items-center justify-center overflow-hidden bg-marble">
      {/* Left Column Decoration */}
      <div className="absolute left-0 top-0 bottom-0 w-16 md:w-24 lg:w-32 bg-gradient-to-r from-marble-warm to-transparent z-10 hidden md:flex items-center justify-center">
        <div className="w-full h-full bg-[url('data:image/svg+xml,%3Csvg%20viewBox%3D%220%200%2040%20400%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Crect%20x%3D%2210%22%20y%3D%220%22%20width%3D%2220%22%20height%3D%22400%22%20fill%3D%22%23e8e4dc%22%2F%3E%3Crect%20x%3D%228%22%20y%3D%220%22%20width%3D%224%22%20height%3D%22400%22%20fill%3D%22%23d4d0c8%22%2F%3E%3Crect%20x%3D%2228%22%20y%3D%220%22%20width%3D%224%22%20height%3D%22400%22%20fill%3D%22%23d4d0c8%22%2F%3E%3C%2Fsvg%3E')] bg-repeat-y opacity-70" />
      </div>

      {/* Right Column Decoration */}
      <div className="absolute right-0 top-0 bottom-0 w-16 md:w-24 lg:w-32 bg-gradient-to-l from-marble-warm to-transparent z-10 hidden md:flex items-center justify-center">
        <div className="w-full h-full bg-[url('data:image/svg+xml,%3Csvg%20viewBox%3D%220%200%2040%20400%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Crect%20x%3D%2210%22%20y%3D%220%22%20width%3D%2220%22%20height%3D%22400%22%20fill%3D%22%23e8e4dc%22%2F%3E%3Crect%20x%3D%228%22%20y%3D%220%22%20width%3D%224%22%20height%3D%22400%22%20fill%3D%22%23d4d0c8%22%2F%3E%3Crect%20x%3D%2228%22%20y%3D%220%22%20width%3D%224%22%20height%3D%22400%22%20fill%3D%22%23d4d0c8%22%2F%3E%3C%2Fsvg%3E')] bg-repeat-y opacity-70" />
      </div>

      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${heroTemple})` }}
      >
        {/* Overlay for readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-marble/30 via-marble/50 to-marble/90" />
      </div>

      {/* Content */}
      <div className="relative z-20 container mx-auto px-4 text-center py-16">
        <div className="max-w-4xl mx-auto">
          {/* Temple Icon */}
          <div className="flex items-center justify-center mb-6">
            <svg viewBox="0 0 80 60" className="w-20 h-16 text-gold" fill="currentColor">
              <polygon points="40,2 78,22 2,22" />
              <rect x="5" y="22" width="70" height="5" />
              <rect x="10" y="27" width="6" height="28" />
              <rect x="22" y="27" width="6" height="28" />
              <rect x="37" y="27" width="6" height="28" />
              <rect x="52" y="27" width="6" height="28" />
              <rect x="64" y="27" width="6" height="28" />
              <rect x="5" y="55" width="70" height="5" />
            </svg>
          </div>

          {/* Main Headline */}
          <h1 className="font-display text-3xl md:text-5xl lg:text-6xl tracking-wide text-navy mb-4">
            Your Gateway to{' '}
            <span className="text-gradient-gold">Precious Metals</span>
          </h1>

          {/* Tagline with decorative elements */}
          <div className="flex items-center justify-center gap-4 mb-8">
            <div className="w-8 md:w-16 h-0.5 bg-gradient-to-r from-transparent to-gold" />
            <p className="font-display text-sm md:text-base tracking-[0.2em] text-navy/70 uppercase">
              ★ Secure • Verified • Certified ★
            </p>
            <div className="w-8 md:w-16 h-0.5 bg-gradient-to-l from-transparent to-gold" />
          </div>

          {/* CTA Button */}
          <Link
            to="/marketplace"
            className="inline-block px-8 py-4 bg-navy text-gold font-display text-base tracking-[0.15em] uppercase border-2 border-gold hover:bg-gold hover:text-navy transition-all shadow-lg"
          >
            Enter Marketplace
          </Link>
        </div>
      </div>
    </section>
  );
};

export default Hero;
