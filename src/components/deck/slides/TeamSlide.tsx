import SlideLayout from '../SlideLayout';
import jamesStuber from '@/assets/james-stuber.jpg';
import ricardoFont from '@/assets/ricardo-font.png';
import khaliaPadilla from '@/assets/khalia-padilla.png';
import macdonnellUlsch from '@/assets/macdonnell-ulsch.jpg';

const team = [
  { name: 'Khalia Padilla', role: 'Co-Founder', bg: 'Strategic leadership & global business development', photo: khaliaPadilla },
  { name: 'Ricardo Font', role: 'Co-Founder', bg: 'Technology vision & platform architecture', photo: ricardoFont },
  { name: 'James Stuber', role: 'Legal Counsel', bg: 'Securities law, regulatory compliance & international trade', photo: jamesStuber },
  { name: 'N. MacDonnell Ulsch', role: 'Senior Advisor', bg: 'Government relations, diplomacy & institutional partnerships', photo: macdonnellUlsch },
];

const TeamSlide = () => (
  <SlideLayout>
    <div className="flex flex-col h-full px-[120px] py-[70px]">
      <p className="text-[16px] tracking-[0.3em] uppercase text-primary/60 mb-3">Leadership</p>
      <h2 className="text-[52px] leading-tight text-secondary-foreground mb-2" style={{ fontFamily: 'Cinzel, serif' }}>
        The <span className="text-gradient-gold">Team</span>
      </h2>
      <div className="greek-key-border-rich w-[120px] h-[4px] mb-10 rounded-sm" />

      <div className="grid grid-cols-4 gap-8 flex-1 items-start">
        {team.map((t, i) => (
          <div key={i} className="flex flex-col items-center text-center group">
            <div
              className="w-[280px] h-[320px] rounded-2xl mb-6 overflow-hidden transition-all duration-500 group-hover:scale-[1.03]"
              style={{
                border: '2px solid hsla(43,72%,50%,0.3)',
                boxShadow: '0 8px 40px hsla(0,0%,0%,0.4), 0 0 20px hsla(43,72%,50%,0.08)',
              }}
            >
              <img src={t.photo} alt={t.name} className="w-full h-full object-cover" />
            </div>
            <h3 className="text-[26px] text-secondary-foreground mb-1" style={{ fontFamily: 'Cinzel, serif' }}>{t.name}</h3>
            <p className="text-[19px] text-primary/70 mb-2">{t.role}</p>
            <p className="text-[15px] text-secondary-foreground/50 leading-relaxed max-w-[280px]">{t.bg}</p>
          </div>
        ))}
      </div>
    </div>
  </SlideLayout>
);

export default TeamSlide;