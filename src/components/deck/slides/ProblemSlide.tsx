import { useState, useEffect } from 'react';
import SlideLayout from '../SlideLayout';
import { TrendingDown, Store, SearchX, Building2 } from 'lucide-react';

const problems = [
  { icon: TrendingDown, title: 'No Real-Time Tracking', desc: 'Institutions are blind to price movements, supply shifts, and custody status across global markets.', stat: '0', statLabel: 'Real-Time Platforms', angle: -35 },
  { icon: Store, title: 'No Unified Marketplace', desc: 'Buyers navigate fragmented brokers, exchanges, and OTC desks across jurisdictions.', stat: '50+', statLabel: 'Fragmented Exchanges', angle: 55 },
  { icon: SearchX, title: 'Unreliable Sources', desc: 'No standardized vetting or transparent provenance system for physical commodities.', stat: '6–12mo', statLabel: 'Avg. Due Diligence', angle: 145 },
  { icon: Building2, title: 'No Tokenization Infrastructure', desc: 'No digital registry, no blockchain verification, no fractional ownership framework.', stat: '$0', statLabel: 'Tokenized Gov. Assets', angle: -145 },
];

/* SVG gear path generator */
const gearPath = (cx: number, cy: number, outerR: number, innerR: number, teeth: number) => {
  const step = (Math.PI * 2) / teeth;
  const halfTooth = step * 0.25;
  let d = '';
  for (let i = 0; i < teeth; i++) {
    const a = i * step - Math.PI / 2;
    const x1 = cx + outerR * Math.cos(a - halfTooth);
    const y1 = cy + outerR * Math.sin(a - halfTooth);
    const x2 = cx + outerR * Math.cos(a + halfTooth);
    const y2 = cy + outerR * Math.sin(a + halfTooth);
    const x3 = cx + innerR * Math.cos(a + halfTooth + step * 0.15);
    const y3 = cy + innerR * Math.sin(a + halfTooth + step * 0.15);
    const x4 = cx + innerR * Math.cos(a + step - halfTooth - step * 0.15);
    const y4 = cy + innerR * Math.sin(a + step - halfTooth - step * 0.15);
    d += `${i === 0 ? 'M' : 'L'}${x1},${y1} L${x2},${y2} L${x3},${y3} L${x4},${y4} `;
  }
  return d + 'Z';
};

