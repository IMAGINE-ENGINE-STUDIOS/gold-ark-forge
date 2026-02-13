import React from 'react';

const MarketplaceIcon = () => (
  <svg viewBox="0 0 96 96" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
    {/* Temple / Marketplace icon */}
    <defs>
      <linearGradient id="gold-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#C5A75F" />
        <stop offset="40%" stopColor="#FFD700" />
        <stop offset="60%" stopColor="#DAA520" />
        <stop offset="100%" stopColor="#B8860B" />
      </linearGradient>
      <linearGradient id="gold-shine" x1="50%" y1="0%" x2="50%" y2="100%">
        <stop offset="0%" stopColor="#FFD700" stopOpacity="0.9" />
        <stop offset="100%" stopColor="#B8860B" stopOpacity="0.6" />
      </linearGradient>
    </defs>
    {/* Pediment / Triangle */}
    <polygon points="48,12 16,38 80,38" fill="url(#gold-grad)" stroke="#DAA520" strokeWidth="1.5" />
    {/* Inner pediment detail */}
    <polygon points="48,20 28,36 68,36" fill="none" stroke="#FFD700" strokeWidth="0.8" opacity="0.5" />
    {/* Architrave */}
    <rect x="14" y="38" width="68" height="5" rx="1" fill="url(#gold-shine)" />
    {/* Columns */}
    <rect x="20" y="43" width="6" height="32" rx="2" fill="url(#gold-grad)" stroke="#DAA520" strokeWidth="0.8" />
    <rect x="36" y="43" width="6" height="32" rx="2" fill="url(#gold-grad)" stroke="#DAA520" strokeWidth="0.8" />
    <rect x="54" y="43" width="6" height="32" rx="2" fill="url(#gold-grad)" stroke="#DAA520" strokeWidth="0.8" />
    <rect x="70" y="43" width="6" height="32" rx="2" fill="url(#gold-grad)" stroke="#DAA520" strokeWidth="0.8" />
    {/* Column capitals */}
    <rect x="18" y="42" width="10" height="3" rx="1" fill="#FFD700" />
    <rect x="34" y="42" width="10" height="3" rx="1" fill="#FFD700" />
    <rect x="52" y="42" width="10" height="3" rx="1" fill="#FFD700" />
    <rect x="68" y="42" width="10" height="3" rx="1" fill="#FFD700" />
    {/* Base / Steps */}
    <rect x="12" y="75" width="72" height="4" rx="1" fill="url(#gold-shine)" />
    <rect x="8" y="79" width="80" height="4" rx="1" fill="url(#gold-grad)" opacity="0.8" />
    {/* Chart line inside temple */}
    <polyline points="30,66 38,58 46,62 54,52 62,56 66,50" fill="none" stroke="#FFD700" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.7" />
    <circle cx="54" cy="52" r="2" fill="#FFD700" opacity="0.8" />
  </svg>
);

const VaultIcon = () => (
  <svg viewBox="0 0 96 96" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
    <defs>
      <linearGradient id="silver-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#E8E8E8" />
        <stop offset="30%" stopColor="#C0C0C0" />
        <stop offset="70%" stopColor="#A8A8A8" />
        <stop offset="100%" stopColor="#808080" />
      </linearGradient>
      <linearGradient id="vault-gold" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#DAA520" />
        <stop offset="50%" stopColor="#FFD700" />
        <stop offset="100%" stopColor="#B8860B" />
      </linearGradient>
      <radialGradient id="lock-glow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#FFD700" stopOpacity="0.3" />
        <stop offset="100%" stopColor="#FFD700" stopOpacity="0" />
      </radialGradient>
    </defs>
    {/* Vault door body */}
    <rect x="16" y="14" width="64" height="68" rx="6" fill="url(#silver-grad)" stroke="#A8A8A8" strokeWidth="2" />
    {/* Inner border */}
    <rect x="22" y="20" width="52" height="56" rx="4" fill="none" stroke="#C0C0C0" strokeWidth="1.5" />
    {/* Vault handle / wheel */}
    <circle cx="48" cy="48" r="16" fill="none" stroke="url(#vault-gold)" strokeWidth="3" />
    <circle cx="48" cy="48" r="20" fill="url(#lock-glow)" />
    <circle cx="48" cy="48" r="6" fill="url(#vault-gold)" />
    {/* Wheel spokes */}
    <line x1="48" y1="32" x2="48" y2="38" stroke="#DAA520" strokeWidth="2" strokeLinecap="round" />
    <line x1="48" y1="58" x2="48" y2="64" stroke="#DAA520" strokeWidth="2" strokeLinecap="round" />
    <line x1="32" y1="48" x2="38" y2="48" stroke="#DAA520" strokeWidth="2" strokeLinecap="round" />
    <line x1="58" y1="48" x2="64" y2="48" stroke="#DAA520" strokeWidth="2" strokeLinecap="round" />
    {/* Diagonal spokes */}
    <line x1="36.7" y1="36.7" x2="40.9" y2="40.9" stroke="#DAA520" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="55.1" y1="55.1" x2="59.3" y2="59.3" stroke="#DAA520" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="59.3" y1="36.7" x2="55.1" y2="40.9" stroke="#DAA520" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="40.9" y1="55.1" x2="36.7" y2="59.3" stroke="#DAA520" strokeWidth="1.5" strokeLinecap="round" />
    {/* Locking bolts */}
    <circle cx="16" cy="30" r="3" fill="#A8A8A8" stroke="#808080" strokeWidth="1" />
    <circle cx="16" cy="48" r="3" fill="#A8A8A8" stroke="#808080" strokeWidth="1" />
    <circle cx="16" cy="66" r="3" fill="#A8A8A8" stroke="#808080" strokeWidth="1" />
    {/* Rivets */}
    <circle cx="26" cy="24" r="1.5" fill="#B0B0B0" />
    <circle cx="70" cy="24" r="1.5" fill="#B0B0B0" />
    <circle cx="26" cy="72" r="1.5" fill="#B0B0B0" />
    <circle cx="70" cy="72" r="1.5" fill="#B0B0B0" />
  </svg>
);

