import SlideLayout from '../SlideLayout';
import { ShoppingCart, Vault, BarChart3, ArrowLeftRight, Bot, Shield } from 'lucide-react';

const features = [
  { icon: ShoppingCart, name: 'Tokenized Marketplace', desc: 'Browse, verify, and acquire tokenized commodity assets with full provenance and instant T+0 settlement.' },
  { icon: Vault,        name: 'Digital Vault',         desc: 'Non-custodial ownership: manage holdings, track custody status, and initiate peer-to-peer transfers on-chain.' },
  { icon: BarChart3,    name: 'Market Intelligence',   desc: 'Real-time pricing across 200+ instruments, AI-powered analysis, live widgets, and cross-asset dashboards.' },
  { icon: ArrowLeftRight, name: 'Trading Bridge',      desc: 'Paper & live trading with broker integration, one-click execution, and limit-order automation.' },
  { icon: Bot,          name: 'AI Trading Bots',       desc: 'Genius strategy advisor, Wave bot, backtest engine, and automated risk management across all asset classes.' },
  { icon: Shield,       name: 'Blockchain Certification', desc: 'Every token is Bitcoin-anchored with Merkle-root proof-of-reserves, cryptographic certificates, and real-time auditing.' },
];

const PlatformSlide = () => (
  <SlideLayout>
    <div className="flex flex-col h-full px-[100px] py-[70px]">
      <p className="text-[16px] tracking-[0.3em] uppercase text-primary/60 mb-3">The Platform</p>
      <h2 className="text-[52px] leading-tight text-secondary-foreground mb-2" style={{ fontFamily: 'Cinzel, serif' }}>
        Gold Arrow <span className="text-gradient-gold">Platform</span>
      </h2>
      <div className="w-[100px] h-[3px] bg-primary/40 mb-10" />

      <div className="grid grid-cols-2 gap-7 flex-1">
        {features.map((f, i) => (
          <div key={i} className="border border-primary/15 rounded-lg p-7 bg-secondary/30 flex gap-5 items-start">
            <div className="w-[52px] h-[52px] rounded flex items-center justify-center bg-primary/10 shrink-0">
              <f.icon className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="text-[24px] text-secondary-foreground mb-2" style={{ fontFamily: 'Cinzel, serif' }}>{f.name}</h3>
              <p className="text-[17px] leading-relaxed text-secondary-foreground/55">{f.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  </SlideLayout>
);

export default PlatformSlide;
