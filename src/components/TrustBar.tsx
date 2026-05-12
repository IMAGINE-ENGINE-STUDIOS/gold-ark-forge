import { ShieldCheck, Landmark, ScrollText, Users } from 'lucide-react';

const items = [
  { icon: Landmark, label: 'HSBC Custody Anchor' },
  { icon: ScrollText, label: 'SEC · CFTC · FinCEN' },
  { icon: ShieldCheck, label: 'EUDR · EU Battery Reg.' },
  { icon: Users, label: 'Named Team & Counsel' },
];

const TrustBar = () => (
  <section className="bg-navy-dark border-y border-gold/20">
    <div className="container mx-auto px-4 py-5">
      <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
        <span className="font-display text-[10px] tracking-[0.3em] text-gold/60 uppercase">
          Institutional Anchors
        </span>
        {items.map(({ icon: Icon, label }) => (
          <div key={label} className="flex items-center gap-2 text-marble/80">
            <Icon className="w-3.5 h-3.5 text-gold" />
            <span className="font-display text-[11px] tracking-[0.15em] uppercase">{label}</span>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default TrustBar;