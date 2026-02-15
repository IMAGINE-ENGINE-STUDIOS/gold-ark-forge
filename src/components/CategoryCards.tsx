import { Link } from 'react-router-dom';
import goldBullion from '@/assets/gold-bars-rich.jpg';
import categoryEnergy from '@/assets/category-energy.jpg';
import categoryAgricultural from '@/assets/category-agricultural.jpg';
import categoryBonds from '@/assets/category-bonds.jpg';
import categorySurplus from '@/assets/category-surplus.jpg';

const categories = [
  {
    name: 'Precious Metals',
    description: 'Gold, Silver & Platinum bullion certificates',
    image: goldBullion,
    href: '/marketplace',
    accentClass: 'from-gold/80 to-gold/20',
    borderClass: 'border-gold/40 hover:border-gold/70',
    tagClass: 'bg-gold/20 text-gold',
  },
  {
    name: 'Energy',
    description: 'Crude oil, natural gas & power commodities',
    image: categoryEnergy,
    href: '/oil-gas',
    accentClass: 'from-amber-500/80 to-amber-500/20',
    borderClass: 'border-amber-500/30 hover:border-amber-500/60',
    tagClass: 'bg-amber-500/20 text-amber-400',
  },
  {
    name: 'Agricultural',
    description: 'Wheat, coffee, cotton & soft commodities',
    image: categoryAgricultural,
    href: '/marketplace',
    accentClass: 'from-emerald-500/80 to-emerald-500/20',
    borderClass: 'border-emerald-500/30 hover:border-emerald-500/60',
    tagClass: 'bg-emerald-500/20 text-emerald-400',
  },
  {
    name: 'Bonds',
    description: 'Treasury notes, corporate & sovereign debt',
    image: categoryBonds,
    href: '/marketplace',
    accentClass: 'from-sky-400/80 to-sky-400/20',
    borderClass: 'border-sky-400/30 hover:border-sky-400/60',
    tagClass: 'bg-sky-400/20 text-sky-300',
  },
  {
    name: 'Surplus',
    description: 'Liquidation, overstock & bulk inventory',
    image: categorySurplus,
    href: '/marketplace',
    accentClass: 'from-purple-400/80 to-purple-400/20',
    borderClass: 'border-purple-400/30 hover:border-purple-400/60',
    tagClass: 'bg-purple-400/20 text-purple-300',
  },
];

const CategoryCards = () => {
  return (
    <section className="py-20 bg-navy relative overflow-hidden">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, hsl(var(--gold)) 1px, transparent 0)', backgroundSize: '40px 40px' }} />

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-12">
          <div className="h-1 w-24 mx-auto bg-gradient-to-r from-transparent via-gold to-transparent mb-6" />
          <h2 className="font-display text-3xl md:text-4xl text-gold-light mb-3 tracking-[0.08em]">
            EXPLORE MARKETS
          </h2>
          <p className="text-marble/50 max-w-xl mx-auto text-sm">
            Institutional-grade access across five core asset classes
          </p>
        </div>

        {/* Top row: 3 cards */}
        <div className="grid md:grid-cols-3 gap-5 max-w-6xl mx-auto mb-5">
          {categories.slice(0, 3).map((cat) => (
            <CategoryCard key={cat.name} {...cat} />
          ))}
        </div>

        {/* Bottom row: 2 cards centered */}
        <div className="grid md:grid-cols-2 gap-5 max-w-4xl mx-auto">
          {categories.slice(3).map((cat) => (
            <CategoryCard key={cat.name} {...cat} />
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

interface CategoryCardProps {
  name: string;
  description: string;
  image: string;
  href: string;
  accentClass: string;
  borderClass: string;
  tagClass: string;
}

const CategoryCard = ({ name, description, image, href, accentClass, borderClass, tagClass }: CategoryCardProps) => (
  <Link to={href} className="group relative">
    <div className={`relative rounded-sm border ${borderClass} overflow-hidden transition-all duration-500 group-hover:-translate-y-1 group-hover:shadow-2xl`}>
      {/* Image */}
      <div className="aspect-[16/10] overflow-hidden relative">
        <img
          src={image}
          alt={name}
          className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/60 to-transparent" />
        {/* Accent line at bottom of image */}
        <div className={`absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r ${accentClass}`} />
      </div>

      {/* Content */}
      <div className="bg-navy-light/50 backdrop-blur-sm p-5">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-display text-lg tracking-[0.1em] text-marble group-hover:text-gold-light transition-colors">
            {name.toUpperCase()}
          </h3>
          <span className={`text-[9px] font-display tracking-[0.2em] px-2 py-0.5 rounded-full ${tagClass}`}>
            LIVE
          </span>
        </div>
        <p className="text-marble/40 text-xs leading-relaxed">
          {description}
        </p>
      </div>

      {/* Ornate corners */}
      <div className="ornate-corner ornate-corner-tl" />
      <div className="ornate-corner ornate-corner-tr" />
      <div className="ornate-corner ornate-corner-bl" />
      <div className="ornate-corner ornate-corner-br" />
    </div>
  </Link>
);

export default CategoryCards;
