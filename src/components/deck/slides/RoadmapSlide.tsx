import SlideLayout from '../SlideLayout';

const phases = [
  { q: 'Q2 2026', items: ['Public launch of Marketplace & Vault', 'First 3 vault partner integrations', 'Bitcoin anchoring v1 live'] },
  { q: 'Q3 2026', items: ['Trading Bridge broker connections', 'AI Intelligence suite launch', 'Mobile-responsive PWA'] },
  { q: 'Q4 2026', items: ['API licensing program', 'Commodity expansion (energy, agriculture)', '10+ jurisdictions covered'] },
  { q: 'H1 2027', items: ['Institutional custody integrations', 'Regulatory sandbox approvals', 'Series A fundraise'] },
];

const RoadmapSlide = () => (
  <SlideLayout>
    <div className="flex flex-col h-full px-[120px] py-[80px]">
      <p className="text-[16px] tracking-[0.3em] uppercase text-primary/60 mb-3">Roadmap</p>
      <h2 className="text-[52px] leading-tight text-secondary-foreground mb-2" style={{ fontFamily: 'Cinzel, serif' }}>
        Path <span className="text-gradient-gold">Forward</span>
      </h2>
      <div className="w-[100px] h-[3px] bg-primary/40 mb-14" />

      <div className="flex gap-6 flex-1 items-start">
        {phases.map((p, i) => (
          <div key={i} className="flex-1 relative">
            {/* Timeline dot */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-4 h-4 rounded-full bg-primary border-2 border-primary/50" />
              {i < phases.length - 1 && <div className="flex-1 h-px bg-primary/20" />}
            </div>
            <h3 className="text-[26px] text-primary mb-4" style={{ fontFamily: 'Cinzel, serif' }}>{p.q}</h3>
            <ul className="space-y-3">
              {p.items.map((item, j) => (
                <li key={j} className="text-[18px] text-secondary-foreground/60 flex gap-2 items-start">
                  <span className="text-primary/50 mt-1">▸</span> {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  </SlideLayout>
);

export default RoadmapSlide;
