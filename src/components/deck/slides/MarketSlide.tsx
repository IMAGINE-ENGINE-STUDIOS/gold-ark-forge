import SlideLayout from '../SlideLayout';

const segments = [
  { label: 'Precious Metals', value: '$12.1T', pct: 100 },
  { label: 'Corporate Bonds', value: '$10.5T', pct: 87 },
  { label: 'Energy',          value: '$6.2T',  pct: 51 },
  { label: 'Agricultural',    value: '$4.8T',  pct: 40 },
  { label: 'REITs',           value: '$2.5T',  pct: 21 },
  { label: 'Art & Collectibles', value: '$1.7T', pct: 14 },
  { label: 'Livestock',       value: '$1.4T',  pct: 12 },
  { label: 'Gov. Surplus',    value: '$0.5T',  pct: 4 },
  { label: 'Bonds & Fixed Income', value: '$46T', pct: 100 },
];

const MarketSlide = () => (
  <SlideLayout>
    <div className="flex h-full">
      {/* Left text */}
      <div className="flex flex-col justify-center px-[100px] w-[50%]">
        <p className="text-[16px] tracking-[0.3em] uppercase text-primary/60 mb-3">Market Opportunity</p>
        <h2 className="text-[52px] leading-tight text-secondary-foreground mb-2" style={{ fontFamily: 'Cinzel, serif' }}>
          <span className="text-gradient-gold">$85T+</span> Addressable
        </h2>
        <div className="w-[100px] h-[3px] bg-primary/40 mb-8" />
        <p className="text-[22px] leading-relaxed text-secondary-foreground/60 mb-6">
          Nine commodity asset classes remain largely un-tokenized. Gold Arrow targets the institutional segment first, then expands across energy, agriculture, bonds, real estate, art, and government surplus.
        </p>
        <div className="grid grid-cols-3 gap-4 mt-2">
          <div className="border border-primary/20 rounded-lg p-4 text-center bg-secondary/30">
            <p className="text-[28px] text-primary font-bold">$85T+</p>
            <p className="text-[14px] text-secondary-foreground/50">TAM</p>
          </div>
          <div className="border border-primary/20 rounded-lg p-4 text-center bg-secondary/30">
            <p className="text-[28px] text-primary font-bold">$2.8T</p>
            <p className="text-[14px] text-secondary-foreground/50">SAM</p>
          </div>
          <div className="border border-primary/20 rounded-lg p-4 text-center bg-secondary/30">
            <p className="text-[28px] text-primary font-bold">$12B</p>
            <p className="text-[14px] text-secondary-foreground/50">SOM (Y3)</p>
          </div>
        </div>
      </div>

      {/* Right bars */}
      <div className="flex-1 flex flex-col justify-center pr-[80px] gap-4">
        {segments.map((s, i) => (
          <div key={i} className="flex items-center gap-4">
            <span className="text-[15px] text-secondary-foreground/60 w-[180px] text-right shrink-0">{s.label}</span>
            <div className="flex-1 h-[28px] bg-secondary/30 rounded overflow-hidden">
              <div
                className="h-full rounded"
                style={{
                  width: `${Math.max(s.pct, 6)}%`,
                  background: `linear-gradient(90deg, hsl(43,72%,50%) 0%, hsl(43,72%,65%) 100%)`,
                  opacity: 0.6 + (s.pct / 100) * 0.4,
                }}
              />
            </div>
            <span className="text-[16px] text-primary font-semibold w-[70px]">{s.value}</span>
          </div>
        ))}
      </div>
    </div>
  </SlideLayout>
);

export default MarketSlide;
