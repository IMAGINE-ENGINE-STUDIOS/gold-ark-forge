import { Link } from 'react-router-dom';
import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import goldBullion from '@/assets/gold-bars-rich.jpg';
import categoryEnergy from '@/assets/category-energy.jpg';
import categoryAgricultural from '@/assets/category-agricultural.jpg';
import categoryBonds from '@/assets/category-bonds.jpg';
import categorySurplus from '@/assets/category-gov-surplus.jpg';
import categoryLivestock from '@/assets/category-livestock.jpg';
import categoryReits from '@/assets/category-reits.jpg';
import categoryArt from '@/assets/category-art.jpg';
import categoryRareEarth from '@/assets/category-rare-earth.jpg';

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
    name: 'Live Stock',
    description: 'Cattle, hogs & feeder livestock futures',
    image: categoryLivestock,
    href: '/marketplace',
    accentClass: 'from-orange-400/80 to-orange-400/20',
    borderClass: 'border-orange-400/30 hover:border-orange-400/60',
    tagClass: 'bg-orange-400/20 text-orange-300',
  },
  {
    name: 'Bonds',
    description: 'T-Bills, CDs, TIPS, Corporate IG/HY & Agency MBS',
    image: categoryBonds,
    href: '/marketplace',
    accentClass: 'from-sky-400/80 to-sky-400/20',
    borderClass: 'border-sky-400/30 hover:border-sky-400/60',
    tagClass: 'bg-sky-400/20 text-sky-300',
    subItems: [
      'Certificates of Deposit (CDs)',
      'Treasury Bills (T-Bills)',
      'Treasury Inflation-Protected Securities (TIPS)',
      'Agency Mortgage-Backed Securities (MBS)',
      'Investment Grade Corporate Bonds',
      'High-Yield Corporate Bonds',
    ],
  },
  {
    name: 'Rare Earth Minerals',
    description: 'Lithium, cobalt, neodymium & critical elements',
    image: categoryRareEarth,
    href: '/marketplace',
    accentClass: 'from-cyan-400/80 to-cyan-400/20',
    borderClass: 'border-cyan-400/30 hover:border-cyan-400/60',
    tagClass: 'bg-cyan-400/20 text-cyan-300',
  },
  {
    name: 'REITs',
    description: 'Real estate investment trusts & property income',
    image: categoryReits,
    href: '/marketplace',
    accentClass: 'from-rose-400/80 to-rose-400/20',
    borderClass: 'border-rose-400/30 hover:border-rose-400/60',
    tagClass: 'bg-rose-400/20 text-rose-300',
  },
  {
    name: 'Art',
    description: 'Fine art, collectibles & cultural assets',
    image: categoryArt,
    href: '/marketplace',
    accentClass: 'from-fuchsia-400/80 to-fuchsia-400/20',
    borderClass: 'border-fuchsia-400/30 hover:border-fuchsia-400/60',
    tagClass: 'bg-fuchsia-400/20 text-fuchsia-300',
  },
  {
    name: 'Gov. Surplus',
    description: 'Government surplus equipment, vehicles & assets',
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

      <div className="w-full px-4 md:px-8 lg:px-12 relative z-10">
        <div className="text-center mb-12">
          <div className="h-1 w-24 mx-auto bg-gradient-to-r from-transparent via-gold to-transparent mb-6" />
          <h2 className="font-display text-3xl md:text-4xl text-gold-light mb-3 tracking-[0.08em]">
            EXPLORE MARKETS
          </h2>
          <p className="text-marble/50 max-w-xl mx-auto text-sm">
            Institutional-grade access across nine core asset classes
          </p>
        </div>

        {/* 3-column wide grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-5">
          {categories.map((cat) => (
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
  subItems?: string[];
}

const CategoryCard = ({ name, description, image, href, accentClass, borderClass, tagClass, subItems }: CategoryCardProps) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="relative">
      <Link to={href} className="group relative block">
        <div className={`relative rounded-sm border ${borderClass} overflow-hidden transition-all duration-500 group-hover:-translate-y-1 group-hover:shadow-2xl`}>
          {/* Image - horizontal rectangle */}
          <div className="aspect-[16/9] overflow-hidden relative">
            <img
              src={image}
              alt={name}
              className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/50 to-transparent" />
            <div className={`absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r ${accentClass}`} />
          </div>

          {/* Content */}
          <div className="bg-navy-light/50 backdrop-blur-sm p-4">
            <div className="flex items-center justify-between mb-1.5">
              <h3 className="font-display text-sm md:text-base tracking-[0.1em] text-marble group-hover:text-gold-light transition-colors">
                {name.toUpperCase()}
              </h3>
              <span className={`text-[8px] font-display tracking-[0.2em] px-1.5 py-0.5 rounded-full ${tagClass}`}>
                LIVE
              </span>
            </div>
            <p className="text-marble/40 text-[11px] leading-relaxed">
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

      {/* Sub-items expand button */}
      {subItems && subItems.length > 0 && (
        <>
          <button
            onClick={() => setExpanded(!expanded)}
            className={`w-full mt-1 flex items-center justify-center gap-1 text-[9px] font-display tracking-[0.15em] py-1.5 rounded-sm border transition-all ${
              expanded ? 'border-sky-400/40 text-sky-300 bg-sky-400/10' : 'border-gold/15 text-marble/30 hover:text-marble/50 hover:border-gold/30'
            }`}
          >
            {expanded ? 'HIDE' : 'VIEW'} INSTRUMENTS
            {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
          {expanded && (
            <div className="mt-1 bg-navy-light/60 border border-gold/10 rounded-sm p-3 space-y-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
              {subItems.map((item) => (
                <div key={item} className="flex items-center gap-2 text-[10px] text-marble/50">
                  <div className="w-1 h-1 rounded-full bg-sky-400/60 flex-shrink-0" />
                  {item}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default CategoryCards;
