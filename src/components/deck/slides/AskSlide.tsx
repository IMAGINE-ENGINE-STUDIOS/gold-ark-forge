import SlideLayout from '../SlideLayout';

const AskSlide = () => (
  <SlideLayout>
    <div className="flex flex-col items-center justify-center h-full text-center px-[200px]">
      <div className="greek-key-border-rich w-[500px] h-[6px] mb-14 rounded-sm" />

      <p className="text-[16px] tracking-[0.3em] uppercase text-primary/60 mb-6">The Ask</p>
      <h2 className="text-[64px] leading-tight text-secondary-foreground mb-4" style={{ fontFamily: 'Cinzel, serif' }}>
        Seed Round: <span className="text-gradient-gold">$5M</span>
      </h2>
      <div className="w-[80px] h-px bg-primary/30 my-6" />

      <div className="grid grid-cols-3 gap-12 mb-12 w-full max-w-[1200px]">
        {[
          { label: 'Product & Engineering', pct: '50%' },
          { label: 'Go-to-Market', pct: '30%' },
          { label: 'Operations & Legal', pct: '20%' },
        ].map((u, i) => (
          <div key={i} className="text-center">
            <p className="text-[36px] font-bold text-primary mb-1" style={{ fontFamily: 'Cinzel, serif' }}>{u.pct}</p>
            <p className="text-[18px] text-secondary-foreground/55">{u.label}</p>
          </div>
        ))}
      </div>

      <div className="w-[80px] h-px bg-primary/30 my-6" />
      <p className="text-[28px] text-secondary-foreground/80 mb-2" style={{ fontFamily: 'Cinzel, serif' }}>
        investors@goldarrow.io
      </p>
      <p className="text-[18px] text-secondary-foreground/40">goldarrow.io</p>

      <div className="greek-key-border-rich w-[500px] h-[6px] mt-14 rounded-sm" />
    </div>
  </SlideLayout>
);

export default AskSlide;
