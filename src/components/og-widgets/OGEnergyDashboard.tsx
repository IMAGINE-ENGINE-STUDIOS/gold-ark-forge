import { Fuel, TrendingUp, TrendingDown } from 'lucide-react';
import { useOilGasPrices, useEIAInventory, useFuturesCurve } from '@/hooks/useOilGasData';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, BarChart, Bar } from 'recharts';
import LivePulse from '@/components/ga-widgets/LivePulse';

const tooltipStyle = { background: 'hsl(213,32%,16%)', border: '1px solid hsl(43,72%,50%,0.3)', fontSize: 10 };

const OGEnergyDashboard = () => {
  const { data: prices, isLoading: pricesLoading } = useOilGasPrices();
  const { data: inventory } = useEIAInventory();
  const { data: futures } = useFuturesCurve();

  const latestInventory = inventory?.slice(-1)[0];
  const invChange = latestInventory?.change ?? 0;

  return (
    <div className="relative rounded-sm bg-gradient-to-br from-navy via-navy to-navy-light border border-gold/30 overflow-hidden">
      <div className="ornate-corner ornate-corner-tl" />
      <div className="ornate-corner ornate-corner-tr" />
      <div className="ornate-corner ornate-corner-bl" />
      <div className="ornate-corner ornate-corner-br" />

      <div className="p-6 md:p-8">
        <div className="flex items-center gap-3 mb-6">
          <Fuel className="w-5 h-5 text-gold" />
          <h3 className="font-display text-lg tracking-[0.1em] text-gold-light">ENERGY EXECUTIVE DASHBOARD</h3>
          <LivePulse label="LIVE" />
        </div>

        {pricesLoading ? (
          <div className="h-60 bg-navy-light/30 rounded animate-pulse" />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Spot Prices */}
            <div className="bg-navy-light/15 rounded-lg p-4 border border-gold/10">
              <div className="text-[8px] font-display tracking-[0.2em] text-marble/30 mb-3">SPOT PRICES</div>
              <div className="space-y-3">
                {(prices || []).slice(0, 4).map(p => (
                  <div key={p.symbol} className="flex items-center justify-between">
                    <div>
                      <div className="text-[10px] font-display tracking-wider text-marble/50">{p.name}</div>
                      <div className="text-xs font-mono text-marble">${p.price.toFixed(2)} <span className="text-[8px] text-marble/25">{p.unit}</span></div>
                    </div>
                    <div className={`flex items-center gap-1 text-[10px] font-mono ${p.change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {p.change >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      {p.change >= 0 ? '+' : ''}{p.change.toFixed(2)}%
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Inventory Gauge */}
            <div className="bg-navy-light/15 rounded-lg p-4 border border-gold/10">
              <div className="text-[8px] font-display tracking-[0.2em] text-marble/30 mb-3">EIA CRUDE INVENTORY</div>
              <div className="text-center mb-3">
                <div className="text-2xl font-mono text-marble">{latestInventory?.value.toFixed(1) ?? '—'}</div>
                <div className="text-[9px] text-marble/30">MILLION BARRELS</div>
                <div className={`text-xs font-mono mt-1 ${invChange >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {invChange >= 0 ? '+' : ''}{invChange.toFixed(1)} MMbbl
                </div>
              </div>
              {inventory && (
                <ResponsiveContainer width="100%" height={80}>
                  <BarChart data={inventory.slice(-12)}>
                    <Bar dataKey="change" fill="hsl(43, 72%, 50%)" radius={[2, 2, 0, 0]} />
                    <Tooltip contentStyle={tooltipStyle} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Futures Curve Mini */}
            <div className="bg-navy-light/15 rounded-lg p-4 border border-gold/10">
              <div className="text-[8px] font-display tracking-[0.2em] text-marble/30 mb-3">FUTURES CURVE</div>
              {futures && (
                <ResponsiveContainer width="100%" height={120}>
                  <AreaChart data={futures}>
                    <defs>
                      <linearGradient id="ogDashWti" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(25, 80%, 50%)" stopOpacity={0.4} />
                        <stop offset="100%" stopColor="hsl(25, 80%, 50%)" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="ogDashBrent" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(210, 60%, 50%)" stopOpacity={0.4} />
                        <stop offset="100%" stopColor="hsl(210, 60%, 50%)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(213,28%,24%)" />
                    <XAxis dataKey="month" tick={{ fontSize: 7, fill: 'hsl(40,25%,96%,0.2)' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 7, fill: 'hsl(40,25%,96%,0.2)' }} axisLine={false} tickLine={false} width={35} domain={['dataMin', 'dataMax']} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Area type="monotone" dataKey="wti" stroke="hsl(25, 80%, 50%)" fill="url(#ogDashWti)" strokeWidth={1.5} name="WTI" />
                    <Area type="monotone" dataKey="brent" stroke="hsl(210, 60%, 50%)" fill="url(#ogDashBrent)" strokeWidth={1.5} name="Brent" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
              <div className="flex gap-3 mt-1 justify-center">
                <span className="text-[8px] text-marble/30 flex items-center gap-1"><span className="w-2 h-0.5 bg-[hsl(25,80%,50%)] inline-block" /> WTI</span>
                <span className="text-[8px] text-marble/30 flex items-center gap-1"><span className="w-2 h-0.5 bg-[hsl(210,60%,50%)] inline-block" /> Brent</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OGEnergyDashboard;
