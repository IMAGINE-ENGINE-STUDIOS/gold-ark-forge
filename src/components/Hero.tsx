import { Link } from 'react-router-dom';
import heroVideo from '@/assets/hero-background.mp4';
import goldArrowLogo from '@/assets/gold-arrow-logo.png';

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <video
        src={heroVideo}
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover object-center"
      />

      {/* Readability overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-navy/60 via-navy/30 to-navy/80" />

      {/* Headline block */}
      <div className="relative z-10 container mx-auto px-4 pt-28 md:pt-32 pb-40 flex flex-col items-center text-center">
        <img src={goldArrowLogo} alt="Gold Arrow" className="w-[110px] md:w-[150px] h-auto drop-shadow-2xl mb-6" />
        <p className="font-display text-[10px] md:text-xs tracking-[0.4em] text-gold/80 uppercase mb-5">
          ◆ Sovereign-Grade Infrastructure for Global Trade ◆
        </p>
        <h1 className="font-display text-4xl md:text-6xl lg:text-7xl text-gold-light leading-[1.05] max-w-5xl">
          <span className="text-gold">$88 Trillion</span> in real assets trade through broken rails.
          <br className="hidden md:block" />
          <span className="text-marble"> Gold Arrow rebuilds them.</span>
        </h1>
        <p className="mt-6 text-marble/80 max-w-2xl text-sm md:text-base">
          Settlement in under 4 hours. 10 bps cost. Real-time auditable.
          Built for sovereigns, institutions, and exporters.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center gap-4">
          <Link
            to="/trade-simulation"
            className="px-10 py-4 bg-gradient-to-r from-gold-dark via-gold to-gold-dark text-navy font-display text-sm md:text-base tracking-[0.2em] uppercase border-2 border-gold-shine hover:scale-105 transition-all shadow-2xl"
            style={{ boxShadow: '0 8px 32px rgba(184,134,11,0.5), inset 0 1px 0 rgba(255,215,0,0.4)' }}
          >
            ★ Run Trade Simulation ★
          </Link>
          <Link
            to="/about#briefing"
            className="px-8 py-4 border border-gold/50 text-gold-light font-display text-xs md:text-sm tracking-[0.2em] uppercase hover:bg-gold/10 transition-colors"
          >
            Request Briefing
          </Link>
        </div>

        {/* Audience tracks */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-3 w-full max-w-4xl">
          {[
            { label: 'For Sovereigns', sub: 'Producing-nation savings', href: '/for-sovereigns' },
            { label: 'For Institutions', sub: 'Custody, settlement, access', href: '/for-institutions' },
            { label: 'For Exporters', sub: 'Same-day cash, lower financing', href: '/for-exporters' },
          ].map((t) => (
            <Link
              key={t.label}
              to={t.href}
              className="border border-gold/30 bg-navy/60 backdrop-blur-sm p-4 hover:border-gold transition-colors text-left group"
            >
              <div className="font-display text-sm tracking-[0.15em] text-gold uppercase">{t.label} →</div>
              <div className="text-[11px] text-marble/70 mt-1">{t.sub}</div>
            </Link>
          ))}
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
