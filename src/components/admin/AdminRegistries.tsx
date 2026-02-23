import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';

const AdminRegistries = () => {
  const { data: auditLogs } = useQuery({
    queryKey: ['admin-audit-logs'],
    queryFn: async () => {
      const { data } = await supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(100);
      return data ?? [];
    },
  });

  const { data: certEvents } = useQuery({
    queryKey: ['admin-cert-events'],
    queryFn: async () => {
      const { data } = await supabase.from('certificate_events').select('*').order('created_at', { ascending: false }).limit(100);
      return data ?? [];
    },
  });

  // Forecast logs from localStorage
  const forecastLogs1 = (() => {
    try { return JSON.parse(localStorage.getItem('ga_forecast_log') || '[]'); } catch { return []; }
  })();
  const forecastLogs2 = (() => {
    try { return JSON.parse(localStorage.getItem('ga_forecast_log_2') || '[]'); } catch { return []; }
  })();

  return (
    <Tabs defaultValue="audit" className="w-full">
      <TabsList className="bg-navy-light/50 border border-gold/20 mb-4">
        <TabsTrigger value="audit" className="font-display text-xs data-[state=active]:bg-gold/20 data-[state=active]:text-gold text-marble/60">Audit Logs</TabsTrigger>
        <TabsTrigger value="cert-events" className="font-display text-xs data-[state=active]:bg-gold/20 data-[state=active]:text-gold text-marble/60">Certificate Events</TabsTrigger>
        <TabsTrigger value="forecast1" className="font-display text-xs data-[state=active]:bg-gold/20 data-[state=active]:text-gold text-marble/60">Forecast Log 1</TabsTrigger>
        <TabsTrigger value="forecast2" className="font-display text-xs data-[state=active]:bg-gold/20 data-[state=active]:text-gold text-marble/60">Forecast Log 2</TabsTrigger>
      </TabsList>

      <TabsContent value="audit">
        <ScrollArea className="h-[500px]">
          <div className="space-y-1">
            {auditLogs?.map((log) => (
              <div key={log.audit_id} className="flex items-center justify-between py-2 px-3 bg-navy-dark/40 rounded border border-gold/10">
                <div className="flex-1">
                  <span className="text-gold/80 font-mono text-xs">{log.action}</span>
                  <span className="text-marble/40 text-xs ml-2">{log.actor_type}:{log.actor_id?.slice(0, 8)}</span>
                </div>
                <div className="text-right">
                  <span className="text-marble/40 text-xs">{log.resource_type}</span>
                  <span className="text-marble/30 text-xs ml-2">{format(new Date(log.created_at), 'MMM d HH:mm')}</span>
                </div>
              </div>
            ))}
            {auditLogs?.length === 0 && <p className="text-marble/40 text-sm text-center py-8">No audit logs</p>}
          </div>
        </ScrollArea>
      </TabsContent>

      <TabsContent value="cert-events">
        <ScrollArea className="h-[500px]">
          <div className="space-y-1">
            {certEvents?.map((evt) => (
              <div key={evt.event_id} className="flex items-center justify-between py-2 px-3 bg-navy-dark/40 rounded border border-gold/10">
                <div className="flex-1">
                  <span className="text-gold/80 font-mono text-xs">{evt.event_type}</span>
                  <span className="text-marble/40 text-xs ml-2">cert:{evt.cert_id?.slice(0, 8)}</span>
                </div>
                <span className="text-marble/30 text-xs">{format(new Date(evt.created_at), 'MMM d HH:mm')}</span>
              </div>
            ))}
            {certEvents?.length === 0 && <p className="text-marble/40 text-sm text-center py-8">No certificate events</p>}
          </div>
        </ScrollArea>
      </TabsContent>

      <TabsContent value="forecast1">
        <ScrollArea className="h-[500px]">
          <div className="space-y-1">
            {forecastLogs1.length === 0 && <p className="text-marble/40 text-sm text-center py-8">No forecast logs in Registry 1</p>}
            {forecastLogs1.map((log: any, i: number) => (
              <div key={i} className="flex items-center justify-between py-2 px-3 bg-navy-dark/40 rounded border border-gold/10">
                <span className="text-marble/70 text-xs font-mono">{log.symbol || log.asset || '—'}</span>
                <span className={`text-xs font-mono ${log.direction === 'up' ? 'text-emerald-400' : 'text-red-400'}`}>
                  {log.direction === 'up' ? '▲' : '▼'} {log.direction}
                </span>
                <span className="text-marble/30 text-xs">{log.timestamp ? format(new Date(log.timestamp), 'MMM d HH:mm') : '—'}</span>
              </div>
            ))}
          </div>
        </ScrollArea>
      </TabsContent>

      <TabsContent value="forecast2">
        <ScrollArea className="h-[500px]">
          <div className="space-y-1">
            {forecastLogs2.length === 0 && <p className="text-marble/40 text-sm text-center py-8">No forecast logs in Registry 2</p>}
            {forecastLogs2.map((log: any, i: number) => (
              <div key={i} className="flex items-center justify-between py-2 px-3 bg-navy-dark/40 rounded border border-gold/10">
                <span className="text-marble/70 text-xs font-mono">{log.symbol || log.asset || '—'}</span>
                <span className={`text-xs font-mono ${log.direction === 'up' || log.bullish ? 'text-emerald-400' : 'text-red-400'}`}>
                  {log.direction === 'up' || log.bullish ? '▲' : '▼'}
                </span>
                <span className={`text-xs ${log.outcome === 'correct' ? 'text-emerald-400' : log.outcome === 'wrong' ? 'text-red-400' : 'text-marble/40'}`}>
                  {log.outcome === 'correct' ? '✓' : log.outcome === 'wrong' ? '✗' : '—'}
                </span>
                <span className="text-marble/30 text-xs">{log.timestamp ? format(new Date(log.timestamp), 'MMM d HH:mm') : '—'}</span>
              </div>
            ))}
          </div>
        </ScrollArea>
      </TabsContent>
    </Tabs>
  );
};

export default AdminRegistries;
