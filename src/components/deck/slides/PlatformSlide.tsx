import { useState, useEffect } from 'react';
import SlideLayout from '../SlideLayout';
import screenshotHomepage from '@/assets/screenshot-homepage.png';
import screenshotIntelligence from '@/assets/screenshot-intelligence.png';
import screenshotTrading from '@/assets/screenshot-trading.png';
import screenshotMarketplace from '@/assets/screenshot-marketplace.png';
import screenshotVault from '@/assets/screenshot-vault.png';
import screenshotOilgas from '@/assets/screenshot-oilgas.png';

const screenshots = [
  { src: screenshotHomepage, label: 'Homepage', desc: 'Institutional landing with Hellenic design, nine asset class marketplace, and live market data.' },
  { src: screenshotIntelligence, label: 'Market Intelligence', desc: '35+ proprietary analytics widgets with real-time data across metals, crypto, forex, and energy markets.' },
  { src: screenshotTrading, label: 'Trading Bridge', desc: 'Paper & live trading with one-click execution, bot automation, backtest engine, and cross-asset portfolio management.' },
  { src: screenshotMarketplace, label: 'Pax Romana Marketplace', desc: '101+ instruments across 9 asset classes with live WebSocket pricing and instant T+0 settlement.' },
  { src: screenshotVault, label: 'The Vault', desc: 'Institutional-grade custody with insured, encrypted, and verified bullion holdings and redemption options.' },
  { src: screenshotOilgas, label: 'Oil & Gas Intelligence', desc: 'Real-time energy analytics powered by EIA, Baker Hughes, IEA, and OPEC data streams.' },
];

const PlatformSlide = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [fadeKey, setFadeKey] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex(prev => {
        const next = (prev + 1) % screenshots.length;
        setFadeKey(k => k + 1);
        return next;
      });
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  const active = screenshots[activeIndex];

  return (
    <SlideLayout>
      <div className="flex flex-col h-full px-[100px] py-[70px]">
        <p className="text-[16px] tracking-[0.3em] uppercase text-primary/60 mb-3">The Platform</p>
        <h2 className="text-[52px] leading-tight text-secondary-foreground mb-2" style={{ fontFamily: 'Cinzel, serif' }}>
          Tokenization <span className="text-gradient-gold">Platform</span>
        </h2>
        <div className="greek-key-border-rich w-[120px] h-[4px] mb-8 rounded-sm" />

        <div className="flex gap-10 flex-1 min-h-0">
          {/* Screenshot area */}
          <div className="flex-1 relative rounded-xl overflow-hidden" style={{ border: '2px solid hsla(43,72%,50%,0.25)', boxShadow: '0 0 60px hsla(43,72%,50%,0.1), 0 20px 60px hsla(0,0%,0%,0.4)' }}>
            <img
              key={fadeKey}
              src={active.src}
              alt={active.label}
              className="w-full h-full object-cover object-top"
              style={{
                animation: 'platformFadeIn 0.8s ease-out both',
              }}
            />
            {/* Gradient overlay at bottom */}
            <div className="absolute inset-x-0 bottom-0 h-[120px]" style={{ background: 'linear-gradient(to top, hsla(213,35%,8%,0.95) 0%, transparent 100%)' }} />
            <div className="absolute bottom-0 inset-x-0 px-8 pb-6">
              <h3 className="text-[28px] text-secondary-foreground" style={{ fontFamily: 'Cinzel, serif' }}>{active.label}</h3>
              <p className="text-[16px] text-secondary-foreground/60 mt-1">{active.desc}</p>
            </div>
            {/* Corner accents */}
            <span className="absolute top-0 left-0 w-[32px] h-[32px] border-t-2 border-l-2 rounded-tl-xl" style={{ borderColor: 'hsla(43,72%,50%,0.5)' }} />
            <span className="absolute top-0 right-0 w-[32px] h-[32px] border-t-2 border-r-2 rounded-tr-xl" style={{ borderColor: 'hsla(43,72%,50%,0.5)' }} />
          </div>

          {/* Thumbnail selector */}
          <div className="w-[400px] flex flex-col gap-3 justify-start overflow-y-auto pr-2" style={{ maxHeight: '100%' }}>
            {screenshots.map((s, i) => {
              const isActive = i === activeIndex;
              return (
                <button
                  key={i}
                  onClick={() => { setActiveIndex(i); setFadeKey(k => k + 1); }}
                  className="relative rounded-lg overflow-hidden text-left transition-all duration-500"
                  style={{
                    border: isActive ? '2px solid hsla(43,72%,50%,0.5)' : '1px solid hsla(43,72%,50%,0.12)',
                    background: isActive
                      ? 'linear-gradient(135deg, hsla(213,32%,16%,0.8) 0%, hsla(43,72%,50%,0.06) 100%)'
                      : 'linear-gradient(135deg, hsla(213,32%,16%,0.4) 0%, hsla(213,35%,10%,0.3) 100%)',
                    boxShadow: isActive ? '0 0 30px hsla(43,72%,50%,0.12)' : 'none',
                    transform: isActive ? 'scale(1.02)' : 'scale(1)',
                  }}
                >
                  <div className="flex items-center gap-4 p-4">
                    <div className="w-[80px] h-[48px] rounded-md overflow-hidden shrink-0" style={{ border: '1px solid hsla(43,72%,50%,0.2)' }}>
                      <img src={s.src} alt={s.label} className="w-full h-full object-cover object-top" />
                    </div>
                    <div>
                      <h4 className="text-[17px] text-secondary-foreground" style={{ fontFamily: 'Cinzel, serif' }}>{s.label}</h4>
                      <p className="text-[12px] text-secondary-foreground/45 mt-0.5 line-clamp-2">{s.desc}</p>
                    </div>
                  </div>
                  {/* Progress bar for active */}
                  {isActive && (
                    <div className="absolute bottom-0 left-0 right-0 h-[3px]">
                      <div
                        className="h-full"
                        style={{
                          background: 'linear-gradient(90deg, hsla(43,72%,50%,0.8), hsla(43,72%,50%,0.4))',
                          animation: 'platformProgress 4s linear both',
                        }}
                      />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes platformFadeIn {
          0% { opacity: 0; transform: scale(1.03); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes platformProgress {
          0% { width: 0%; }
          100% { width: 100%; }
        }
      `}</style>
    </SlideLayout>
  );
};

export default PlatformSlide;
