const rows = [
  { label: 'Settlement', before: '4.8 days average', after: 'Under 4 hours' },
  { label: 'Cost', before: '2 to 4% of trade value', after: '10 bps (0.10%)' },
  { label: 'Transparency', before: 'Opaque, manual audits', after: 'Real-time, auditable' },
  { label: 'Access', before: '14 institutions globally', after: 'Sovereigns, institutions, SMEs' },
];

const BeforeAfter = () => (
  <section className="bg-navy-dark py-16 border-t border-gold/15">
    <div className="container mx-auto px-4">
      <div className="text-center mb-10">
        <div className="h-1 w-24 mx-auto bg-gradient-to-r from-transparent via-gold to-transparent mb-5" />
        <h2 className="font-display text-3xl md:text-4xl text-gold-light mb-3">
          THE NEW SETTLEMENT STANDARD
        </h2>
        <p className="text-marble/60 text-sm max-w-xl mx-auto">
          Legacy commodity rails versus Gold Arrow infrastructure.
        </p>
      </div>

      {/* Desktop table */}
      <div className="hidden md:grid max-w-5xl mx-auto grid-cols-3 border border-gold/30 bg-navy/40">
        <div className="p-4 border-b border-gold/20"></div>
        <div className="p-4 border-b border-l border-gold/20 font-display text-xs tracking-[0.25em] text-marble/60 uppercase text-center">Before</div>
        <div className="p-4 border-b border-l border-gold/20 font-display text-xs tracking-[0.25em] text-gold uppercase text-center">After · Gold Arrow</div>
        {rows.map((r) => (
          <div key={r.label} className="contents">
            <div className="p-4 border-b border-gold/10 font-display text-sm tracking-[0.15em] text-gold uppercase">{r.label}</div>
            <div className="p-4 border-b border-l border-gold/10 text-marble/60 text-sm text-center">{r.before}</div>
            <div className="p-4 border-b border-l border-gold/10 text-gold-light font-semibold text-sm text-center">{r.after}</div>
          </div>
        ))}
      </div>

      {/* Mobile stacked */}
      <div className="md:hidden max-w-md mx-auto space-y-4">
        {rows.map((r) => (
          <div key={r.label} className="border border-gold/30 bg-navy/40 p-4">
            <div className="font-display text-xs tracking-[0.2em] text-gold uppercase mb-3">{r.label}</div>
            <div className="text-marble/60 text-xs mb-1">Before · {r.before}</div>
            <div className="text-gold-light text-sm font-semibold">After · {r.after}</div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default BeforeAfter;