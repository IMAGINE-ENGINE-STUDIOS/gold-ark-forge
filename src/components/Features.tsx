const features = [
  {
    icon: (
      <svg viewBox="0 0 60 50" className="w-12 h-10" fill="currentColor">
        <polygon points="30,2 58,18 2,18" />
        <rect x="5" y="18" width="50" height="3" />
        <rect x="8" y="21" width="4" height="22" />
        <rect x="18" y="21" width="4" height="22" />
        <rect x="28" y="21" width="4" height="22" />
        <rect x="38" y="21" width="4" height="22" />
        <rect x="48" y="21" width="4" height="22" />
        <rect x="3" y="43" width="54" height="3" />
      </svg>
    ),
    title: 'Live Marketplace',
    description: 'Trade Gold, Silver, & Platinum with Real-Time Pricing.',
  },
  {
    icon: (
      <svg viewBox="0 0 50 50" className="w-10 h-10" fill="currentColor">
        <circle cx="25" cy="25" r="23" fill="none" stroke="currentColor" strokeWidth="2" />
        <circle cx="25" cy="25" r="18" fill="none" stroke="currentColor" strokeWidth="2" />
        <circle cx="25" cy="25" r="8" fill="currentColor" />
        <rect x="23" y="4" width="4" height="8" />
        <rect x="23" y="38" width="4" height="8" />
        <rect x="4" y="23" width="8" height="4" />
        <rect x="38" y="23" width="8" height="4" />
      </svg>
    ),
    title: 'Secure Vault',
    description: 'Institutional-Grade Storage & Protection.',
  },
  {
    icon: (
      <svg viewBox="0 0 50 50" className="w-10 h-10" fill="currentColor">
        <polygon points="25,2 32,18 50,18 36,28 42,46 25,36 8,46 14,28 0,18 18,18" />
      </svg>
    ),
    title: 'Certified Assets',
    description: 'Fully Verified & Authenticated Bullion.',
  },
];

const Features = () => {
  return (
    <section className="py-16 bg-marble">
      {/* Greek Key Border */}
      <div className="h-4 greek-key-border mb-8" />

      <div className="container mx-auto px-4">
        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="text-center group"
            >
              {/* Icon Container */}
              <div className="inline-flex items-center justify-center w-20 h-20 mb-4 text-gold/70 group-hover:text-gold transition-colors">
                {feature.icon}
              </div>

              {/* Content */}
              <h3 className="font-display text-lg md:text-xl text-navy mb-2 tracking-wide uppercase">
                {feature.title}
              </h3>
              <p className="text-navy/60 text-sm leading-relaxed">
                {feature.description}
              </p>

              {/* Divider between items */}
              {index < features.length - 1 && (
                <div className="hidden md:block absolute right-0 top-1/2 -translate-y-1/2 w-px h-24 bg-gold/20" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Greek Key Border */}
      <div className="h-4 greek-key-border mt-8" />
    </section>
  );
};

export default Features;
