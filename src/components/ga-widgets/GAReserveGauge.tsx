import { useCertificateReserveTotals } from '@/hooks/useCertificateReserveTotals';
import { useMetalPrices } from '@/hooks/useMetalPrices';
import { useLatestReserveProof } from '@/hooks/useReserveProof';
import { Shield, Lock, CheckCircle2 } from 'lucide-react';
import { useInView } from '@/hooks/useInView';

const GAReserveGauge = () => {
  const { ref, inView } = useInView();
  const { data: totals, isLoading: loadingTotals } = useCertificateReserveTotals();
  const { data: prices, isLoading: loadingPrices } = useMetalPrices();
  const { data: proof } = useLatestReserveProof();
  const isLoading = loadingTotals || loadingPrices;

  const goldValue = (totals?.gold_oz ?? 0) * (prices?.gold?.price_usd ?? 0);
  const silverValue = (totals?.silver_oz ?? 0) * (prices?.silver?.price_usd ?? 0);
  const platinumValue = (totals?.platinum_oz ?? 0) * (prices?.platinum?.price_usd ?? 0);
  const totalValue = goldValue + silverValue + platinumValue;

  const segments = [
    { label: 'Gold', oz: totals?.gold_oz ?? 0, value: goldValue, color: 'hsl(43, 72%, 50%)', pct: totalValue > 0 ? (goldValue / totalValue) * 100 : 0 },
    { label: 'Silver', oz: totals?.silver_oz ?? 0, value: silverValue, color: 'hsl(210, 6%, 67%)', pct: totalValue > 0 ? (silverValue / totalValue) * 100 : 0 },
    { label: 'Platinum', oz: totals?.platinum_oz ?? 0, value: platinumValue, color: 'hsl(210, 4%, 76%)', pct: totalValue > 0 ? (platinumValue / totalValue) * 100 : 0 },
  ];

  // Arc gauge SVG
  const radius = 80;
  const circumference = Math.PI * radius; // half circle
  let accumulatedOffset = 0;

  return (
    <div ref={ref} className={`relative rounded-sm bg-gradient-to-br from-navy via-navy to-navy-light border border-gold/30 overflow-hidden transition-all duration-700 ease-out hover:border-gold/40 hover:shadow-[0_0_30px_-10px_hsla(43,72%,50%,0.15)] ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
      <div className="ornate-corner ornate-corner-tl" />
      <div className="ornate-corner ornate-corner-tr" />
      <div className="ornate-corner ornate-corner-bl" />
      <div className="ornate-corner ornate-corner-br" />

      <div className="p-6 md:p-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Shield className="w-5 h-5 text-gold" />
          <h3 className="font-display text-lg tracking-[0.1em] text-gold-light">RESERVE BACKING</h3>
        </div>

        <div className="flex flex-col lg:flex-row items-center gap-8">
          {/* Arc Gauge */}
          <div className="relative flex-shrink-0">
            <svg width="200" height="120" viewBox="0 0 200 120">
              {/* Background arc */}
              <path
                d="M 10 110 A 80 80 0 0 1 190 110"
                fill="none"
                stroke="hsl(213, 28%, 24%)"
                strokeWidth="12"
                strokeLinecap="round"
              />
              {/* Colored segments */}
              {segments.map((seg, i) => {
                const segLength = (seg.pct / 100) * circumference;
                const dashOffset = circumference - accumulatedOffset;
                accumulatedOffset += segLength;
                return (
                  <path
                    key={i}
                    d="M 10 110 A 80 80 0 0 1 190 110"
                    fill="none"
                    stroke={seg.color}
                    strokeWidth="12"
                    strokeLinecap="round"
                    strokeDasharray={`${segLength} ${circumference}`}
                    strokeDashoffset={-accumulatedOffset + segLength}
                    className="transition-all duration-1000"
                    style={{ transformOrigin: '100px 110px' }}
                  />
                );
              })}
            </svg>
            {/* Center value */}
            <div className="absolute inset-0 flex flex-col items-center justify-end pb-2">
              <span className="font-display text-2xl text-marble font-semibold">
                {isLoading ? '...' : `$${(totalValue / 1000000).toFixed(2)}M`}
              </span>
              <span className="text-[10px] text-marble/40 tracking-widest">TOTAL VALUE</span>
            </div>
          </div>

          {/* Breakdown */}
          <div className="flex-1 w-full space-y-4">
            {segments.map((seg) => (
              <div key={seg.label} className="flex items-center gap-4">
                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: seg.color }} />
                <div className="flex-1">
                  <div className="flex justify-between items-baseline mb-1">
                    <span className="font-display text-xs tracking-[0.15em] text-marble/70">{seg.label.toUpperCase()}</span>
                    <span className="text-sm text-marble font-medium">{seg.oz.toLocaleString()} oz</span>
                  </div>
                  <div className="h-1.5 bg-navy-light rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-1000"
                      style={{ width: `${seg.pct}%`, backgroundColor: seg.color }}
                    />
                  </div>
                </div>
                <span className="text-xs text-marble/40 w-12 text-right">{seg.pct.toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Proof Footer */}
        {proof && (
          <div className="mt-6 pt-4 border-t border-gold/10 flex flex-wrap items-center gap-4 text-[10px]">
            <div className="flex items-center gap-1.5 text-emerald-400">
              <CheckCircle2 className="w-3 h-3" />
              <span>Bitcoin Anchored</span>
            </div>
            <div className="flex items-center gap-1.5 text-marble/40">
              <Lock className="w-3 h-3" />
              <span className="font-mono truncate max-w-[180px]">{proof.merkle_root}</span>
            </div>
            <span className="text-marble/30">{proof.bar_count} bars verified</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default GAReserveGauge;
