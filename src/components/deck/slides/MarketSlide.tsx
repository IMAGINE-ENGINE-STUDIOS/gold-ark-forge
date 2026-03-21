import { useState, useEffect } from 'react';
import SlideLayout from '../SlideLayout';

/* ── 5-Year commodity market growth projections ── */
const markets = [
  { label: 'Bonds & Fixed Income', now: 56.5, y5: 68, color: 'hsla(43,72%,55%,1)' },
  { label: 'Precious Metals', now: 12.1, y5: 16.8, color: 'hsla(43,72%,50%,0.9)' },
  { label: 'Energy', now: 6.2, y5: 9.1, color: 'hsla(43,72%,45%,0.85)' },
  { label: 'Agricultural', now: 4.8, y5: 6.5, color: 'hsla(43,60%,48%,0.8)' },
  { label: 'Rare Earth Minerals', now: 3.2, y5: 5.4, color: 'hsla(43,55%,44%,0.75)' },
  { label: 'REITs', now: 2.5, y5: 3.8, color: 'hsla(43,50%,42%,0.7)' },
  { label: 'Art & Collectibles', now: 1.7, y5: 2.9, color: 'hsla(43,45%,40%,0.65)' },
  { label: 'Livestock', now: 1.4, y5: 1.9, color: 'hsla(43,40%,38%,0.6)' },
  { label: 'Gov. Surplus', now: 0.5, y5: 0.8, color: 'hsla(43,35%,36%,0.55)' },
];

/* ── Tokenization market growth curve (2024-2030) ── */
const tokenizationData = [
  { year: '2024', value: 0.6 },
  { year: '2025', value: 1.2 },
  { year: '2026', value: 2.8 },
  { year: '2027', value: 5.5 },
  { year: '2028', value: 10.2 },
  { year: '2029', value: 16.0 },
  { year: '2030', value: 30.0 },
];

const maxBar = 58; // max y5 value for scaling

