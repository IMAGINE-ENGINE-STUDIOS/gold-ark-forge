import { useState, useEffect } from 'react';
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

const TeamSlide = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 150);
    return () => clearTimeout(t);
  }, []);

  return (
    <SlideLayout>
      <div className="flex flex-col h-full px-[100px] py-[60px]">
        <div style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(-20px)', transition: 'all 0.8s cubic-bezier(0.22, 1, 0.36, 1) 0.1s' }}>
          <p className="text-[20px] tracking-[0.3em] uppercase text-primary/60 mb-3">Leadership</p>
          <h2 className="text-[64px] leading-tight text-secondary-foreground mb-2" style={{ fontFamily: 'Cinzel, serif' }}>
            The <span className="text-gradient-gold">Team</span>
          </h2>
          <div className="greek-key-border-rich w-[120px] h-[4px] mb-8 rounded-sm" />
        </div>

        <div className="flex-1 flex items-center justify-center">
          <div className="flex gap-10 justify-center">
            {team.map((t, i) => (
              <div key={i} className="flex flex-col items-center text-center group"
                style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0) scale(1)' : 'translateY(40px) scale(0.92)', transition: `all 0.9s cubic-bezier(0.22, 1, 0.36, 1) ${0.3 + i * 0.15}s` }}>
                <div className="relative mb-5">
                  <div className="w-[300px] h-[340px] rounded-2xl overflow-hidden transition-all duration-700 group-hover:scale-[1.03] group-hover:shadow-[0_12px_50px_hsla(43,72%,50%,0.2)]"
                    style={{ border: '2px solid hsla(43,72%,50%,0.25)', boxShadow: '0 10px 50px hsla(0,0%,0%,0.5), 0 0 30px hsla(43,72%,50%,0.06)' }}>
                    <img src={t.photo} alt={t.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.05]" />
                    <div className="absolute inset-x-0 bottom-0 h-[120px] pointer-events-none rounded-b-2xl" style={{ background: 'linear-gradient(to top, hsla(213,32%,10%,0.85) 0%, transparent 100%)' }} />
                  </div>
                  <span className="absolute top-0 left-0 w-[20px] h-[20px] border-t-2 border-l-2 rounded-tl-2xl pointer-events-none" style={{ borderColor: 'hsla(43,72%,50%,0.4)' }} />
                  <span className="absolute top-0 right-0 w-[20px] h-[20px] border-t-2 border-r-2 rounded-tr-2xl pointer-events-none" style={{ borderColor: 'hsla(43,72%,50%,0.4)' }} />
                  <span className="absolute bottom-0 left-0 w-[20px] h-[20px] border-b-2 border-l-2 rounded-bl-2xl pointer-events-none" style={{ borderColor: 'hsla(43,72%,50%,0.4)' }} />
                  <span className="absolute bottom-0 right-0 w-[20px] h-[20px] border-b-2 border-r-2 rounded-br-2xl pointer-events-none" style={{ borderColor: 'hsla(43,72%,50%,0.4)' }} />
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-5 py-1.5 rounded-full text-[18px] tracking-wider"
                    style={{ background: 'hsla(43,72%,50%,0.15)', border: '1px solid hsla(43,72%,50%,0.35)', backdropFilter: 'blur(12px)', color: 'hsla(43,72%,70%,1)', fontFamily: 'Cinzel, serif' }}>
                    {t.role}
                  </div>
                </div>
                <h3 className="text-[34px] text-secondary-foreground mb-2 transition-colors duration-300 group-hover:text-primary" style={{ fontFamily: 'Cinzel, serif' }}>{t.name}</h3>
                <div className="w-[40px] h-[2px] rounded-full mb-3 transition-all duration-500 group-hover:w-[60px]" style={{ background: 'linear-gradient(90deg, transparent, hsla(43,72%,50%,0.5), transparent)' }} />
                <p className="text-[18px] text-secondary-foreground/45 leading-relaxed max-w-[280px]">{t.bg}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </SlideLayout>
  );
};

export default TeamSlide;
