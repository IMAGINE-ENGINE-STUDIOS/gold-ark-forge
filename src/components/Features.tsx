import iconTemple from '@/assets/icon-temple.png';
import iconVault from '@/assets/icon-vault.png';
import iconCertified from '@/assets/icon-certified.png';

const features = [
  {
    icon: iconTemple,
    title: 'Live Marketplace',
    description: 'Trade Gold, Silver, & Platinum with Real-Time Pricing.',
  },
  {
    icon: iconVault,
    title: 'Secure Vault',
    description: 'Institutional-Grade Storage & Protection.',
  },
  {
    icon: iconCertified,
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
                {/* Icon image */}
                <div className="w-24 h-24 mx-auto relative">
                  <img 
                    src={feature.icon} 
                    alt={feature.title}
                    className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-300"
                  />
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
