import { useBrokerConnections, useAlpacaAccount, usePositions, BROKER_META, BrokerType } from '@/hooks/useBrokerTrading';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Briefcase, Loader2 } from 'lucide-react';
import WidgetShell from '@/components/ga-widgets/WidgetShell';

const COLORS = [
  'hsl(43, 72%, 50%)',   // gold
  'hsl(210, 6%, 67%)',   // silver
  'hsl(142, 71%, 45%)',  // green
  'hsl(217, 91%, 60%)',  // blue
  'hsl(262, 83%, 58%)',  // purple
];

const PortfolioSummary = () => {
  const { data: connections, isLoading } = useBrokerConnections();

  if (isLoading) {
    return (
      <WidgetShell icon={Briefcase} title="PORTFOLIO" badge="AGGREGATE">
        <div className="flex items-center justify-center py-8 text-marble/40">
          <Loader2 className="w-5 h-5 animate-spin mr-2" />
          <span className="text-xs font-display tracking-wider">LOADING...</span>
        </div>
      </WidgetShell>
    );
  }

  if (!connections?.length) {
    return (
      <WidgetShell icon={Briefcase} title="PORTFOLIO" badge="AGGREGATE">
        <div className="text-center py-6">
          <Briefcase className="w-10 h-10 text-gold/20 mx-auto mb-3" />
          <p className="text-marble/40 text-sm">Connect a broker to view portfolio</p>
        </div>
      </WidgetShell>
    );
  }

  return (
    <WidgetShell icon={Briefcase} title="PORTFOLIO" badge="AGGREGATE">
      <div className="space-y-4">
        {connections.map((conn) => (
          <ConnectionSummary key={conn.id} connectionId={conn.id} broker={conn.broker} label={conn.label} environment={conn.environment} />
        ))}
      </div>
    </WidgetShell>
  );
};

function ConnectionSummary({ connectionId, broker, label, environment }: { connectionId: string; broker: string; label: string | null; environment: string }) {
  const { data: account } = useAlpacaAccount(connectionId);
  const { data: positions } = usePositions(connectionId);
  const bl = BROKER_META[broker as BrokerType]?.label || broker;

  const pieData = positions?.length
    ? positions.map((p) => ({
        name: p.symbol,
        value: Math.abs(parseFloat(p.market_value) || parseFloat(p.qty)),
      }))
    : [{ name: 'Cash', value: parseFloat(account?.cash || '1') }];

  const totalPnL = positions?.reduce((sum, p) => sum + parseFloat(p.unrealized_pl || '0'), 0) || 0;

  return (
    <div className="bg-navy-light/30 rounded-lg p-3 border border-gold/5">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-display tracking-wider text-marble/60">
          {label || `${bl} ${environment.toUpperCase()}`}
        </span>
        {account && (
          <span className="text-sm font-mono text-gold">${parseFloat(account.portfolio_value).toLocaleString()}</span>
        )}
      </div>

      <div className="flex items-center gap-4">
        <div className="w-16 h-16 flex-shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={pieData} dataKey="value" cx="50%" cy="50%" outerRadius={28} innerRadius={14} strokeWidth={0}>
                {pieData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ background: 'hsl(213,32%,16%)', border: '1px solid hsl(43,72%,50%,0.3)', fontSize: 10 }}
                labelStyle={{ color: 'hsl(40,25%,96%)' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="flex-1 space-y-1">
          <div className="flex justify-between text-[10px]">
            <span className="text-marble/40 font-display tracking-wider">POSITIONS</span>
            <span className="text-marble font-mono">{positions?.length || 0}</span>
          </div>
          <div className="flex justify-between text-[10px]">
            <span className="text-marble/40 font-display tracking-wider">UNREALIZED P&L</span>
            <span className={`font-mono ${totalPnL >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {totalPnL >= 0 ? '+' : ''}${totalPnL.toFixed(2)}
            </span>
          </div>
          {account && (
            <div className="flex justify-between text-[10px]">
              <span className="text-marble/40 font-display tracking-wider">CASH</span>
              <span className="text-marble font-mono">${parseFloat(account.cash).toLocaleString()}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default PortfolioSummary;
