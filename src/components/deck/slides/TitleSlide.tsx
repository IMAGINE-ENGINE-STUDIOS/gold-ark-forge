import SlideLayout from '../SlideLayout';

const TitleSlide = () => (
  <SlideLayout>
    <div className="flex flex-col items-center justify-center h-full text-center px-40">
      <div className="greek-key-border-rich w-[600px] h-[6px] mb-16 rounded-sm" />

      <h1 className="text-[96px] leading-none tracking-[0.08em] text-gradient-gold mb-6" style={{ fontFamily: 'Cinzel, serif' }}>
        GOLD ARROW
      </h1>
      <p className="text-[28px] tracking-[0.3em] uppercase text-secondary-foreground/70 mb-4" style={{ fontFamily: 'Source Sans 3, sans-serif' }}>
        The New Standard for Trading Tokenized Commodities
      </p>
      <div className="w-[120px] h-px bg-primary/40 my-8" />
      <p className="text-[20px] text-secondary-foreground/50 max-w-[900px] leading-relaxed mb-6">
        Precious Metals · Energy · Agriculture · Bonds · Livestock · Corporate Bonds · REITs · Art · Gov. Surplus
      </p>
      <p className="text-[22px] text-primary/80 tracking-[0.15em]" style={{ fontFamily: 'Cinzel, serif' }}>
        Investor Presentation · 2026
      </p>

      <div className="greek-key-border-rich w-[600px] h-[6px] mt-16 rounded-sm" />
    </div>
  </SlideLayout>
);

export default TitleSlide;
