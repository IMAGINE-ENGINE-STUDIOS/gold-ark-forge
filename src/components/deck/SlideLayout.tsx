import React from 'react';

interface SlideLayoutProps {
  children: React.ReactNode;
  className?: string;
}

const SlideLayout = ({ children, className = '' }: SlideLayoutProps) => (
  <div
    className={`slide-content relative w-[1920px] h-[1080px] overflow-hidden ${className}`}
    style={{ background: 'linear-gradient(145deg, hsl(213,35%,10%) 0%, hsl(213,32%,16%) 60%, hsl(213,28%,20%) 100%)' }}
  >
    <style>{`
      @keyframes slideGoldPulse {
        0%, 100% { opacity: 0.04; }
        50% { opacity: 0.09; }
      }
      @keyframes slideGoldSweep {
        0% { transform: translateX(-100%) skewX(-20deg); }
        100% { transform: translateX(300%) skewX(-20deg); }
      }
      @keyframes slideCornerGlow {
        0%, 100% { opacity: 0.4; }
        50% { opacity: 0.8; }
      }
      @keyframes slideFloatParticle {
        0% { transform: translateY(0) scale(1); opacity: 0; }
        10% { opacity: 1; }
        90% { opacity: 1; }
        100% { transform: translateY(-400px) scale(0.3); opacity: 0; }
      }
    `}</style>

    {/* Radial gold ambient glow — top right (pulsing) */}
    <div
      className="absolute pointer-events-none"
      style={{
        top: -200, right: -200, width: 900, height: 900,
        background: 'radial-gradient(circle, hsla(43,72%,50%,0.08) 0%, transparent 65%)',
        animation: 'slideGoldPulse 6s ease-in-out infinite',
      }}
    />
    {/* Radial gold ambient glow — bottom left (pulsing offset) */}
    <div
      className="absolute pointer-events-none"
      style={{
        bottom: -200, left: -200, width: 700, height: 700,
        background: 'radial-gradient(circle, hsla(43,72%,50%,0.06) 0%, transparent 65%)',
        animation: 'slideGoldPulse 6s ease-in-out infinite 3s',
      }}
    />
    {/* Center subtle gold wash */}
    <div
      className="absolute pointer-events-none"
      style={{
        top: '30%', left: '25%', width: 1000, height: 500,
        background: 'radial-gradient(ellipse, hsla(43,72%,50%,0.03) 0%, transparent 70%)',
        animation: 'slideGoldPulse 8s ease-in-out infinite 1.5s',
      }}
    />

    {/* Gold dot grid pattern */}
    <div
      className="absolute inset-0 pointer-events-none opacity-[0.03]"
      style={{
        backgroundImage: 'radial-gradient(circle at 1px 1px, hsla(43,72%,50%,0.9) 0.5px, transparent 0)',
        backgroundSize: '40px 40px',
      }}
    />

    {/* Sweeping gold light ray (animated) */}
    <div
      className="absolute pointer-events-none"
      style={{
        top: 0, left: 0, width: 400, height: '100%',
        background: 'linear-gradient(90deg, transparent, hsla(43,72%,50%,0.04), transparent)',
        animation: 'slideGoldSweep 12s ease-in-out infinite',
      }}
    />

    {/* Diagonal light rays */}
    <div className="absolute pointer-events-none" style={{ top: 0, right: '15%', width: 250, height: '100%', background: 'linear-gradient(165deg, hsla(43,72%,50%,0.04) 0%, transparent 35%)', transform: 'skewX(-15deg)' }} />
    <div className="absolute pointer-events-none" style={{ top: 0, left: '10%', width: 180, height: '100%', background: 'linear-gradient(195deg, hsla(43,72%,50%,0.025) 0%, transparent 30%)', transform: 'skewX(10deg)' }} />

    {/* Top gold border — double line */}
    <div className="absolute top-0 left-0 right-0 h-[2px] pointer-events-none" style={{ background: 'linear-gradient(90deg, transparent 3%, hsla(43,72%,50%,0.5) 25%, hsla(43,72%,50%,0.7) 50%, hsla(43,72%,50%,0.5) 75%, transparent 97%)' }} />
    <div className="absolute top-[5px] left-[40px] right-[40px] h-[1px] pointer-events-none" style={{ background: 'linear-gradient(90deg, transparent, hsla(43,72%,50%,0.2) 30%, hsla(43,72%,50%,0.3) 50%, hsla(43,72%,50%,0.2) 70%, transparent)' }} />
    {/* Bottom gold border — double line */}
    <div className="absolute bottom-0 left-0 right-0 h-[2px] pointer-events-none" style={{ background: 'linear-gradient(90deg, transparent 3%, hsla(43,72%,50%,0.4) 25%, hsla(43,72%,50%,0.6) 50%, hsla(43,72%,50%,0.4) 75%, transparent 97%)' }} />
    <div className="absolute bottom-[5px] left-[40px] right-[40px] h-[1px] pointer-events-none" style={{ background: 'linear-gradient(90deg, transparent, hsla(43,72%,50%,0.2) 30%, hsla(43,72%,50%,0.25) 50%, hsla(43,72%,50%,0.2) 70%, transparent)' }} />

    {/* Left & right vertical gold lines — double */}
    <div className="absolute left-0 top-0 bottom-0 w-[2px] pointer-events-none" style={{ background: 'linear-gradient(180deg, transparent 5%, hsla(43,72%,50%,0.35) 30%, hsla(43,72%,50%,0.35) 70%, transparent 95%)' }} />
    <div className="absolute left-[5px] top-[40px] bottom-[40px] w-[1px] pointer-events-none" style={{ background: 'linear-gradient(180deg, transparent, hsla(43,72%,50%,0.15) 20%, hsla(43,72%,50%,0.15) 80%, transparent)' }} />
    <div className="absolute right-0 top-0 bottom-0 w-[2px] pointer-events-none" style={{ background: 'linear-gradient(180deg, transparent 5%, hsla(43,72%,50%,0.35) 30%, hsla(43,72%,50%,0.35) 70%, transparent 95%)' }} />
    <div className="absolute right-[5px] top-[40px] bottom-[40px] w-[1px] pointer-events-none" style={{ background: 'linear-gradient(180deg, transparent, hsla(43,72%,50%,0.15) 20%, hsla(43,72%,50%,0.15) 80%, transparent)' }} />

    {/* Outer ornate corners — animated glow */}
    {[
      { t: 8, l: 8, bt: true, bl: true, radius: '8px 0 0 0' },
      { t: 8, r: 8, bt: true, br: true, radius: '0 8px 0 0' },
      { b: 8, l: 8, bb: true, bl: true, radius: '0 0 0 8px' },
      { b: 8, r: 8, bb: true, br: true, radius: '0 0 8px 0' },
    ].map((c, i) => (
      <span
        key={`outer-${i}`}
        className="absolute w-[48px] h-[48px] pointer-events-none"
        style={{
          top: c.t, bottom: c.b, left: c.l, right: c.r,
          borderTop: c.bt ? '2px solid hsla(43,72%,50%,0.6)' : 'none',
          borderBottom: c.bb ? '2px solid hsla(43,72%,50%,0.6)' : 'none',
          borderLeft: c.bl ? '2px solid hsla(43,72%,50%,0.6)' : 'none',
          borderRight: c.br ? '2px solid hsla(43,72%,50%,0.6)' : 'none',
          borderRadius: c.radius,
          animation: `slideCornerGlow 4s ease-in-out infinite ${i * 0.5}s`,
        }}
      />
    ))}

    {/* Inner ornate corners */}
    {[
      { t: 24, l: 24, bt: true, bl: true },
      { t: 24, r: 24, bt: true, br: true },
      { b: 24, l: 24, bb: true, bl: true },
      { b: 24, r: 24, bb: true, br: true },
    ].map((c, i) => (
      <span
        key={`inner-${i}`}
        className="absolute w-[24px] h-[24px] pointer-events-none"
        style={{
          top: c.t, bottom: c.b, left: c.l, right: c.r,
          borderTop: c.bt ? '1px solid hsla(43,72%,50%,0.3)' : 'none',
          borderBottom: c.bb ? '1px solid hsla(43,72%,50%,0.3)' : 'none',
          borderLeft: c.bl ? '1px solid hsla(43,72%,50%,0.3)' : 'none',
          borderRight: c.br ? '1px solid hsla(43,72%,50%,0.3)' : 'none',
        }}
      />
    ))}

    {/* Corner diamond accents */}
    {[
      { top: 6, left: 6 },
      { top: 6, right: 6 },
      { bottom: 6, left: 6 },
      { bottom: 6, right: 6 },
    ].map((pos, i) => (
      <div
        key={`diamond-${i}`}
        className="absolute w-[6px] h-[6px] pointer-events-none"
        style={{
          ...pos,
          background: 'hsla(43,72%,50%,0.7)',
          transform: 'rotate(45deg)',
          boxShadow: '0 0 8px hsla(43,72%,50%,0.4)',
          animation: `slideCornerGlow 3s ease-in-out infinite ${i * 0.8}s`,
        }}
      />
    ))}

    {/* Floating gold particles */}
    {[...Array(8)].map((_, i) => (
      <div
        key={`particle-${i}`}
        className="absolute pointer-events-none rounded-full"
        style={{
          width: 2 + (i % 3),
          height: 2 + (i % 3),
          bottom: 30 + (i * 20),
          left: `${8 + i * 11}%`,
          background: `hsla(43,72%,50%,${0.2 + (i % 3) * 0.1})`,
          boxShadow: `0 0 8px hsla(43,72%,50%,${0.15 + (i % 3) * 0.05})`,
          animation: `slideFloatParticle ${7 + i * 1.5}s ease-in-out infinite ${i * 1.2}s`,
        }}
      />
    ))}

    {/* Top center decorative flourish */}
    <div className="absolute top-[10px] left-1/2 -translate-x-1/2 flex items-center gap-2 pointer-events-none">
      <div style={{ width: 40, height: 1, background: 'linear-gradient(90deg, transparent, hsla(43,72%,50%,0.3))' }} />
      <div style={{ width: 4, height: 4, background: 'hsla(43,72%,50%,0.5)', transform: 'rotate(45deg)', boxShadow: '0 0 6px hsla(43,72%,50%,0.3)' }} />
      <div style={{ width: 30, height: 1, background: 'hsla(43,72%,50%,0.4)' }} />
      <div style={{ width: 6, height: 6, border: '1px solid hsla(43,72%,50%,0.5)', transform: 'rotate(45deg)', boxShadow: '0 0 8px hsla(43,72%,50%,0.2)' }} />
      <div style={{ width: 30, height: 1, background: 'hsla(43,72%,50%,0.4)' }} />
      <div style={{ width: 4, height: 4, background: 'hsla(43,72%,50%,0.5)', transform: 'rotate(45deg)', boxShadow: '0 0 6px hsla(43,72%,50%,0.3)' }} />
      <div style={{ width: 40, height: 1, background: 'linear-gradient(90deg, hsla(43,72%,50%,0.3), transparent)' }} />
    </div>

    {/* Bottom center decorative flourish */}
    <div className="absolute bottom-[10px] left-1/2 -translate-x-1/2 flex items-center gap-2 pointer-events-none">
      <div style={{ width: 40, height: 1, background: 'linear-gradient(90deg, transparent, hsla(43,72%,50%,0.25))' }} />
      <div style={{ width: 4, height: 4, background: 'hsla(43,72%,50%,0.4)', transform: 'rotate(45deg)' }} />
      <div style={{ width: 30, height: 1, background: 'hsla(43,72%,50%,0.35)' }} />
      <div style={{ width: 6, height: 6, border: '1px solid hsla(43,72%,50%,0.4)', transform: 'rotate(45deg)' }} />
      <div style={{ width: 30, height: 1, background: 'hsla(43,72%,50%,0.35)' }} />
      <div style={{ width: 4, height: 4, background: 'hsla(43,72%,50%,0.4)', transform: 'rotate(45deg)' }} />
      <div style={{ width: 40, height: 1, background: 'linear-gradient(90deg, hsla(43,72%,50%,0.25), transparent)' }} />
    </div>

    {/* Side mid-point gold accents */}
    <div className="absolute left-[6px] top-1/2 -translate-y-1/2 pointer-events-none" style={{ width: 4, height: 4, background: 'hsla(43,72%,50%,0.5)', transform: 'rotate(45deg)', boxShadow: '0 0 6px hsla(43,72%,50%,0.3)' }} />
    <div className="absolute right-[6px] top-1/2 -translate-y-1/2 pointer-events-none" style={{ width: 4, height: 4, background: 'hsla(43,72%,50%,0.5)', transform: 'rotate(45deg)', boxShadow: '0 0 6px hsla(43,72%,50%,0.3)' }} />

    {children}
  </div>
);

export default SlideLayout;
