import { useState, useEffect } from 'react';
import SlideLayout from '../SlideLayout';
import { Coins, Globe, ShieldCheck, Gem, Flame, Wheat, FileText, Beef, Building2, Landmark, Palette, Package } from 'lucide-react';
import goldBullion from '@/assets/gold-bars-rich.jpg';
import categoryEnergy from '@/assets/category-energy.jpg';
import categoryBonds from '@/assets/category-bonds.jpg';

const pillars = [
  { icon: Flame, title: 'Tokenization of Physical Commodities', desc: 'Convert barrels of crude oil, natural gas, and energy reserves into blockchain-verified digital tokens with full chain-of-custody.', image: categoryEnergy },
  { icon: Coins, title: 'Tokenize', desc: 'Transform physical assets into fractional, tradeable digital tokens backed 1:1 by verified reserves.', image: goldBullion },
  { icon: Globe, title: 'Trade', desc: 'Buy and sell tokenized commodities instantly with T+0 settlement and 24/7 global access.', image: categoryBonds },
];

const assetClasses = [
  { icon: Flame, name: 'Energy (Oil & Gas)' },
  { icon: Gem, name: 'Precious Metals' },
  { icon: Wheat, name: 'Agriculture' },
  { icon: FileText, name: 'Bonds' },
  { icon: Beef, name: 'Livestock' },
  { icon: Landmark, name: 'Rare Earth Minerals' },
  { icon: Building2, name: 'REITs' },
  { icon: Palette, name: 'Art & Collectibles' },
  { icon: Package, name: 'Gov. Surplus' },
];

const AboutSlide = () => {
  const [visible, setVisible] = useState(false);
  useEffect(() => { const t = setTimeout(() => setVisible(true), 150); return () => clearTimeout(t); }, []);

  return (
    <SlideLayout>
      <div className="flex h-full">
        {/* Left column */}
        <div className="w-[52%] flex flex-col justify-center px-[100px] py-[60px]">
          <div style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(-20px)', transition: 'all 0.8s cubic-bezier(0.22,1,0.36,1) 0.1s' }}>
            <p className="text-[16px] tracking-[0.3em] uppercase text-primary/60 mb-3">About Us</p>
            <h2 className="text-[52px] leading-tight text-secondary-foreground mb-2" style={{ fontFamily: 'Cinzel, serif' }}>
              What is <span className="text-gradient-gold">Gold Arrow</span>?
            </h2>
            <div className="greek-key-border-rich w-[120px] h-[4px] mb-8 rounded-sm" />
          </div>

          <div
            className="text-[20px] leading-[1.8] text-secondary-foreground/70 mb-10 max-w-[750px]"
            style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(15px)', transition: 'all 0.8s cubic-bezier(0.22,1,0.36,1) 0.3s' }}
          >
            <p className="mb-4">
              Gold Arrow is an <span className="text-primary font-semibold">institutional-grade platform</span> that tokenizes physical commodities into blockchain-verified digital tokens.
            </p>
            <p className="text-[18px] text-secondary-foreground/55 leading-relaxed">
              Starting with <span className="text-primary font-medium">crude oil and energy reserves</span>, we create a new global standard for trading, custody, and settlement — spanning precious metals, agriculture, rare earth minerals, and beyond.
            </p>
          </div>

          {/* Asset classes */}
          <div style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(15px)', transition: 'all 0.8s cubic-bezier(0.22,1,0.36,1) 0.5s' }}>
            <p className="text-[13px] tracking-[0.25em] uppercase text-primary/50 mb-4">Nine Tokenizable Asset Classes</p>
            <div className="grid grid-cols-3 gap-2.5">
              {assetClasses.map((a, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2.5 px-4 py-2.5 rounded-lg transition-all duration-300 hover:border-primary/40 hover:bg-primary/5 cursor-default"
                  style={{
                    border: '1px solid hsla(43,72%,50%,0.12)',
                    background: 'hsla(213,32%,16%,0.3)',
                    opacity: visible ? 1 : 0,
                    transform: visible ? 'translateX(0)' : 'translateX(-10px)',
                    transition: `all 0.5s cubic-bezier(0.22,1,0.36,1) ${0.6 + i * 0.05}s`,
                  }}
                >
                  <a.icon className="w-5 h-5 text-primary/70 shrink-0" />
                  <span className="text-[14px] text-secondary-foreground/65">{a.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right column — compact pillar cards */}
        <div className="w-[48%] flex flex-col justify-center gap-5 pr-[80px] pl-[30px]">
          {pillars.map((p, i) => (
            <div
              key={i}
              className="group relative rounded-xl overflow-hidden cursor-pointer"
              style={{
                border: '1px solid hsla(43,72%,50%,0.2)',
                boxShadow: '0 6px 30px hsla(0,0%,0%,0.3)',
                opacity: visible ? 1 : 0,
                transform: visible ? 'translateX(0) scale(1)' : 'translateX(40px) scale(0.95)',
                transition: `all 0.8s cubic-bezier(0.22,1,0.36,1) ${0.3 + i * 0.2}s`,
              }}
            >
              {/* Image background — shorter aspect */}
              <div className="aspect-[16/6] relative overflow-hidden">
                <img
                  src={p.image}
                  alt={p.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  style={{ filter: 'brightness(0.45) saturate(0.7)' }}
                />
                {/* Gradient overlay */}
                <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, hsla(213,35%,10%,0.7) 0%, hsla(43,72%,50%,0.05) 100%)' }} />
                <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, hsla(213,35%,10%,0.95) 0%, transparent 60%)' }} />

                {/* Gold shimmer line */}
                <div
                  className="absolute bottom-0 left-0 right-0 h-[2px] transition-all duration-500 group-hover:h-[3px]"
                  style={{ background: 'linear-gradient(90deg, transparent, hsla(43,72%,50%,0.6), transparent)' }}
                />

                {/* Content overlay */}
                <div className="absolute inset-0 flex items-center px-8 gap-5">
                  <div
                    className="w-[60px] h-[60px] rounded-xl flex items-center justify-center shrink-0 transition-all duration-500 group-hover:scale-110 group-hover:rotate-3"
                    style={{
                      border: '1.5px solid hsla(43,72%,50%,0.35)',
                      background: 'radial-gradient(circle, hsla(43,72%,50%,0.15) 0%, transparent 70%)',
                      backdropFilter: 'blur(8px)',
                    }}
                  >
                    <p.icon className="w-7 h-7 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-[28px] text-secondary-foreground mb-1 transition-colors duration-300 group-hover:text-primary" style={{ fontFamily: 'Cinzel, serif' }}>
                      {p.title}
                    </h3>
                    <p className="text-[15px] text-secondary-foreground/50 leading-snug">{p.desc}</p>
                  </div>
                </div>

                {/* Corner accents */}
                <span className="absolute top-2 right-2 w-[16px] h-[16px] border-t border-r rounded-tr-lg pointer-events-none transition-all duration-500 group-hover:w-[24px] group-hover:h-[24px]" style={{ borderColor: 'hsla(43,72%,50%,0.3)' }} />
                <span className="absolute bottom-2 left-2 w-[16px] h-[16px] border-b border-l rounded-bl-lg pointer-events-none transition-all duration-500 group-hover:w-[24px] group-hover:h-[24px]" style={{ borderColor: 'hsla(43,72%,50%,0.3)' }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </SlideLayout>
  );
};

export default AboutSlide;