const MarketSlide = () => {
  const [animate, setAnimate] = useState(false);
  const [curveProgress, setCurveProgress] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setAnimate(true), 200);
    const t2 = setTimeout(() => {
      let start = 0;
      const duration = 1800;
      const step = (ts: number) => {
        if (!start) start = ts;
        const p = Math.min((ts - start) / duration, 1);
        setCurveProgress(1 - Math.pow(1 - p, 3)); // ease-out cubic
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }, 600);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  /* SVG curve for tokenization growth */
  const svgW = 680, svgH = 260, padX = 50, padY = 30;
  const maxVal = 30;
  const plotW = svgW - padX * 2;
  const plotH = svgH - padY * 2;
  const points = tokenizationData.map((d, i) => ({
    x: padX + (i / (tokenizationData.length - 1)) * plotW,
    y: padY + plotH - (d.value / maxVal) * plotH,
    ...d,
  }));

  // Smooth curve path
  const pathD = points.reduce((acc, p, i) => {
    if (i === 0) return `M ${p.x} ${p.y}`;
    const prev = points[i - 1];
    const cpx = (prev.x + p.x) / 2;
    return `${acc} C ${cpx} ${prev.y}, ${cpx} ${p.y}, ${p.x} ${p.y}`;
  }, '');

  // Area fill path
  const areaD = `${pathD} L ${points[points.length - 1].x} ${padY + plotH} L ${points[0].x} ${padY + plotH} Z`;

  const pathLength = 2000;

  return (
    <SlideLayout>
      <div className="flex h-full">
        {/* ── LEFT: Market bars with growth ── */}
        <div className="w-[52%] flex flex-col justify-center px-[80px]">
          <p className="text-[16px] tracking-[0.3em] uppercase text-primary/60 mb-3">Market Opportunity</p>
          <h2 className="text-[48px] leading-tight text-secondary-foreground mb-2" style={{ fontFamily: 'Cinzel, serif' }}>
            <span className="text-gradient-gold">$85T+</span> Growing Markets
          </h2>
          <div className="greek-key-border-rich w-[120px] h-[4px] mb-6 rounded-sm" />
          <p className="text-[18px] leading-relaxed text-secondary-foreground/50 mb-6">
            Five-year growth projections across nine tokenizable asset classes.
          </p>

          <div className="flex flex-col gap-[10px]">
            {markets.map((m, i) => {
              const nowPct = (m.now / maxBar) * 100;
              const y5Pct = (m.y5 / maxBar) * 100;
              const growth = Math.round(((m.y5 - m.now) / m.now) * 100);
              return (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-[13px] text-secondary-foreground/60 w-[150px] text-right shrink-0">{m.label}</span>
                  <div className="flex-1 h-[24px] rounded-sm overflow-hidden relative" style={{ background: 'hsla(213,32%,16%,0.6)' }}>
                    {/* Current bar */}
                    <div
                      className="absolute inset-y-0 left-0 rounded-sm"
                      style={{
                        width: animate ? `${nowPct}%` : '0%',
                        background: m.color,
                        opacity: 0.4,
                        transition: `width 1.2s cubic-bezier(0.22,1,0.36,1) ${i * 0.06}s`,
                      }}
                    />
                    {/* Projected bar */}
                    <div
                      className="absolute inset-y-0 left-0 rounded-sm"
                      style={{
                        width: animate ? `${y5Pct}%` : '0%',
                        background: `linear-gradient(90deg, ${m.color}, hsla(43,72%,65%,0.95))`,
                        transition: `width 1.8s cubic-bezier(0.22,1,0.36,1) ${0.4 + i * 0.08}s`,
                      }}
                    />
                    {/* Shimmer pulse */}
                    <div
                      className="absolute inset-y-0 left-0 rounded-sm"
                      style={{
                        width: animate ? `${y5Pct}%` : '0%',
                        background: 'linear-gradient(90deg, transparent 60%, hsla(43,72%,70%,0.15) 80%, transparent 100%)',
                        transition: `width 2s cubic-bezier(0.22,1,0.36,1) ${0.6 + i * 0.08}s`,
                        animation: animate ? 'shimmer-slide 3s ease-in-out infinite' : 'none',
                        animationDelay: `${2 + i * 0.1}s`,
                      }}
                    />
                  </div>
                  <div className="flex items-center gap-2 w-[130px] shrink-0">
                    <span className="text-[14px] text-primary font-semibold">${m.y5}T</span>
                    <span className="text-[11px] px-[6px] py-[1px] rounded-full" style={{
                      background: 'hsla(142,60%,40%,0.15)',
                      color: 'hsla(142,60%,60%,1)',
                    }}>+{growth}%</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* TAM / SAM / SOM */}
          <div className="grid grid-cols-3 gap-4 mt-8">
            {[
              { val: '$85T+', label: 'TAM (2024)' },
              { val: '$108T', label: 'TAM (2029)' },
              { val: '$12B', label: 'SOM (Y3)' },
            ].map((s, i) => (
              <div key={i} className="rounded-lg p-3 text-center relative overflow-hidden"
                style={{
                  border: '1px solid hsla(43,72%,50%,0.2)',
                  background: 'linear-gradient(135deg, hsla(213,32%,16%,0.5) 0%, hsla(213,35%,10%,0.3) 100%)',
                }}
              >
                <span className="ornate-corner ornate-corner-tl" style={{ width: 12, height: 12 }} />
                <span className="ornate-corner ornate-corner-br" style={{ width: 12, height: 12 }} />
                <p className="text-[24px] text-primary font-bold" style={{ fontFamily: 'Cinzel, serif' }}>{s.val}</p>
                <p className="text-[12px] text-secondary-foreground/50">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── RIGHT: Tokenization growth curve ── */}
        <div className="flex-1 flex flex-col justify-center pr-[80px] pl-[20px]">
          <p className="text-[14px] tracking-[0.25em] uppercase text-primary/60 mb-2">Tokenization Market</p>
          <h3 className="text-[36px] text-secondary-foreground mb-1" style={{ fontFamily: 'Cinzel, serif' }}>
            <span className="text-gradient-gold">$30T</span> by 2030
          </h3>
          <div className="greek-key-border-rich w-[80px] h-[3px] mb-6 rounded-sm" />
          <p className="text-[16px] text-secondary-foreground/50 mb-6 leading-relaxed">
            Real-world asset tokenization is projected to grow 50× this decade, driven by institutional demand for instant settlement, fractional ownership, and transparent provenance.
          </p>

          {/* SVG Chart */}
          <div className="relative rounded-xl overflow-hidden" style={{
            border: '1px solid hsla(43,72%,50%,0.15)',
            background: 'linear-gradient(180deg, hsla(213,32%,14%,0.6) 0%, hsla(213,35%,10%,0.8) 100%)',
          }}>
            <svg width={svgW} height={svgH} viewBox={`0 0 ${svgW} ${svgH}`} className="w-full h-auto">
              <defs>
                <linearGradient id="curveGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="hsla(43,72%,45%,1)" />
                  <stop offset="100%" stopColor="hsla(43,72%,65%,1)" />
                </linearGradient>
                <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsla(43,72%,50%,0.3)" />
                  <stop offset="100%" stopColor="hsla(43,72%,50%,0.02)" />
                </linearGradient>
              </defs>

              {/* Grid lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((frac, i) => (
                <line key={i}
                  x1={padX} y1={padY + plotH * (1 - frac)} x2={svgW - padX} y2={padY + plotH * (1 - frac)}
                  stroke="hsla(213,30%,30%,0.3)" strokeDasharray="4 4"
                />
              ))}

              {/* Area fill */}
              <path d={areaD} fill="url(#areaGrad)" opacity={curveProgress} />

              {/* Curve line */}
              <path
                d={pathD}
                fill="none"
                stroke="url(#curveGrad)"
                strokeWidth={3}
                strokeLinecap="round"
                strokeDasharray={pathLength}
                strokeDashoffset={pathLength * (1 - curveProgress)}
              />

              {/* Data points */}
              {points.map((p, i) => {
                const dotProgress = Math.max(0, Math.min(1, (curveProgress - i / points.length) * points.length));
                return (
                  <g key={i}>
                    {/* Glow */}
                    <circle cx={p.x} cy={p.y} r={12} fill="hsla(43,72%,50%,0.08)" opacity={dotProgress} />
                    {/* Dot */}
                    <circle cx={p.x} cy={p.y} r={4} fill="hsla(43,72%,55%,1)" opacity={dotProgress} />
                    {/* Year label */}
                    <text x={p.x} y={padY + plotH + 18} textAnchor="middle" fill="hsla(0,0%,80%,0.5)" fontSize="11">{p.year}</text>
                    {/* Value label */}
                    <text x={p.x} y={p.y - 14} textAnchor="middle" fill="hsla(43,72%,60%,0.9)" fontSize="12" fontWeight="600"
                      opacity={dotProgress}>
                      ${p.value}T
                    </text>
                  </g>
                );
              })}

              {/* Y-axis labels */}
              {[0, 0.25, 0.5, 0.75, 1].map((frac, i) => (
                <text key={i} x={padX - 8} y={padY + plotH * (1 - frac) + 4} textAnchor="end" fill="hsla(0,0%,70%,0.4)" fontSize="10">
                  ${Math.round(maxVal * frac)}T
                </text>
              ))}
            </svg>
          </div>

          {/* Growth stats */}
          <div className="grid grid-cols-3 gap-3 mt-5">
            {[
              { val: '50×', label: 'Growth (2024–30)' },
              { val: '87%', label: 'CAGR' },
              { val: '$600B', label: 'Today' },
            ].map((s, i) => (
              <div key={i} className="text-center rounded-lg py-3 px-2"
                style={{
                  border: '1px solid hsla(43,72%,50%,0.12)',
                  background: 'hsla(213,32%,14%,0.4)',
                }}
              >
                <p className="text-[22px] text-primary font-bold" style={{ fontFamily: 'Cinzel, serif' }}>{s.val}</p>
                <p className="text-[11px] text-secondary-foreground/40">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Shimmer keyframes */}
      <style>{`
        @keyframes shimmer-slide {
          0%, 100% { opacity: 0; }
          50% { opacity: 1; }
        }
      `}</style>
    </SlideLayout>
  );
};

export default MarketSlide;
