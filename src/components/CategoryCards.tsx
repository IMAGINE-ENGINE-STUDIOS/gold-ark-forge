import { Link } from 'react-router-dom';
import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import goldBullion from '@/assets/gold-bars-rich.jpg';
import categoryEnergy from '@/assets/category-energy.jpg';
import categoryAgricultural from '@/assets/category-agricultural.jpg';
import categoryBonds from '@/assets/category-bonds.jpg';
import categorySurplus from '@/assets/category-gov-surplus.jpg';
import categoryLivestock from '@/assets/category-livestock.jpg';
import categoryCorporateBonds from '@/assets/category-corporate-bonds.jpg';
import categoryReits from '@/assets/category-reits.jpg';
import categoryArt from '@/assets/category-art.jpg';

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
    description: 'CDs, T-Bills, TIPS, Agency MBS & High-Yield Savings',
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
      'High-Yield Savings & Money Market Accounts',
    ],
  },
  {
    name: 'Corporate Bonds',
    description: 'High-grade AAA/AA corporate debt instruments',
    image: categoryCorporateBonds,
    href: '/marketplace',
    accentClass: 'from-indigo-400/80 to-indigo-400/20',
    borderClass: 'border-indigo-400/30 hover:border-indigo-400/60',
    tagClass: 'bg-indigo-400/20 text-indigo-300',
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

      <div className="w-full px-0 relative z-10">
        <div className="text-center mb-12 px-4">
          <div className="h-1 w-24 mx-auto bg-gradient-to-r from-transparent via-gold to-transparent mb-6" />
          <h2 className="font-display text-3xl md:text-4xl text-gold-light mb-3 tracking-[0.08em]">
            EXPLORE MARKETS
          </h2>
          <p className="text-marble/50 max-w-xl mx-auto text-sm">
            Institutional-grade access across nine core asset classes
          </p>
        </div>

        {/* Edge-to-edge grid */}
        <div className="grid grid-cols-3 md:grid-cols-3 lg:grid-cols-9 gap-0">
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
    <div className="relative group">
      <Link to={href} className="block relative overflow-hidden">
        {/* Full image with overlay */}
        <div className="aspect-[3/4] overflow-hidden relative">
          <img
            src={image}
            alt={name}
            className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
          />
          {/* Dark overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/70 to-navy/30 group-hover:from-navy/90 group-hover:via-navy/50 group-hover:to-navy/20 transition-all duration-500" />
          {/* Accent line */}
          <div className={`absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r ${accentClass} opacity-60 group-hover:opacity-100 transition-opacity`} />
          {/* Side borders on hover */}
          <div className={`absolute inset-0 border-x-0 border-y-0 group-hover:border-x border-transparent group-hover:${borderClass.split(' ')[0]} transition-all duration-300`} />

          {/* Content overlay at bottom */}
          <div className="absolute bottom-0 left-0 right-0 p-3 md:p-4">
            <span className={`text-[7px] font-display tracking-[0.25em] px-1.5 py-0.5 rounded-full ${tagClass} inline-block mb-2`}>
              LIVE
            </span>
            <h3 className="font-display text-xs md:text-sm tracking-[0.12em] text-marble group-hover:text-gold-light transition-colors mb-1">
              {name.toUpperCase()}
            </h3>
            <p className="text-marble/35 text-[9px] md:text-[10px] leading-relaxed hidden md:block">
              {description}
            </p>
          </div>
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
