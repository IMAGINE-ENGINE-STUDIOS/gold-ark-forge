import SlideLayout from '../SlideLayout';
import { AlertTriangle, Eye, Lock, Globe } from 'lucide-react';

const problems = [
  { icon: Eye, title: 'Opacity', desc: 'No transparent, verifiable chain-of-custody for physical bullion assets across global markets.' },
  { icon: Lock, title: 'Counterparty Risk', desc: 'Paper certificates lack cryptographic proof, enabling fraud and double-pledging of assets.' },
  { icon: Globe, title: 'Fragmented Markets', desc: '$12T+ in precious metals with no unified digital registry or cross-border verification standard.' },
  { icon: AlertTriangle, title: 'Audit Gaps', desc: 'Annual audits leave 364 days of unverified custody status, undermining institutional confidence.' },
];

const ProblemSlide = () => (
  <SlideLayout>
    <div className="flex flex-col h-full px-[120px] py-[80px]">
      <p className="text-[16px] tracking-[0.3em] uppercase text-primary/60 mb-3" style={{ fontFamily: 'Source Sans 3' }}>The Problem</p>
      <h2 className="text-[56px] leading-tight text-secondary-foreground mb-2" style={{ fontFamily: 'Cinzel, serif' }}>
        Bullion Markets Are <span className="text-gradient-gold">Broken</span>
      </h2>
      <div className="w-[100px] h-[3px] bg-primary/40 mb-12" />

      <div className="grid grid-cols-2 gap-10 flex-1">
        {problems.map((p, i) => (
          <div key={i} className="flex gap-6 items-start">
            <div className="w-[64px] h-[64px] rounded flex items-center justify-center bg-primary/10 border border-primary/20 shrink-0">
              <p.icon className="w-7 h-7 text-primary" />
            </div>
            <div>
              <h3 className="text-[28px] text-secondary-foreground mb-2" style={{ fontFamily: 'Cinzel, serif' }}>{p.title}</h3>
              <p className="text-[20px] leading-relaxed text-secondary-foreground/60" style={{ fontFamily: 'Source Sans 3' }}>{p.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  </SlideLayout>
);

export default ProblemSlide;
