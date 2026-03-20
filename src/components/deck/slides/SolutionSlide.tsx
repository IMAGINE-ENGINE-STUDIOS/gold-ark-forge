import SlideLayout from '../SlideLayout';
import { Shield, Link2, Zap } from 'lucide-react';

const pillars = [
  { icon: Shield, title: 'Cryptographic Certificates', desc: 'Every asset receives a tamper-proof digital certificate with multi-party signatures and on-chain anchoring.' },
  { icon: Link2, title: 'Bitcoin Anchored', desc: 'Merkle-root commitments to Bitcoin mainnet provide immutable, censorship-resistant proof of existence.' },
  { icon: Zap, title: 'Real-Time Verification', desc: 'Any counterparty can verify asset authenticity, custody status, and chain-of-title in seconds — globally.' },
];

const SolutionSlide = () => (
  <SlideLayout>
    <div className="flex flex-col h-full px-[120px] py-[80px]">
      <p className="text-[16px] tracking-[0.3em] uppercase text-primary/60 mb-3">The Solution</p>
      <h2 className="text-[56px] leading-tight text-secondary-foreground mb-2" style={{ fontFamily: 'Cinzel, serif' }}>
        Tokenization <span className="text-gradient-gold">Infrastructure</span>
      </h2>
      <div className="greek-key-border-rich w-[120px] h-[4px] mb-16 rounded-sm" />

      <div className="flex gap-8 flex-1 items-start relative">
        {/* Connecting gold line */}
        <div className="absolute top-[60px] left-[16%] right-[16%] h-px" style={{ background: 'linear-gradient(90deg, transparent 0%, hsla(43,72%,50%,0.3) 20%, hsla(43,72%,50%,0.3) 80%, transparent 100%)' }} />

        {pillars.map((p, i) => (
          <div key={i} className="flex-1 flex flex-col items-center text-center relative z-10">
            <div className="w-[120px] h-[120px] rounded-full flex items-center justify-center mb-10"
              style={{
                border: '2px solid hsla(43,72%,50%,0.35)',
                background: 'radial-gradient(circle, hsla(43,72%,50%,0.12) 0%, transparent 70%)',
                boxShadow: '0 0 50px hsla(43,72%,50%,0.1), 0 0 100px hsla(43,72%,50%,0.05)',
              }}
            >
              <p.icon className="w-14 h-14 text-primary" />
            </div>
            <h3 className="text-[28px] text-gradient-gold mb-5" style={{ fontFamily: 'Cinzel, serif' }}>{p.title}</h3>
            <p className="text-[20px] leading-relaxed text-secondary-foreground/60 max-w-[400px]">{p.desc}</p>
          </div>
        ))}
      </div>
    </div>
  </SlideLayout>
);

export default SolutionSlide;
