import { useFuturesCurve } from '@/hooks/useOilGasData';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import WidgetShell from '@/components/ga-widgets/WidgetShell';
import { TrendingUp } from 'lucide-react';
import { useState } from 'react';

const OGFuturesCurve = () => {
  const { data: curve, isLoading } = useFuturesCurve();
  const [showSeries, setShowSeries] = useState<'both' | 'wti' | 'brent'>('both');

  const curveShape = (curve && curve.length >= 2)
    ? (curve[curve.length - 1].wti > curve[0].wti ? 'CONTANGO' : 'BACKWARDATION')
    : '—';

  // Calculate spread data
  const spreadData = (curve ?? []).map((c) => ({
    ...c,
    spread: Math.round((c.brent - c.wti) * 100) / 100,
  }));

  return (
    <WidgetShell icon={TrendingUp} title="FUTURES CURVE" badge={curveShape} source="CME / ICE">
      {isLoading ? (
        <div className="h-64 bg-navy-light/30 rounded animate-pulse" />
      ) : (
        <div className="space-y-4">
          {/* Series toggles */}
          <div className="flex items-center justify-between">
            <div className="flex gap-1">
              {(['both', 'wti', 'brent'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setShowSeries(s)}
                  className={`px-3 py-1 text-[10px] font-display tracking-wider rounded transition-all duration-300 ${
                    showSeries === s ? 'bg-gold/20 text-gold border border-gold/40' : 'text-marble/40 hover:text-marble/70 border border-transparent hover:border-gold/20'
                  }`}
                >
                  {s === 'both' ? 'WTI + BRENT' : s.toUpperCase()}
                </button>
              ))}
            </div>

            {/* Spread indicator */}
            {spreadData.length > 0 && (
              <div className="text-right">
                <span className="text-[9px] text-marble/30 font-display tracking-wider">M1 SPREAD</span>
                <span className="text-xs text-marble/60 ml-2 font-display">${spreadData[0].spread.toFixed(2)}</span>
              </div>
            )}
          </div>

          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={spreadData}>
                <XAxis dataKey="month" tick={{ fill: 'hsl(40,25%,96%,0.4)', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis domain={['dataMin - 1', 'dataMax + 1']} tick={{ fill: 'hsl(40,25%,96%,0.3)', fontSize: 9 }} axisLine={false} tickLine={false} width={45} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'hsl(213,32%,16%)', border: '1px solid hsl(43,72%,50%,0.3)', borderRadius: 4, fontSize: 11 }}
                  cursor={{ stroke: 'hsla(43,72%,50%,0.15)' }}
                  animationDuration={200}
                />
                {(showSeries === 'both' || showSeries === 'wti') && (
                  <Line type="monotone" dataKey="wti" name="WTI" stroke="hsl(25,80%,50%)" strokeWidth={2} dot={{ r: 3, fill: 'hsl(25,80%,50%)', strokeWidth: 0 }} activeDot={{ r: 5, fill: 'hsl(25,80%,50%)', stroke: 'hsl(25,80%,70%)', strokeWidth: 2 }} animationDuration={1000} />
                )}
                {(showSeries === 'both' || showSeries === 'brent') && (
                  <Line type="monotone" dataKey="brent" name="Brent" stroke="hsl(210,60%,50%)" strokeWidth={2} dot={{ r: 3, fill: 'hsl(210,60%,50%)', strokeWidth: 0 }} activeDot={{ r: 5, fill: 'hsl(210,60%,50%)', stroke: 'hsl(210,60%,70%)', strokeWidth: 2 }} animationDuration={1000} />
                )}
                <Legend wrapperStyle={{ fontSize: 10, color: 'hsl(40,25%,96%,0.5)' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <p className="text-[10px] text-marble/25 text-center tracking-wider">
            Market structure: <span className={`font-semibold ${curveShape === 'BACKWARDATION' ? 'text-emerald-400' : 'text-red-400'}`}>{curveShape}</span> — {curveShape === 'BACKWARDATION' ? 'Near-term premium signals tight supply' : 'Forward premium signals adequate supply'}
          </p>
        </div>
      )}
    </WidgetShell>
  );
};

export default OGFuturesCurve;
