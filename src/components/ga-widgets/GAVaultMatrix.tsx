import { useBullionBars } from '@/hooks/useBullionBars';
import { useMetalPrices } from '@/hooks/useMetalPrices';
import { Vault, Shield, CheckCircle2, AlertTriangle } from 'lucide-react';

const statusConfig = {
  free: { label: 'Free', icon: CheckCircle2, className: 'text-emerald-400 bg-emerald-400/10' },
  pledged: { label: 'Pledged', icon: Shield, className: 'text-gold bg-gold/10' },
  redeemed: { label: 'Redeemed', icon: AlertTriangle, className: 'text-marble/40 bg-marble/10' },
};

const metalDot: Record<string, string> = {
  gold: 'bg-gold',
  silver: 'bg-silver',
  platinum: 'bg-platinum',
};

const GAVaultMatrix = () => {
  const { data: bars, isLoading } = useBullionBars({ limit: 20 });
  const { data: prices } = useMetalPrices();

  return (
    <div className="relative rounded-sm bg-gradient-to-br from-navy via-navy to-navy-light border border-gold/30 overflow-hidden">
      <div className="ornate-corner ornate-corner-tl" />
      <div className="ornate-corner ornate-corner-tr" />
      <div className="ornate-corner ornate-corner-bl" />
      <div className="ornate-corner ornate-corner-br" />

      <div className="p-6 md:p-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Vault className="w-5 h-5 text-gold" />
          <h3 className="font-display text-lg tracking-[0.1em] text-gold-light">VAULT INVENTORY</h3>
          {bars && (
            <span className="ml-auto text-[10px] tracking-widest text-marble/40 font-display">
              {bars.length} BARS
            </span>
          )}
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-navy-light/50 rounded animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gold/20">
                  <th className="text-left py-2 px-3 font-display text-[10px] tracking-[0.2em] text-marble/50">METAL</th>
                  <th className="text-left py-2 px-3 font-display text-[10px] tracking-[0.2em] text-marble/50">SERIAL</th>
                  <th className="text-right py-2 px-3 font-display text-[10px] tracking-[0.2em] text-marble/50">WEIGHT</th>
                  <th className="text-right py-2 px-3 font-display text-[10px] tracking-[0.2em] text-marble/50">PURITY</th>
                  <th className="text-right py-2 px-3 font-display text-[10px] tracking-[0.2em] text-marble/50">VALUE</th>
                  <th className="text-center py-2 px-3 font-display text-[10px] tracking-[0.2em] text-marble/50">STATUS</th>
                </tr>
              </thead>
              <tbody>
                {bars?.map((bar) => {
                  const spot = prices?.[bar.metal_type]?.price_usd ?? 0;
                  const value = Number(bar.weight_oz) * spot;
                  const status = statusConfig[bar.custody_status];
                  const StatusIcon = status.icon;
                  return (
                    <tr key={bar.id} className="border-b border-navy-light/50 hover:bg-navy-light/30 transition-colors">
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${metalDot[bar.metal_type]}`} />
                          <span className="font-display text-xs tracking-[0.15em] text-marble/70">
                            {bar.metal_type.toUpperCase()}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-3 font-mono text-xs text-marble/60">{bar.serial_number}</td>
                      <td className="py-3 px-3 text-right text-sm text-marble font-medium">
                        {Number(bar.weight_oz).toLocaleString()} oz
                      </td>
                      <td className="py-3 px-3 text-right text-xs text-marble/60">
                        {(Number(bar.purity) * 100).toFixed(2)}%
                      </td>
                      <td className="py-3 px-3 text-right text-sm text-gold-light font-medium">
                        ${value.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                      </td>
                      <td className="py-3 px-3">
                        <div className={`flex items-center justify-center gap-1 text-[10px] px-2 py-1 rounded ${status.className}`}>
                          <StatusIcon className="w-3 h-3" />
                          {status.label}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {(!bars || bars.length === 0) && (
              <div className="text-center py-8 text-marble/30 text-sm font-display tracking-widest">
                NO BARS IN VAULT
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default GAVaultMatrix;