const ProblemSlide = () => {
  const [phase, setPhase] = useState(0); // 0=hidden, 1=gears in, 2=crack, 3=labels

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 300);
    const t2 = setTimeout(() => setPhase(2), 1200);
    const t3 = setTimeout(() => setPhase(3), 2000);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  return (
    <SlideLayout>
      <style>{`
        @keyframes gearSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes gearSpinReverse { from { transform: rotate(0deg); } to { transform: rotate(-360deg); } }
        @keyframes gearJam { 
          0%,40% { transform: rotate(var(--jam-from)); }
          50% { transform: rotate(calc(var(--jam-from) + 3deg)); }
          60% { transform: rotate(calc(var(--jam-from) - 2deg)); }
          70%,100% { transform: rotate(var(--jam-from)); }
        }
        @keyframes crackExpand {
          0% { stroke-dashoffset: 800; opacity: 0; }
          20% { opacity: 1; }
          100% { stroke-dashoffset: 0; opacity: 1; }
        }
        @keyframes sparkFly {
          0% { opacity: 1; transform: translate(0,0) scale(1); }
          100% { opacity: 0; transform: translate(var(--sx), var(--sy)) scale(0); }
        }
        @keyframes smokeRise {
          0% { opacity: 0.6; transform: translateY(0) scale(1); }
          100% { opacity: 0; transform: translateY(-60px) scale(2.5); }
        }
      `}</style>

      <div className="flex flex-col h-full px-[100px] py-[40px]">
        {/* Header */}
        <div style={{ opacity: phase >= 1 ? 1 : 0, transform: phase >= 1 ? 'translateY(0)' : 'translateY(-20px)', transition: 'all 0.8s cubic-bezier(0.22,1,0.36,1)' }}>
          <p className="text-[16px] tracking-[0.3em] uppercase text-primary/60 mb-3">The Institutional Crisis</p>
          <h2 className="text-[52px] leading-tight text-secondary-foreground mb-2" style={{ fontFamily: 'Cinzel, serif' }}>
            A <span className="text-gradient-gold">Broken</span> Machine
          </h2>
          <div className="greek-key-border-rich w-[120px] h-[4px] mb-3 rounded-sm" />
          <p className="text-[20px] text-secondary-foreground/50 max-w-[800px]">
            The <span className="text-primary font-semibold">$85 trillion</span> commodity market runs on infrastructure that was never designed for the digital age.
          </p>
        </div>

        {/* Gear mechanism area */}
        <div className="flex-1 relative mt-2 flex items-center justify-center">
          {/* Central gear SVG mechanism */}
          <svg viewBox="0 0 1720 480" className="absolute inset-0 w-full h-full" style={{ overflow: 'visible' }}>
            <defs>
              <radialGradient id="gearGold" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="hsla(43,72%,55%,0.25)" />
                <stop offset="100%" stopColor="hsla(43,72%,40%,0.08)" />
              </radialGradient>
              <radialGradient id="gearRed" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="hsla(0,70%,50%,0.2)" />
                <stop offset="100%" stopColor="hsla(0,70%,40%,0.05)" />
              </radialGradient>
              <filter id="gearGlow">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Connecting broken chain / cracks */}
            {phase >= 2 && (
              <g>
                {/* Crack lines */}
                {[
                  'M 580,240 L 620,220 L 640,245 L 680,230 L 720,240',
                  'M 1000,240 L 1040,220 L 1060,245 L 1100,230 L 1140,240',
                  'M 400,350 L 430,380 L 460,360',
                  'M 1260,350 L 1290,380 L 1320,360',
                ].map((d, i) => (
                  <path
                    key={i}
                    d={d}
                    fill="none"
                    stroke="hsla(0,80%,55%,0.7)"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeDasharray="800"
                    style={{
                      animation: `crackExpand 0.8s ease-out ${i * 0.15}s forwards`,
                      strokeDashoffset: 800,
                    }}
                  />
                ))}

                {/* Sparks */}
                {Array.from({ length: 12 }).map((_, i) => {
                  const cx = [620, 1060, 440, 1300][i % 4];
                  const cy = [230, 230, 370, 370][i % 4];
                  return (
                    <circle
                      key={`spark-${i}`}
                      cx={cx} cy={cy} r={2.5}
                      fill="hsla(43,82%,60%,0.9)"
                      style={{
                        '--sx': `${(Math.random() - 0.5) * 60}px`,
                        '--sy': `${(Math.random() - 0.5) * 60}px`,
                        animation: `sparkFly 0.6s ease-out ${0.1 + i * 0.05}s forwards`,
                        opacity: 0,
                      } as React.CSSProperties}
                    />
                  );
                })}

                {/* Smoke wisps */}
                {[620, 1060].map((sx, i) => (
                  <circle
                    key={`smoke-${i}`}
                    cx={sx} cy={230} r={20}
                    fill="hsla(0,0%,60%,0.15)"
                    style={{ animation: `smokeRise 2s ease-out ${0.3 + i * 0.2}s forwards`, opacity: 0 }}
                  />
                ))}
              </g>
            )}

            {/* 4 gears — each representing a broken problem */}
            {problems.map((p, i) => {
              const positions = [
                { cx: 380, cy: 290, r: 160, ir: 120, teeth: 18, dir: 1 },
                { cx: 820, cy: 290, r: 140, ir: 105, teeth: 16, dir: -1 },
                { cx: 1200, cy: 290, r: 155, ir: 115, teeth: 17, dir: 1 },
                { cx: 1540, cy: 290, r: 130, ir: 98, teeth: 15, dir: -1 },
              ];
              const g = positions[i];
              const isJammed = phase >= 2;
              const animStyle = isJammed
                ? { '--jam-from': `${p.angle}deg`, animation: `gearJam 1.5s ease-in-out ${i * 0.1}s infinite` } as React.CSSProperties
                : { animation: `${g.dir > 0 ? 'gearSpin' : 'gearSpinReverse'} ${8 + i * 2}s linear infinite` };

              return (
                <g
                  key={i}
                  style={{
                    transformOrigin: `${g.cx}px ${g.cy}px`,
                    opacity: phase >= 1 ? 1 : 0,
                    transition: `opacity 0.6s ease ${i * 0.15}s`,
                    ...animStyle,
                  }}
                  filter="url(#gearGlow)"
                >
                  {/* Gear body */}
                  <path
                    d={gearPath(g.cx, g.cy, g.r, g.ir, g.teeth)}
                    fill={isJammed ? 'url(#gearRed)' : 'url(#gearGold)'}
                    stroke={isJammed ? 'hsla(0,60%,50%,0.5)' : 'hsla(43,72%,50%,0.4)'}
                    strokeWidth="2"
                    style={{ transition: 'fill 0.5s, stroke 0.5s' }}
                  />
                  {/* Inner hub */}
                  <circle
                    cx={g.cx} cy={g.cy} r={g.ir * 0.55}
                    fill="hsla(213,35%,12%,0.9)"
                    stroke={isJammed ? 'hsla(0,60%,50%,0.4)' : 'hsla(43,72%,50%,0.3)'}
                    strokeWidth="2"
                    style={{ transition: 'stroke 0.5s' }}
                  />
                  {/* Center hole */}
                  <circle
                    cx={g.cx} cy={g.cy} r={18}
                    fill="hsla(213,35%,8%,1)"
                    stroke="hsla(43,72%,50%,0.2)"
                    strokeWidth="1.5"
                  />
                  {/* Spokes */}
                  {[0, 60, 120].map((a) => (
                    <line
                      key={a}
                      x1={g.cx + 20 * Math.cos((a * Math.PI) / 180)}
                      y1={g.cy + 20 * Math.sin((a * Math.PI) / 180)}
                      x2={g.cx + g.ir * 0.52 * Math.cos((a * Math.PI) / 180)}
                      y2={g.cy + g.ir * 0.52 * Math.sin((a * Math.PI) / 180)}
                      stroke="hsla(43,72%,50%,0.2)"
                      strokeWidth="3"
                    />
                  ))}
                </g>
              );
            })}
          </svg>

          {/* Problem labels below/over each gear */}
          <div className="absolute bottom-0 left-0 right-0 flex justify-between px-[20px]">
            {problems.map((p, i) => (
              <div
                key={i}
                className="flex flex-col items-center text-center"
                style={{
                  width: '360px',
                  opacity: phase >= 3 ? 1 : 0,
                  transform: phase >= 3 ? 'translateY(0)' : 'translateY(20px)',
                  transition: `all 0.7s cubic-bezier(0.22,1,0.36,1) ${i * 0.12}s`,
                }}
              >
                {/* Icon badge */}
                <div
                  className="w-[52px] h-[52px] rounded-full flex items-center justify-center mb-3"
                  style={{
                    border: '2px solid hsla(0,60%,50%,0.4)',
                    background: 'radial-gradient(circle, hsla(0,60%,50%,0.12) 0%, hsla(213,35%,12%,0.8) 100%)',
                    boxShadow: '0 0 20px hsla(0,60%,50%,0.15)',
                  }}
                >
                  <p.icon className="w-6 h-6 text-red-400/90" />
                </div>

                <h3 className="text-[22px] text-secondary-foreground mb-1.5" style={{ fontFamily: 'Cinzel, serif' }}>
                  {p.title}
                </h3>
                <p className="text-[14px] leading-snug text-secondary-foreground/45 mb-3 px-2">
                  {p.desc}
                </p>

                {/* Stat chip */}
                <div
                  className="flex items-baseline gap-2 px-5 py-2 rounded-full"
                  style={{
                    border: '1px solid hsla(0,60%,50%,0.25)',
                    background: 'hsla(0,60%,50%,0.06)',
                  }}
                >
                  <span className="text-[24px] font-bold text-red-400" style={{ fontFamily: 'Cinzel, serif' }}>
                    {p.stat}
                  </span>
                  <span className="text-[11px] uppercase tracking-wider text-secondary-foreground/35">
                    {p.statLabel}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </SlideLayout>
  );
};

export default ProblemSlide;
