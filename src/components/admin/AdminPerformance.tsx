import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, BarChart, Bar } from 'recharts';
import { format } from 'date-fns';

const AdminPerformance = () => {
  const { data: snapshots } = useQuery({
    queryKey: ['admin-reserve-snapshots'],
    queryFn: async () => {
      const { data } = await supabase.from('reserve_snapshots').select('*').order('created_at', { ascending: true }).limit(100);
      return (data ?? []).map(s => ({
        date: format(new Date(s.created_at), 'MMM d'),
        gold: Number(s.total_gold_oz),
        silver: Number(s.total_silver_oz),
        platinum: Number(s.total_platinum_oz),
        bars: s.bar_count,
      }));
    },
  });

  const { data: transfers } = useQuery({
    queryKey: ['admin-transfer-volume'],
    queryFn: async () => {
      const { data } = await supabase.from('transfers').select('created_at, status').order('created_at', { ascending: true }).limit(200);
      const grouped: Record<string, number> = {};
      (data ?? []).forEach(t => {
        const key = format(new Date(t.created_at), 'MMM d');
        grouped[key] = (grouped[key] || 0) + 1;
      });
      return Object.entries(grouped).map(([date, count]) => ({ date, count }));
    },
  });

  const { data: certTimeline } = useQuery({
    queryKey: ['admin-cert-timeline'],
    queryFn: async () => {
      const { data } = await supabase.from('certificates').select('issued_at').order('issued_at', { ascending: true }).limit(200);
      const grouped: Record<string, number> = {};
      (data ?? []).forEach(c => {
        const key = format(new Date(c.issued_at), 'MMM d');
        grouped[key] = (grouped[key] || 0) + 1;
      });
      return Object.entries(grouped).map(([date, count]) => ({ date, count }));
    },
  });

  return (
    <div className="space-y-6">
      {/* Reserve Trends */}
      <div className="bg-navy-dark/60 border border-gold/20 rounded-lg p-5">
        <h3 className="font-display text-sm tracking-widest text-gold uppercase mb-4">Reserve Holdings Over Time</h3>
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={snapshots ?? []}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(212,175,55,0.1)" />
            <XAxis dataKey="date" tick={{ fill: '#999', fontSize: 10 }} />
            <YAxis tick={{ fill: '#999', fontSize: 10 }} />
            <Tooltip contentStyle={{ background: '#0a1628', border: '1px solid rgba(212,175,55,0.3)', borderRadius: 8 }} />
            <Area type="monotone" dataKey="gold" stroke="#d4af37" fill="rgba(212,175,55,0.2)" name="Gold (oz)" />
            <Area type="monotone" dataKey="silver" stroke="#c0c0c0" fill="rgba(192,192,192,0.1)" name="Silver (oz)" />
            <Area type="monotone" dataKey="platinum" stroke="#e5e4e2" fill="rgba(229,228,226,0.1)" name="Platinum (oz)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Certificate Issuance */}
        <div className="bg-navy-dark/60 border border-gold/20 rounded-lg p-5">
          <h3 className="font-display text-sm tracking-widest text-gold uppercase mb-4">Certificate Issuance</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={certTimeline ?? []}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(212,175,55,0.1)" />
              <XAxis dataKey="date" tick={{ fill: '#999', fontSize: 10 }} />
              <YAxis tick={{ fill: '#999', fontSize: 10 }} />
              <Tooltip contentStyle={{ background: '#0a1628', border: '1px solid rgba(212,175,55,0.3)', borderRadius: 8 }} />
              <Bar dataKey="count" fill="rgba(212,175,55,0.6)" name="Certificates" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Transfer Volume */}
        <div className="bg-navy-dark/60 border border-gold/20 rounded-lg p-5">
          <h3 className="font-display text-sm tracking-widest text-gold uppercase mb-4">Transfer Volume</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={transfers ?? []}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(212,175,55,0.1)" />
              <XAxis dataKey="date" tick={{ fill: '#999', fontSize: 10 }} />
              <YAxis tick={{ fill: '#999', fontSize: 10 }} />
              <Tooltip contentStyle={{ background: '#0a1628', border: '1px solid rgba(212,175,55,0.3)', borderRadius: 8 }} />
              <Bar dataKey="count" fill="rgba(52,211,153,0.6)" name="Transfers" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default AdminPerformance;
