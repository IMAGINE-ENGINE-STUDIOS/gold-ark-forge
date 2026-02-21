import { useState, useEffect, useMemo } from 'react';
import { Clock } from 'lucide-react';
import WidgetShell from './WidgetShell';

interface Session {
  name: string;
  openUTC: number;
  closeUTC: number;
  volatility: string;
  color: string;
}

const SESSIONS: Session[] = [
  { name: 'SYDNEY', openUTC: 22, closeUTC: 7, volatility: 'Low', color: 'hsl(200,70%,50%)' },
  { name: 'TOKYO', openUTC: 0, closeUTC: 9, volatility: 'Medium', color: 'hsl(350,70%,55%)' },
  { name: 'LONDON', openUTC: 8, closeUTC: 17, volatility: 'High', color: 'hsl(43,72%,50%)' },
  { name: 'NEW YORK', openUTC: 13, closeUTC: 22, volatility: 'High', color: 'hsl(150,60%,45%)' },
];

const isOpen = (s: Session, hourUTC: number) => {
  if (s.openUTC < s.closeUTC) return hourUTC >= s.openUTC && hourUTC < s.closeUTC;
  return hourUTC >= s.openUTC || hourUTC < s.closeUTC;
};

const GATradingSessions = () => {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const iv = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(iv);
  }, []);

  const hourUTC = now.getUTCHours() + now.getUTCMinutes() / 60;

  const overlapInfo = useMemo(() => {
    const londonOpen = isOpen(SESSIONS[2], Math.floor(hourUTC));
    const nyOpen = isOpen(SESSIONS[3], Math.floor(hourUTC));
    if (londonOpen && nyOpen) return 'LONDON–NY OVERLAP · HIGHEST LIQUIDITY';
    const tokyoOpen = isOpen(SESSIONS[1], Math.floor(hourUTC));
    if (londonOpen && tokyoOpen) return 'TOKYO–LONDON OVERLAP';
    return null;
  }, [hourUTC]);

  return (
    <WidgetShell icon={Clock} title="TRADING SESSIONS" badge="GLOBAL">
      <div className="space-y-3">
        {/* Current UTC time */}
        <div className="flex items-center justify-between">
          <span className="text-[9px] font-mono text-marble/40">UTC {now.toISOString().slice(11, 16)}</span>
          {overlapInfo && (
            <span className="text-[8px] font-mono text-gold animate-pulse bg-gold/10 px-2 py-0.5 rounded border border-gold/20">{overlapInfo}</span>
          )}
        </div>

        {/* Sessions */}
        {SESSIONS.map(s => {
          const open = isOpen(s, Math.floor(hourUTC));
          // Timeline bar: 24h, session highlighted
          const startPct = (s.openUTC / 24) * 100;
          const dur = s.openUTC < s.closeUTC ? s.closeUTC - s.openUTC : 24 - s.openUTC + s.closeUTC;
          const widthPct = (dur / 24) * 100;
          const nowPct = (hourUTC / 24) * 100;

          return (
            <div key={s.name} className="space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color, opacity: open ? 1 : 0.3 }} />
                  <span className="text-[10px] font-display tracking-wider text-marble/70">{s.name}</span>
                  <span className={`text-[7px] font-mono px-1.5 py-0.5 rounded ${open ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20' : 'bg-navy-light/30 text-marble/25 border border-gold/5'}`}>
                    {open ? 'OPEN' : 'CLOSED'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[8px] font-mono text-marble/30">{s.openUTC}:00–{s.closeUTC}:00 UTC</span>
                  <span className={`text-[7px] font-mono ${s.volatility === 'High' ? 'text-gold/50' : s.volatility === 'Medium' ? 'text-marble/40' : 'text-marble/25'}`}>
                    {s.volatility}
                  </span>
                </div>
              </div>
              {/* Timeline bar */}
              <div className="h-1.5 bg-navy-light/30 rounded-full relative overflow-hidden">
                <div className="absolute h-full rounded-full" style={{
                  left: `${startPct}%`,
                  width: s.openUTC < s.closeUTC ? `${widthPct}%` : undefined,
                  right: s.openUTC >= s.closeUTC ? undefined : undefined,
                  backgroundColor: s.color,
                  opacity: open ? 0.5 : 0.15,
                  ...(s.openUTC >= s.closeUTC ? {} : {})
                }} />
                {s.openUTC >= s.closeUTC && (
                  <>
                    <div className="absolute h-full rounded-full" style={{ left: `${startPct}%`, right: 0, backgroundColor: s.color, opacity: open ? 0.5 : 0.15 }} />
                    <div className="absolute h-full rounded-full" style={{ left: 0, width: `${(s.closeUTC / 24) * 100}%`, backgroundColor: s.color, opacity: open ? 0.5 : 0.15 }} />
                  </>
                )}
                {/* Now indicator */}
                <div className="absolute top-0 h-full w-0.5 bg-gold rounded-full z-10" style={{ left: `${nowPct}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </WidgetShell>
  );
};

export default GATradingSessions;
