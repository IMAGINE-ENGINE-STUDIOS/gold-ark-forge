import { useRigCount } from '@/hooks/useOilGasData';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import WidgetShell from '@/components/ga-widgets/WidgetShell';
import { Drill } from 'lucide-react';

const OGRigCount = () => {
  const { data: rigData, isLoading } = useRigCount();
  const latest = rigData?.[rigData.length - 1];

  return (
    <WidgetShell icon={Drill} title="BAKER HUGHES RIG COUNT" source="Baker Hughes" badge="WEEKLY">
      {isLoading ? (
        <div className="h-64 bg-navy-light/30 rounded animate-pulse" />
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-4 gap-3 text-center">
            <div>
              <p className="text-[10px] text-marble/40 font-display tracking-wider">TOTAL</p>
              <p className="font-display text-2xl text-marble">{latest?.total}</p>
            </div>
            <div>
              <p className="text-[10px] text-marble/40 font-display tracking-wider">OIL</p>
              <p className="font-display text-2xl" style={{ color: 'hsl(25,80%,50%)' }}>{latest?.oil}</p>
            </div>
            <div>
              <p className="text-[10px] text-marble/40 font-display tracking-wider">GAS</p>
              <p className="font-display text-2xl" style={{ color: 'hsl(145,60%,45%)' }}>{latest?.gas}</p>
            </div>
            <div>
              <p className="text-[10px] text-marble/40 font-display tracking-wider">WoW Δ</p>
              <p className={`font-display text-2xl ${(latest?.change ?? 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {(latest?.change ?? 0) >= 0 ? '+' : ''}{latest?.change}
              </p>
            </div>
          </div>

          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={rigData}>
                <XAxis dataKey="date" tickFormatter={(d) => d.slice(5)} tick={{ fill: 'hsl(40,25%,96%,0.3)', fontSize: 9 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'hsl(40,25%,96%,0.3)', fontSize: 9 }} axisLine={false} tickLine={false} width={40} />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(213,32%,16%)', border: '1px solid hsl(43,72%,50%,0.3)', borderRadius: 4, fontSize: 11 }} />
                <Area type="monotone" dataKey="oil" stackId="1" stroke="hsl(25,80%,50%)" fill="hsl(25,80%,50%)" fillOpacity={0.3} strokeWidth={1.5} />
                <Area type="monotone" dataKey="gas" stackId="1" stroke="hsl(145,60%,45%)" fill="hsl(145,60%,45%)" fillOpacity={0.3} strokeWidth={1.5} />
                <Legend wrapperStyle={{ fontSize: 10, color: 'hsl(40,25%,96%,0.5)' }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </WidgetShell>
  );
};

export default OGRigCount;
