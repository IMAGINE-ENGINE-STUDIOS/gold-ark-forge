import { Link } from 'react-router-dom';
import vaultDoor from '@/assets/vault-door.jpg';

const VaultPreview = () => {
  return (
    <section className="py-20 bg-gradient-marble marble-texture">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-navy/5 border border-navy/10 mb-6">
            <span className="font-display text-sm tracking-[0.15em] text-navy/70 uppercase">
              The Hellenic Vault
            </span>
          </div>
          <h2 className="font-display text-3xl md:text-4xl text-navy mb-4">
            Ultimate Protection for Your Bullion
          </h2>
        </div>

        {/* Two Column Layout */}
        <div className="grid lg:grid-cols-2 gap-8 max-w-6xl mx-auto mt-12">
          {/* Marketplace Card */}
          <Link
            to="/marketplace"
            className="group relative overflow-hidden bg-cover bg-center min-h-[400px] flex items-end"
            style={{
              backgroundImage: `linear-gradient(to top, hsl(213, 32%, 16%) 0%, hsl(213, 32%, 16%, 0.7) 40%, transparent 100%), url(${vaultDoor})`,
            }}
          >
            {/* Border */}
            <div className="absolute inset-0 border-4 border-gold/30 group-hover:border-gold/60 transition-colors" />
            
            {/* Content */}
            <div className="relative z-10 p-8 w-full">
              <h3 className="font-display text-2xl md:text-3xl text-marble mb-2 tracking-wide">
                Enter the Marketplace
              </h3>
              <p className="text-marble/70 mb-4">
                Buy & Sell Precious Metals
              </p>
              <span className="inline-flex items-center gap-2 text-gold font-display text-sm tracking-wider uppercase group-hover:gap-3 transition-all">
                Explore Now
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </span>
            </div>
          </Link>

          {/* Vault Card */}
          <Link
            to="/vault"
            className="group relative overflow-hidden min-h-[400px] flex items-end navy-overlay"
          >
            {/* Vault Door Graphic */}
            <div className="absolute inset-0 flex items-center justify-center opacity-20">
              <svg viewBox="0 0 200 200" className="w-64 h-64 text-gold">
                <circle cx="100" cy="100" r="95" fill="none" stroke="currentColor" strokeWidth="2" />
                <circle cx="100" cy="100" r="85" fill="none" stroke="currentColor" strokeWidth="1" />
                <circle cx="100" cy="100" r="70" fill="none" stroke="currentColor" strokeWidth="3" />
                <circle cx="100" cy="100" r="20" fill="none" stroke="currentColor" strokeWidth="2" />
                {/* Lock mechanism lines */}
                <line x1="100" y1="30" x2="100" y2="50" stroke="currentColor" strokeWidth="4" />
                <line x1="100" y1="150" x2="100" y2="170" stroke="currentColor" strokeWidth="4" />
                <line x1="30" y1="100" x2="50" y2="100" stroke="currentColor" strokeWidth="4" />
                <line x1="150" y1="100" x2="170" y2="100" stroke="currentColor" strokeWidth="4" />
              </svg>
            </div>

            {/* Border */}
            <div className="absolute inset-0 border-4 border-gold/30 group-hover:border-gold/60 transition-colors" />
            
            {/* Content */}
            <div className="relative z-10 p-8 w-full">
              <h3 className="font-display text-2xl md:text-3xl text-marble mb-2 tracking-wide">
                Access The Vault
              </h3>
              <p className="text-marble/70 mb-4">
                Safeguard Your Investments
              </p>
              <span className="inline-flex items-center gap-2 text-gold font-display text-sm tracking-wider uppercase group-hover:gap-3 transition-all">
                View Holdings
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </span>
            </div>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default VaultPreview;
