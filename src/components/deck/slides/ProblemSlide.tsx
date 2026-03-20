import SlideLayout from '../SlideLayout';
import { AlertTriangle, Eye, Lock, Globe } from 'lucide-react';

const problems = [
  { icon: Eye, title: 'Opacity', desc: 'No transparent, verifiable chain-of-custody for physical commodities across global institutional markets.', stat: '0%', statLabel: 'Digital Verification' },
  { icon: Lock, title: 'Counterparty Risk', desc: 'Paper certificates and legacy registries lack cryptographic proof, enabling fraud and double-pledging.', stat: '$85T+', statLabel: 'Exposed Assets' },
  { icon: Globe, title: 'Fragmented Markets', desc: 'Nine major commodity classes with no unified digital registry, no cross-border verification standard.', stat: '9', statLabel: 'Siloed Markets' },
  { icon: AlertTriangle, title: 'Audit Gaps', desc: 'Annual audits leave 364 days of unverified custody status across metals, bonds, REITs, and surplus assets.', stat: '364', statLabel: 'Blind Days/Year' },
];

const ProblemSlide = () => (
  <SlideLayout>
    <div className="flex flex-col h-full px-[100px] py-[70px]">
      <p className="text-[16px] tracking-[0.3em] uppercase text-primary/60 mb-3">The Institutional Crisis</p>
      <h2 className="text-[56px] leading-tight text-secondary-foreground mb-2" style={{ fontFamily: 'Cinzel, serif' }}>
        A <span className="text-gradient-gold">$85 Trillion</span> Problem
      </h2>
      <div className="greek-key-border-rich w-[120px] h-[4px] mb-10 rounded-sm" />

      <div className="grid grid-cols-2 gap-8 flex-1">
        {problems.map((p, i) => (
          <div key={i} className="relative rounded-lg p-8 flex gap-6 items-start overflow-hidden"
            style={{
              border: '1px solid hsla(43,72%,50%,0.2)',
              background: 'linear-gradient(135deg, hsla(213,35%,10%,0.8) 0%, hsla(213,32%,16%,0.6) 100%)',
              boxShadow: '0 0 40px hsla(43,72%,50%,0.06), inset 0 1px 0 hsla(43,72%,50%,0.08)',
            }}
          >
            {/* Icon */}
            <div className="w-[80px] h-[80px] rounded-full flex items-center justify-center shrink-0"
              style={{
                border: '2px solid hsla(43,72%,50%,0.3)',
                background: 'radial-gradient(circle, hsla(0,80%,55%,0.08) 0%, hsla(43,72%,50%,0.06) 100%)',
              }}
            >
              <p.icon className="w-10 h-10 text-primary" />
            </div>

            <div className="flex-1">
              <h3 className="text-[28px] text-secondary-foreground mb-2" style={{ fontFamily: 'Cinzel, serif' }}>{p.title}</h3>
              <p className="text-[18px] leading-relaxed text-secondary-foreground/55 mb-4">{p.desc}</p>
              <div className="flex items-baseline gap-2">
                <span className="text-[32px] font-bold text-primary" style={{ fontFamily: 'Cinzel, serif' }}>{p.stat}</span>
                <span className="text-[14px] uppercase tracking-wider text-secondary-foreground/40">{p.statLabel}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom crisis bar */}
      <div className="mt-8 rounded-lg py-5 px-10 text-center"
        style={{
          background: 'linear-gradient(90deg, hsla(43,72%,50%,0.08) 0%, hsla(43,72%,50%,0.15) 50%, hsla(43,72%,50%,0.08) 100%)',
          border: '1px solid hsla(43,72%,50%,0.2)',
        }}
      >
        <p className="text-[22px] text-secondary-foreground/70">
          <span className="text-gradient-gold text-[28px] font-bold" style={{ fontFamily: 'Cinzel, serif' }}>$85T+</span>
          <span className="mx-3">in real-world assets with</span>
          <span className="text-primary font-semibold">no digital chain-of-custody</span>
        </p>
      </div>
    </div>
  </SlideLayout>
);

export default ProblemSlide;