const CertifiedIcon = () => (
  <svg viewBox="0 0 96 96" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
    <defs>
      <linearGradient id="cert-gold" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#C5A75F" />
        <stop offset="40%" stopColor="#FFD700" />
        <stop offset="60%" stopColor="#DAA520" />
        <stop offset="100%" stopColor="#B8860B" />
      </linearGradient>
      <linearGradient id="ribbon-red" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#DAA520" />
        <stop offset="100%" stopColor="#8B6914" />
      </linearGradient>
    </defs>
    {/* Shield / Badge shape */}
    <path d="M48 8 L78 22 L78 52 Q78 72 48 88 Q18 72 18 52 L18 22 Z" fill="none" stroke="url(#cert-gold)" strokeWidth="2.5" />
    <path d="M48 14 L72 26 L72 50 Q72 67 48 82 Q24 67 24 50 L24 26 Z" fill="url(#cert-gold)" opacity="0.12" />
    {/* Inner shield detail */}
    <path d="M48 20 L66 30 L66 48 Q66 62 48 74 Q30 62 30 48 L30 30 Z" fill="none" stroke="#DAA520" strokeWidth="1" opacity="0.5" />
    {/* Checkmark */}
    <polyline points="36,48 44,58 62,36" fill="none" stroke="url(#cert-gold)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
    {/* Star accents */}
    <polygon points="48,16 49.5,19.5 53,19.5 50,21.5 51.5,25 48,23 44.5,25 46,21.5 43,19.5 46.5,19.5" fill="#FFD700" opacity="0.8" />
    {/* Small decorative dots */}
    <circle cx="32" cy="34" r="1.5" fill="#DAA520" opacity="0.6" />
    <circle cx="64" cy="34" r="1.5" fill="#DAA520" opacity="0.6" />
    {/* Ribbon tails */}
    <path d="M38 76 L34 88 L40 84 L44 90" fill="none" stroke="url(#ribbon-red)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M58 76 L62 88 L56 84 L52 90" fill="none" stroke="url(#ribbon-red)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const features = [
  {
    Icon: MarketplaceIcon,
    title: 'Live Marketplace',
    description: 'Trade Gold, Silver, & Platinum with Real-Time Pricing.',
  },
  {
    Icon: VaultIcon,
    title: 'Secure Vault',
    description: 'Institutional-Grade Storage & Protection.',
  },
  {
    Icon: CertifiedIcon,
    title: 'Certified Assets',
    description: 'Fully Verified & Authenticated Bullion.',
  },
];

const Features = () => {
  return (
    <section className="py-20 bg-marble relative">
      {/* Greek Key Border Top */}
      <div className="absolute top-0 left-0 right-0">
        <div className="h-6 greek-key-border-rich" />
      </div>

      <div className="container mx-auto px-4 pt-8">
        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto relative">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="text-center group relative"
            >
              {/* Icon Container with glow */}
              <div className="relative inline-block mb-6">
                <div className="w-24 h-24 mx-auto relative">
                  <feature.Icon />
                  {/* Glow effect on hover */}
                  <div className="absolute inset-0 blur-xl bg-gold/20 opacity-0 group-hover:opacity-100 transition-opacity -z-10" />
                </div>
              </div>

              {/* Content */}
              <h3 className="font-display text-xl md:text-2xl text-navy mb-3 tracking-wide uppercase">
                {feature.title}
              </h3>
              <p className="text-navy/60 leading-relaxed max-w-xs mx-auto">
                {feature.description}
              </p>

              {/* Decorative divider */}
              <div className="mt-6 mx-auto w-20 h-1 bg-gradient-to-r from-transparent via-gold to-transparent" />

              {/* Vertical divider between items */}
              {index < features.length - 1 && (
                <div className="hidden md:block absolute right-0 top-1/2 -translate-y-1/2 w-px h-32 bg-gradient-to-b from-transparent via-gold/40 to-transparent" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Greek Key Border Bottom */}
      <div className="absolute bottom-0 left-0 right-0">
        <div className="h-6 greek-key-border-rich" />
      </div>
    </section>
  );
};

export default Features;
