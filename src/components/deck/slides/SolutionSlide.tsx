import SlideLayout from '../SlideLayout';
import { Shield, Link2, Zap } from 'lucide-react';

const pillars = [
  { icon: Shield, title: 'Cryptographic Certificates', desc: 'Every bar receives a tamper-proof digital certificate with partner signatures and on-chain anchoring.' },
  { icon: Link2, title: 'Bitcoin Anchored', desc: 'Merkle-root commitments to Bitcoin mainnet provide immutable, censorship-resistant proof of existence.' },
  { icon: Zap, title: 'Real-Time Verification', desc: 'Any counterparty can verify asset authenticity, custody status, and chain-of-title in seconds.' },
];

const SolutionSlide = () => (
  <SlideLayout>
    <div className="flex flex-col h-full px-[120px] py-[80px]">
      <p className="text-[16px] tracking-[0.3em] uppercase text-primary/60 mb-3">The Solution</p>
      <h2 className="text-[56px] leading-tight text-secondary-foreground mb-2" style={{ fontFamily: 'Cinzel, serif' }}>
        Gold Arrow <span className="text-gradient-gold">Platform</span>
      </h2>
      <div className="w-[100px] h-[3px] bg-primary/40 mb-14" />

      <div className="flex gap-12 flex-1 items-start">
        {pillars.map((p, i) => (
          <div key={i} className="flex-1 flex flex-col items-center text-center">
            <div className="w-[100px] h-[100px] rounded-lg flex items-center justify-center bg-primary/10 border border-primary/20 mb-8">
              <p.icon className="w-12 h-12 text-primary" />
            </div>
            <h3 className="text-[28px] text-secondary-foreground mb-4" style={{ fontFamily: 'Cinzel, serif' }}>{p.title}</h3>
            <p className="text-[20px] leading-relaxed text-secondary-foreground/60">{p.desc}</p>
          </div>
        ))}
      </div>
    </div>
  </SlideLayout>
);

export default SolutionSlide;
