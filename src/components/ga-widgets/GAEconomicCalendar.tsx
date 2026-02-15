import { CalendarDays } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import LivePulse from './LivePulse';

interface EconEvent {
  date: string;
  time: string;
  country: string;
  flag: string;
  event: string;
  impact: 'high' | 'medium' | 'low';
  previous?: string;
  forecast?: string;
  actual?: string;
}

// Seeded PRNG for deterministic per-day generation
const seededRandom = (seed: number) => {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
};

const hashString = (str: string) => {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = ((h << 5) - h + str.charCodeAt(i)) | 0;
  return Math.abs(h);
};

const generateEvents = (): EconEvent[] => {
  const now = new Date();
  const events: EconEvent[] = [];

  const templates = [
    { country: 'US', flag: '🇺🇸', events: ['Fed Interest Rate Decision', 'Non-Farm Payrolls', 'CPI (YoY)', 'GDP Growth Rate (QoQ)', 'Unemployment Rate', 'Retail Sales (MoM)', 'ISM Manufacturing PMI', 'FOMC Minutes', 'Core PCE Price Index', 'Consumer Confidence'] },
    { country: 'EU', flag: '🇪🇺', events: ['ECB Interest Rate Decision', 'CPI (YoY)', 'GDP Growth Rate', 'PMI Manufacturing', 'Unemployment Rate'] },
    { country: 'UK', flag: '🇬🇧', events: ['BoE Interest Rate Decision', 'CPI (YoY)', 'GDP (QoQ)', 'Retail Sales'] },
    { country: 'JP', flag: '🇯🇵', events: ['BoJ Interest Rate Decision', 'CPI (YoY)', 'GDP Growth Rate', 'Tankan Index'] },
    { country: 'CN', flag: '🇨🇳', events: ['PBoC Rate Decision', 'CPI (YoY)', 'GDP Growth Rate', 'PMI Manufacturing'] },
    { country: 'AU', flag: '🇦🇺', events: ['RBA Interest Rate Decision', 'CPI (QoQ)', 'Employment Change', 'GDP (QoQ)'] },
    { country: 'CA', flag: '🇨🇦', events: ['BoC Interest Rate Decision', 'CPI (MoM)', 'Employment Change', 'GDP (MoM)'] },
    { country: 'CH', flag: '🇨🇭', events: ['SNB Policy Rate', 'CPI (YoY)', 'GDP (QoQ)', 'KOF Leading Indicator'] },
  ];

  const impacts: ('high' | 'medium' | 'low')[] = ['high', 'medium', 'low'];
  const times = ['08:30', '09:00', '10:00', '13:00', '14:00', '14:30', '15:00', '20:00'];

  for (let d = 0; d < 14; d++) {
    const date = new Date(now);
    date.setDate(now.getDate() + d);
    if (date.getDay() === 0 || date.getDay() === 6) continue;

    const dateStr = date.toISOString().split('T')[0];
    const rng = seededRandom(hashString(dateStr));

    const numEvents = 3 + Math.floor(rng() * 3);
    // Round-robin: ensure diversity by picking first events from different countries
    const shuffled = [...templates].sort(() => rng() - 0.5);

    for (let e = 0; e < numEvents; e++) {
      const template = shuffled[e % shuffled.length];
      const eventName = template.events[Math.floor(rng() * template.events.length)];
      const impact = impacts[Math.floor(rng() * impacts.length)];
      const time = times[Math.floor(rng() * times.length)];

      const prev = (rng() * 5).toFixed(1) + '%';
      const forecast = (rng() * 5).toFixed(1) + '%';
      const actual = d === 0 && rng() > 0.5 ? (rng() * 5).toFixed(1) + '%' : undefined;

      events.push({
        date: dateStr,
        time,
        country: template.country,
        flag: template.flag,
        event: eventName,
        impact,
        previous: prev,
        forecast,
        actual,
      });
    }
  }

  return events.sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`));
};

const impactColors = {
  high: 'bg-red-400/20 text-red-400 border-red-400/30',
  medium: 'bg-gold/20 text-gold border-gold/30',
  low: 'bg-marble/10 text-marble/40 border-marble/20',
};

const GAEconomicCalendar = () => {
  const [filter, setFilter] = useState<'all' | 'high' | 'medium'>('all');
  const [refreshKey, setRefreshKey] = useState(0);
  const events = useMemo(() => generateEvents(), [refreshKey]);

  useEffect(() => {
    const timer = setInterval(() => setRefreshKey((k) => k + 1), 300000);
    return () => clearInterval(timer);
  }, []);

  const filtered = filter === 'all' ? events : events.filter((e) => e.impact === filter);

  const grouped = filtered.reduce<Record<string, EconEvent[]>>((acc, e) => {
    (acc[e.date] = acc[e.date] || []).push(e);
    return acc;
  }, {});

  return (
    <div className="relative rounded-sm bg-gradient-to-br from-navy via-navy to-navy-light border border-gold/30 overflow-hidden">
      <div className="ornate-corner ornate-corner-tl" />
      <div className="ornate-corner ornate-corner-tr" />
      <div className="ornate-corner ornate-corner-bl" />
      <div className="ornate-corner ornate-corner-br" />

      <div className="p-6 md:p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <CalendarDays className="w-5 h-5 text-gold" />
            <h3 className="font-display text-lg tracking-[0.1em] text-gold-light">ECONOMIC CALENDAR</h3>
            <LivePulse label="LIVE" />
          </div>
          <div className="flex gap-1">
            {(['all', 'high', 'medium'] as const).map((f) => (
              <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1 text-[10px] font-display tracking-wider rounded transition-all ${filter === f ? 'bg-gold/20 text-gold border border-gold/40' : 'text-marble/40 hover:text-marble/70 border border-transparent'}`}>
                {f === 'all' ? 'ALL' : f === 'high' ? '🔴 HIGH' : '🟡 MEDIUM'}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-6 max-h-[500px] overflow-y-auto pr-2 scrollbar-thin">
          {Object.entries(grouped).map(([date, evts]) => {
            const dateObj = new Date(date + 'T00:00:00');
            const isToday = date === new Date().toISOString().split('T')[0];
            return (
              <div key={date}>
                <div className="flex items-center gap-2 mb-3">
                  <span className={`font-display text-xs tracking-widest ${isToday ? 'text-gold' : 'text-marble/40'}`}>
                    {isToday ? '📍 TODAY' : dateObj.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                  </span>
                  <div className="flex-1 h-px bg-gold/10" />
                </div>
                <div className="space-y-1.5">
                  {evts.map((evt, i) => (
                    <div key={i} className="flex items-center gap-3 p-2.5 rounded hover:bg-navy-light/20 transition-colors">
                      <span className="text-[10px] text-marble/30 font-mono w-12">{evt.time}</span>
                      <span className="text-sm">{evt.flag}</span>
                      <span className={`text-[8px] px-1.5 py-0.5 rounded border font-display tracking-wider ${impactColors[evt.impact]}`}>
                        {evt.impact.toUpperCase()}
                      </span>
                      <span className="text-xs text-marble/70 flex-1">{evt.event}</span>
                      <div className="flex gap-4 text-[10px] text-marble/40 font-mono">
                        <span>P: {evt.previous}</span>
                        <span>F: {evt.forecast}</span>
                        {evt.actual && <span className="text-gold font-medium">A: {evt.actual}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default GAEconomicCalendar;
