import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, Ship, Anchor, Shield, TrendingUp, TrendingDown } from 'lucide-react';

interface Chokepoint {
  id: string;
  name: string;
  region: string;
  lat: number;
  lng: number;
  throughputMbpd: number;         // million barrels per day
  percentGlobalSupply: number;
  riskLevel: 'low' | 'moderate' | 'elevated' | 'high' | 'critical';
  riskScore: number;              // 0-100
  vesselCount24h: number;
  trend: 'up' | 'down' | 'stable';
  factors: string[];
  lastIncident: string;
}

const CHOKEPOINTS: Chokepoint[] = [
  {
    id: 'hormuz', name: 'Strait of Hormuz', region: 'Persian Gulf',
    lat: 26.56, lng: 56.25, throughputMbpd: 20.5, percentGlobalSupply: 21,
    riskLevel: 'elevated', riskScore: 68, vesselCount24h: 42,
    trend: 'up', factors: ['Iran tensions', 'IRGC naval drills', 'Insurance premiums +12%'],
    lastIncident: '2025-12-14',
  },
  {
    id: 'suez', name: 'Suez Canal', region: 'Egypt',
    lat: 30.46, lng: 32.34, throughputMbpd: 9.2, percentGlobalSupply: 9,
    riskLevel: 'high', riskScore: 78, vesselCount24h: 58,
    trend: 'up', factors: ['Houthi attacks', 'Re-routing via Cape', 'Transit fees +18%'],
    lastIncident: '2026-01-22',
  },
  {
    id: 'malacca', name: 'Strait of Malacca', region: 'Southeast Asia',
    lat: 2.5, lng: 101.2, throughputMbpd: 16.0, percentGlobalSupply: 16,
    riskLevel: 'low', riskScore: 22, vesselCount24h: 95,
    trend: 'stable', factors: ['Normal operations', 'Piracy incidents -40% YoY'],
    lastIncident: '2025-08-03',
  },
  {
    id: 'bab', name: 'Bab el-Mandeb', region: 'Yemen / Djibouti',
    lat: 12.58, lng: 43.33, throughputMbpd: 6.2, percentGlobalSupply: 6,
    riskLevel: 'critical', riskScore: 91, vesselCount24h: 18,
    trend: 'up', factors: ['Active conflict zone', 'Missile attacks on tankers', 'Navy escorts required'],
    lastIncident: '2026-02-08',
  },
  {
    id: 'cape', name: 'Cape of Good Hope', region: 'South Africa',
    lat: -34.35, lng: 18.47, throughputMbpd: 8.7, percentGlobalSupply: 9,
    riskLevel: 'moderate', riskScore: 38, vesselCount24h: 64,
    trend: 'up', factors: ['Increased re-routing from Suez', 'Longer voyage times +10 days', 'Weather risk season'],
    lastIncident: '2025-11-19',
  },
  {
    id: 'panama', name: 'Panama Canal', region: 'Central America',
    lat: 9.08, lng: -79.68, throughputMbpd: 1.0, percentGlobalSupply: 1,
    riskLevel: 'moderate', riskScore: 45, vesselCount24h: 28,
    trend: 'down', factors: ['Drought restrictions easing', 'LNG transit priority', 'Slot auctions stabilizing'],
    lastIncident: '2025-09-07',
  },
];

const riskColors: Record<string, string> = {
  low: 'text-emerald-400',
  moderate: 'text-amber-400',
  elevated: 'text-orange-400',
  high: 'text-red-400',
  critical: 'text-red-500',
};

const riskBgColors: Record<string, string> = {
  low: 'bg-emerald-400/10 border-emerald-400/30',
  moderate: 'bg-amber-400/10 border-amber-400/30',
  elevated: 'bg-orange-400/10 border-orange-400/30',
  high: 'bg-red-400/10 border-red-400/30',
  critical: 'bg-red-500/15 border-red-500/40',
};

const riskBarColors: Record<string, string> = {
  low: 'bg-emerald-400',
  moderate: 'bg-amber-400',
  elevated: 'bg-orange-400',
  high: 'bg-red-400',
  critical: 'bg-red-500',
};

// Simulate live vessel data refresh
const fetchChokepointData = async (): Promise<Chokepoint[]> => {
  const now = Date.now();
  return CHOKEPOINTS.map((cp) => {
    const drift = Math.sin(now / 60000 + cp.lat) * 3;
    return {
      ...cp,
      vesselCount24h: Math.max(5, Math.round(cp.vesselCount24h + drift)),
      riskScore: Math.max(0, Math.min(100, Math.round(cp.riskScore + Math.sin(now / 120000 + cp.lng) * 2))),
    };
  });
};

