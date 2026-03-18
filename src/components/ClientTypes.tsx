import React from 'react';

const InstitutionalIcon = () => (
  <svg viewBox="0 0 96 96" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
    <defs>
      <linearGradient id="ci-gold" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#C5A75F" />
        <stop offset="35%" stopColor="#FFD700" />
        <stop offset="65%" stopColor="#DAA520" />
        <stop offset="100%" stopColor="#B8860B" />
      </linearGradient>
      <linearGradient id="ci-gold-v" x1="50%" y1="0%" x2="50%" y2="100%">
        <stop offset="0%" stopColor="#FFD700" stopOpacity="0.9" />
        <stop offset="100%" stopColor="#B8860B" stopOpacity="0.7" />
      </linearGradient>
      <linearGradient id="ci-shimmer" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#FFD700" stopOpacity="0">
          <animate attributeName="offset" values="-0.5;1.5" dur="3.5s" repeatCount="indefinite" />
        </stop>
        <stop offset="20%" stopColor="#FFFACD" stopOpacity="0.6">
          <animate attributeName="offset" values="-0.3;1.7" dur="3.5s" repeatCount="indefinite" />
        </stop>
        <stop offset="40%" stopColor="#FFD700" stopOpacity="0">
          <animate attributeName="offset" values="-0.1;1.9" dur="3.5s" repeatCount="indefinite" />
        </stop>
      </linearGradient>
    </defs>
    {/* Pediment */}
    <polygon points="48,10 14,36 82,36" fill="none" stroke="url(#ci-gold)" strokeWidth="1.8" strokeLinejoin="round" />
    <polygon points="48,10 14,36 82,36" fill="none" stroke="url(#ci-shimmer)" strokeWidth="1.8" strokeLinejoin="round" />
    {/* Architrave */}
    <line x1="12" y1="38" x2="84" y2="38" stroke="url(#ci-gold)" strokeWidth="2" strokeLinecap="round" />
    {/* Columns */}
    <line x1="22" y1="40" x2="22" y2="72" stroke="url(#ci-gold-v)" strokeWidth="3" strokeLinecap="round" />
    <line x1="38" y1="40" x2="38" y2="72" stroke="url(#ci-gold-v)" strokeWidth="3" strokeLinecap="round" />
    <line x1="58" y1="40" x2="58" y2="72" stroke="url(#ci-gold-v)" strokeWidth="3" strokeLinecap="round" />
    <line x1="74" y1="40" x2="74" y2="72" stroke="url(#ci-gold-v)" strokeWidth="3" strokeLinecap="round" />
    {/* Column capitals */}
    <line x1="19" y1="40" x2="25" y2="40" stroke="#FFD700" strokeWidth="2" strokeLinecap="round" />
    <line x1="35" y1="40" x2="41" y2="40" stroke="#FFD700" strokeWidth="2" strokeLinecap="round" />
    <line x1="55" y1="40" x2="61" y2="40" stroke="#FFD700" strokeWidth="2" strokeLinecap="round" />
    <line x1="71" y1="40" x2="77" y2="40" stroke="#FFD700" strokeWidth="2" strokeLinecap="round" />
    {/* Base */}
    <line x1="10" y1="74" x2="86" y2="74" stroke="url(#ci-gold)" strokeWidth="2.5" strokeLinecap="round" />
    <line x1="8" y1="78" x2="88" y2="78" stroke="url(#ci-gold)" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
    {/* Rising trend line - animated draw */}
    <polyline points="30,66 40,58 50,62 60,52 70,48" fill="none" stroke="#FFD700" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="80" strokeDashoffset="80">
      <animate attributeName="stroke-dashoffset" from="80" to="0" dur="3s" repeatCount="indefinite" />
    </polyline>
    {/* Pulsing dot */}
    <circle cx="70" cy="48" r="2" fill="#FFD700">
      <animate attributeName="r" values="1.5;3;1.5" dur="2.5s" repeatCount="indefinite" />
      <animate attributeName="opacity" values="0.3;0.8;0.3" dur="2.5s" repeatCount="indefinite" />
    </circle>
  </svg>
);

