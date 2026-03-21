import { useState, useEffect } from 'react';
import SlideLayout from '../SlideLayout';

const allocations = [
  { label: 'Go-to-Market', pct: 50, color: 'hsla(43,72%,50%,1)' },
  { label: 'Product & Maintenance', pct: 30, color: 'hsla(43,72%,50%,0.65)' },
  { label: 'Legal & Compliance', pct: 20, color: 'hsla(43,72%,50%,0.4)' },
];

const earnings = [
  { year: 'Y1', revenue: 1.2 },
  { year: 'Y2', revenue: 8.5 },
  { year: 'Y3', revenue: 32 },
  { year: 'Y4', revenue: 75 },
  { year: 'Y5', revenue: 150 },
];

const maxRevenue = 150;

const AskSlide = () => {
  const [progress, setProgress] = useState(0);
  const [barsVisible, setBarsVisible] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setProgress(1), 300);
    const t2 = setTimeout(() => setBarsVisible(true), 800);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  // Donut chart SVG
  const radius = 90;
  const circumference = 2 * Math.PI * radius;
  let cumulativeOffset = 0;

  return (
    <SlideLayout>
      <div className="flex flex-col h-full px-[100px] py-[60px]">
        <p className="text-[16px] tracking-[0.3em] uppercase text-primary/60 mb-3">The Ask</p>
        <h2 className="text-[52px] leading-tight text-secondary-foreground mb-2" style={{ fontFamily: 'Cinzel, serif' }}>
          Seed Round: <span className="text-gradient-gold">$5M</span>
        </h2>
        <div className="greek-key-border-rich w-[120px] h-[4px] mb-8 rounded-sm" />

        <div className="flex gap-12 flex-1 min-h-0">
          {/* Left: Capital Allocation Donut */}
          <div className="w-[480px] flex flex-col items-center">
            <p className="text-[15px] tracking-[0.2em] uppercase text-primary/50 mb-6 self-start">Capital Allocation</p>
            <div className="relative">
              <svg width="260" height="260" viewBox="0 0 260 260">
                {allocations.map((a, i) => {
                  const segmentLength = (a.pct / 100) * circumference;
                  const offset = cumulativeOffset;
                  cumulativeOffset += segmentLength;
                  return (
                    <circle
                      key={i}
                      cx="130" cy="130" r={radius}
                      fill="none"
                      stroke={a.color}
                      strokeWidth="28"
                      strokeDasharray={`${segmentLength} ${circumference - segmentLength}`}
                      strokeDashoffset={-offset}
                      strokeLinecap="round"
                      style={{
                        transform: 'rotate(-90deg)',
                        transformOrigin: '130px 130px',
                        opacity: progress,
                        transition: `all 1.2s cubic-bezier(0.22, 1, 0.36, 1) ${i * 0.2}s`,
                      }}
                    />
                  );
                })}
                {/* Center text */}
                <text x="130" y="122" textAnchor="middle" fill="hsla(43,72%,50%,1)" fontSize="36" fontFamily="Cinzel, serif" fontWeight="bold">$5M</text>
                <text x="130" y="150" textAnchor="middle" fill="hsla(0,0%,100%,0.5)" fontSize="14" fontFamily="Source Sans 3, sans-serif">SEED ROUND</text>
              </svg>
            </div>

            {/* Legend */}
            <div className="flex flex-col gap-3 mt-6 w-full">
              {allocations.map((a, i) => (
                <div key={i} className="flex items-center gap-4 px-4 py-3 rounded-lg"
                  style={{
                    background: 'hsla(213,32%,16%,0.5)',
                    border: '1px solid hsla(43,72%,50%,0.1)',
                    opacity: progress,
                    transform: progress ? 'translateX(0)' : 'translateX(-20px)',
                    transition: `all 0.6s ease ${0.6 + i * 0.15}s`,
                  }}
                >
                  <div className="w-4 h-4 rounded-sm shrink-0" style={{ background: a.color }} />
                  <span className="text-[17px] text-secondary-foreground/70 flex-1">{a.label}</span>
                  <span className="text-[22px] font-bold text-primary" style={{ fontFamily: 'Cinzel, serif' }}>{a.pct}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right: 5-Year Earnings Growth — Animated Curve */}
          <div className="flex-1 flex flex-col">
            <p className="text-[15px] tracking-[0.2em] uppercase text-primary/50 mb-6">5-Year Revenue Projection</p>

            {(() => {
              const cW = 580, cH = 380;
              const pL = 55, pR = 25, pT = 40, pB = 50;
              const plotW = cW - pL - pR, plotH = cH - pT - pB;

              const pts = earnings.map((e, i) => ({
                x: pL + (i / (earnings.length - 1)) * plotW,
                y: pT + plotH - (e.revenue / maxRevenue) * plotH,
                ...e,
              }));

              const linePath = pts.reduce((acc, p, i) => {
                if (i === 0) return `M ${p.x} ${p.y}`;
                const prev = pts[i - 1];
                const cx1 = prev.x + (p.x - prev.x) * 0.4;
                const cx2 = p.x - (p.x - prev.x) * 0.4;
                return `${acc} C ${cx1} ${prev.y}, ${cx2} ${p.y}, ${p.x} ${p.y}`;
              }, '');

              const areaPath = `${linePath} L ${pts[pts.length - 1].x} ${pT + plotH} L ${pts[0].x} ${pT + plotH} Z`;

              return (
                <div className="relative" style={{ width: cW, height: cH }}>
                  <svg width={cW} height={cH}>
                    {[0, 50, 100, 150].map(v => {
                      const y = pT + plotH - (v / maxRevenue) * plotH;
                      return (
                        <g key={v}>
                          <line x1={pL} y1={y} x2={pL + plotW} y2={y} stroke="hsla(43,72%,50%,0.07)" strokeWidth="1" />
                          <text x={pL - 8} y={y + 4} textAnchor="end" fill="hsla(0,0%,100%,0.3)" fontSize="12" fontFamily="Source Sans 3, sans-serif">${v}M</text>
                        </g>
                      );
                    })}
                    <defs>
                      <linearGradient id="askAreaGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsla(43,72%,50%,0.3)" />
                        <stop offset="100%" stopColor="hsla(43,72%,50%,0)" />
                      </linearGradient>
                      <clipPath id="askReveal">
                        <rect x={pL} y={pT} height={plotH} style={{ width: barsVisible ? plotW : 0, transition: 'width 2.5s cubic-bezier(0.22,1,0.36,1) 0.3s' }} />
                      </clipPath>
                    </defs>
                    <path d={areaPath} fill="url(#askAreaGrad)" clipPath="url(#askReveal)" />
                    <path d={linePath} fill="none" stroke="hsla(43,72%,50%,1)" strokeWidth="3" strokeLinecap="round"
                      strokeDasharray="1200" strokeDashoffset={barsVisible ? 0 : 1200}
                      style={{ transition: 'stroke-dashoffset 2.5s cubic-bezier(0.22,1,0.36,1) 0.3s', filter: 'drop-shadow(0 0 6px hsla(43,72%,50%,0.4))' }} />
                    {pts.map((p, i) => (
                      <g key={i}>
                        <line x1={p.x} y1={p.y} x2={p.x} y2={pT + plotH} stroke="hsla(43,72%,50%,0.1)" strokeDasharray="4 4"
                          style={{ opacity: barsVisible ? 1 : 0, transition: `opacity 0.4s ease ${1 + i * 0.3}s` }} />
                        <circle cx={p.x} cy={p.y} r="10" fill="hsla(43,72%,50%,0.12)"
                          style={{ opacity: barsVisible ? 1 : 0, transition: `opacity 0.3s ease ${0.9 + i * 0.35}s` }} />
                        <circle cx={p.x} cy={p.y} r="5" fill="hsla(43,72%,50%,1)" stroke="hsla(213,35%,10%,1)" strokeWidth="2.5"
                          style={{ opacity: barsVisible ? 1 : 0, transition: `opacity 0.3s ease ${0.9 + i * 0.35}s` }} />
                        <text x={p.x} y={p.y - 16} textAnchor="middle" fill="hsla(43,72%,50%,1)" fontSize="15" fontWeight="bold" fontFamily="Cinzel, serif"
                          style={{ opacity: barsVisible ? 1 : 0, transition: `opacity 0.4s ease ${1.2 + i * 0.35}s` }}>
                          ${p.revenue}M
                        </text>
                        <text x={p.x} y={pT + plotH + 26} textAnchor="middle" fill="hsla(0,0%,100%,0.45)" fontSize="15" fontFamily="Cinzel, serif">
                          {p.year}
                        </text>
                      </g>
                    ))}
                  </svg>
                </div>
              );
            })()}

            {/* Metrics row */}
            <div className="grid grid-cols-3 gap-4 mt-6">
              {[
                { label: 'Year 5 Revenue', value: '$150M' },
                { label: 'Users', value: '100K+' },
                { label: 'AUM Target', value: '$10B' },
              ].map((m, i) => (
                <div key={i} className="text-center py-4 rounded-lg"
                  style={{
                    border: '1px solid hsla(43,72%,50%,0.15)',
                    background: 'hsla(213,32%,16%,0.4)',
                  }}
                >
                  <p className="text-[28px] font-bold text-primary" style={{ fontFamily: 'Cinzel, serif' }}>{m.value}</p>
                  <p className="text-[13px] text-secondary-foreground/45 mt-1">{m.label}</p>
                </div>
              ))}
            </div>

            <p className="text-[14px] text-secondary-foreground/35 mt-4 text-right">Revenue: SaaS fees + 0.15% spread + custody fees + $100K/yr Gold Arrow Lobby subscriptions</p>
          </div>
        </div>

        <div className="flex justify-between items-end mt-4">
          <div>
            <p className="text-[22px] text-secondary-foreground/80" style={{ fontFamily: 'Cinzel, serif' }}>investors@goldarrow.io</p>
            <p className="text-[15px] text-secondary-foreground/40">goldarrow.io</p>
          </div>
        </div>
      </div>
    </SlideLayout>
  );
};

export default AskSlide;
