import { Link } from 'react-router-dom';
import heroBackground from '@/assets/hero-background.jpg';

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Full Hero Background Image */}
      <img 
        src={heroBackground} 
        alt="Greek temple with gold and silver bullion" 
        className="absolute inset-0 w-full h-full object-cover object-center"
      />

      {/* Subtle overlay for text readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-navy/20" />

      {/* Content - Positioned to match the image's text placement */}
      <div className="relative z-10 container mx-auto px-4 text-center">
        {/* Spacer to push content down to match image layout */}
        <div className="h-[15vh]" />
        
        {/* CTA Button - Positioned below the image's built-in text */}
        <div className="mt-[35vh]">
          <Link
            to="/marketplace"
            className="inline-block px-12 py-5 bg-gradient-to-r from-gold-dark via-gold to-gold-dark text-navy font-display text-lg tracking-[0.2em] uppercase border-2 border-gold-shine hover:scale-105 transition-all shadow-2xl hover:shadow-gold/50"
            style={{
              boxShadow: '0 8px 32px rgba(184, 134, 11, 0.4), inset 0 1px 0 rgba(255, 215, 0, 0.3)'
            }}
          >
            ★ Enter Marketplace ★
          </Link>
        </div>
      </div>

      {/* Greek Key Border Bottom */}
      <div className="absolute bottom-0 left-0 right-0 z-20">
        <div className="h-8 greek-key-border-rich" />
      </div>
    </section>
  );
};

export default Hero;
