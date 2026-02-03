import { Link } from 'react-router-dom';
import goldBullion from '@/assets/gold-bars-rich.jpg';
import silverBullion from '@/assets/silver-bars-rich.jpg';
import platinumBullion from '@/assets/platinum-bars-rich.jpg';

const metals = [
  {
    name: 'Gold',
    image: goldBullion,
    href: '/marketplace/gold',
    frameClass: 'gold-frame-ornate',
    buttonClass: 'btn-gold-metallic',
    shimmerClass: 'gold-shimmer',
  },
  {
    name: 'Silver',
    image: silverBullion,
    href: '/marketplace/silver',
    frameClass: 'silver-frame-ornate',
    buttonClass: 'btn-silver-metallic',
    shimmerClass: 'silver-shimmer',
  },
  {
    name: 'Platinum',
    image: platinumBullion,
    href: '/marketplace/platinum',
    frameClass: 'platinum-frame-ornate',
    buttonClass: 'btn-platinum-metallic',
    shimmerClass: 'platinum-shimmer',
  },
];

const MetalCards = () => {
  return (
    <section className="py-20 bg-marble relative overflow-hidden">
      {/* Decorative marble texture */}
      <div className="absolute inset-0 marble-texture" />

      <div className="container mx-auto px-4 relative z-10">
        {/* Metal Cards Grid */}
        <div className="grid md:grid-cols-3 gap-10 max-w-6xl mx-auto">
          {metals.map((metal) => (
            <Link
              key={metal.name}
              to={metal.href}
              className="group relative"
            >
              {/* Card Container - Shield Shape */}
              <div className={`relative ${metal.frameClass} p-1 transition-all duration-300 group-hover:-translate-y-2`}>
                {/* Inner card */}
                <div className="bg-cream p-6 relative overflow-hidden">
                  {/* Ornate corner pieces */}
                  <div className="ornate-corner ornate-corner-tl" />
                  <div className="ornate-corner ornate-corner-tr" />
                  <div className="ornate-corner ornate-corner-bl" />
                  <div className="ornate-corner ornate-corner-br" />

                  {/* Image Container with inner border */}
                  <div className="relative mb-6">
                    <div className="absolute inset-0 border-4 border-gold/30 z-10 pointer-events-none" />
                    <div className="aspect-[4/3] overflow-hidden">
                      <img
                        src={metal.image}
                        alt={`${metal.name} Bullion`}
                        className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
                      />
                    </div>
                  </div>

                  {/* Button */}
                  <div className={`${metal.buttonClass} py-4 px-6 text-center shadow-lg group-hover:shadow-xl transition-shadow`}>
                    <span className="font-display text-base tracking-[0.15em] uppercase">
                      ★ Explore {metal.name} ★
                    </span>
                  </div>
                </div>
              </div>
            </Link>
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

export default MetalCards;
