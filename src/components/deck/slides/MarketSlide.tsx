import SlideLayout from '../SlideLayout';

const segments = [
  { label: 'Bonds & Fixed Income', value: '$46T', pct: 100 },
  { label: 'Precious Metals', value: '$12.1T', pct: 26 },
  { label: 'Corporate Bonds', value: '$10.5T', pct: 23 },
  { label: 'Energy', value: '$6.2T', pct: 13 },
  { label: 'Agricultural', value: '$4.8T', pct: 10 },
  { label: 'REITs', value: '$2.5T', pct: 5 },
  { label: 'Art & Collectibles', value: '$1.7T', pct: 4 },
  { label: 'Livestock', value: '$1.4T', pct: 3 },
  { label: 'Gov. Surplus', value: '$0.5T', pct: 1 },
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
        <div className="greek-key-border-rich w-[120px] h-[4px] mb-8 rounded-sm" />
        <p className="text-[22px] leading-relaxed text-secondary-foreground/60 mb-8">
          Nine commodity asset classes remain largely un-tokenized. Gold Arrow targets the institutional segment first, then expands across energy, agriculture, bonds, real estate, art, and government surplus.
        </p>
        <div className="grid grid-cols-3 gap-4 mt-2">
          {[
            { val: '$85T+', label: 'TAM' },
            { val: '$2.8T', label: 'SAM' },
            { val: '$12B', label: 'SOM (Y3)' },
          ].map((s, i) => (
            <div key={i} className="rounded-lg p-4 text-center"
              style={{
                border: '1px solid hsla(43,72%,50%,0.2)',
                background: 'linear-gradient(135deg, hsla(213,32%,16%,0.5) 0%, hsla(213,35%,10%,0.3) 100%)',
                boxShadow: '0 0 20px hsla(43,72%,50%,0.05)',
              }}
            >
              <p className="text-[28px] text-primary font-bold" style={{ fontFamily: 'Cinzel, serif' }}>{s.val}</p>
              <p className="text-[14px] text-secondary-foreground/50">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right bars */}
      <div className="flex-1 flex flex-col justify-center pr-[80px] gap-4">
        {segments.map((s, i) => (
          <div key={i} className="flex items-center gap-4">
            <span className="text-[15px] text-secondary-foreground/60 w-[180px] text-right shrink-0">{s.label}</span>
            <div className="flex-1 h-[28px] rounded overflow-hidden" style={{ background: 'hsla(213,32%,16%,0.5)' }}>
              <div
                className="h-full rounded"
                style={{
                  width: `${Math.max(s.pct, 6)}%`,
                  background: `linear-gradient(90deg, hsla(43,72%,45%,0.7) 0%, hsla(43,72%,60%,0.9) 100%)`,
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