const OGChokepoints = () => {
  const { data: chokepoints } = useQuery({
    queryKey: ['chokepoint-risk'],
    queryFn: fetchChokepointData,
    refetchInterval: 30000,
    staleTime: 15000,
  });

  const [selected, setSelected] = useState<string | null>(null);
  const points = useMemo(() => chokepoints ?? CHOKEPOINTS, [chokepoints]);
  const globalRisk = useMemo(() => Math.round(points.reduce((s, c) => s + c.riskScore * (c.percentGlobalSupply / 100), 0) / points.reduce((s, c) => s + c.percentGlobalSupply / 100, 0)), [points]);
  const selectedPoint = points.find((p) => p.id === selected);

  return (
    <div className="space-y-6">
      {/* Global Risk Summary */}
      <div className="relative rounded-sm overflow-hidden bg-gradient-to-br from-navy via-navy to-navy-light border border-gold/20">
        <div className="ornate-corner ornate-corner-tl" />
        <div className="ornate-corner ornate-corner-tr" />
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-gold" />
              <h3 className="font-display text-sm tracking-[0.2em] text-gold-light">GLOBAL CHOKEPOINT RISK INDEX</h3>
            </div>
            <div className={`px-3 py-1 rounded text-xs font-display tracking-wider ${
              globalRisk > 70 ? 'bg-red-500/15 text-red-400' : globalRisk > 50 ? 'bg-orange-400/10 text-orange-400' : 'bg-emerald-400/10 text-emerald-400'
            }`}>
              {globalRisk}/100
            </div>
          </div>

          <div className="h-3 bg-navy-dark/80 rounded-full overflow-hidden mb-6">
            <div
              className={`h-full rounded-full transition-all duration-1000 ${
                globalRisk > 70 ? 'bg-gradient-to-r from-red-500 to-red-400' : globalRisk > 50 ? 'bg-gradient-to-r from-orange-500 to-amber-400' : 'bg-gradient-to-r from-emerald-500 to-emerald-400'
              }`}
              style={{ width: `${globalRisk}%` }}
            />
          </div>

          {/* Chokepoint Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {points.map((cp) => (
              <button
                key={cp.id}
                onClick={() => setSelected(selected === cp.id ? null : cp.id)}
                className={`text-left p-4 rounded-sm border transition-all duration-200 hover:border-gold/40 ${
                  selected === cp.id ? 'border-gold/60 bg-navy-light/40' : 'border-gold/15 bg-navy-dark/40'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-display text-xs tracking-[0.15em] text-marble/80">{cp.name}</span>
                  <span className={`text-[10px] font-display tracking-wider uppercase ${riskColors[cp.riskLevel]}`}>
                    {cp.riskLevel}
                  </span>
                </div>

                {/* Risk bar */}
                <div className="h-1.5 bg-navy-dark/80 rounded-full overflow-hidden mb-3">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${riskBarColors[cp.riskLevel]}`}
                    style={{ width: `${cp.riskScore}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[10px]">
                  <div className="flex items-center gap-1 text-marble/40">
                    <Ship className="w-3 h-3" />
                    <span>{cp.vesselCount24h} vessels/24h</span>
                  </div>
                  <span className="text-marble/30">{cp.throughputMbpd} mbpd</span>
                </div>

                <div className="flex items-center gap-1 mt-1">
                  {cp.trend === 'up' && <TrendingUp className="w-3 h-3 text-red-400" />}
                  {cp.trend === 'down' && <TrendingDown className="w-3 h-3 text-emerald-400" />}
                  <span className="text-[9px] text-marble/30">{cp.percentGlobalSupply}% global supply</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Detail Panel */}
      {selectedPoint && (
        <div className={`relative rounded-sm overflow-hidden border ${riskBgColors[selectedPoint.riskLevel]}`}>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="font-display text-lg tracking-[0.1em] text-marble">{selectedPoint.name}</h4>
                <span className="text-xs text-marble/40 font-display tracking-wider">{selectedPoint.region} · {selectedPoint.lat.toFixed(2)}°N, {selectedPoint.lng.toFixed(2)}°E</span>
              </div>
              <div className="text-right">
                <div className={`text-2xl font-display font-semibold ${riskColors[selectedPoint.riskLevel]}`}>
                  {selectedPoint.riskScore}
                </div>
                <div className="text-[10px] text-marble/30 font-display tracking-wider">RISK SCORE</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="bg-navy/40 rounded p-3">
                <div className="text-[10px] text-marble/30 font-display tracking-wider mb-1">THROUGHPUT</div>
                <div className="text-lg text-marble font-display">{selectedPoint.throughputMbpd} <span className="text-xs text-marble/40">mbpd</span></div>
              </div>
              <div className="bg-navy/40 rounded p-3">
                <div className="text-[10px] text-marble/30 font-display tracking-wider mb-1">VESSEL TRAFFIC</div>
                <div className="text-lg text-marble font-display flex items-center gap-2">
                  <Ship className="w-4 h-4 text-gold/60" />
                  {selectedPoint.vesselCount24h}
                  <span className="text-xs text-marble/40">/24h</span>
                </div>
              </div>
              <div className="bg-navy/40 rounded p-3">
                <div className="text-[10px] text-marble/30 font-display tracking-wider mb-1">LAST INCIDENT</div>
                <div className="text-sm text-marble font-display flex items-center gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                  {selectedPoint.lastIncident}
                </div>
              </div>
            </div>

            <div>
              <div className="text-[10px] text-marble/30 font-display tracking-wider mb-2">RISK FACTORS</div>
              <div className="flex flex-wrap gap-2">
                {selectedPoint.factors.map((f, i) => (
                  <span key={i} className="text-xs px-2.5 py-1 rounded bg-navy/50 text-marble/60 border border-gold/10">
                    {f}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OGChokepoints;
