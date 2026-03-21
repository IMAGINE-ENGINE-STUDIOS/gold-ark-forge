import SlideLayout from '../SlideLayout';
import goldBullion from '@/assets/gold-bars-rich.jpg';
import categoryEnergy from '@/assets/category-energy.jpg';
import categoryAgricultural from '@/assets/category-agricultural.jpg';
import categoryBonds from '@/assets/category-bonds.jpg';
import categoryLivestock from '@/assets/category-livestock.jpg';
import categoryReits from '@/assets/category-reits.jpg';
import categoryArt from '@/assets/category-art.jpg';
import categorySurplus from '@/assets/category-gov-surplus.jpg';
import categoryRareEarth from '@/assets/category-rare-earth.jpg';

const assets = [
  { name: 'Precious Metals', desc: 'Gold, Silver, Platinum', size: '$12.1T', image: goldBullion },
  { name: 'Energy', desc: 'Crude Oil, Natural Gas, Uranium', size: '$6.2T', image: categoryEnergy },
  { name: 'Agricultural', desc: 'Grains, Coffee, Sugar, Cotton', size: '$4.8T', image: categoryAgricultural },
  { name: 'Bonds', desc: 'T-Bills, CDs, TIPS, Corporate IG/HY', size: '$56.5T', image: categoryBonds },
  { name: 'Livestock', desc: 'Cattle, Hogs, Feeder Cattle', size: '$1.4T', image: categoryLivestock },
  { name: 'Rare Earth Minerals', desc: 'Lithium, Cobalt, Neodymium', size: '$3.2T', image: categoryRareEarth },
  { name: 'REITs', desc: 'Commercial, Residential', size: '$2.5T', image: categoryReits },
  { name: 'Art & Collectibles', desc: 'Fine Art, Rare Assets', size: '$1.7T', image: categoryArt },
  { name: 'Gov. Surplus', desc: 'Equipment, Fleet, Infra', size: '$0.5T', image: categorySurplus },
];

const AssetClassesSlide = () => (
  <SlideLayout>
    <div className="flex flex-col h-full px-[80px] py-[60px]">
      <p className="text-[16px] tracking-[0.3em] uppercase text-primary/60 mb-3">Asset Universe</p>
      <h2 className="text-[52px] leading-tight text-secondary-foreground mb-2" style={{ fontFamily: 'Cinzel, serif' }}>
        Nine <span className="text-gradient-gold">Tokenizable</span> Asset Classes
      </h2>
      <div className="greek-key-border-rich w-[120px] h-[4px] mb-8 rounded-sm" />

      <div className="grid grid-cols-3 gap-5 flex-1">
        {assets.map((a, i) => (
          <div key={i} className="relative rounded-lg overflow-hidden group"
            style={{
              border: '1px solid hsla(43,72%,50%,0.25)',
              boxShadow: '0 4px 20px hsla(43,72%,50%,0.08)',
            }}
          >
            <img src={a.image} alt={a.name} className="absolute inset-0 w-full h-full object-cover" />
            {/* Dark overlay */}
            <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, hsla(213,35%,10%,0.5) 0%, hsla(213,35%,10%,0.85) 100%)' }} />
            
            {/* Ornate corners */}
            <span className="absolute top-2 left-2 w-4 h-4 border-l-2 border-t-2" style={{ borderColor: 'hsla(43,72%,50%,0.5)' }} />
            <span className="absolute top-2 right-2 w-4 h-4 border-r-2 border-t-2" style={{ borderColor: 'hsla(43,72%,50%,0.5)' }} />
            <span className="absolute bottom-2 left-2 w-4 h-4 border-l-2 border-b-2" style={{ borderColor: 'hsla(43,72%,50%,0.5)' }} />
            <span className="absolute bottom-2 right-2 w-4 h-4 border-r-2 border-b-2" style={{ borderColor: 'hsla(43,72%,50%,0.5)' }} />

            {/* Content */}
            <div className="relative z-10 p-5 flex flex-col h-full justify-end">
              <div className="flex items-baseline justify-between mb-1">
                <h3 className="text-[22px] text-secondary-foreground" style={{ fontFamily: 'Cinzel, serif' }}>{a.name}</h3>
                <span className="text-[18px] text-primary font-bold" style={{ fontFamily: 'Cinzel, serif' }}>{a.size}</span>
              </div>
              <p className="text-[15px] text-secondary-foreground/50">{a.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 text-center rounded-lg py-4"
        style={{
          background: 'linear-gradient(90deg, hsla(43,72%,50%,0.06) 0%, hsla(43,72%,50%,0.12) 50%, hsla(43,72%,50%,0.06) 100%)',
          border: '1px solid hsla(43,72%,50%,0.15)',
        }}
      >
        <p className="text-[20px] text-secondary-foreground/60">
          Combined addressable market: <span className="text-gradient-gold text-[24px] font-bold" style={{ fontFamily: 'Cinzel, serif' }}>$88T+</span> in tokenizable real-world assets
        </p>
      </div>
    </div>
  </SlideLayout>
);

export default AssetClassesSlide;
