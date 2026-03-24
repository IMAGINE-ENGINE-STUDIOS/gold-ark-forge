import SlideLayout from '../SlideLayout';
import { ShoppingCart, Vault, BarChart3, ArrowLeftRight } from 'lucide-react';

const products = [
  { icon: ShoppingCart, name: 'Marketplace', desc: 'Browse, verify, and acquire certified bullion assets with full provenance.' },
  { icon: Vault, name: 'Vault', desc: 'Manage holdings, track custody status, and initiate peer-to-peer transfers.' },
  { icon: BarChart3, name: 'Intelligence', desc: 'Real-time pricing across 200+ instruments, AI-powered analysis, and market widgets.' },
  { icon: ArrowLeftRight, name: 'Trading Bridge', desc: 'Paper & live trading with broker integration, bot automation, and risk tools.' },
];

const ProductSlide = () => (
  <SlideLayout>
    <div className="flex flex-col h-full px-[120px] py-[80px]">
      <p className="text-[20px] tracking-[0.3em] uppercase text-primary/60 mb-3">The Product</p>
      <h2 className="text-[64px] leading-tight text-secondary-foreground mb-2" style={{ fontFamily: 'Cinzel, serif' }}>
        Four <span className="text-gradient-gold">Pillars</span>
      </h2>
      <div className="w-[100px] h-[3px] bg-primary/40 mb-12" />

      <div className="grid grid-cols-2 gap-8 flex-1">
        {products.map((p, i) => (
          <div key={i} className="border border-primary/15 rounded-lg p-8 bg-secondary/30 flex gap-6 items-start">
            <div className="w-[56px] h-[56px] rounded flex items-center justify-center bg-primary/10 shrink-0">
              <p.icon className="w-7 h-7 text-primary" />
            </div>
            <div>
              <h3 className="text-[34px] text-secondary-foreground mb-2" style={{ fontFamily: 'Cinzel, serif' }}>{p.name}</h3>
              <p className="text-[24px] leading-relaxed text-secondary-foreground/60">{p.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  </SlideLayout>
);

export default ProductSlide;
