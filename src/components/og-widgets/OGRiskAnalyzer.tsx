import { ShieldAlert, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';
import { useSpreads, useWtiBrentSpreadHistory } from '@/hooks/useOilGasData';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from 'recharts';
import LivePulse from '@/components/ga-widgets/LivePulse';

const tooltipStyle = { background: 'hsl(213,32%,16%)', border: '1px solid hsl(43,72%,50%,0.3)', fontSize: 10 };

const chokepoints = [
  { name: 'Strait of Hormuz', throughput: 21.0, risk: 'low', vessels: 42 },
  { name: 'Suez Canal', throughput: 5.5, risk: 'medium', vessels: 28 },
  { name: 'Bab el-Mandeb', throughput: 6.2, risk: 'high', vessels: 18 },
  { name: 'Strait of Malacca', throughput: 16.0, risk: 'low', vessels: 55 },
  { name: 'LOOP Terminal', throughput: 3.2, risk: 'low', vessels: 8 },
];

const riskColors = { low: 'bg-emerald-500', medium: 'bg-amber-500', high: 'bg-red-500' };
const riskText = { low: 'text-emerald-400', medium: 'text-amber-400', high: 'text-red-400' };

const OGRiskAnalyzer = () => {
  const { data: spreads } = useSpreads();
  const { data: spreadHistory } = useWtiBrentSpreadHistory();

  const spreadMetrics = [
    { label: 'WTI-BRENT SPREAD', value: spreads?.wtiBrent ?? -3.73, unit: '$/bbl', threshold: -5 },
    { label: '3-2-1 CRACK SPREAD', value: spreads?.crack321 ?? 28.15, unit: '$/bbl', threshold: 20 },
    { label: 'SPARK SPREAD', value: spreads?.sparkSpread ?? 1.82, unit: '$/MMBtu', threshold: 1.0 },
    { label: 'HEAT CRACK', value: spreads?.heatCrack ?? 31.40, unit: '$/bbl', threshold: 25 },
  ];

  return (
    <div className="relative rounded-sm bg-gradient-to-br from-navy via-navy to-navy-light border border-gold/30 overflow-hidden">
      <div className="ornate-corner ornate-corner-tl" />
      <div className="ornate-corner ornate-corner-tr" />
      <div className="ornate-corner ornate-corner-bl" />
      <div className="ornate-corner ornate-corner-br" />

      <div className="p-6 md:p-8">
        <div className="flex items-center gap-3 mb-6">
          <ShieldAlert className="w-5 h-5 text-gold" />
          <h3 className="font-display text-lg tracking-[0.1em] text-gold-light">RISK & SPREADS ANALYZER</h3>
          <LivePulse label="LIVE" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Spreads Panel */}
          <div>
            <div className="text-[9px] font-display tracking-[0.2em] text-marble/30 mb-3">SPREAD METRICS</div>
            <div className="grid grid-cols-2 gap-3 mb-4">
              {spreadMetrics.map(m => {
                const isHealthy = m.label.includes('WTI') ? m.value > m.threshold : m.value > m.threshold;
                return (
                  <div key={m.label} className="bg-navy-light/20 rounded p-3 border border-gold/5">
                    <div className="text-[7px] font-display tracking-wider text-marble/30">{m.label}</div>
                    <div className={`text-lg font-mono mt-1 ${isHealthy ? 'text-emerald-400' : 'text-red-400'}`}>
                      {m.value >= 0 ? '' : ''}{m.value.toFixed(2)}
                    </div>
                    <div className="text-[8px] text-marble/20">{m.unit}</div>
                    <div className="flex items-center gap-1 mt-1">
                      <div className={`w-1.5 h-1.5 rounded-full ${isHealthy ? 'bg-emerald-500' : 'bg-red-500'}`} />
                      <span className={`text-[7px] font-display tracking-wider ${isHealthy ? 'text-emerald-400/60' : 'text-red-400/60'}`}>
                        {isHealthy ? 'HEALTHY' : 'ALERT'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* WTI-Brent Spread Chart */}
            {spreadHistory && (
              <div className="bg-navy-light/10 rounded p-3 border border-gold/5">
                <div className="text-[8px] font-display tracking-wider text-marble/30 mb-2">WTI-BRENT 30D SPREAD</div>
                <ResponsiveContainer width="100%" height={120}>
                  <AreaChart data={spreadHistory}>
                    <defs>
                      <linearGradient id="riskSpread" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(25, 80%, 50%)" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="hsl(25, 80%, 50%)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(213,28%,24%)" />
                    <XAxis dataKey="date" tick={{ fontSize: 7, fill: 'hsl(40,25%,96%,0.2)' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 7, fill: 'hsl(40,25%,96%,0.2)' }} axisLine={false} tickLine={false} width={35} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <ReferenceLine y={0} stroke="hsl(43,72%,50%,0.3)" strokeDasharray="3 3" />
                    <Area type="monotone" dataKey="spread" stroke="hsl(25, 80%, 50%)" fill="url(#riskSpread)" strokeWidth={1.5} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Chokepoints Panel */}
          <div>
            <div className="text-[9px] font-display tracking-[0.2em] text-marble/30 mb-3">CHOKEPOINT RISK LEVELS</div>
            <div className="space-y-2">
              {chokepoints.map(cp => (
                <div key={cp.name} className="flex items-center gap-3 p-3 bg-navy-light/15 rounded border border-gold/5 hover:border-gold/15 transition-colors">
                  <div className={`w-2.5 h-2.5 rounded-full ${riskColors[cp.risk as keyof typeof riskColors]} flex-shrink-0`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-display tracking-wider text-marble/70">{cp.name}</span>
                      <span className={`text-[9px] font-display tracking-wider ${riskText[cp.risk as keyof typeof riskText]}`}>
                        {cp.risk.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-[9px] font-mono text-marble/30">{cp.throughput} mbpd</span>
                      <span className="text-[9px] font-mono text-marble/20">{cp.vessels} vessels</span>
                    </div>
                    <div className="h-1 bg-navy-dark/50 rounded-full mt-1.5 overflow-hidden">
                      <div className={`h-full rounded-full ${riskColors[cp.risk as keyof typeof riskColors]}`}
                        style={{ width: `${cp.risk === 'high' ? 85 : cp.risk === 'medium' ? 55 : 25}%`, opacity: 0.6 }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OGRiskAnalyzer;
