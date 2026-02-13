import React from 'react';

const InstitutionalIcon = () => (
  <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
    <defs>
      <linearGradient id="inst-gold" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#C5A75F" />
        <stop offset="40%" stopColor="#FFD700" />
        <stop offset="60%" stopColor="#DAA520" />
        <stop offset="100%" stopColor="#B8860B" />
      </linearGradient>
      <linearGradient id="inst-silver" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#E0E0E0" />
        <stop offset="50%" stopColor="#C0C0C0" />
        <stop offset="100%" stopColor="#909090" />
      </linearGradient>
    </defs>
    {/* Pillar base */}
    <rect x="8" y="54" width="48" height="4" rx="1" fill="url(#inst-gold)" opacity="0.8" />
    <rect x="12" y="50" width="40" height="4" rx="1" fill="url(#inst-gold)" />
    {/* Left pillar */}
    <rect x="16" y="22" width="5" height="28" rx="1.5" fill="url(#inst-silver)" stroke="#DAA520" strokeWidth="0.5" />
    <rect x="14.5" y="21" width="8" height="3" rx="1" fill="#FFD700" />
    {/* Right pillar */}
    <rect x="43" y="22" width="5" height="28" rx="1.5" fill="url(#inst-silver)" stroke="#DAA520" strokeWidth="0.5" />
    <rect x="41.5" y="21" width="8" height="3" rx="1" fill="#FFD700" />
    {/* Pediment */}
    <polygon points="32,6 10,22 54,22" fill="url(#inst-gold)" stroke="#DAA520" strokeWidth="1" />
    <polygon points="32,12 20,20 44,20" fill="none" stroke="#FFD700" strokeWidth="0.5" opacity="0.6" />
    {/* Central diamond / keystone */}
    <polygon points="32,13 35,17 32,21 29,17" fill="#FFD700" stroke="#B8860B" strokeWidth="0.5" />
    {/* Rising chart bars inside */}
    <rect x="24" y="40" width="3" height="9" rx="0.5" fill="url(#inst-gold)" opacity="0.6" />
    <rect x="29" y="35" width="3" height="14" rx="0.5" fill="url(#inst-gold)" opacity="0.7" />
    <rect x="34" y="30" width="3" height="19" rx="0.5" fill="url(#inst-gold)" opacity="0.85" />
    <rect x="39" y="26" width="3" height="23" rx="0.5" fill="url(#inst-gold)" />
  </svg>
);

