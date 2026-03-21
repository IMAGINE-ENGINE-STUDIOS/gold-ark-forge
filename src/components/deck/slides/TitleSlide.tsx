import SlideLayout from '../SlideLayout';

const TitleSlide = () => (
  <SlideLayout>
    {/* Radial gold glow */}
    <div className="absolute inset-0 pointer-events-none" style={{
      background: 'radial-gradient(ellipse 800px 600px at 50% 45%, hsla(43,72%,50%,0.12) 0%, transparent 70%)',
    }} />

    {/* Subtle dot grid */}
    <div className="absolute inset-0 pointer-events-none opacity-[0.04]" style={{
      backgroundImage: 'radial-gradient(circle, hsl(43,72%,60%) 1px, transparent 1px)',
      backgroundSize: '40px 40px',
    }} />

    <div className="flex flex-col items-center justify-center h-full text-center px-40 relative z-10">
      <div className="greek-key-border-rich w-[900px] h-[8px] mb-20 rounded-sm" />

      <h1
        className="text-[120px] leading-none tracking-[0.08em] text-gradient-gold mb-8"
        style={{ fontFamily: 'Cinzel, serif', backgroundSize: '200% auto', animation: 'shimmer 4s ease-in-out infinite' }}
      >
        GOLD ARROW
      </h1>

      <p className="text-[30px] tracking-[0.3em] uppercase text-secondary-foreground/70 mb-4" style={{ fontFamily: 'Source Sans 3, sans-serif' }}>
        The New Standard for Trading Tokenized Commodities
      </p>

      <div className="greek-key-border-rich w-[200px] h-[4px] my-10 rounded-sm" />

      <p className="text-[22px] text-secondary-foreground/50 max-w-[1100px] leading-relaxed mb-8 tracking-wide">
        Oil & Gas <span className="text-gradient-gold mx-2">·</span> Precious Metals <span className="text-gradient-gold mx-2">·</span> Agriculture <span className="text-gradient-gold mx-2">·</span> Bonds <span className="text-gradient-gold mx-2">·</span> Livestock <span className="text-gradient-gold mx-2">·</span> Rare Earth Minerals <span className="text-gradient-gold mx-2">·</span> REITs <span className="text-gradient-gold mx-2">·</span> Art <span className="text-gradient-gold mx-2">·</span> Gov. Surplus
      </p>

      <p className="text-[24px] text-primary/80 tracking-[0.15em]" style={{ fontFamily: 'Cinzel, serif' }}>
        Investor Presentation · 2026
      </p>

      <div className="greek-key-border-rich w-[900px] h-[8px] mt-20 rounded-sm" />
    </div>
  </SlideLayout>
);

export default TitleSlide;
