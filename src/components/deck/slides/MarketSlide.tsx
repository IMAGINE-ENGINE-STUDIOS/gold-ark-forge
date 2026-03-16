import SlideLayout from '../SlideLayout';

const rings = [
  { label: 'TAM', value: '$12.1T', desc: 'Global precious metals market', size: 420, color: 'hsl(43,72%,50%)' },
  { label: 'SAM', value: '$680B', desc: 'Institutionally custodied bullion', size: 300, color: 'hsl(43,76%,62%)' },
  { label: 'SOM', value: '$4.2B', desc: 'Digital certification addressable', size: 180, color: 'hsl(45,85%,72%)' },
];

const MarketSlide = () => (
  <SlideLayout>
    <div className="flex h-full">
      {/* Left text */}
      <div className="flex flex-col justify-center px-[120px] w-[55%]">
        <p className="text-[16px] tracking-[0.3em] uppercase text-primary/60 mb-3">Market Opportunity</p>
        <h2 className="text-[52px] leading-tight text-secondary-foreground mb-2" style={{ fontFamily: 'Cinzel, serif' }}>
          A <span className="text-gradient-gold">Massive</span> Undigitised Market
        </h2>
        <div className="w-[100px] h-[3px] bg-primary/40 mb-10" />
        <p className="text-[22px] leading-relaxed text-secondary-foreground/60 mb-8">
          Precious metals represent one of the largest asset classes globally, yet digital infrastructure for certification, verification, and transfer remains nascent.
        </p>
        <p className="text-[22px] leading-relaxed text-secondary-foreground/60">
          Gold Arrow targets the institutional segment first — vaults, custodians, and dealers — before expanding to retail and commodity markets.
        </p>
      </div>

      {/* Right concentric rings */}
      <div className="flex-1 flex items-center justify-center relative">
        {rings.map((r, i) => (
          <div
            key={i}
            className="absolute rounded-full border-2 flex items-center justify-center"
            style={{ width: r.size, height: r.size, borderColor: r.color + '40' }}
          >
            {i === rings.length - 1 && (
              <div className="text-center">
                {rings.map((rr, j) => (
                  <div key={j} className={j > 0 ? 'mt-1' : ''}>
                    <span className="text-[14px] tracking-wider text-secondary-foreground/50">{rr.label}</span>
                    <span className="text-[20px] font-bold ml-2" style={{ color: rr.color }}>{rr.value}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  </SlideLayout>
);

export default MarketSlide;
