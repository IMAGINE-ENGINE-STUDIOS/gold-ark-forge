import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { FileCheck, Building2, Shield, Users, Activity } from 'lucide-react';
import { format } from 'date-fns';

const MetricCard = ({ icon: Icon, label, value, sub }: { icon: React.ElementType; label: string; value: string | number; sub?: string }) => (
  <div className="bg-navy-dark/60 border border-gold/20 rounded-lg p-5">
    <div className="flex items-center gap-3 mb-2">
      <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center">
        <Icon className="w-5 h-5 text-gold" />
      </div>
      <span className="text-marble/50 font-display text-xs tracking-widest uppercase">{label}</span>
    </div>
    <p className="text-3xl font-display text-gold">{value}</p>
    {sub && <p className="text-marble/40 text-xs mt-1">{sub}</p>}
  </div>
);

const AdminOverview = () => {
  const { data: certs } = useQuery({
    queryKey: ['admin-certs-count'],
    queryFn: async () => {
      const { count } = await supabase.from('certificates').select('*', { count: 'exact', head: true });
      return count ?? 0;
    },
  });

  const { data: partners } = useQuery({
    queryKey: ['admin-partners-count'],
    queryFn: async () => {
      const { count } = await supabase.from('partners').select('*', { count: 'exact', head: true }).eq('status', 'active');
      return count ?? 0;
    },
  });

  const { data: holdings } = useQuery({
    queryKey: ['admin-holdings-count'],
    queryFn: async () => {
      const { count } = await supabase.from('vault_holdings').select('*', { count: 'exact', head: true }).eq('status', 'active');
      return count ?? 0;
    },
  });

  const { data: auditLogs } = useQuery({
    queryKey: ['admin-recent-audit'],
    queryFn: async () => {
      const { data } = await supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(10);
      return data ?? [];
    },
  });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard icon={FileCheck} label="Certificates" value={certs ?? '—'} sub="Total issued" />
        <MetricCard icon={Building2} label="Active Partners" value={partners ?? '—'} sub="Vaults & dealers" />
        <MetricCard icon={Shield} label="Vault Holdings" value={holdings ?? '—'} sub="Active holdings" />
        <MetricCard icon={Users} label="Platform" value="Live" sub="All systems operational" />
      </div>

      <div className="bg-navy-dark/60 border border-gold/20 rounded-lg p-5">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="w-4 h-4 text-gold" />
          <h3 className="font-display text-sm tracking-widest text-gold uppercase">Recent Activity</h3>
        </div>
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {auditLogs?.length === 0 && <p className="text-marble/40 text-sm">No recent activity</p>}
          {auditLogs?.map((log) => (
            <div key={log.audit_id} className="flex items-center justify-between py-2 border-b border-gold/10 last:border-0">
              <div>
                <span className="text-marble/80 text-sm font-mono">{log.action}</span>
                <span className="text-marble/40 text-xs ml-2">{log.resource_type}/{log.resource_id?.slice(0, 8)}</span>
              </div>
              <span className="text-marble/30 text-xs">{format(new Date(log.created_at), 'MMM d, HH:mm')}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminOverview;
