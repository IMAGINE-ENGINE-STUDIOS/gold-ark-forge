import SlideLayout from '../SlideLayout';
import { Coins, Globe, ShieldCheck, Gem, Flame, Wheat, FileText, Beef, Building2, Landmark, Palette, Package } from 'lucide-react';
import goldBullion from '@/assets/gold-bars-rich.jpg';
import categoryEnergy from '@/assets/category-energy.jpg';
import categoryBonds from '@/assets/category-bonds.jpg';

const pillars = [
  {
    icon: Coins,
    title: 'Tokenize',
    desc: 'Transform physical assets into fractional, tradeable digital tokens backed 1:1 by verified reserves.',
    image: goldBullion,
  },
  {
    icon: Globe,
    title: 'Trade',
    desc: 'Buy and sell tokenized commodities instantly with T+0 settlement and 24/7 global market access.',
    image: categoryEnergy,
  },
  {
    icon: ShieldCheck,
    title: 'Trust',
    desc: 'Every token is anchored to Bitcoin with cryptographic proof-of-reserves and full chain-of-custody.',
    image: categoryBonds,
  },
];

const assetClasses = [
  { icon: Gem, name: 'Precious Metals' },
  { icon: Flame, name: 'Energy' },
  { icon: Wheat, name: 'Agriculture' },
  { icon: FileText, name: 'Bonds' },
  { icon: Beef, name: 'Livestock' },
  { icon: Building2, name: 'Corporate Bonds' },
  { icon: Landmark, name: 'REITs' },
  { icon: Palette, name: 'Art & Collectibles' },
  { icon: Package, name: 'Gov. Surplus' },
];

const AboutSlide = () => (
  <SlideLayout>
    <div className="flex h-full">
      {/* Left column */}
      <div className="w-[55%] flex flex-col justify-center px-[100px] py-[70px]">
        <p className="text-[16px] tracking-[0.3em] uppercase text-primary/60 mb-3">About Us</p>
        <h2 className="text-[56px] leading-tight text-secondary-foreground mb-2" style={{ fontFamily: 'Cinzel, serif' }}>
          What is <span className="text-gradient-gold">Gold Arrow</span>?
        </h2>
        <div className="greek-key-border-rich w-[120px] h-[4px] mb-10 rounded-sm" />

        <p className="text-[24px] leading-relaxed text-secondary-foreground/70 mb-10 max-w-[800px]">
          Gold Arrow is an institutional-grade platform that{' '}
          <span className="text-primary">tokenizes physical commodities</span> — precious metals, energy, and agricultural assets — into blockchain-verified digital tokens, creating a new global standard for trading, custody, and settlement.
        </p>

        {/* Asset classes grid */}
        <p className="text-[14px] tracking-[0.25em] uppercase text-primary/50 mb-4">Nine Tokenizable Asset Classes</p>
        <div className="grid grid-cols-3 gap-3">
          {assetClasses.map((a, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3 border border-primary/15 rounded bg-secondary/20">
              <a.icon className="w-6 h-6 text-primary shrink-0" />
              <span className="text-[15px] text-secondary-foreground/70">{a.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right column — 3 square pillar cards */}
      <div className="w-[45%] flex flex-col justify-center gap-6 pr-[80px] pl-[40px]">
        {pillars.map((p, i) => (
          <div
            key={i}
            className="group relative rounded-sm overflow-hidden border border-primary/30 cursor-pointer"
            style={{
              transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget;
              el.style.transform = 'scale(1.04)';
              el.style.boxShadow = '0 0 40px hsla(43,72%,50%,0.3), 0 0 80px hsla(43,72%,50%,0.1)';
              el.style.borderColor = 'hsla(43,72%,50%,0.6)';
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget;
              el.style.transform = 'scale(1)';
              el.style.boxShadow = 'none';
              el.style.borderColor = 'hsla(43,72%,50%,0.3)';
            }}
          >
            {/* Image background */}
            <div className="aspect-[16/7] relative overflow-hidden">
              <img
                src={p.image}
                alt={p.title}
                className="w-full h-full object-cover transition-transform duration-700"
                style={{ filter: 'brightness(0.5) saturate(0.7)' }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLImageElement).style.transform = 'scale(1.08)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLImageElement).style.transform = 'scale(1)';
                }}
              />
              {/* Gradient overlay */}
              <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, hsl(213,35%,10%) 0%, hsla(213,35%,10%,0.6) 50%, transparent 100%)' }} />
              {/* Gold bottom line */}
              <div className="absolute bottom-0 left-0 right-0 h-[3px]" style={{ background: 'linear-gradient(90deg, transparent, hsla(43,72%,50%,0.7), transparent)' }} />

              {/* Icon + Title overlay */}
              <div className="absolute inset-0 flex items-center justify-center gap-5">
                <div
                  className="w-[80px] h-[80px] rounded-full flex items-center justify-center shrink-0"
                  style={{
                    border: '2px solid hsla(43,72%,50%,0.4)',
                    background: 'radial-gradient(circle, hsla(43,72%,50%,0.2) 0%, transparent 70%)',
                    transition: 'all 0.5s',
                  }}
                >
                  <p.icon className="w-10 h-10 text-primary" style={{ transition: 'transform 0.5s' }} />
                </div>
                <div>
                  <h3 className="text-[32px] text-gradient-gold" style={{ fontFamily: 'Cinzel, serif' }}>{p.title}</h3>
                </div>
              </div>

              {/* Ornate corners */}
              <span className="ornate-corner ornate-corner-tl" />
              <span className="ornate-corner ornate-corner-tr" />
              <span className="ornate-corner ornate-corner-bl" />
              <span className="ornate-corner ornate-corner-br" />
            </div>

            {/* Description below */}
            <div className="px-6 py-4" style={{ background: 'hsla(213,35%,10%,0.9)' }}>
              <p className="text-[18px] leading-relaxed text-secondary-foreground/55">{p.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  </SlideLayout>
);

export default AboutSlide;
