import { useState, useEffect } from 'react';
import SlideLayout from '../SlideLayout';
import { Mail, Globe, ArrowUpRight } from 'lucide-react';

const ThankYouSlide = () => {
  const [visible, setVisible] = useState(false);
  useEffect(() => { const t = setTimeout(() => setVisible(true), 150); return () => clearTimeout(t); }, []);

  return (
    <SlideLayout>
      {/* Radial gold glow */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse 900px 700px at 50% 40%, hsla(43,72%,50%,0.14) 0%, transparent 70%)',
      }} />

      {/* Animated dot grid */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.035]" style={{
        backgroundImage: 'radial-gradient(circle, hsl(43,72%,60%) 1px, transparent 1px)',
        backgroundSize: '48px 48px',
      }} />

      {/* Diagonal gold rays */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="absolute"
            style={{
              width: '1px',
              height: '200%',
              top: '-50%',
              left: `${20 + i * 15}%`,
              background: 'linear-gradient(180deg, transparent 0%, hsla(43,72%,50%,0.06) 30%, hsla(43,72%,50%,0.03) 70%, transparent 100%)',
              transform: 'rotate(25deg)',
              opacity: visible ? 1 : 0,
              transition: `opacity 1.5s ease ${0.5 + i * 0.2}s`,
            }}
          />
        ))}
      </div>

      <div className="flex flex-col items-center justify-center h-full text-center px-40 relative z-10">
        {/* Top ornate line */}
        <div
          className="greek-key-border-rich h-[6px] rounded-sm mb-16"
          style={{
            width: visible ? 700 : 0,
            transition: 'width 1.2s cubic-bezier(0.22,1,0.36,1) 0.2s',
          }}
        />

        {/* Thank You heading */}
        <h1
          className="text-[110px] leading-none tracking-[0.06em] text-gradient-gold mb-6"
          style={{
            fontFamily: 'Cinzel, serif',
            backgroundSize: '200% auto',
            animation: 'shimmer 4s ease-in-out infinite',
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0) scale(1)' : 'translateY(30px) scale(0.95)',
            transition: 'all 1s cubic-bezier(0.22,1,0.36,1) 0.3s',
          }}
        >
          THANK YOU
        </h1>

        {/* Subtitle */}
        <p
          className="text-[26px] tracking-[0.25em] uppercase text-secondary-foreground/60 mb-4"
          style={{
            fontFamily: 'Source Sans 3, sans-serif',
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(15px)',
            transition: 'all 0.8s cubic-bezier(0.22,1,0.36,1) 0.6s',
          }}
        >
          For Your Consideration
        </p>

        {/* Decorative divider */}
        <div
          className="flex items-center gap-4 my-10"
          style={{
            opacity: visible ? 1 : 0,
            transition: 'opacity 0.8s ease 0.8s',
          }}
        >
          <div className="w-[120px] h-[1px]" style={{ background: 'linear-gradient(90deg, transparent, hsla(43,72%,50%,0.5))' }} />
          <div className="w-3 h-3 rotate-45" style={{ border: '1.5px solid hsla(43,72%,50%,0.5)', background: 'hsla(43,72%,50%,0.1)' }} />
          <div className="w-[120px] h-[1px]" style={{ background: 'linear-gradient(270deg, transparent, hsla(43,72%,50%,0.5))' }} />
        </div>

        {/* Contact cards */}
        <div
          className="flex items-center gap-10 mb-12"
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(20px)',
            transition: 'all 0.9s cubic-bezier(0.22,1,0.36,1) 1s',
          }}
        >
          {/* Email card */}
          <div
            className="group flex items-center gap-5 px-10 py-6 rounded-2xl cursor-pointer transition-all duration-500 hover:scale-[1.03]"
            style={{
              border: '1.5px solid hsla(43,72%,50%,0.2)',
              background: 'linear-gradient(135deg, hsla(213,32%,16%,0.6) 0%, hsla(213,35%,12%,0.8) 100%)',
              backdropFilter: 'blur(12px)',
              boxShadow: '0 8px 32px hsla(0,0%,0%,0.3)',
            }}
          >
            <div
              className="w-[56px] h-[56px] rounded-xl flex items-center justify-center transition-all duration-500 group-hover:scale-110 group-hover:rotate-3"
              style={{
                border: '1.5px solid hsla(43,72%,50%,0.35)',
                background: 'radial-gradient(circle, hsla(43,72%,50%,0.15) 0%, transparent 70%)',
              }}
            >
              <Mail className="w-6 h-6 text-primary" />
            </div>
            <div className="text-left">
              <p className="text-[13px] tracking-[0.2em] uppercase text-primary/50 mb-1">Email</p>
              <p className="text-[22px] text-secondary-foreground/90 transition-colors duration-300 group-hover:text-primary" style={{ fontFamily: 'Source Sans 3, sans-serif' }}>
                board@goldarrowsecurities.com
              </p>
            </div>
            <ArrowUpRight className="w-5 h-5 text-primary/30 ml-2 transition-all duration-300 group-hover:text-primary/70 group-hover:translate-x-1 group-hover:-translate-y-1" />
          </div>

          {/* Website card */}
          <div
            className="group flex items-center gap-5 px-10 py-6 rounded-2xl cursor-pointer transition-all duration-500 hover:scale-[1.03]"
            style={{
              border: '1.5px solid hsla(43,72%,50%,0.2)',
              background: 'linear-gradient(135deg, hsla(213,32%,16%,0.6) 0%, hsla(213,35%,12%,0.8) 100%)',
              backdropFilter: 'blur(12px)',
              boxShadow: '0 8px 32px hsla(0,0%,0%,0.3)',
            }}
          >
            <div
              className="w-[56px] h-[56px] rounded-xl flex items-center justify-center transition-all duration-500 group-hover:scale-110 group-hover:rotate-3"
              style={{
                border: '1.5px solid hsla(43,72%,50%,0.35)',
                background: 'radial-gradient(circle, hsla(43,72%,50%,0.15) 0%, transparent 70%)',
              }}
            >
              <Globe className="w-6 h-6 text-primary" />
            </div>
            <div className="text-left">
              <p className="text-[13px] tracking-[0.2em] uppercase text-primary/50 mb-1">Website</p>
              <p className="text-[22px] text-secondary-foreground/90 transition-colors duration-300 group-hover:text-primary" style={{ fontFamily: 'Source Sans 3, sans-serif' }}>
                www.goldarrowsecurities.com
              </p>
            </div>
            <ArrowUpRight className="w-5 h-5 text-primary/30 ml-2 transition-all duration-300 group-hover:text-primary/70 group-hover:translate-x-1 group-hover:-translate-y-1" />
          </div>
        </div>

        {/* Tagline */}
        <p
          className="text-[20px] text-secondary-foreground/40 tracking-[0.15em] italic mb-16"
          style={{
            fontFamily: 'Cinzel, serif',
            opacity: visible ? 1 : 0,
            transition: 'opacity 1s ease 1.3s',
          }}
        >
          "The New Standard for Trading Tokenized Commodities"
        </p>

        {/* Bottom ornate line */}
        <div
          className="greek-key-border-rich h-[6px] rounded-sm"
          style={{
            width: visible ? 700 : 0,
            transition: 'width 1.2s cubic-bezier(0.22,1,0.36,1) 1.4s',
          }}
        />

        {/* Year badge */}
        <p
          className="text-[16px] text-primary/40 tracking-[0.3em] mt-10"
          style={{
            fontFamily: 'Cinzel, serif',
            opacity: visible ? 1 : 0,
            transition: 'opacity 0.8s ease 1.6s',
          }}
        >
          © 2026 GOLD ARROW SECURITIES
        </p>
      </div>
    </SlideLayout>
  );
};

export default ThankYouSlide;
