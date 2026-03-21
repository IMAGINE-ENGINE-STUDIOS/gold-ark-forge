import { useState, useEffect } from 'react';
import SlideLayout from '../SlideLayout';
import { Handshake, TrendingUp, Globe, Award } from 'lucide-react';

const partners = [
  {
    name: 'HSBC',
    logo: 'https://logo.clearbit.com/hsbc.com',
    desc: 'Global banking & custody partnership',
  },
  {
    name: 'U.S. Department of the Treasury',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/80/US-DeptOfTheTreasury-Seal.svg/200px-US-DeptOfTheTreasury-Seal.svg.png',
    desc: 'Regulatory alignment & compliance framework',
  },
];

const tractionItems = [
  { icon: TrendingUp, label: 'Platform Built', value: '100%', desc: '9 asset classes, 101+ instruments live' },
  { icon: Globe, label: 'Global Reach', value: '6+', desc: 'Jurisdictions with vault partnerships' },
  { icon: Handshake, label: 'Gold Arrow Lobby', value: '$100K/yr', desc: 'Annual subscription — trade & diplomacy events' },
  { icon: Award, label: 'Certificates', value: 'Live', desc: 'Digital certification & blockchain anchoring' },
];

const PartnersAndTractionSlide = () => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setProgress(1), 200);
    return () => clearTimeout(t);
  }, []);

  return (
    <SlideLayout>
      <div className="flex flex-col h-full px-[100px] py-[70px]">
        <p className="text-[16px] tracking-[0.3em] uppercase text-primary/60 mb-3">Partners & Traction</p>
        <h2 className="text-[52px] leading-tight text-secondary-foreground mb-2" style={{ fontFamily: 'Cinzel, serif' }}>
          Strategic <span className="text-gradient-gold">Partnerships</span>
        </h2>
        <div className="greek-key-border-rich w-[120px] h-[4px] mb-10 rounded-sm" />

        <div className="flex gap-14 flex-1 min-h-0">
          {/* Left: Partners */}
          <div className="w-[800px] flex flex-col gap-8">
            <p className="text-[15px] tracking-[0.2em] uppercase text-primary/50 mb-2">Working With</p>
            {partners.map((p, i) => (
              <div
                key={i}
                className="flex items-center gap-8 rounded-xl px-10 py-8"
                style={{
                  border: '1px solid hsla(43,72%,50%,0.2)',
                  background: 'linear-gradient(135deg, hsla(213,32%,16%,0.6) 0%, hsla(43,72%,50%,0.04) 100%)',
                  boxShadow: '0 4px 40px hsla(0,0%,0%,0.3)',
                  opacity: progress,
                  transform: progress ? 'translateX(0)' : 'translateX(-40px)',
                  transition: `all 0.8s cubic-bezier(0.22, 1, 0.36, 1) ${0.3 + i * 0.3}s`,
                }}
              >
                <div
                  className="w-[100px] h-[100px] rounded-xl flex items-center justify-center shrink-0 overflow-hidden"
                  style={{
                    background: 'hsla(0,0%,100%,0.95)',
                    border: '2px solid hsla(43,72%,50%,0.25)',
                    boxShadow: '0 0 20px hsla(43,72%,50%,0.1)',
                  }}
                >
                  <img
                    src={p.logo}
                    alt={p.name}
                    className="w-[72px] h-[72px] object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
                <div className="flex-1">
                  <h3 className="text-[30px] text-secondary-foreground mb-2" style={{ fontFamily: 'Cinzel, serif' }}>{p.name}</h3>
                  <p className="text-[18px] text-secondary-foreground/55">{p.desc}</p>
                </div>
                {/* Gold accent corner */}
                <span className="absolute top-0 right-0 w-[24px] h-[24px] border-t-2 border-r-2 rounded-tr-xl" style={{ borderColor: 'hsla(43,72%,50%,0.3)' }} />
              </div>
            ))}

            {/* Lobby callout */}
            <div
              className="rounded-xl px-10 py-6 mt-2"
              style={{
                border: '1px solid hsla(43,72%,50%,0.25)',
                background: 'linear-gradient(135deg, hsla(43,72%,50%,0.08) 0%, hsla(213,32%,16%,0.5) 100%)',
                opacity: progress,
                transform: progress ? 'translateY(0)' : 'translateY(20px)',
                transition: 'all 0.8s cubic-bezier(0.22, 1, 0.36, 1) 0.9s',
              }}
            >
              <h4 className="text-[22px] text-primary mb-2" style={{ fontFamily: 'Cinzel, serif' }}>
                🏛️ Gold Arrow Lobby Program
              </h4>
              <p className="text-[17px] text-secondary-foreground/60 leading-relaxed">
                $100,000/year subscription connecting governments around the globe through exclusive events
                to promote international trade, diplomacy, and strategic relationships.
              </p>
            </div>
          </div>

          {/* Right: Traction metrics */}
          <div className="flex-1 flex flex-col gap-6">
            <p className="text-[15px] tracking-[0.2em] uppercase text-primary/50 mb-2">Key Milestones</p>
            {tractionItems.map((item, i) => {
              const Icon = item.icon;
              return (
                <div
                  key={i}
                  className="flex items-center gap-6 rounded-xl px-8 py-6"
                  style={{
                    border: '1px solid hsla(43,72%,50%,0.12)',
                    background: 'hsla(213,32%,16%,0.4)',
                    opacity: progress,
                    transform: progress ? 'translateX(0) scale(1)' : 'translateX(30px) scale(0.95)',
                    transition: `all 0.7s cubic-bezier(0.22, 1, 0.36, 1) ${0.4 + i * 0.2}s`,
                  }}
                >
                  <div
                    className="w-[56px] h-[56px] rounded-lg flex items-center justify-center shrink-0"
                    style={{
                      background: 'radial-gradient(circle, hsla(43,72%,50%,0.15) 0%, transparent 70%)',
                      border: '1px solid hsla(43,72%,50%,0.2)',
                    }}
                  >
                    <Icon className="w-7 h-7 text-primary/70" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-baseline gap-3">
                      <span className="text-[32px] font-bold text-primary" style={{ fontFamily: 'Cinzel, serif' }}>{item.value}</span>
                      <span className="text-[18px] text-secondary-foreground/70">{item.label}</span>
                    </div>
                    <p className="text-[15px] text-secondary-foreground/45 mt-1">{item.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </SlideLayout>
  );
};

export default PartnersAndTractionSlide;
