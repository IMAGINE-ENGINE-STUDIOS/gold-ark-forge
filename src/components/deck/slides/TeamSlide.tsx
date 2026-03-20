import SlideLayout from '../SlideLayout';
import { User } from 'lucide-react';

const team = [
  { name: 'CEO / Founder', role: 'Vision & Strategy', bg: '15+ years in commodities & fintech' },
  { name: 'CTO', role: 'Technology & Architecture', bg: 'Ex-FAANG, blockchain infrastructure' },
  { name: 'COO', role: 'Operations & Compliance', bg: 'Former VP at tier-1 custodian' },
  { name: 'Head of Partnerships', role: 'Vault & Dealer Network', bg: 'Global precious metals industry' },
];

const TeamSlide = () => (
  <SlideLayout>
    <div className="flex flex-col h-full px-[120px] py-[80px]">
      <p className="text-[16px] tracking-[0.3em] uppercase text-primary/60 mb-3">Leadership</p>
      <h2 className="text-[52px] leading-tight text-secondary-foreground mb-2" style={{ fontFamily: 'Cinzel, serif' }}>
        The <span className="text-gradient-gold">Team</span>
      </h2>
      <div className="greek-key-border-rich w-[120px] h-[4px] mb-14 rounded-sm" />

      <div className="grid grid-cols-4 gap-10 flex-1 items-start">
        {team.map((t, i) => (
          <div key={i} className="flex flex-col items-center text-center">
            <div className="w-[130px] h-[130px] rounded-full flex items-center justify-center mb-6"
              style={{
                border: '2px solid hsla(43,72%,50%,0.35)',
                background: 'radial-gradient(circle, hsla(43,72%,50%,0.08) 0%, transparent 70%)',
                boxShadow: '0 0 30px hsla(43,72%,50%,0.08)',
              }}
            >
              <User className="w-14 h-14 text-primary/40" />
            </div>
            <h3 className="text-[24px] text-secondary-foreground mb-1" style={{ fontFamily: 'Cinzel, serif' }}>{t.name}</h3>
            <p className="text-[18px] text-primary/70 mb-3">{t.role}</p>
            <p className="text-[16px] text-secondary-foreground/50">{t.bg}</p>
          </div>
        ))}
      </div>
    </div>
  </SlideLayout>
);

export default TeamSlide;
