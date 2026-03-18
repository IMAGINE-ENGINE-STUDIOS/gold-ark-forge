import SlideLayout from '../SlideLayout';
import { Coins, Globe, ShieldCheck } from 'lucide-react';

const AboutSlide = () => (
  <SlideLayout>
    <div className="flex flex-col h-full px-[120px] py-[80px]">
      <p className="text-[16px] tracking-[0.3em] uppercase text-primary/60 mb-3">About Us</p>
      <h2 className="text-[56px] leading-tight text-secondary-foreground mb-2" style={{ fontFamily: 'Cinzel, serif' }}>
        What is <span className="text-gradient-gold">Gold Arrow</span>?
      </h2>
      <div className="w-[100px] h-[3px] bg-primary/40 mb-12" />

      <p className="text-[26px] leading-relaxed text-secondary-foreground/70 mb-14 max-w-[1400px]">
        Gold Arrow is an institutional-grade platform that <span className="text-primary">tokenizes physical commodities</span> — precious metals, energy, and agricultural assets — into blockchain-verified digital tokens, creating a new global standard for trading, custody, and settlement.
      </p>

      <div className="grid grid-cols-3 gap-12 flex-1 items-start">
        {[
          { icon: Coins, title: 'Tokenize', desc: 'Transform physical assets into fractional, tradeable digital tokens backed 1:1 by verified reserves in insured vaults worldwide.' },
          { icon: Globe, title: 'Trade', desc: 'Buy and sell tokenized commodities instantly with T+0 settlement, no intermediaries, and 24/7 global market access.' },
          { icon: ShieldCheck, title: 'Trust', desc: 'Every token is anchored to Bitcoin mainnet with cryptographic proof-of-reserves, real-time auditing, and full chain-of-custody.' },
        ].map((p, i) => (
          <div key={i} className="flex flex-col items-center text-center">
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

export default AboutSlide;
