import { useState, useEffect } from 'react';
import SlideLayout from '../SlideLayout';

const streams = [
  { name: 'Certification Fees', pct: 35, color: 'hsla(43,72%,55%,1)', desc: 'Per-certificate issuance fees charged to vault partners and dealers.' },
  { name: 'Trading Commissions', pct: 25, color: 'hsla(43,72%,50%,0.85)', desc: 'Basis-point fees on P2P transfers and marketplace settlements.' },
  { name: 'Gold Arrow Lobby', pct: 20, color: 'hsla(43,72%,45%,0.7)', desc: '$100K/yr subscription — exclusive diplomatic & trade events.' },
  { name: 'API & Data Licensing', pct: 12, color: 'hsla(43,72%,40%,0.55)', desc: 'Enterprise API access for verification & real-time pricing.' },
  { name: 'Premium Intelligence', pct: 8, color: 'hsla(43,72%,35%,0.45)', desc: 'AI analysis, bot automation & institutional dashboards.' },
];

const BusinessModelSlide = () => {
  const [progress, setProgress] = useState(0);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [counters, setCounters] = useState(streams.map(() => 0));

  useEffect(() => {
    const t1 = setTimeout(() => setProgress(1), 200);
    streams.forEach((_, i) => { setTimeout(() => setActiveIndex(i), 600 + i * 400); });
    return () => clearTimeout(t1);
  }, []);

  useEffect(() => {
    if (activeIndex < 0) return;
    const idx = activeIndex;
    const target = streams[idx].pct;
    let frame: number;
    const start = performance.now();
    const duration = 800;
    const animate = (now: number) => {
      const elapsed = now - start;
      const p = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setCounters(prev => { const next = [...prev]; next[idx] = Math.round(target * eased); return next; });
      if (p < 1) frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [activeIndex]);

  const radius = 120;
  const circumference = 2 * Math.PI * radius;
  let cumulativeOffset = 0;

  return (
    <SlideLayout>
      <div className="flex flex-col h-full px-[100px] py-[70px]">
        <div style={{ opacity: progress, transform: progress ? 'translateY(0)' : 'translateY(-20px)', transition: 'all 0.8s cubic-bezier(0.22,1,0.36,1)' }}>
          <p className="text-[20px] tracking-[0.3em] uppercase text-primary/60 mb-3">Business Model</p>
          <h2 className="text-[64px] leading-tight text-secondary-foreground mb-2" style={{ fontFamily: 'Cinzel, serif' }}>
            Revenue <span className="text-gradient-gold">Architecture</span>
          </h2>
          <div className="w-[100px] h-[3px] bg-primary/40 mb-10" />
        </div>

        <div className="flex gap-16 flex-1 min-h-0">
          {/* Donut Chart */}
          <div className="w-[420px] flex flex-col items-center justify-center">
            <div className="relative">
              <svg width="300" height="300" viewBox="0 0 300 300">
                <circle cx="150" cy="150" r={radius} fill="none" stroke="hsla(213,32%,20%,0.6)" strokeWidth="36" />
                {streams.map((s, i) => {
                  const segmentLength = (s.pct / 100) * circumference;
                  const offset = cumulativeOffset;
                  cumulativeOffset += segmentLength;
                  const isRevealed = i <= activeIndex;
                  return (
                    <circle key={i} cx="150" cy="150" r={radius} fill="none" stroke={s.color} strokeWidth="36"
                      strokeDasharray={`${segmentLength - 3} ${circumference - segmentLength + 3}`} strokeDashoffset={-offset}
                      style={{ transform: 'rotate(-90deg)', transformOrigin: '150px 150px', opacity: isRevealed ? 1 : 0, transition: `opacity 0.6s ease ${i * 0.1}s`, filter: isRevealed ? 'drop-shadow(0 0 8px hsla(43,72%,50%,0.3))' : 'none' }} />
                  );
                })}
                <text x="150" y="140" textAnchor="middle" fill="hsla(43,72%,50%,1)" fontSize="42" fontFamily="Cinzel, serif" fontWeight="bold" style={{ opacity: progress, transition: 'opacity 0.8s ease 0.5s' }}>5</text>
                <text x="150" y="172" textAnchor="middle" fill="hsla(0,0%,100%,0.45)" fontSize="16" fontFamily="Source Sans 3, sans-serif" letterSpacing="3" style={{ opacity: progress, transition: 'opacity 0.8s ease 0.7s' }}>REVENUE STREAMS</text>
              </svg>
              <div className="absolute inset-0 rounded-full" style={{ background: 'radial-gradient(circle, hsla(43,72%,50%,0.08) 0%, transparent 70%)', animation: 'pulse 3s ease-in-out infinite' }} />
            </div>
          </div>

          {/* Stream Cards */}
          <div className="flex-1 flex flex-col gap-4 justify-center">
            {streams.map((s, i) => {
              const isVisible = i <= activeIndex;
              return (
                <div key={i} className="relative overflow-hidden rounded-xl"
                  style={{ background: 'hsla(213,32%,14%,0.7)', border: '1px solid hsla(43,72%,50%,0.12)', opacity: isVisible ? 1 : 0, transform: isVisible ? 'translateX(0)' : 'translateX(60px)', transition: `all 0.7s cubic-bezier(0.22, 1, 0.36, 1) ${i * 0.12}s` }}>
                  <div className="absolute left-0 top-0 bottom-0 rounded-xl"
                    style={{ width: isVisible ? `${s.pct}%` : '0%', background: `linear-gradient(90deg, ${s.color.replace(/[\d.]+\)$/, '0.15)')}, transparent)`, transition: `width 1.2s cubic-bezier(0.22, 1, 0.36, 1) ${0.3 + i * 0.15}s` }} />
                  <div className="relative flex items-center gap-6 px-6 py-5">
                    <div className="w-[5px] h-[44px] rounded-full shrink-0" style={{ background: s.color }} />
                    <div className="w-[70px] text-right shrink-0">
                      <span className="text-[42px] font-bold text-primary" style={{ fontFamily: 'Cinzel, serif' }}>{counters[i]}</span>
                      <span className="text-[24px] text-primary/60" style={{ fontFamily: 'Cinzel, serif' }}>%</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-[26px] text-secondary-foreground mb-0.5" style={{ fontFamily: 'Cinzel, serif' }}>{s.name}</h3>
                      <p className="text-[18px] text-secondary-foreground/45 leading-snug">{s.desc}</p>
                    </div>
                    <div className="w-3 h-3 rounded-full shrink-0" style={{ background: s.color, boxShadow: `0 0 12px ${s.color}`, animation: isVisible ? 'pulse 2s ease-in-out infinite' : 'none', animationDelay: `${i * 0.4}s` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom ticker */}
        <div className="flex items-center gap-8 mt-6 pt-5" style={{ borderTop: '1px solid hsla(43,72%,50%,0.1)', opacity: activeIndex >= 4 ? 1 : 0, transition: 'opacity 0.8s ease 0.5s' }}>
          {[
            { label: 'Recurring Revenue', value: '60%+' },
            { label: 'Gross Margin Target', value: '85%' },
            { label: 'Lobby Subscriptions', value: '$100K/yr' },
          ].map((m, i) => (
            <div key={i} className="flex items-center gap-3">
              <span className="text-[34px] font-bold text-primary" style={{ fontFamily: 'Cinzel, serif' }}>{m.value}</span>
              <span className="text-[17px] text-secondary-foreground/40 uppercase tracking-wider">{m.label}</span>
              {i < 2 && <div className="w-[1px] h-[30px] bg-primary/15 ml-5" />}
            </div>
          ))}
        </div>
      </div>
    </SlideLayout>
  );
};

export default BusinessModelSlide;
