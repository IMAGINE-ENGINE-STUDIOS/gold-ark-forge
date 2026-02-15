import { useFuturesCurve } from '@/hooks/useOilGasData';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import WidgetShell from '@/components/ga-widgets/WidgetShell';
import { TrendingUp } from 'lucide-react';

const OGFuturesCurve = () => {
  const { data: curve, isLoading } = useFuturesCurve();

  const curveShape = (curve && curve.length >= 2)
    ? (curve[curve.length - 1].wti > curve[0].wti ? 'CONTANGO' : 'BACKWARDATION')
    : '—';

  return (
    <WidgetShell icon={TrendingUp} title="FUTURES CURVE" badge={curveShape} source="CME / ICE">
      {isLoading ? (
        <div className="h-64 bg-navy-light/30 rounded animate-pulse" />
      ) : (
        <div className="space-y-4">
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={curve}>
                <XAxis dataKey="month" tick={{ fill: 'hsl(40,25%,96%,0.4)', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis domain={['dataMin - 1', 'dataMax + 1']} tick={{ fill: 'hsl(40,25%,96%,0.3)', fontSize: 9 }} axisLine={false} tickLine={false} width={45} />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(213,32%,16%)', border: '1px solid hsl(43,72%,50%,0.3)', borderRadius: 4, fontSize: 11 }} />
                <Line type="monotone" dataKey="wti" name="WTI" stroke="hsl(25,80%,50%)" strokeWidth={2} dot={{ r: 3, fill: 'hsl(25,80%,50%)' }} />
                <Line type="monotone" dataKey="brent" name="Brent" stroke="hsl(210,60%,50%)" strokeWidth={2} dot={{ r: 3, fill: 'hsl(210,60%,50%)' }} />
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
