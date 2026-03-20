import SlideLayout from '../SlideLayout';
import { ShoppingCart, Vault, BarChart3, ArrowLeftRight, Bot, Shield } from 'lucide-react';

const features = [
  { icon: ShoppingCart, name: 'Tokenized Marketplace', desc: 'Browse, verify, and acquire tokenized commodity assets with full provenance and instant T+0 settlement across nine asset classes.' },
  { icon: Shield, name: 'Digital Certificates', desc: 'Cryptographic certificates with multi-party signatures, Bitcoin anchoring, and tamper-proof chain-of-custody for every tokenized asset.' },
  { icon: ArrowLeftRight, name: 'Trading Bridge', desc: 'Paper and live trading with broker integration, one-click execution, limit-order automation, and cross-asset portfolio management.' },
  { icon: BarChart3, name: 'Real-Time Verification', desc: 'Any counterparty can verify asset authenticity, custody status, and chain-of-title in seconds — accessible from anywhere globally.' },
  { icon: Vault, name: 'International Vault Network', desc: 'Non-custodial ownership across insured vaults worldwide. Manage holdings, track custody, and initiate peer-to-peer transfers on-chain.' },
  { icon: Bot, name: 'AI Trading Intelligence', desc: 'Genius strategy advisor, Wave bot, backtest engine, and automated risk management powered by AI across all asset classes.' },
];

const PlatformSlide = () => (
  <SlideLayout>
    <div className="flex flex-col h-full px-[100px] py-[70px]">
      <p className="text-[16px] tracking-[0.3em] uppercase text-primary/60 mb-3">The Platform</p>
      <h2 className="text-[52px] leading-tight text-secondary-foreground mb-2" style={{ fontFamily: 'Cinzel, serif' }}>
        Tokenization <span className="text-gradient-gold">Platform</span>
      </h2>
      <div className="greek-key-border-rich w-[120px] h-[4px] mb-10 rounded-sm" />

      <div className="grid grid-cols-2 gap-7 flex-1">
        {features.map((f, i) => (
          <div key={i} className="rounded-lg p-7 flex gap-6 items-start"
            style={{
              borderLeft: '3px solid hsla(43,72%,50%,0.4)',
              border: '1px solid hsla(43,72%,50%,0.12)',
              borderLeftWidth: '3px',
              borderLeftColor: 'hsla(43,72%,50%,0.4)',
              background: 'linear-gradient(135deg, hsla(213,32%,16%,0.5) 0%, hsla(213,35%,10%,0.3) 100%)',
            }}
          >
            <div className="w-[64px] h-[64px] rounded-lg flex items-center justify-center shrink-0"
              style={{
                background: 'radial-gradient(circle, hsla(43,72%,50%,0.12) 0%, transparent 70%)',
                border: '1px solid hsla(43,72%,50%,0.2)',
              }}
            >
              <f.icon className="w-8 h-8 text-primary" />
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
