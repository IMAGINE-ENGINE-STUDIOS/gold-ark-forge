import SlideLayout from '../SlideLayout';
import { Coins, Globe, ShieldCheck, Gem, Flame, Wheat, FileText, Beef, Building2, Landmark, Palette, Package } from 'lucide-react';

const pillars = [
  { icon: Coins, title: 'Tokenize', desc: 'Transform physical assets into fractional, tradeable digital tokens backed 1:1 by verified reserves in insured vaults worldwide.' },
  { icon: Globe, title: 'Trade', desc: 'Buy and sell tokenized commodities instantly with T+0 settlement, no intermediaries, and 24/7 global market access.' },
  { icon: ShieldCheck, title: 'Trust', desc: 'Every token is anchored to Bitcoin with cryptographic proof-of-reserves, real-time auditing, and full chain-of-custody.' },
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
          Gold Arrow is an institutional-grade platform that <span className="text-primary">tokenizes physical commodities</span> — precious metals, energy, and agricultural assets — into blockchain-verified digital tokens, creating a new global standard for trading, custody, and settlement.
        </p>

        {/* Asset classes grid */}
        <p className="text-[14px] tracking-[0.25em] uppercase text-primary/50 mb-4">Nine Tokenizable Asset Classes</p>
        <div className="grid grid-cols-3 gap-3">
          {assetClasses.map((a, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3 border border-primary/15 rounded bg-secondary/20">
              <a.icon className="w-5 h-5 text-primary shrink-0" />
              <span className="text-[15px] text-secondary-foreground/70">{a.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right column — 3 pillars */}
      <div className="w-[45%] flex flex-col justify-center gap-10 pr-[80px] pl-[40px]">
        {pillars.map((p, i) => (
          <div key={i} className="flex flex-col items-center text-center">
            <div className="w-[100px] h-[100px] rounded-full flex items-center justify-center mb-6"
              style={{
                background: 'radial-gradient(circle, hsla(43,72%,50%,0.15) 0%, transparent 70%)',
                border: '2px solid hsla(43,72%,50%,0.3)',
                boxShadow: '0 0 30px hsla(43,72%,50%,0.1)',
              }}
            >
              <p.icon className="w-12 h-12 text-primary" />
            </div>
            <h3 className="text-[28px] text-gradient-gold mb-3" style={{ fontFamily: 'Cinzel, serif' }}>{p.title}</h3>
            <p className="text-[18px] leading-relaxed text-secondary-foreground/55 max-w-[380px]">{p.desc}</p>
          </div>
        ))}
      </div>
    </div>
  </SlideLayout>
);

export default AboutSlide;
