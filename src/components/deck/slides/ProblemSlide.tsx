import { useState, useEffect } from 'react';
import SlideLayout from '../SlideLayout';
import { TrendingDown, Store, SearchX, Building2 } from 'lucide-react';

const problems = [
  { icon: TrendingDown, title: 'No Real-Time Tracking', desc: 'Commodities markets lack unified real-time tracking tools, leaving institutions blind to price movements, supply shifts, and custody status across global markets.', stat: '0', statLabel: 'Real-Time Platforms' },
  { icon: Store, title: 'No Unified Marketplace', desc: 'There is no single marketplace to acquire national and international commodity assets — buyers must navigate fragmented brokers, exchanges, and OTC desks across jurisdictions.', stat: '50+', statLabel: 'Fragmented Exchanges' },
  { icon: SearchX, title: 'Unreliable Sources', desc: 'Finding trustworthy, verified sources for physical commodities requires extensive research and due diligence, with no standardized vetting or transparent provenance system.', stat: '6–12mo', statLabel: 'Avg. Due Diligence' },
  { icon: Building2, title: 'No Tokenization Infrastructure', desc: 'Governments and institutions have no existing infrastructure to tokenize physical commodities — no digital registry, no blockchain verification, no fractional ownership framework.', stat: '$0', statLabel: 'Tokenized Gov. Assets' },
];

const ProblemSlide = () => {
  const [visibleCount, setVisibleCount] = useState(0);
  const [barVisible, setBarVisible] = useState(false);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    problems.forEach((_, i) => {
      timers.push(setTimeout(() => setVisibleCount(i + 1), 400 + i * 500));
    });
    timers.push(setTimeout(() => setBarVisible(true), 400 + problems.length * 500 + 300));
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <SlideLayout>
      <div className="flex flex-col h-full px-[100px] py-[70px]">
        <p className="text-[16px] tracking-[0.3em] uppercase text-primary/60 mb-3">The Institutional Crisis</p>
        <h2 className="text-[56px] leading-tight text-secondary-foreground mb-2" style={{ fontFamily: 'Cinzel, serif' }}>
          A <span className="text-gradient-gold">$85 Trillion</span> Problem
        </h2>
        <div className="greek-key-border-rich w-[120px] h-[4px] mb-10 rounded-sm" />

        <div className="grid grid-cols-2 gap-8 flex-1">
          {problems.map((p, i) => {
            const visible = i < visibleCount;
            return (
              <div
                key={i}
                className="relative rounded-lg overflow-hidden"
                style={{
                  opacity: visible ? 1 : 0,
                  transform: visible ? 'translateY(0) scale(1)' : 'translateY(30px) scale(0.92)',
                  transition: 'all 0.7s cubic-bezier(0.22, 1, 0.36, 1)',
                }}
              >
                {/* Square card */}
                <div
                  className="p-8 h-full flex flex-col justify-between"
                  style={{
                    border: '1px solid hsla(43,72%,50%,0.2)',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, hsla(213,35%,10%,0.9) 0%, hsla(213,32%,16%,0.7) 100%)',
                    boxShadow: visible
                      ? '0 0 40px hsla(43,72%,50%,0.08), inset 0 1px 0 hsla(43,72%,50%,0.1)'
                      : 'none',
                  }}
                >
                  {/* Corner accents */}
                  <span className="absolute top-0 left-0 w-[28px] h-[28px] border-t-2 border-l-2 rounded-tl-lg" style={{ borderColor: 'hsla(43,72%,50%,0.5)' }} />
                  <span className="absolute top-0 right-0 w-[28px] h-[28px] border-t-2 border-r-2 rounded-tr-lg" style={{ borderColor: 'hsla(43,72%,50%,0.5)' }} />
                  <span className="absolute bottom-0 left-0 w-[28px] h-[28px] border-b-2 border-l-2 rounded-bl-lg" style={{ borderColor: 'hsla(43,72%,50%,0.5)' }} />
                  <span className="absolute bottom-0 right-0 w-[28px] h-[28px] border-b-2 border-r-2 rounded-br-lg" style={{ borderColor: 'hsla(43,72%,50%,0.5)' }} />

                  <div className="flex items-start gap-5">
                    {/* Icon square */}
                    <div
                      className="w-[72px] h-[72px] rounded-lg flex items-center justify-center shrink-0"
                      style={{
                        border: '2px solid hsla(43,72%,50%,0.3)',
                        background: 'radial-gradient(circle, hsla(0,80%,55%,0.08) 0%, hsla(43,72%,50%,0.06) 100%)',
                      }}
                    >
                      <p.icon className="w-9 h-9 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-[26px] text-secondary-foreground mb-2" style={{ fontFamily: 'Cinzel, serif' }}>{p.title}</h3>
                      <p className="text-[17px] leading-relaxed text-secondary-foreground/55">{p.desc}</p>
                    </div>
                  </div>

                  {/* Stat at bottom */}
                  <div className="mt-5 pt-4 flex items-baseline gap-3" style={{ borderTop: '1px solid hsla(43,72%,50%,0.1)' }}>
                    <span
                      className="text-[36px] font-bold text-primary"
                      style={{
                        fontFamily: 'Cinzel, serif',
                        opacity: visible ? 1 : 0,
                        transform: visible ? 'scale(1)' : 'scale(0.5)',
                        transition: 'all 0.6s cubic-bezier(0.22, 1, 0.36, 1) 0.3s',
                      }}
                    >
                      {p.stat}
                    </span>
                    <span className="text-[13px] uppercase tracking-wider text-secondary-foreground/40">{p.statLabel}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom crisis bar */}
        <div
          className="mt-8 rounded-lg py-5 px-10 text-center"
          style={{
            background: 'linear-gradient(90deg, hsla(43,72%,50%,0.08) 0%, hsla(43,72%,50%,0.15) 50%, hsla(43,72%,50%,0.08) 100%)',
            border: '1px solid hsla(43,72%,50%,0.2)',
            opacity: barVisible ? 1 : 0,
            transform: barVisible ? 'translateY(0)' : 'translateY(20px)',
            transition: 'all 0.8s cubic-bezier(0.22, 1, 0.36, 1)',
          }}
        >
          <p className="text-[22px] text-secondary-foreground/70">
            <span className="text-gradient-gold text-[28px] font-bold" style={{ fontFamily: 'Cinzel, serif' }}>$85T+</span>
            <span className="mx-3">in real-world assets with</span>
            <span className="text-primary font-semibold">no digital chain-of-custody</span>
          </p>
        </div>
      </div>
    </SlideLayout>
  );
};

export default ProblemSlide;
