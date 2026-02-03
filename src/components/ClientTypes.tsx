import iconTemple from '@/assets/icon-temple.png';
import iconVault from '@/assets/icon-vault.png';
import iconCertified from '@/assets/icon-certified.png';

const clients = [
  {
    icon: iconTemple,
    title: 'Institutional Investors',
    subtitle: 'Bespoke Services',
    description: 'Dedicated account management, custom allocation strategies, and direct vault access.',
  },
  {
    icon: iconVault,
    title: 'Family Offices',
    subtitle: 'Wealth Preservation',
    description: 'Multi-generational asset protection with full transparency and succession planning.',
  },
  {
    icon: iconCertified,
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
                    <img 
                      src={client.icon} 
                      alt={client.title}
                      className="w-14 h-14 object-contain"
                    />
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