const FamilyOfficeIcon = () => (
  <svg viewBox="0 0 96 96" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
    <defs>
      <linearGradient id="cf-gold" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#C5A75F" />
        <stop offset="35%" stopColor="#FFD700" />
        <stop offset="65%" stopColor="#DAA520" />
        <stop offset="100%" stopColor="#B8860B" />
      </linearGradient>
      <linearGradient id="cf-shimmer" x1="0%" y1="100%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#FFD700" stopOpacity="0">
          <animate attributeName="offset" values="-0.5;1.5" dur="4s" repeatCount="indefinite" />
        </stop>
        <stop offset="15%" stopColor="#FFFACD" stopOpacity="0.5">
          <animate attributeName="offset" values="-0.35;1.65" dur="4s" repeatCount="indefinite" />
        </stop>
        <stop offset="30%" stopColor="#FFD700" stopOpacity="0">
          <animate attributeName="offset" values="-0.2;1.8" dur="4s" repeatCount="indefinite" />
        </stop>
      </linearGradient>
    </defs>
    {/* Shield */}
    <path d="M48 8 L80 22 L80 50 Q80 72 48 88 Q16 72 16 50 L16 22 Z" fill="none" stroke="url(#cf-gold)" strokeWidth="2" strokeLinejoin="round" />
    <path d="M48 8 L80 22 L80 50 Q80 72 48 88 Q16 72 16 50 L16 22 Z" fill="none" stroke="url(#cf-shimmer)" strokeWidth="2" strokeLinejoin="round" />
    <path d="M48 14 L74 26 L74 48 Q74 67 48 82 Q22 67 22 48 L22 26 Z" fill="url(#cf-gold)" opacity="0.06" />
    {/* Tree trunk */}
    <line x1="48" y1="70" x2="48" y2="42" stroke="url(#cf-gold)" strokeWidth="2.5" strokeLinecap="round" />
    {/* Main branches */}
    <path d="M48 50 Q38 42 30 34" fill="none" stroke="url(#cf-gold)" strokeWidth="2" strokeLinecap="round" />
    <path d="M48 50 Q58 42 66 34" fill="none" stroke="url(#cf-gold)" strokeWidth="2" strokeLinecap="round" />
    {/* Upper branches */}
    <path d="M48 42 Q42 36 36 28" fill="none" stroke="url(#cf-gold)" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M48 42 Q54 36 60 28" fill="none" stroke="url(#cf-gold)" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="48" y1="42" x2="48" y2="24" stroke="url(#cf-gold)" strokeWidth="1.5" strokeLinecap="round" />
    {/* Leaf circles - breathing pulse */}
    <circle cx="30" cy="32" r="3" fill="#FFD700">
      <animate attributeName="r" values="2.5;3.5;2.5" dur="3s" begin="0s" repeatCount="indefinite" />
      <animate attributeName="opacity" values="0.5;0.9;0.5" dur="3s" begin="0s" repeatCount="indefinite" />
    </circle>
    <circle cx="66" cy="32" r="3" fill="#FFD700">
      <animate attributeName="r" values="2.5;3.5;2.5" dur="3s" begin="0.5s" repeatCount="indefinite" />
      <animate attributeName="opacity" values="0.5;0.9;0.5" dur="3s" begin="0.5s" repeatCount="indefinite" />
    </circle>
    <circle cx="36" cy="26" r="2.5" fill="#DAA520">
      <animate attributeName="r" values="2;3;2" dur="3s" begin="1s" repeatCount="indefinite" />
      <animate attributeName="opacity" values="0.4;0.8;0.4" dur="3s" begin="1s" repeatCount="indefinite" />
    </circle>
    <circle cx="60" cy="26" r="2.5" fill="#DAA520">
      <animate attributeName="r" values="2;3;2" dur="3s" begin="1.5s" repeatCount="indefinite" />
      <animate attributeName="opacity" values="0.4;0.8;0.4" dur="3s" begin="1.5s" repeatCount="indefinite" />
    </circle>
    <circle cx="48" cy="22" r="3" fill="#FFD700">
      <animate attributeName="r" values="2.5;4;2.5" dur="3s" begin="0.3s" repeatCount="indefinite" />
      <animate attributeName="opacity" values="0.5;1;0.5" dur="3s" begin="0.3s" repeatCount="indefinite" />
    </circle>
    {/* Roots */}
    <path d="M48 70 Q40 74 34 76" fill="none" stroke="#DAA520" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
    <path d="M48 70 Q56 74 62 76" fill="none" stroke="#DAA520" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
  </svg>
);

const GovernmentIcon = () => (
  <svg viewBox="0 0 96 96" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
    <defs>
      <linearGradient id="cg-gold" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#C5A75F" />
        <stop offset="35%" stopColor="#FFD700" />
        <stop offset="65%" stopColor="#DAA520" />
        <stop offset="100%" stopColor="#B8860B" />
      </linearGradient>
    </defs>
    {/* Globe - slow rotation */}
    <circle cx="48" cy="48" r="30" fill="none" stroke="url(#cg-gold)" strokeWidth="1.8" />
    <g style={{ transformOrigin: '48px 48px' }}>
      <animateTransform attributeName="transform" type="rotate" from="0 48 48" to="360 48 48" dur="30s" repeatCount="indefinite" />
      {/* Latitude */}
      <ellipse cx="48" cy="48" rx="30" ry="12" fill="none" stroke="#DAA520" strokeWidth="0.8" opacity="0.35" />
      <ellipse cx="48" cy="48" rx="30" ry="22" fill="none" stroke="#DAA520" strokeWidth="0.5" opacity="0.2" />
      {/* Longitude */}
      <ellipse cx="48" cy="48" rx="12" ry="30" fill="none" stroke="#DAA520" strokeWidth="0.8" opacity="0.35" />
    </g>
    {/* Left laurel */}
    <path d="M18 68 Q8 52 18 32" fill="none" stroke="url(#cg-gold)" strokeWidth="1.8" strokeLinecap="round" />
    <ellipse cx="13" cy="40" rx="3" ry="5" transform="rotate(-15 13 40)" fill="#DAA520" opacity="0.4" />
    <ellipse cx="11" cy="50" rx="3" ry="5" transform="rotate(-5 11 50)" fill="#DAA520" opacity="0.4" />
    <ellipse cx="13" cy="60" rx="3" ry="5" transform="rotate(10 13 60)" fill="#DAA520" opacity="0.4" />
    {/* Right laurel */}
    <path d="M78 68 Q88 52 78 32" fill="none" stroke="url(#cg-gold)" strokeWidth="1.8" strokeLinecap="round" />
    <ellipse cx="83" cy="40" rx="3" ry="5" transform="rotate(15 83 40)" fill="#DAA520" opacity="0.4" />
    <ellipse cx="85" cy="50" rx="3" ry="5" transform="rotate(5 85 50)" fill="#DAA520" opacity="0.4" />
    <ellipse cx="83" cy="60" rx="3" ry="5" transform="rotate(-10 83 60)" fill="#DAA520" opacity="0.4" />
    {/* Central star - pulsing */}
    <polygon points="48,30 51,40 62,40 53,46 56,56 48,50 40,56 43,46 34,40 45,40" fill="url(#cg-gold)">
      <animate attributeName="opacity" values="0.5;0.9;0.5" dur="3s" repeatCount="indefinite" />
    </polygon>
  </svg>
);

const clients = [
  {
    Icon: InstitutionalIcon,
    title: 'Institutional Investors',
    subtitle: 'Tokenized Portfolios',
    description: 'Trade tokenized commodities at scale with real-time settlement, full transparency, and on-chain audit trails.',
  },
  {
    Icon: FamilyOfficeIcon,
    title: 'Family Offices',
    subtitle: 'Generational Wealth',
    description: 'Diversify into tokenized real-world assets — precious metals, energy, agriculture — with non-custodial ownership.',
  },
  {
    Icon: GovernmentIcon,
    title: 'Sovereign & Institutional',
    subtitle: 'Reserve Tokenization',
    description: 'Tokenize and manage national reserves with blockchain-verified provenance and cross-border interoperability.',
  },
];

const ClientTypes = () => {
  return (
    <section className="py-24 navy-overlay relative overflow-hidden">
      {/* Decorative Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `repeating-linear-gradient(
            45deg,
            transparent,
            transparent 20px,
            currentColor 20px,
            currentColor 21px
          )`,
        }} />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-block mb-6">
            <div className="h-1 w-24 mx-auto bg-gradient-to-r from-transparent via-gold to-transparent mb-4" />
            <h2 className="font-display text-4xl md:text-5xl text-marble mb-4">
              Built for <span className="text-gradient-gold">Serious Capital</span>
            </h2>
            <div className="h-1 w-24 mx-auto bg-gradient-to-r from-transparent via-gold to-transparent mt-4" />
          </div>
          <p className="text-marble/70 max-w-2xl mx-auto text-lg">
            The new standard for trading tokenized commodities — designed for institutions, family offices, and sovereign entities.
          </p>
        </div>

        {/* Client Types Grid */}
        <div className="grid md:grid-cols-3 gap-12 max-w-5xl mx-auto">
          {clients.map((client, index) => (
            <div
              key={client.title}
              className="group text-center p-8 relative"
            >
              {/* Icon Container */}
              <div className="relative inline-block mb-8">
                <div className="w-24 h-24">
                  <client.Icon />
                </div>
                {/* Subtle glow */}
                <div className="absolute inset-0 blur-xl bg-gold/10 -z-10 group-hover:bg-gold/20 transition-colors" />
              </div>

              {/* Content */}
              <h3 className="font-display text-2xl text-marble mb-2 tracking-wide">
                {client.title}
              </h3>
              <p className="text-gold text-sm tracking-[0.2em] uppercase mb-4">
                {client.subtitle}
              </p>
              <p className="text-marble/60 leading-relaxed">
                {client.description}
              </p>

              {/* Decorative Line */}
              <div className="mt-8 mx-auto w-20 h-1 bg-gradient-to-r from-transparent via-gold/50 to-transparent" />

              {/* Vertical divider */}
              {index < clients.length - 1 && (
                <div className="hidden md:block absolute right-0 top-1/2 -translate-y-1/2 w-px h-40 bg-gradient-to-b from-transparent via-gold/30 to-transparent" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Greek Key Border Bottom */}
      <div className="absolute bottom-0 left-0 right-0">
        <div className="h-4 greek-key-border-rich-dark" />
      </div>
    </section>
  );
};

export default ClientTypes;
