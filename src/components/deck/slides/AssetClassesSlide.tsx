import SlideLayout from '../SlideLayout';
import { Gem, Flame, Wheat, FileText, Beef, Building2, Landmark, Palette, Package } from 'lucide-react';

const assets = [
  { icon: Gem,       name: 'Precious Metals',    desc: 'Gold, Silver, Platinum, Palladium', size: '$12.1T' },
  { icon: Flame,     name: 'Energy',              desc: 'Crude Oil, Natural Gas, Uranium',   size: '$6.2T' },
  { icon: Wheat,     name: 'Agricultural',         desc: 'Grains, Coffee, Sugar, Cotton',     size: '$4.8T' },
  { icon: FileText,  name: 'Bonds',               desc: 'T-Bills, CDs, TIPS, Agency MBS',    size: '$46T' },
  { icon: Beef,      name: 'Livestock',            desc: 'Cattle, Hogs, Feeder Cattle',       size: '$1.4T' },
  { icon: Building2, name: 'Corporate Bonds',     desc: 'Investment Grade, High-Yield',       size: '$10.5T' },
  { icon: Landmark,  name: 'REITs',               desc: 'Commercial, Residential, Industrial', size: '$2.5T' },
  { icon: Palette,   name: 'Art & Collectibles',  desc: 'Fine Art, Rare Assets, Antiques',    size: '$1.7T' },
  { icon: Package,   name: 'Gov. Surplus',         desc: 'Equipment, Fleet, Infrastructure',  size: '$0.5T' },
];

const AssetClassesSlide = () => (
  <SlideLayout>
    <div className="flex flex-col h-full px-[100px] py-[70px]">
      <p className="text-[16px] tracking-[0.3em] uppercase text-primary/60 mb-3">Asset Universe</p>
      <h2 className="text-[52px] leading-tight text-secondary-foreground mb-2" style={{ fontFamily: 'Cinzel, serif' }}>
        Nine <span className="text-gradient-gold">Tokenizable</span> Asset Classes
      </h2>
      <div className="w-[100px] h-[3px] bg-primary/40 mb-10" />

      <div className="grid grid-cols-3 gap-6 flex-1 items-start">
        {assets.map((a, i) => (
          <div key={i} className="flex gap-5 items-start border border-primary/10 rounded-lg px-6 py-5 bg-secondary/20">
            <div className="w-[52px] h-[52px] rounded flex items-center justify-center bg-primary/10 border border-primary/20 shrink-0">
              <a.icon className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
              <div className="flex items-baseline justify-between mb-1">
                <h3 className="text-[22px] text-secondary-foreground" style={{ fontFamily: 'Cinzel, serif' }}>{a.name}</h3>
                <span className="text-[16px] text-primary font-semibold">{a.size}</span>
              </div>
              <p className="text-[16px] leading-relaxed text-secondary-foreground/50">{a.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <p className="text-[18px] text-secondary-foreground/40 text-center mt-6">
        Combined addressable market: <span className="text-primary font-semibold">$85T+</span> in tokenizable real-world assets
      </p>
    </div>
  </SlideLayout>
);

export default AssetClassesSlide;
