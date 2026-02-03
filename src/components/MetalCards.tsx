import { Link } from 'react-router-dom';
import goldBars from '@/assets/gold-bars.jpg';
import silverBars from '@/assets/silver-bars.jpg';
import platinumBars from '@/assets/platinum-bars.jpg';

const metals = [
  {
    name: 'Gold',
    subtitle: 'Buy & Sell',
    image: goldBars,
    variant: 'gold' as const,
    href: '/marketplace/gold',
    spotPrice: '$2,034.50',
    change: '+1.2%',
  },
  {
    name: 'Silver',
    subtitle: 'Buy & Sell',
    image: silverBars,
    variant: 'silver' as const,
    href: '/marketplace/silver',
    spotPrice: '$23.45',
    change: '+0.8%',
  },
  {
    name: 'Platinum',
    subtitle: 'Buy & Sell',
    image: platinumBars,
    variant: 'platinum' as const,
    href: '/marketplace/platinum',
    spotPrice: '$987.20',
    change: '-0.3%',
  },
];

const MetalCards = () => {
  return (
    <section className="py-20 bg-gradient-marble marble-texture">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="font-display text-3xl md:text-4xl text-navy mb-4">
            Trade Premium Bullion
          </h2>
          <div className="divider-ornate max-w-md mx-auto">
            <span className="font-display text-sm tracking-[0.2em] text-navy/60 uppercase">
              Verified Assets
            </span>
          </div>
        </div>

        {/* Metal Cards Grid */}
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {metals.map((metal, index) => (
            <Link
              key={metal.name}
              to={metal.href}
              className={`
                group relative overflow-hidden transition-all duration-500
                hover:-translate-y-2 hover:shadow-xl
                ${metal.variant === 'gold' ? 'metal-card-gold' : ''}
                ${metal.variant === 'silver' ? 'metal-card-silver' : ''}
                ${metal.variant === 'platinum' ? 'metal-card-platinum' : ''}
              `}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Top Border Decoration */}
              <div className={`h-1 ${metal.variant === 'gold' ? 'gold-shimmer' : metal.variant === 'silver' ? 'silver-shimmer' : 'platinum-shimmer'}`} />
              
              {/* Card Content */}
              <div className="p-6">
                {/* Image Container */}
                <div className="relative mb-6 overflow-hidden rounded">
                  <div className="aspect-square bg-white/50 flex items-center justify-center p-4">
                    <img
                      src={metal.image}
                      alt={`${metal.name} Bullion`}
                      className="w-full h-full object-contain transform group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  {/* Corner Decorations */}
                  <div className="absolute top-2 left-2 w-4 h-4 border-l-2 border-t-2 border-gold/60" />
                  <div className="absolute top-2 right-2 w-4 h-4 border-r-2 border-t-2 border-gold/60" />
                  <div className="absolute bottom-2 left-2 w-4 h-4 border-l-2 border-b-2 border-gold/60" />
                  <div className="absolute bottom-2 right-2 w-4 h-4 border-r-2 border-b-2 border-gold/60" />
                </div>

                {/* Metal Info */}
                <div className="text-center">
                  <h3 className="font-display text-2xl text-navy mb-1">
                    {metal.name} Bullion
                  </h3>
                  <p className="text-sm text-navy/60 tracking-wider uppercase mb-4">
                    {metal.subtitle}
                  </p>
                  
                  {/* Price Info */}
                  <div className="flex items-center justify-center gap-4 pt-4 border-t border-navy/10">
                    <span className="text-lg font-semibold text-navy">{metal.spotPrice}</span>
                    <span className={`text-sm font-medium ${metal.change.startsWith('+') ? 'text-green-600' : 'text-red-500'}`}>
                      {metal.change}
                    </span>
                  </div>
                </div>
              </div>

              {/* Bottom Border */}
              <div className={`h-1 ${metal.variant === 'gold' ? 'gold-shimmer' : metal.variant === 'silver' ? 'silver-shimmer' : 'platinum-shimmer'}`} />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default MetalCards;
