import { Link } from 'react-router-dom';
import goldBullion from '@/assets/gold-bullion-card.jpg';
import silverBullion from '@/assets/silver-bullion-card.jpg';
import platinumBullion from '@/assets/platinum-bullion-card.jpg';

const metals = [
  {
    name: 'Gold',
    image: goldBullion,
    href: '/marketplace/gold',
    borderColor: 'border-gold',
    bgGradient: 'from-gold/20 via-gold/10 to-transparent',
    buttonBg: 'bg-gradient-to-b from-gold-light via-gold to-gold-dark',
    buttonText: 'text-navy',
  },
  {
    name: 'Silver',
    image: silverBullion,
    href: '/marketplace/silver',
    borderColor: 'border-silver',
    bgGradient: 'from-silver/20 via-silver/10 to-transparent',
    buttonBg: 'bg-gradient-to-b from-silver-light via-silver to-silver-dark',
    buttonText: 'text-navy',
  },
  {
    name: 'Platinum',
    image: platinumBullion,
    href: '/marketplace/platinum',
    borderColor: 'border-platinum',
    bgGradient: 'from-platinum/20 via-platinum/10 to-transparent',
    buttonBg: 'bg-gradient-to-b from-platinum-light via-platinum to-platinum-dark',
    buttonText: 'text-navy',
  },
];

const MetalCards = () => {
  return (
    <section className="py-16 bg-gradient-marble relative overflow-hidden">
      {/* Decorative columns on sides */}
      <div className="absolute left-0 top-0 bottom-0 w-8 md:w-16 bg-gradient-to-r from-marble-warm to-transparent opacity-80" />
      <div className="absolute right-0 top-0 bottom-0 w-8 md:w-16 bg-gradient-to-l from-marble-warm to-transparent opacity-80" />

      <div className="container mx-auto px-4 relative z-10">
        {/* Metal Cards Grid */}
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {metals.map((metal) => (
            <Link
              key={metal.name}
              to={metal.href}
              className="group relative"
            >
              {/* Card Container - Shield/Badge Shape */}
              <div className={`relative bg-marble border-4 ${metal.borderColor} overflow-hidden transition-all duration-300 group-hover:shadow-xl group-hover:-translate-y-1`}>
                {/* Top gradient accent */}
                <div className={`absolute top-0 left-0 right-0 h-24 bg-gradient-to-b ${metal.bgGradient}`} />
                
                {/* Corner decorations */}
                <div className="absolute top-2 left-2 w-6 h-6 border-l-2 border-t-2 border-gold/50" />
                <div className="absolute top-2 right-2 w-6 h-6 border-r-2 border-t-2 border-gold/50" />
                <div className="absolute bottom-2 left-2 w-6 h-6 border-l-2 border-b-2 border-gold/50" />
                <div className="absolute bottom-2 right-2 w-6 h-6 border-r-2 border-b-2 border-gold/50" />

                {/* Image Container */}
                <div className="relative p-6 pb-4">
                  <div className="aspect-square overflow-hidden rounded bg-white/50 shadow-inner">
                    <img
                      src={metal.image}
                      alt={`${metal.name} Bullion`}
                      className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                </div>

                {/* Button */}
                <div className="px-6 pb-6">
                  <div className={`${metal.buttonBg} ${metal.buttonText} py-3 px-4 font-display text-sm tracking-[0.15em] uppercase text-center border border-current/20 shadow-md group-hover:shadow-lg transition-shadow`}>
                    ★ Explore {metal.name} ★
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default MetalCards;
