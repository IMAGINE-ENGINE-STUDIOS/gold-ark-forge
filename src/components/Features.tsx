import React from 'react';

const MarketplaceIcon = () => (
  <svg viewBox="0 0 96 96" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
    <defs>
      <linearGradient id="f-gold" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#C5A75F" />
        <stop offset="35%" stopColor="#FFD700" />
        <stop offset="65%" stopColor="#DAA520" />
        <stop offset="100%" stopColor="#B8860B" />
      </linearGradient>
      <linearGradient id="f-gold-v" x1="50%" y1="0%" x2="50%" y2="100%">
        <stop offset="0%" stopColor="#FFD700" stopOpacity="0.9" />
        <stop offset="100%" stopColor="#B8860B" stopOpacity="0.7" />
      </linearGradient>
    </defs>
    {/* Pediment */}
    <polyline points="14,38 48,12 82,38" fill="none" stroke="url(#f-gold)" strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" />
    {/* Architrave */}
    <line x1="12" y1="40" x2="84" y2="40" stroke="url(#f-gold)" strokeWidth="2" strokeLinecap="round" />
    {/* Columns */}
    <line x1="22" y1="42" x2="22" y2="72" stroke="url(#f-gold-v)" strokeWidth="2.5" strokeLinecap="round" />
    <line x1="40" y1="42" x2="40" y2="72" stroke="url(#f-gold-v)" strokeWidth="2.5" strokeLinecap="round" />
    <line x1="56" y1="42" x2="56" y2="72" stroke="url(#f-gold-v)" strokeWidth="2.5" strokeLinecap="round" />
    <line x1="74" y1="42" x2="74" y2="72" stroke="url(#f-gold-v)" strokeWidth="2.5" strokeLinecap="round" />
    {/* Base */}
    <line x1="10" y1="74" x2="86" y2="74" stroke="url(#f-gold)" strokeWidth="2" strokeLinecap="round" />
    <line x1="8" y1="78" x2="88" y2="78" stroke="url(#f-gold)" strokeWidth="1.2" strokeLinecap="round" opacity="0.5" />
    {/* Chart line */}
    <polyline points="32,66 42,58 50,62 60,50 68,46" fill="none" stroke="#FFD700" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.45" />
    <circle cx="68" cy="46" r="2" fill="#FFD700" opacity="0.5" />
  </svg>
);

const VaultIcon = () => (
  <svg viewBox="0 0 96 96" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
    <defs>
      <linearGradient id="f-silver" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#E8E8E8" />
        <stop offset="50%" stopColor="#C0C0C0" />
        <stop offset="100%" stopColor="#909090" />
      </linearGradient>
      <linearGradient id="f-vgold" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#DAA520" />
        <stop offset="50%" stopColor="#FFD700" />
        <stop offset="100%" stopColor="#B8860B" />
      </linearGradient>
    </defs>
    {/* Vault body */}
    <rect x="18" y="16" width="60" height="64" rx="5" fill="none" stroke="url(#f-silver)" strokeWidth="2" />
    {/* Inner border */}
    <rect x="24" y="22" width="48" height="52" rx="3" fill="none" stroke="#C0C0C0" strokeWidth="1" opacity="0.4" />
    {/* Wheel */}
    <circle cx="48" cy="48" r="16" fill="none" stroke="url(#f-vgold)" strokeWidth="2" />
    <circle cx="48" cy="48" r="5" fill="url(#f-vgold)" opacity="0.7" />
    {/* Spokes */}
    <line x1="48" y1="34" x2="48" y2="40" stroke="#DAA520" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="48" y1="56" x2="48" y2="62" stroke="#DAA520" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="34" y1="48" x2="40" y2="48" stroke="#DAA520" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="56" y1="48" x2="62" y2="48" stroke="#DAA520" strokeWidth="1.5" strokeLinecap="round" />
    {/* Diagonal spokes */}
    <line x1="38.1" y1="38.1" x2="42" y2="42" stroke="#DAA520" strokeWidth="1.2" strokeLinecap="round" />
    <line x1="54" y1="54" x2="57.9" y2="57.9" stroke="#DAA520" strokeWidth="1.2" strokeLinecap="round" />
    <line x1="57.9" y1="38.1" x2="54" y2="42" stroke="#DAA520" strokeWidth="1.2" strokeLinecap="round" />
    <line x1="42" y1="54" x2="38.1" y2="57.9" stroke="#DAA520" strokeWidth="1.2" strokeLinecap="round" />
    {/* Locking bolts */}
    <circle cx="18" cy="32" r="2.5" fill="none" stroke="#A8A8A8" strokeWidth="1.2" />
    <circle cx="18" cy="48" r="2.5" fill="none" stroke="#A8A8A8" strokeWidth="1.2" />
    <circle cx="18" cy="64" r="2.5" fill="none" stroke="#A8A8A8" strokeWidth="1.2" />
  </svg>
);

const CertifiedIcon = () => (
  <svg viewBox="0 0 96 96" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
    <defs>
      <linearGradient id="f-cgold" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#C5A75F" />
        <stop offset="35%" stopColor="#FFD700" />
        <stop offset="65%" stopColor="#DAA520" />
        <stop offset="100%" stopColor="#B8860B" />
      </linearGradient>
    </defs>
    {/* Shield */}
    <path d="M48 8 L78 22 L78 52 Q78 72 48 88 Q18 72 18 52 L18 22 Z" fill="none" stroke="url(#f-cgold)" strokeWidth="2" strokeLinejoin="round" />
    <path d="M48 16 L70 27 L70 49 Q70 65 48 78 Q26 65 26 49 L26 27 Z" fill="url(#f-cgold)" opacity="0.06" />
    {/* Checkmark */}
    <polyline points="36,50 44,60 62,36" fill="none" stroke="url(#f-cgold)" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
    {/* Star */}
    <polygon points="48,14 49.5,18 53,18 50,20.5 51.5,24 48,22 44.5,24 46,20.5 43,18 46.5,18" fill="#FFD700" opacity="0.6" />
    {/* Ribbon tails */}
    <path d="M38 76 L34 88 L40 84 L44 90" fill="none" stroke="#DAA520" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.5" />
    <path d="M58 76 L62 88 L56 84 L52 90" fill="none" stroke="#DAA520" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.5" />
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
