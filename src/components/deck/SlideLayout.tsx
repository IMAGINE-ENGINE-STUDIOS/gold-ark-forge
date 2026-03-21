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
    {/* Radial gold ambient glow — top right */}
    <div
      className="absolute pointer-events-none"
      style={{
        top: -200,
        right: -200,
        width: 800,
        height: 800,
        background: 'radial-gradient(circle, hsla(43,72%,50%,0.06) 0%, transparent 70%)',
      }}
    />
    {/* Radial gold ambient glow — bottom left */}
    <div
      className="absolute pointer-events-none"
      style={{
        bottom: -150,
        left: -150,
        width: 600,
        height: 600,
        background: 'radial-gradient(circle, hsla(43,72%,50%,0.04) 0%, transparent 70%)',
      }}
    />

    {/* Gold grid pattern */}
    <div
      className="absolute inset-0 pointer-events-none opacity-[0.025]"
      style={{
        backgroundImage: 'radial-gradient(circle at 1px 1px, hsla(43,72%,50%,0.8) 0.5px, transparent 0)',
        backgroundSize: '48px 48px',
      }}
    />

    {/* Top gold border line */}
    <div
      className="absolute top-0 left-0 right-0 h-[2px] pointer-events-none"
      style={{ background: 'linear-gradient(90deg, transparent 5%, hsla(43,72%,50%,0.4) 30%, hsla(43,72%,50%,0.6) 50%, hsla(43,72%,50%,0.4) 70%, transparent 95%)' }}
    />
    {/* Bottom gold border line */}
    <div
      className="absolute bottom-0 left-0 right-0 h-[2px] pointer-events-none"
      style={{ background: 'linear-gradient(90deg, transparent 5%, hsla(43,72%,50%,0.3) 30%, hsla(43,72%,50%,0.5) 50%, hsla(43,72%,50%,0.3) 70%, transparent 95%)' }}
    />

    {/* Left vertical gold accent */}
    <div
      className="absolute left-0 top-0 bottom-0 w-[2px] pointer-events-none"
      style={{ background: 'linear-gradient(180deg, transparent 10%, hsla(43,72%,50%,0.25) 40%, hsla(43,72%,50%,0.25) 60%, transparent 90%)' }}
    />
    {/* Right vertical gold accent */}
    <div
      className="absolute right-0 top-0 bottom-0 w-[2px] pointer-events-none"
      style={{ background: 'linear-gradient(180deg, transparent 10%, hsla(43,72%,50%,0.25) 40%, hsla(43,72%,50%,0.25) 60%, transparent 90%)' }}
    />

    {/* Ornate corners — larger & more detailed */}
    <span className="absolute top-3 left-3 w-[40px] h-[40px] border-t-2 border-l-2 rounded-tl-lg pointer-events-none" style={{ borderColor: 'hsla(43,72%,50%,0.5)' }} />
    <span className="absolute top-3 right-3 w-[40px] h-[40px] border-t-2 border-r-2 rounded-tr-lg pointer-events-none" style={{ borderColor: 'hsla(43,72%,50%,0.5)' }} />
    <span className="absolute bottom-3 left-3 w-[40px] h-[40px] border-b-2 border-l-2 rounded-bl-lg pointer-events-none" style={{ borderColor: 'hsla(43,72%,50%,0.5)' }} />
    <span className="absolute bottom-3 right-3 w-[40px] h-[40px] border-b-2 border-r-2 rounded-br-lg pointer-events-none" style={{ borderColor: 'hsla(43,72%,50%,0.5)' }} />

    {/* Inner ornate corners */}
    <span className="absolute top-3 left-3 w-[20px] h-[20px] border-t border-l pointer-events-none" style={{ borderColor: 'hsla(43,72%,50%,0.3)', top: 20, left: 20 }} />
    <span className="absolute top-3 right-3 w-[20px] h-[20px] border-t border-r pointer-events-none" style={{ borderColor: 'hsla(43,72%,50%,0.3)', top: 20, right: 20 }} />
    <span className="absolute bottom-3 left-3 w-[20px] h-[20px] border-b border-l pointer-events-none" style={{ borderColor: 'hsla(43,72%,50%,0.3)', bottom: 20, left: 20 }} />
    <span className="absolute bottom-3 right-3 w-[20px] h-[20px] border-b border-r pointer-events-none" style={{ borderColor: 'hsla(43,72%,50%,0.3)', bottom: 20, right: 20 }} />

    {/* Diagonal light ray */}
    <div
      className="absolute pointer-events-none"
      style={{
        top: 0,
        right: '20%',
        width: 300,
        height: '100%',
        background: 'linear-gradient(165deg, hsla(43,72%,50%,0.03) 0%, transparent 40%)',
        transform: 'skewX(-15deg)',
      }}
    />

    {children}
  </div>
);

export default SlideLayout;
