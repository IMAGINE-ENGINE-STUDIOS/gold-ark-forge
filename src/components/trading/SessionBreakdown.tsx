import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';
import type { PaperOrder } from '@/hooks/usePaperTrading';

interface SessionBreakdownProps {
  orders: PaperOrder[];
}

const chartTooltipStyle = { background: 'hsl(213,32%,16%)', border: '1px solid hsl(43,72%,50%,0.3)', fontSize: 10 };

function getSession(timestamp: number): 'Asia' | 'London' | 'New York' {
  const hour = new Date(timestamp).getUTCHours();
  if (hour >= 0 && hour < 8) return 'Asia';
  if (hour >= 8 && hour < 14) return 'London';
  return 'New York';
}

export default function SessionBreakdown({ orders }: SessionBreakdownProps) {
  const sessionData = useMemo(() => {
    const sessions: Record<string, { buys: number; sells: number; net: number; count: number }> = {
      'Asia': { buys: 0, sells: 0, net: 0, count: 0 },
      'London': { buys: 0, sells: 0, net: 0, count: 0 },
      'New York': { buys: 0, sells: 0, net: 0, count: 0 },
    };

    orders.filter(o => o.status === 'filled').forEach(o => {
      const session = getSession(o.filledAt);
      const value = o.price * o.qty;
      sessions[session].count++;
      if (o.side === 'sell') {
        sessions[session].sells += value;
        sessions[session].net += value;
      } else {
        sessions[session].buys += value;
        sessions[session].net -= value;
      }
    });

    return Object.entries(sessions).map(([name, data]) => ({
      session: name,
      trades: data.count,
      net: Math.round(data.net),
    }));
  }, [orders]);

  if (orders.length === 0) return null;

  return (
    <div className="bg-navy-light/30 rounded-lg p-3 border border-gold/5">
      <span className="text-[9px] font-display tracking-wider text-marble/25">SESSION PERFORMANCE (UTC)</span>
      <div className="h-28 mt-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={sessionData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(43,72%,50%,0.05)" />
            <XAxis dataKey="session" tick={{ fontSize: 8, fill: 'hsl(40,25%,96%,0.3)' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 7, fill: 'hsl(40,25%,96%,0.15)' }} axisLine={false} tickLine={false} width={45} tickFormatter={v => `$${v}`} />
            <Tooltip contentStyle={chartTooltipStyle} formatter={(v: number) => [`$${v.toLocaleString()}`, 'Net Flow']} />
            <Bar dataKey="net" radius={[3, 3, 0, 0]}>
              {sessionData.map((entry, i) => (
                <Cell key={i} fill={entry.net >= 0 ? 'hsl(142,71%,45%)' : 'hsl(0,84%,60%)'} fillOpacity={0.7} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="flex justify-between mt-1">
        {sessionData.map(s => (
          <div key={s.session} className="text-center">
            <div className="text-[7px] text-marble/20 font-display tracking-wider">{s.trades} trades</div>
          </div>
        ))}
      </div>
    </div>
  );
}
