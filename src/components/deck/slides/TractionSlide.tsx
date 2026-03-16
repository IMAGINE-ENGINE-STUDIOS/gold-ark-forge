import SlideLayout from '../SlideLayout';
import { useCertificateReserveTotals } from '@/hooks/useCertificateReserveTotals';
import { useBullionBars } from '@/hooks/useBullionBars';
import { usePartners } from '@/hooks/usePartners';

const TractionSlide = () => {
  const { data: totals } = useCertificateReserveTotals();
  const { data: bars } = useBullionBars({ limit: 1000 });
  const { data: partners } = usePartners();

  const metrics = [
    { label: 'Certificates Issued', value: totals?.cert_count ?? 0 },
    { label: 'Gold in Vault (oz)', value: totals?.gold_oz?.toLocaleString() ?? '0' },
    { label: 'Silver in Vault (oz)', value: totals?.silver_oz?.toLocaleString() ?? '0' },
    { label: 'Bullion Bars Registered', value: bars?.length ?? 0 },
    { label: 'Partner Network', value: partners?.length ?? 0 },
    { label: 'Jurisdictions', value: new Set(bars?.map(b => b.jurisdiction) ?? []).size },
  ];

  return (
    <SlideLayout>
      <div className="flex flex-col h-full px-[120px] py-[80px]">
        <p className="text-[16px] tracking-[0.3em] uppercase text-primary/60 mb-3">Traction</p>
        <h2 className="text-[52px] leading-tight text-secondary-foreground mb-2" style={{ fontFamily: 'Cinzel, serif' }}>
          Live <span className="text-gradient-gold">Metrics</span>
        </h2>
        <div className="w-[100px] h-[3px] bg-primary/40 mb-14" />

        <div className="grid grid-cols-3 gap-8 flex-1 content-start">
          {metrics.map((m, i) => (
            <div key={i} className="border border-primary/15 rounded-lg p-8 bg-secondary/20 text-center">
              <p className="text-[48px] font-bold text-primary mb-2" style={{ fontFamily: 'Cinzel, serif' }}>
                {typeof m.value === 'number' ? m.value.toLocaleString() : m.value}
              </p>
              <p className="text-[18px] tracking-wider text-secondary-foreground/50 uppercase">{m.label}</p>
            </div>
          ))}
        </div>

        <p className="text-[14px] text-secondary-foreground/30 text-center mt-4">Data pulled live from Gold Arrow backend</p>
      </div>
    </SlideLayout>
  );
};

export default TractionSlide;