const FamilyOfficeIcon = () => (
  <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
    <defs>
      <linearGradient id="fam-gold" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#C5A75F" />
        <stop offset="40%" stopColor="#FFD700" />
        <stop offset="60%" stopColor="#DAA520" />
        <stop offset="100%" stopColor="#B8860B" />
      </linearGradient>
      <linearGradient id="fam-silver" x1="50%" y1="0%" x2="50%" y2="100%">
        <stop offset="0%" stopColor="#E8E8E8" />
        <stop offset="100%" stopColor="#A0A0A0" />
      </linearGradient>
    </defs>
    {/* Shield outline */}
    <path d="M32 6 L54 16 L54 36 Q54 52 32 60 Q10 52 10 36 L10 16 Z" fill="none" stroke="url(#fam-gold)" strokeWidth="2" />
    <path d="M32 10 L50 18 L50 35 Q50 49 32 56 Q14 49 14 35 L14 18 Z" fill="url(#fam-gold)" opacity="0.08" />
    {/* Inner shield line */}
    <path d="M32 14 L46 21 L46 34 Q46 46 32 52 Q18 46 18 34 L18 21 Z" fill="none" stroke="#DAA520" strokeWidth="0.8" opacity="0.4" />
    {/* Tree of life / generational symbol */}
    {/* Trunk */}
    <line x1="32" y1="46" x2="32" y2="30" stroke="url(#fam-gold)" strokeWidth="2.5" strokeLinecap="round" />
    {/* Root lines */}
    <line x1="32" y1="46" x2="26" y2="50" stroke="#DAA520" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="32" y1="46" x2="38" y2="50" stroke="#DAA520" strokeWidth="1.5" strokeLinecap="round" />
    {/* Main branches */}
    <line x1="32" y1="34" x2="24" y2="26" stroke="url(#fam-gold)" strokeWidth="2" strokeLinecap="round" />
    <line x1="32" y1="34" x2="40" y2="26" stroke="url(#fam-gold)" strokeWidth="2" strokeLinecap="round" />
    <line x1="32" y1="30" x2="26" y2="22" stroke="url(#fam-gold)" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="32" y1="30" x2="38" y2="22" stroke="url(#fam-gold)" strokeWidth="1.5" strokeLinecap="round" />
    {/* Leaf dots */}
    <circle cx="24" cy="26" r="2.5" fill="#FFD700" />
    <circle cx="40" cy="26" r="2.5" fill="#FFD700" />
    <circle cx="26" cy="22" r="2" fill="#DAA520" />
    <circle cx="38" cy="22" r="2" fill="#DAA520" />
    <circle cx="32" cy="18" r="2.5" fill="#FFD700" />
    {/* Crown top */}
    <line x1="32" y1="30" x2="32" y2="18" stroke="url(#fam-gold)" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const GovernmentIcon = () => (
  <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
    <defs>
      <linearGradient id="gov-gold" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#C5A75F" />
        <stop offset="40%" stopColor="#FFD700" />
        <stop offset="60%" stopColor="#DAA520" />
        <stop offset="100%" stopColor="#B8860B" />
      </linearGradient>
      <linearGradient id="gov-silver" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#E0E0E0" />
        <stop offset="50%" stopColor="#C0C0C0" />
        <stop offset="100%" stopColor="#808080" />
      </linearGradient>
    </defs>
    {/* Globe circle */}
    <circle cx="32" cy="32" r="24" fill="none" stroke="url(#gov-gold)" strokeWidth="2" />
    <circle cx="32" cy="32" r="20" fill="url(#gov-gold)" opacity="0.06" />
    {/* Latitude lines */}
    <ellipse cx="32" cy="32" rx="24" ry="10" fill="none" stroke="#DAA520" strokeWidth="0.8" opacity="0.4" />
    <ellipse cx="32" cy="32" rx="24" ry="18" fill="none" stroke="#DAA520" strokeWidth="0.6" opacity="0.3" />
    {/* Longitude line */}
    <ellipse cx="32" cy="32" rx="10" ry="24" fill="none" stroke="#DAA520" strokeWidth="0.8" opacity="0.4" />
    {/* Meridian */}
    <line x1="32" y1="8" x2="32" y2="56" stroke="#DAA520" strokeWidth="0.6" opacity="0.3" />
    <line x1="8" y1="32" x2="56" y2="32" stroke="#DAA520" strokeWidth="0.6" opacity="0.3" />
    {/* Laurel wreath left */}
    <path d="M14 44 Q8 36 14 28" fill="none" stroke="url(#gov-gold)" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M12 42 Q7 36 12 30" fill="none" stroke="#DAA520" strokeWidth="1" strokeLinecap="round" opacity="0.6" />
    {/* Laurel leaves left */}
    <ellipse cx="11" cy="33" rx="2" ry="3.5" transform="rotate(-20 11 33)" fill="#DAA520" opacity="0.5" />
    <ellipse cx="10" cy="38" rx="2" ry="3.5" transform="rotate(-10 10 38)" fill="#DAA520" opacity="0.5" />
    {/* Laurel wreath right */}
    <path d="M50 44 Q56 36 50 28" fill="none" stroke="url(#gov-gold)" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M52 42 Q57 36 52 30" fill="none" stroke="#DAA520" strokeWidth="1" strokeLinecap="round" opacity="0.6" />
    {/* Laurel leaves right */}
    <ellipse cx="53" cy="33" rx="2" ry="3.5" transform="rotate(20 53 33)" fill="#DAA520" opacity="0.5" />
    <ellipse cx="54" cy="38" rx="2" ry="3.5" transform="rotate(10 54 38)" fill="#DAA520" opacity="0.5" />
    {/* Central star */}
    <polygon points="32,22 34,28 40,28 35,32 37,38 32,34 27,38 29,32 24,28 30,28" fill="url(#gov-gold)" stroke="#B8860B" strokeWidth="0.5" />
  </svg>
);

const clients = [
  {
    Icon: InstitutionalIcon,
    title: 'Institutional Investors',
    subtitle: 'Bespoke Services',
    description: 'Dedicated account management, custom allocation strategies, and direct vault access.',
  },
  {
    Icon: FamilyOfficeIcon,
    title: 'Family Offices',
    subtitle: 'Wealth Preservation',
    description: 'Multi-generational asset protection with full transparency and succession planning.',
  },
  {
    Icon: GovernmentIcon,
    title: 'Government & Sovereigns',
    subtitle: 'Secure Reserves',
    description: 'National reserve management with diplomatic protocols and sovereign guarantees.',
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
              Trusted by <span className="text-gradient-gold">Elite Institutions</span>
            </h2>
            <div className="h-1 w-24 mx-auto bg-gradient-to-r from-transparent via-gold to-transparent mt-4" />
          </div>
          <p className="text-marble/70 max-w-2xl mx-auto text-lg">
            Built for the most discerning investors who demand security, transparency, and excellence.
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
                {/* Geometric Frame */}
                <div className="w-28 h-28 border-2 border-gold/40 rotate-45 flex items-center justify-center group-hover:border-gold transition-colors">
                  <div className="w-20 h-20 border border-gold/30 group-hover:border-gold/60 transition-colors flex items-center justify-center -rotate-45">
                    <div className="w-14 h-14">
                      <client.Icon />
                    </div>
                  </div>
                </div>
                {/* Glow effect */}
                <div className="absolute inset-0 blur-2xl bg-gold/10 -z-10 group-hover:bg-gold/20 transition-colors" />
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
