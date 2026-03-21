import { useEffect, useState } from 'react';
import SlideLayout from '../SlideLayout';
import { Handshake, ScanLine, Link2, ArrowLeftRight, Eye } from 'lucide-react';

const steps = [
  {
    icon: Handshake,
    num: '01',
    title: 'Connect',
    subtitle: 'Institutional Onboarding',
    desc: 'Banks, vaults, and custodians are onboarded with mTLS credentials and compliance verification.',
  },
  {
    icon: ScanLine,
    num: '02',
    title: 'Digitize',
    subtitle: 'Asset Digitization',
    desc: 'Physical assets are scanned, weighed, assayed, and catalogued with unique serial identifiers.',
  },
  {
    icon: Link2,
    num: '03',
    title: 'Tokenize',
    subtitle: 'Blockchain Certification',
    desc: 'Digital certificates are minted and Merkle-root anchored to Bitcoin mainnet for immutable proof.',
  },
  {
    icon: ArrowLeftRight,
    num: '04',
    title: 'Trade',
    subtitle: 'Global Trading',
    desc: 'T+0 atomic settlement, 24/7 market access, no intermediaries — fractional ownership enabled.',
  },
  {
    icon: Eye,
    num: '05',
    title: 'Monitor',
    subtitle: 'Real-Time Surveillance',
    desc: 'Live proof-of-reserves, custody status, and chain-of-title verification — globally accessible.',
  },
];

const SolutionSlide = () => {
  const [active, setActive] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setActive(true), 200);
    return () => clearTimeout(t);
  }, []);

  return (
    <SlideLayout>
      {/* Subtle grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: 'linear-gradient(hsla(43,72%,50%,0.3) 1px, transparent 1px), linear-gradient(90deg, hsla(43,72%,50%,0.3) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      <div className="flex flex-col h-full px-[100px] py-[70px] relative z-10">
        <p className="text-[16px] tracking-[0.3em] uppercase text-primary/60 mb-3">The Solution</p>
        <h2 className="text-[56px] leading-tight text-secondary-foreground mb-2" style={{ fontFamily: 'Cinzel, serif' }}>
          Tokenization <span className="text-gradient-gold">Infrastructure</span>
        </h2>
        <div className="greek-key-border-rich w-[120px] h-[4px] mb-12 rounded-sm" />

        <p className="text-[22px] text-secondary-foreground/60 mb-16 max-w-[900px]">
          A five-stage pipeline that transforms physical commodities into globally tradeable, blockchain-verified digital assets.
        </p>

        {/* Pipeline */}
        <div className="flex-1 flex items-center relative">
          {/* Connecting line background (grey track) */}
          <div
            className="absolute h-[3px] rounded-full"
            style={{
              top: 52,
              left: '5%',
              right: '5%',
              background: 'hsla(213,20%,30%,0.4)',
            }}
          />
          {/* Animated gold line */}
          <div
            className="absolute h-[3px] rounded-full"
            style={{
              top: 52,
              left: '5%',
              width: active ? '90%' : '0%',
              background: 'linear-gradient(90deg, hsla(43,72%,50%,0.8), hsla(43,72%,50%,0.4))',
              transition: 'width 2.5s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: '0 0 20px hsla(43,72%,50%,0.3)',
            }}
          />

          {/* Pulse dot that travels */}
          <div
            className="absolute w-3 h-3 rounded-full"
            style={{
              top: 47,
              left: active ? '94%' : '5%',
              background: 'hsla(43,72%,50%,0.9)',
              boxShadow: '0 0 15px hsla(43,72%,50%,0.6)',
              transition: 'left 2.5s cubic-bezier(0.4, 0, 0.2, 1)',
              opacity: active ? 1 : 0,
            }}
          />

          {/* Step nodes */}
          {steps.map((step, i) => (
            <div
              key={i}
              className="flex-1 flex flex-col items-center text-center relative z-10"
              style={{
                opacity: active ? 1 : 0,
                transform: active ? 'translateY(0)' : 'translateY(20px)',
                transition: `opacity 0.6s ease ${i * 0.4}s, transform 0.6s ease ${i * 0.4}s`,
              }}
            >
              {/* Numbered node circle */}
              <div
                className="w-[105px] h-[105px] rounded-full flex items-center justify-center mb-8 relative"
                style={{
                  border: '2px solid hsla(43,72%,50%,0.5)',
                  background: 'radial-gradient(circle, hsla(43,72%,50%,0.15) 0%, hsla(213,35%,10%,0.9) 70%)',
                  boxShadow: active ? `0 0 30px hsla(43,72%,50%,${0.1 + i * 0.04})` : 'none',
                  transition: `box-shadow 0.6s ease ${i * 0.4 + 0.3}s`,
                }}
              >
                {/* Step number */}
                <span
                  className="absolute -top-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-bold"
                  style={{
                    background: 'linear-gradient(135deg, hsla(43,72%,50%,0.9), hsla(43,72%,40%,0.7))',
                    color: 'hsl(213,35%,10%)',
                    fontFamily: 'Cinzel, serif',
                  }}
                >
                  {step.num}
                </span>
                <step.icon className="w-12 h-12 text-primary" />
              </div>

              <h3 className="text-[28px] text-gradient-gold mb-1" style={{ fontFamily: 'Cinzel, serif' }}>
                {step.title}
              </h3>
              <p className="text-[14px] tracking-[0.15em] uppercase text-primary/50 mb-4">{step.subtitle}</p>
              <p className="text-[17px] leading-relaxed text-secondary-foreground/55 max-w-[300px]">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </SlideLayout>
  );
};

export default SolutionSlide;
