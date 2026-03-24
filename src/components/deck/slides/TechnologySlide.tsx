import SlideLayout from '../SlideLayout';
import { Database, Bitcoin, Cpu, Wifi } from 'lucide-react';

const stack = [
  { icon: Bitcoin, title: 'Bitcoin Anchoring', items: ['Merkle-tree commitments', 'OP_RETURN / Taproot', 'Immutable proof-of-existence'] },
  { icon: Database, title: 'Cloud Backend', items: ['PostgreSQL with RLS', 'Edge Functions (Deno)', 'Real-time subscriptions'] },
  { icon: Wifi, title: 'Live Data Feeds', items: ['200+ instruments', 'WebSocket streaming', 'AI-powered signals'] },
  { icon: Cpu, title: 'AI & Automation', items: ['LLM strategy analysis', 'Trading bot engine', 'Risk thermometer'] },
];

const TechnologySlide = () => (
  <SlideLayout>
    <div className="flex flex-col h-full px-[120px] py-[80px]">
      <p className="text-[20px] tracking-[0.3em] uppercase text-primary/60 mb-3">Technology</p>
      <h2 className="text-[64px] leading-tight text-secondary-foreground mb-2" style={{ fontFamily: 'Cinzel, serif' }}>
        Built for <span className="text-gradient-gold">Scale</span>
      </h2>
      <div className="w-[100px] h-[3px] bg-primary/40 mb-12" />

      <div className="grid grid-cols-4 gap-8 flex-1">
        {stack.map((s, i) => (
          <div key={i} className="flex flex-col items-center text-center">
            <div className="w-[72px] h-[72px] rounded-lg flex items-center justify-center bg-primary/10 border border-primary/20 mb-6">
              <s.icon className="w-9 h-9 text-primary" />
            </div>
            <h3 className="text-[26px] text-secondary-foreground mb-4" style={{ fontFamily: 'Cinzel, serif' }}>{s.title}</h3>
            <ul className="space-y-2">
              {s.items.map((item, j) => (
                <li key={j} className="text-[20px] text-secondary-foreground/55">{item}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  </SlideLayout>
);

export default TechnologySlide;
