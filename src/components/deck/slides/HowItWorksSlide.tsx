import SlideLayout from '../SlideLayout';
import { Hammer, Anchor, CheckCircle, Repeat } from 'lucide-react';

const steps = [
  { icon: Hammer, label: 'MINT', desc: 'Partner issues digital certificate for physical bar with metadata & signature.' },
  { icon: Anchor, label: 'ANCHOR', desc: 'Merkle root of certificate batch committed to Bitcoin mainnet.' },
  { icon: CheckCircle, label: 'VERIFY', desc: 'Anyone can verify authenticity, custody, and chain-of-title via public endpoint.' },
  { icon: Repeat, label: 'TRANSFER', desc: 'Peer-to-peer atomic swap with BTC settlement and partner countersign.' },
];

const HowItWorksSlide = () => (
  <SlideLayout>
    <div className="flex flex-col h-full px-[120px] py-[80px]">
      <p className="text-[16px] tracking-[0.3em] uppercase text-primary/60 mb-3">How It Works</p>
      <h2 className="text-[52px] leading-tight text-secondary-foreground mb-2" style={{ fontFamily: 'Cinzel, serif' }}>
        Certificate <span className="text-gradient-gold">Lifecycle</span>
      </h2>
      <div className="w-[100px] h-[3px] bg-primary/40 mb-16" />

      <div className="flex items-start justify-between flex-1 gap-4">
        {steps.map((s, i) => (
          <div key={i} className="flex-1 flex flex-col items-center text-center relative">
            {i < steps.length - 1 && (
              <div className="absolute top-[40px] left-[60%] w-[80%] h-px bg-primary/20" />
            )}
            <div className="w-[80px] h-[80px] rounded-full flex items-center justify-center border-2 border-primary/30 bg-primary/5 mb-6 z-10">
              <s.icon className="w-9 h-9 text-primary" />
            </div>
            <h3 className="text-[24px] text-primary tracking-[0.2em] mb-3" style={{ fontFamily: 'Cinzel, serif' }}>{s.label}</h3>
            <p className="text-[18px] leading-relaxed text-secondary-foreground/60 px-4">{s.desc}</p>
          </div>
        ))}
      </div>
    </div>
  </SlideLayout>
);

export default HowItWorksSlide;
