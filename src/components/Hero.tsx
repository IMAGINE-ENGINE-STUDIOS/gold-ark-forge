import { Link } from 'react-router-dom';
import heroVideo from '@/assets/hero-background.mp4';
import goldArrowLogo from '@/assets/gold-arrow-logo.png';

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Full Hero Background Video */}
      <video
        src={heroVideo}
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover object-center"
      />

      {/* Subtle overlay for text readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-navy/20" />

      {/* Logo overlay */}
      <div className="absolute top-1/4 left-0 right-0 z-10 flex justify-center">
        <img src={goldArrowLogo} alt="Gold Arrow" className="w-[220px] md:w-[320px] h-auto drop-shadow-2xl" />
      </div>

      {/* Content - CTA Button at bottom */}
      <div className="absolute bottom-24 left-0 right-0 z-10 flex justify-center">
        <Link
          to="/marketplace"
          className="inline-block px-14 py-6 bg-gradient-to-r from-gold-dark via-gold to-gold-dark text-navy font-display text-xl tracking-[0.2em] uppercase border-2 border-gold-shine hover:scale-105 transition-all shadow-2xl hover:shadow-gold/50"
          style={{
            boxShadow: '0 8px 32px rgba(184, 134, 11, 0.5), inset 0 1px 0 rgba(255, 215, 0, 0.4)'
          }}
        >
          ★ Start Trading Tokenized Assets ★
        </Link>
      </div>

      {/* Greek Key Border Bottom */}
      <div className="absolute bottom-0 left-0 right-0 z-20">
        <div className="h-8 greek-key-border-rich" />
      </div>
    </section>
  );
};

export default Hero;
