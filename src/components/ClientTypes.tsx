import { Building, Users, Landmark } from 'lucide-react';

const clients = [
  {
    icon: Building,
    title: 'Institutional Investors',
    subtitle: 'Bespoke Services',
    description: 'Dedicated account management, custom allocation strategies, and direct vault access.',
  },
  {
    icon: Users,
    title: 'Family Offices',
    subtitle: 'Wealth Preservation',
    description: 'Multi-generational asset protection with full transparency and succession planning.',
  },
  {
    icon: Landmark,
    title: 'Government & Sovereigns',
    subtitle: 'Secure Reserves',
    description: 'National reserve management with diplomatic protocols and sovereign guarantees.',
  },
];

const ClientTypes = () => {
  return (
    <section className="py-20 navy-overlay relative overflow-hidden">
      {/* Background Pattern */}
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
          <h2 className="font-display text-3xl md:text-4xl text-marble mb-4">
            Trusted by <span className="text-gradient-gold">Elite Institutions</span>
          </h2>
          <p className="text-marble/70 max-w-2xl mx-auto">
            Built for the most discerning investors who demand security, transparency, and excellence.
          </p>
        </div>

        {/* Client Types Grid */}
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {clients.map((client, index) => (
            <div
              key={client.title}
              className="group text-center p-8"
            >
              {/* Icon Container */}
              <div className="relative inline-block mb-6">
                {/* Geometric Frame */}
                <div className="w-24 h-24 border-2 border-gold/40 rotate-45 flex items-center justify-center group-hover:border-gold transition-colors">
                  <div className="w-16 h-16 border border-gold/30 group-hover:border-gold/60 transition-colors" />
                </div>
                {/* Icon */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <client.icon className="w-10 h-10 text-gold" />
                </div>
              </div>

              {/* Content */}
              <h3 className="font-display text-xl text-marble mb-1 tracking-wide">
                {client.title}
              </h3>
              <p className="text-gold text-sm tracking-wider uppercase mb-4">
                {client.subtitle}
              </p>
              <p className="text-marble/60 leading-relaxed">
                {client.description}
              </p>

              {/* Decorative Line */}
              <div className="mt-6 mx-auto w-16 h-px bg-gradient-to-r from-transparent via-gold/50 to-transparent" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ClientTypes;
