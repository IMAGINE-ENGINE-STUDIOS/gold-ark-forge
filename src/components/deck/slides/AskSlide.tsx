import SlideLayout from '../SlideLayout';

const projections = [
  { year: 'Year 1', revenue: '$1.2M', users: '500+', aum: '$50M' },
  { year: 'Year 2', revenue: '$8.5M', users: '5,000+', aum: '$400M' },
  { year: 'Year 3', revenue: '$32M', users: '25,000+', aum: '$2B' },
];

const AskSlide = () => (
  <SlideLayout>
    <div className="flex flex-col h-full px-[120px] py-[70px]">
      <p className="text-[16px] tracking-[0.3em] uppercase text-primary/60 mb-3">The Ask</p>
      <h2 className="text-[52px] leading-tight text-secondary-foreground mb-2" style={{ fontFamily: 'Cinzel, serif' }}>
        Seed Round: <span className="text-gradient-gold">$5M</span>
      </h2>
      <div className="w-[100px] h-[3px] bg-primary/40 mb-10" />

      {/* Use of funds */}
      <div className="grid grid-cols-3 gap-10 mb-10">
        {[
          { label: 'Product & Engineering', pct: '50%' },
          { label: 'Go-to-Market', pct: '30%' },
          { label: 'Operations & Legal', pct: '20%' },
        ].map((u, i) => (
          <div key={i} className="border border-primary/15 rounded-lg p-6 bg-secondary/20 text-center">
            <p className="text-[40px] font-bold text-primary mb-1" style={{ fontFamily: 'Cinzel, serif' }}>{u.pct}</p>
            <p className="text-[17px] text-secondary-foreground/55">{u.label}</p>
          </div>
        ))}
      </div>

      {/* Financial projections table */}
      <p className="text-[16px] tracking-[0.2em] uppercase text-primary/50 mb-4">Financial Projections</p>
      <div className="border border-primary/15 rounded-lg overflow-hidden mb-8">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-primary/10 border-b border-primary/15">
              <th className="text-[18px] text-secondary-foreground/70 py-4 px-8 font-normal tracking-wider">Period</th>
              <th className="text-[18px] text-secondary-foreground/70 py-4 px-8 font-normal tracking-wider">Revenue</th>
              <th className="text-[18px] text-secondary-foreground/70 py-4 px-8 font-normal tracking-wider">Users</th>
              <th className="text-[18px] text-secondary-foreground/70 py-4 px-8 font-normal tracking-wider">AUM</th>
            </tr>
          </thead>
          <tbody>
            {projections.map((p, i) => (
              <tr key={i} className="border-b border-primary/10 last:border-0">
                <td className="text-[20px] text-secondary-foreground/80 py-4 px-8" style={{ fontFamily: 'Cinzel, serif' }}>{p.year}</td>
                <td className="text-[22px] text-primary font-bold py-4 px-8">{p.revenue}</td>
                <td className="text-[20px] text-secondary-foreground/70 py-4 px-8">{p.users}</td>
                <td className="text-[20px] text-secondary-foreground/70 py-4 px-8">{p.aum}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-between items-end mt-auto">
        <div>
          <p className="text-[24px] text-secondary-foreground/80 mb-1" style={{ fontFamily: 'Cinzel, serif' }}>investors@goldarrow.io</p>
          <p className="text-[16px] text-secondary-foreground/40">goldarrow.io</p>
        </div>
        <div className="text-right">
          <p className="text-[16px] text-secondary-foreground/40">Revenue model: SaaS fees + 0.15% transaction spread + custody fees</p>
        </div>
      </div>
    </div>
  </SlideLayout>
);

export default AskSlide;
