import { useReserveHistory } from '@/hooks/useReserveProof';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { History, Link2 } from 'lucide-react';

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-navy-dark border border-gold/30 rounded px-3 py-2 shadow-lg text-xs">
      <p className="font-display text-gold-light mb-1">{d.date}</p>
      <div className="space-y-0.5 text-marble/60">
        <p>Gold: {d.gold.toLocaleString()} oz</p>
        <p>Silver: {d.silver.toLocaleString()} oz</p>
        <p>Platinum: {d.platinum.toLocaleString()} oz</p>
        <p className="text-marble/40 mt-1">{d.bars} bars verified</p>
      </div>
    </div>
  );
};

const GAReserveTimeline = () => {
  const { data: history, isLoading } = useReserveHistory(12);

  const chartData = (history ?? [])
    .slice()
    .reverse()
    .map((s) => ({
      date: new Date(s.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      gold: Number(s.total_gold_oz),
      silver: Number(s.total_silver_oz),
      platinum: Number(s.total_platinum_oz),
      bars: s.bar_count,
      total: Number(s.total_gold_oz) + Number(s.total_silver_oz) + Number(s.total_platinum_oz),
      txid: s.bitcoin_txid,
      merkle: s.merkle_root,
    }));

  return (
    <div className="relative rounded-sm bg-gradient-to-br from-navy via-navy to-navy-light border border-gold/30 overflow-hidden">
      <div className="ornate-corner ornate-corner-tl" />
      <div className="ornate-corner ornate-corner-tr" />
      <div className="ornate-corner ornate-corner-bl" />
      <div className="ornate-corner ornate-corner-br" />

      <div className="p-6 md:p-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <History className="w-5 h-5 text-gold" />
          <h3 className="font-display text-lg tracking-[0.1em] text-gold-light">RESERVE TIMELINE</h3>
        </div>

        {isLoading ? (
          <div className="h-48 bg-navy-light/30 rounded animate-pulse" />
        ) : chartData.length > 0 ? (
          <>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 5, right: 5, left: 10, bottom: 5 }}>
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10, fill: 'hsl(210, 6%, 67%)' }}
                    axisLine={{ stroke: 'hsl(213, 28%, 24%)' }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: 'hsl(210, 6%, 67%)' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                    width={45}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsla(43, 72%, 50%, 0.05)' }} />
                  <Bar dataKey="total" radius={[3, 3, 0, 0]} maxBarSize={32}>
                    {chartData.map((_, i) => (
                      <Cell key={i} fill={`hsla(43, 72%, 50%, ${0.3 + (i / chartData.length) * 0.5})`} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Latest snapshots with Bitcoin anchoring */}
            <div className="mt-4 space-y-2">
              {chartData.slice(-3).reverse().map((snap, i) => (
                <div key={i} className="flex items-center gap-3 text-[10px]">
                  <div className="w-1.5 h-1.5 rounded-full bg-gold flex-shrink-0" />
                  <span className="text-marble/50 font-display tracking-wider w-16">{snap.date}</span>
                  <span className="text-marble/40">{snap.bars} bars</span>
                  {snap.txid && (
                    <div className="flex items-center gap-1 text-emerald-400 ml-auto">
                      <Link2 className="w-3 h-3" />
                      <span className="font-mono truncate max-w-[120px]">{snap.txid}</span>
                    </div>
                  )}
                  {!snap.txid && (
                    <span className="text-marble/20 ml-auto font-mono">pending</span>
                  )}
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-8 text-marble/30 text-sm font-display tracking-widest">
            NO SNAPSHOTS RECORDED
          </div>
        )}
      </div>
    </div>
  );
};

export default GAReserveTimeline;
