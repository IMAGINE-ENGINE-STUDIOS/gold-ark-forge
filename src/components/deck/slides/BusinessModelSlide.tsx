import SlideLayout from '../SlideLayout';

const streams = [
  { name: 'Certification Fees', pct: '45%', desc: 'Per-certificate issuance fees charged to vault partners and dealers for minting digital certificates.' },
  { name: 'Trading Commissions', pct: '30%', desc: 'Basis-point fees on peer-to-peer transfers and marketplace transactions settled through the platform.' },
  { name: 'API & Data Licensing', pct: '15%', desc: 'Enterprise API access for verification endpoints, real-time pricing feeds, and reserve proof data.' },
  { name: 'Premium Intelligence', pct: '10%', desc: 'Subscription revenue from advanced AI analysis, bot automation, and institutional dashboards.' },
];

const BusinessModelSlide = () => (
  <SlideLayout>
    <div className="flex flex-col h-full px-[120px] py-[80px]">
      <p className="text-[16px] tracking-[0.3em] uppercase text-primary/60 mb-3">Business Model</p>
      <h2 className="text-[52px] leading-tight text-secondary-foreground mb-2" style={{ fontFamily: 'Cinzel, serif' }}>
        Revenue <span className="text-gradient-gold">Streams</span>
      </h2>
      <div className="w-[100px] h-[3px] bg-primary/40 mb-12" />

      <div className="flex flex-col gap-6 flex-1">
        {streams.map((s, i) => (
          <div key={i} className="flex items-center gap-8">
            <div className="w-[80px] text-right">
              <span className="text-[32px] font-bold text-primary" style={{ fontFamily: 'Cinzel, serif' }}>{s.pct}</span>
            </div>
            <div className="w-[4px] h-[60px] rounded-full bg-primary/30" />
            <div className="flex-1">
              <h3 className="text-[26px] text-secondary-foreground mb-1" style={{ fontFamily: 'Cinzel, serif' }}>{s.name}</h3>
              <p className="text-[18px] text-secondary-foreground/55">{s.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  </SlideLayout>
);

export default BusinessModelSlide;
