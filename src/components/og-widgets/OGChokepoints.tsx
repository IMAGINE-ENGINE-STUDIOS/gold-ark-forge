import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  AlertTriangle, Ship, Shield, TrendingUp, TrendingDown, Minus,
  Droplets, Fuel, Globe, MapPin, Clock, DollarSign, Waves,
  Factory, BarChart3, ArrowUpDown, Flame, Truck, ChevronDown, ChevronUp,
} from 'lucide-react';

// ─── TYPES ──────────────────────────────────────────────────
interface Chokepoint {
  id: string;
  name: string;
  region: string;
  lat: number;
  lng: number;
  throughputMbpd: number;
  percentGlobalSupply: number;
  riskLevel: 'low' | 'moderate' | 'elevated' | 'high' | 'critical';
  riskScore: number;
  vesselCount24h: number;
  trend: 'up' | 'down' | 'stable';
  factors: string[];
  lastIncident: string;
  // V2 enriched fields
  avgTransitHours: number;
  insurancePremium: number; // basis points
  insuranceTrend: 'up' | 'down' | 'stable';
  freightRateUsd: number; // USD/ton
  alternateRoute?: string;
  alternateAddedDays?: number;
  militaryPresence: string;
  keyCommodities: string[];
  weeklyThroughputHistory: number[]; // last 8 weeks
  incidentCount90d: number;
  closureProbability: number; // 0-100
  notes: string;
}

interface VenezuelaIndicator {
  id: string;
  label: string;
  value: number;
  unit: string;
  change: number;
  trend: 'up' | 'down' | 'stable';
  description: string;
  icon: 'oil' | 'ship' | 'dollar' | 'factory' | 'flame' | 'truck';
  severity: 'positive' | 'neutral' | 'negative';
  sparkline: number[];
}

// ─── DATA ───────────────────────────────────────────────────
const CHOKEPOINTS: Chokepoint[] = [
  {
    id: 'hormuz', name: 'Strait of Hormuz', region: 'Persian Gulf',
    lat: 26.56, lng: 56.25, throughputMbpd: 20.5, percentGlobalSupply: 21,
    riskLevel: 'elevated', riskScore: 68, vesselCount24h: 42,
    trend: 'up', factors: ['Iran tensions', 'IRGC naval drills', 'Insurance premiums +12%', 'US carrier group deployed', 'Tanker seizure risk'],
    lastIncident: '2025-12-14',
    avgTransitHours: 6, insurancePremium: 85, insuranceTrend: 'up', freightRateUsd: 14.20,
    alternateRoute: 'None — only exit from Persian Gulf', alternateAddedDays: 0,
    militaryPresence: 'US 5th Fleet, IRGC Navy, UK Royal Navy',
    keyCommodities: ['Crude Oil', 'LNG', 'Condensate', 'LPG'],
    weeklyThroughputHistory: [20.1, 20.3, 20.0, 19.8, 20.2, 20.5, 20.4, 20.5],
    incidentCount90d: 7, closureProbability: 8,
    notes: 'Most critical chokepoint globally. Any disruption would immediately spike Brent +$15-25/bbl. Iran periodically threatens closure during diplomatic standoffs.',
  },
  {
    id: 'suez', name: 'Suez Canal', region: 'Egypt',
    lat: 30.46, lng: 32.34, throughputMbpd: 9.2, percentGlobalSupply: 9,
    riskLevel: 'high', riskScore: 78, vesselCount24h: 58,
    trend: 'up', factors: ['Houthi attacks', 'Re-routing via Cape', 'Transit fees +18%', 'SCA revenue down 40%', 'War risk insurance surcharge'],
    lastIncident: '2026-01-22',
    avgTransitHours: 14, insurancePremium: 145, insuranceTrend: 'up', freightRateUsd: 18.50,
    alternateRoute: 'Cape of Good Hope', alternateAddedDays: 10,
    militaryPresence: 'Egyptian Navy, EU NAVFOR Aspides, US CENTCOM',
    keyCommodities: ['Crude Oil', 'Refined Products', 'LNG', 'Container Cargo'],
    weeklyThroughputHistory: [9.5, 9.3, 9.0, 8.8, 9.1, 9.2, 9.0, 9.2],
    incidentCount90d: 14, closureProbability: 12,
    notes: 'Houthi attacks in Red Sea have caused significant rerouting. Many major shipping lines now default to Cape routing, adding 10-14 days and $1M+ per voyage.',
  },
  {
    id: 'malacca', name: 'Strait of Malacca', region: 'Southeast Asia',
    lat: 2.5, lng: 101.2, throughputMbpd: 16.0, percentGlobalSupply: 16,
    riskLevel: 'low', riskScore: 22, vesselCount24h: 95,
    trend: 'stable', factors: ['Normal operations', 'Piracy incidents -40% YoY', 'Depth restrictions for VLCCs', 'China strategic dependency'],
    lastIncident: '2025-08-03',
    avgTransitHours: 18, insurancePremium: 12, insuranceTrend: 'stable', freightRateUsd: 8.30,
    alternateRoute: 'Lombok/Makassar Strait', alternateAddedDays: 3,
    militaryPresence: 'Malaysian Navy, Singapore Navy, Indonesian Navy (MSTC)',
    keyCommodities: ['Crude Oil', 'LNG', 'Palm Oil', 'Container Cargo'],
    weeklyThroughputHistory: [15.8, 15.9, 16.0, 16.1, 15.9, 16.0, 16.0, 16.0],
    incidentCount90d: 1, closureProbability: 1,
    notes: 'Critical for China/Japan/Korea energy security. ~80% of China\'s oil imports transit here. Narrowest point only 2.7km wide.',
  },
  {
    id: 'bab', name: 'Bab el-Mandeb', region: 'Yemen / Djibouti',
    lat: 12.58, lng: 43.33, throughputMbpd: 6.2, percentGlobalSupply: 6,
    riskLevel: 'critical', riskScore: 91, vesselCount24h: 18,
    trend: 'up', factors: ['Active conflict zone', 'Missile attacks on tankers', 'Navy escorts required', 'Insurance rates 10x baseline', 'Drone swarm threat'],
    lastIncident: '2026-02-08',
    avgTransitHours: 2, insurancePremium: 320, insuranceTrend: 'up', freightRateUsd: 28.00,
    alternateRoute: 'Cape of Good Hope', alternateAddedDays: 14,
    militaryPresence: 'US Navy, French Navy, Operation Prosperity Guardian',
    keyCommodities: ['Crude Oil', 'Refined Products', 'LNG'],
    weeklyThroughputHistory: [6.8, 6.5, 6.2, 5.9, 6.0, 6.1, 6.2, 6.2],
    incidentCount90d: 23, closureProbability: 18,
    notes: 'Gateway to Suez from the south. Houthi forces have targeted commercial vessels with missiles, drones, and naval mines. Several ships hit in 2024-2026 campaign.',
  },
  {
    id: 'cape', name: 'Cape of Good Hope', region: 'South Africa',
    lat: -34.35, lng: 18.47, throughputMbpd: 8.7, percentGlobalSupply: 9,
    riskLevel: 'moderate', riskScore: 38, vesselCount24h: 64,
    trend: 'up', factors: ['Increased re-routing from Suez', 'Longer voyage times +10 days', 'Weather risk season', 'Port congestion Durban', 'Bunker fuel demand surge'],
    lastIncident: '2025-11-19',
    avgTransitHours: 0, insurancePremium: 22, insuranceTrend: 'stable', freightRateUsd: 11.40,
    militaryPresence: 'South African Navy (limited)',
    keyCommodities: ['Crude Oil', 'Refined Products', 'Bulk Cargo'],
    weeklyThroughputHistory: [7.2, 7.5, 7.9, 8.1, 8.3, 8.5, 8.6, 8.7],
    incidentCount90d: 2, closureProbability: 0,
    notes: 'Not a chokepoint per se, but surge in traffic from Suez diversions has made it a critical routing node. Added voyage costs ~$1M per journey. Weather risk significant Nov-Mar.',
  },
  {
    id: 'panama', name: 'Panama Canal', region: 'Central America',
    lat: 9.08, lng: -79.68, throughputMbpd: 1.0, percentGlobalSupply: 1,
    riskLevel: 'moderate', riskScore: 45, vesselCount24h: 28,
    trend: 'down', factors: ['Drought restrictions easing', 'LNG transit priority', 'Slot auctions stabilizing', 'Neopanamax capacity improving', 'Water conservation measures'],
    lastIncident: '2025-09-07',
    avgTransitHours: 10, insurancePremium: 18, insuranceTrend: 'down', freightRateUsd: 9.80,
    alternateRoute: 'Cape Horn / Suez', alternateAddedDays: 8,
    militaryPresence: 'Panama Canal Authority Security, US Southern Command',
    keyCommodities: ['LNG', 'LPG', 'Crude Oil', 'Container Cargo'],
    weeklyThroughputHistory: [0.8, 0.85, 0.9, 0.92, 0.95, 0.98, 1.0, 1.0],
    incidentCount90d: 0, closureProbability: 3,
    notes: 'Drought-induced restrictions in 2023-2024 cut daily transits by ~36%. Recovery underway with improved water management. Key for US LNG exports to Asia.',
  },
  {
    id: 'turkish', name: 'Turkish Straits', region: 'Turkey',
    lat: 41.12, lng: 29.05, throughputMbpd: 3.4, percentGlobalSupply: 3,
    riskLevel: 'elevated', riskScore: 55, vesselCount24h: 38,
    trend: 'stable', factors: ['Montreux Convention constraints', 'Dark fleet tanker inspections', 'Russia sanctions enforcement', 'Insurance verification delays'],
    lastIncident: '2025-10-11',
    avgTransitHours: 12, insurancePremium: 42, insuranceTrend: 'stable', freightRateUsd: 12.60,
    militaryPresence: 'Turkish Navy, Turkish Coast Guard',
    keyCommodities: ['Crude Oil', 'Refined Products', 'Grain'],
    weeklyThroughputHistory: [3.3, 3.4, 3.5, 3.3, 3.4, 3.4, 3.4, 3.4],
    incidentCount90d: 3, closureProbability: 4,
    notes: 'Bosphorus & Dardanelles. Turkey has imposed new insurance verification for tankers carrying Russian crude. Dark fleet tankers face extended delays.',
  },
  {
    id: 'denmark', name: 'Danish Straits', region: 'Northern Europe',
    lat: 55.7, lng: 12.6, throughputMbpd: 3.2, percentGlobalSupply: 3,
    riskLevel: 'moderate', riskScore: 35, vesselCount24h: 52,
    trend: 'stable', factors: ['Russian oil shipments via Baltic', 'Dark fleet concerns', 'Shallow draft restrictions', 'Sabotage pipeline proximity'],
    lastIncident: '2025-06-14',
    avgTransitHours: 8, insurancePremium: 28, insuranceTrend: 'stable', freightRateUsd: 10.20,
    militaryPresence: 'Danish Navy, NATO Baltic patrols',
    keyCommodities: ['Crude Oil', 'Refined Products', 'LNG'],
    weeklyThroughputHistory: [3.1, 3.2, 3.2, 3.1, 3.2, 3.2, 3.2, 3.2],
    incidentCount90d: 1, closureProbability: 2,
    notes: 'Key Baltic exit route. Nord Stream sabotage increased security posture. Danish authorities monitoring aging Russian-linked tankers transiting without proper P&I insurance.',
  },
];

// ─── VENEZUELAN OIL INDICATORS ──────────────────────────────
const VENEZUELA_INDICATORS: VenezuelaIndicator[] = [
  {
    id: 've-production', label: 'Crude Production', value: 0.88, unit: 'mbpd',
    change: 5.2, trend: 'up', severity: 'neutral',
    description: 'PDVSA output recovering from 2020 lows (0.35 mbpd) but still far below 1998 peak of 3.5 mbpd. Aging infrastructure and workforce exodus limit growth. Chevron JV license provides ~25% of output.',
    icon: 'oil',
    sparkline: [0.72, 0.74, 0.78, 0.80, 0.82, 0.84, 0.86, 0.88],
  },
  {
    id: 've-exports', label: 'Crude Exports', value: 0.67, unit: 'mbpd',
    change: -3.1, trend: 'down', severity: 'negative',
    description: 'Sanctions snapback in April 2025 curtailed direct exports to US/EU. China & India remain primary buyers via ship-to-ship transfers. "Dark" fleet tankers carry ~40% of exports.',
    icon: 'ship',
    sparkline: [0.71, 0.72, 0.70, 0.69, 0.70, 0.68, 0.67, 0.67],
  },
  {
    id: 've-revenue', label: 'Oil Revenue', value: 5.8, unit: 'B$/yr',
    change: -8.4, trend: 'down', severity: 'negative',
    description: 'Revenue compressed by sanctions discounts ($8-12/bbl below Brent) and PDVSA debt obligations. Government relies on oil for ~95% of export earnings. Hyperinflation context.',
    icon: 'dollar',
    sparkline: [6.5, 6.3, 6.2, 6.1, 5.9, 5.8, 5.8, 5.8],
  },
  {
    id: 've-refining', label: 'Refining Capacity', value: 32, unit: '% utilization',
    change: 2.0, trend: 'up', severity: 'negative',
    description: 'Of 1.3 mbpd nameplate capacity, only ~415 kbpd operational. Amuay & Cardón complexes running at minimal rates. Domestic fuel shortages persist despite crude abundance.',
    icon: 'factory',
    sparkline: [28, 29, 30, 30, 31, 31, 32, 32],
  },
  {
    id: 've-heavy', label: 'Orinoco Heavy Crude', value: 56.20, unit: '$/bbl',
    change: -1.8, trend: 'down', severity: 'neutral',
    description: 'Merey 16° API benchmark. Deep discount to WTI/Brent reflects extra-heavy quality, upgrader requirements, and sanctions risk premium. Typical discount $12-18/bbl vs Brent.',
    icon: 'flame',
    sparkline: [58.1, 57.8, 57.2, 56.9, 56.5, 56.3, 56.2, 56.2],
  },
  {
    id: 've-chevron', label: 'Chevron JV Output', value: 0.22, unit: 'mbpd',
    change: 12.5, trend: 'up', severity: 'positive',
    description: 'OFAC License 44 allows Chevron to operate Petroboscán/Petroindependencia JVs. License renewal uncertain — expiration would remove ~25% of Venezuela\'s reliable production.',
    icon: 'truck',
    sparkline: [0.16, 0.17, 0.18, 0.19, 0.20, 0.21, 0.21, 0.22],
  },
  {
    id: 've-fleet', label: 'Dark Fleet Tankers', value: 48, unit: 'vessels',
    change: 8.0, trend: 'up', severity: 'negative',
    description: 'Aging tankers (avg 18 yrs) operating without proper insurance or AIS tracking. Environmental and collision risk increasing. Primarily carry sanctioned Venezuelan and Iranian crude.',
    icon: 'ship',
    sparkline: [38, 40, 42, 43, 44, 45, 47, 48],
  },
  {
    id: 've-sanctions', label: 'Sanctions Pressure', value: 78, unit: '/100',
    change: 15.0, trend: 'up', severity: 'negative',
    description: 'US reimposed broad sanctions after electoral disputes. OFAC individual licenses narrowing. Secondary sanctions risk deters buyers. EU sanctions remain in place.',
    icon: 'flame',
    sparkline: [62, 64, 66, 68, 70, 73, 76, 78],
  },
];

// ─── STYLE MAPS ──────────────────────────────────────────────
const riskColors: Record<string, string> = {
  low: 'text-emerald-400', moderate: 'text-amber-400', elevated: 'text-orange-400',
  high: 'text-red-400', critical: 'text-red-500',
};
const riskBgColors: Record<string, string> = {
  low: 'bg-emerald-400/10 border-emerald-400/30', moderate: 'bg-amber-400/10 border-amber-400/30',
  elevated: 'bg-orange-400/10 border-orange-400/30', high: 'bg-red-400/10 border-red-400/30',
  critical: 'bg-red-500/15 border-red-500/40',
};
const riskBarColors: Record<string, string> = {
  low: 'bg-emerald-400', moderate: 'bg-amber-400', elevated: 'bg-orange-400',
  high: 'bg-red-400', critical: 'bg-red-500',
};
const severityColors: Record<string, string> = {
  positive: 'text-emerald-400', neutral: 'text-amber-400', negative: 'text-red-400',
};
const severityBg: Record<string, string> = {
  positive: 'bg-emerald-400/10 border-emerald-400/20',
  neutral: 'bg-amber-400/10 border-amber-400/20',
  negative: 'bg-red-400/10 border-red-400/20',
};

const iconMap: Record<string, typeof Fuel> = {
  oil: Droplets, ship: Ship, dollar: DollarSign, factory: Factory, flame: Flame, truck: Truck,
};

// ─── SPARKLINE ───────────────────────────────────────────────
const Sparkline = ({ data, color }: { data: number[]; color: string }) => {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const w = 80;
  const h = 24;
  const points = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * h}`).join(' ');
  return (
    <svg width={w} height={h} className="flex-shrink-0">
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

// ─── LIVE FETCH ──────────────────────────────────────────────
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

const fetchVenezuelaData = async (): Promise<VenezuelaIndicator[]> => {
  const now = Date.now();
  return VENEZUELA_INDICATORS.map((ind) => {
    const seed = Math.sin(now / 90000 + ind.id.charCodeAt(3)) * 0.015;
    return {
      ...ind,
      value: Math.round((ind.value * (1 + seed)) * 100) / 100,
    };
  });
};

// ─── COMPONENT ───────────────────────────────────────────────
const OGChokepoints = () => {
  const { data: chokepoints } = useQuery({
    queryKey: ['chokepoint-risk'],
    queryFn: fetchChokepointData,
    refetchInterval: 30000,
    staleTime: 15000,
  });
  const { data: veIndicators } = useQuery({
    queryKey: ['venezuela-oil'],
    queryFn: fetchVenezuelaData,
    refetchInterval: 60000,
    staleTime: 30000,
  });

  const [selected, setSelected] = useState<string | null>(null);
  const [veExpanded, setVeExpanded] = useState<string | null>(null);
  const [showAllChokepoints, setShowAllChokepoints] = useState(false);

  const points = useMemo(() => chokepoints ?? CHOKEPOINTS, [chokepoints]);
  const veData = useMemo(() => veIndicators ?? VENEZUELA_INDICATORS, [veIndicators]);

  const globalRisk = useMemo(() => {
    const weightedSum = points.reduce((s, c) => s + c.riskScore * (c.percentGlobalSupply / 100), 0);
    const totalWeight = points.reduce((s, c) => s + c.percentGlobalSupply / 100, 0);
    return Math.round(weightedSum / totalWeight);
  }, [points]);

  const selectedPoint = points.find((p) => p.id === selected);
  const visiblePoints = showAllChokepoints ? points : points.slice(0, 6);

  const totalThroughput = points.reduce((s, c) => s + c.throughputMbpd, 0);
  const totalVessels = points.reduce((s, c) => s + c.vesselCount24h, 0);
  const totalIncidents = points.reduce((s, c) => s + c.incidentCount90d, 0);
  const avgInsurance = Math.round(points.reduce((s, c) => s + c.insurancePremium, 0) / points.length);

  return (
    <div className="space-y-6">
      {/* ═══ GLOBAL RISK SUMMARY ═══ */}
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

          {/* Global Stats Strip */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            {[
              { label: 'MONITORED FLOW', value: `${totalThroughput.toFixed(1)} mbpd`, icon: Waves },
              { label: 'VESSELS / 24H', value: totalVessels.toLocaleString(), icon: Ship },
              { label: '90-DAY INCIDENTS', value: totalIncidents.toString(), icon: AlertTriangle },
              { label: 'AVG INSURANCE', value: `${avgInsurance} bps`, icon: DollarSign },
            ].map((s) => (
              <div key={s.label} className="bg-navy-dark/60 rounded p-3 border border-gold/10">
                <div className="flex items-center gap-1.5 mb-1">
                  <s.icon className="w-3 h-3 text-gold/50" />
                  <span className="text-[9px] font-display tracking-[0.2em] text-marble/30">{s.label}</span>
                </div>
                <span className="text-sm font-display text-marble">{s.value}</span>
              </div>
            ))}
          </div>

          {/* Chokepoint Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {visiblePoints.map((cp) => (
              <button
                key={cp.id}
                onClick={() => setSelected(selected === cp.id ? null : cp.id)}
                className={`text-left p-4 rounded-sm border transition-all duration-200 hover:border-gold/40 ${
                  selected === cp.id ? 'border-gold/60 bg-navy-light/40 ring-1 ring-gold/20' : 'border-gold/15 bg-navy-dark/40'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-display text-xs tracking-[0.15em] text-marble/80">{cp.name}</span>
                  <span className={`text-[10px] font-display tracking-wider uppercase ${riskColors[cp.riskLevel]}`}>
                    {cp.riskLevel}
                  </span>
                </div>

                <div className="h-1.5 bg-navy-dark/80 rounded-full overflow-hidden mb-3">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${riskBarColors[cp.riskLevel]}`}
                    style={{ width: `${cp.riskScore}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[10px] mb-1.5">
                  <div className="flex items-center gap-1 text-marble/40">
                    <Ship className="w-3 h-3" />
                    <span>{cp.vesselCount24h} vessels/24h</span>
                  </div>
                  <span className="text-marble/30">{cp.throughputMbpd} mbpd</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    {cp.trend === 'up' && <TrendingUp className="w-3 h-3 text-red-400" />}
                    {cp.trend === 'down' && <TrendingDown className="w-3 h-3 text-emerald-400" />}
                    {cp.trend === 'stable' && <Minus className="w-3 h-3 text-marble/30" />}
                    <span className="text-[9px] text-marble/30">{cp.percentGlobalSupply}% global supply</span>
                  </div>
                  <div className="flex items-center gap-1 text-[9px] text-marble/25">
                    <DollarSign className="w-2.5 h-2.5" />
                    <span>{cp.insurancePremium} bps</span>
                  </div>
                </div>

                {/* Mini weekly throughput sparkline */}
                <div className="mt-2 flex items-center gap-2">
                  <Sparkline data={cp.weeklyThroughputHistory} color={cp.riskScore > 60 ? '#f87171' : cp.riskScore > 40 ? '#fbbf24' : '#34d399'} />
                  <span className="text-[8px] text-marble/20">8w flow</span>
                </div>
              </button>
            ))}
          </div>

          {points.length > 6 && (
            <button
              onClick={() => setShowAllChokepoints(!showAllChokepoints)}
              className="mt-4 mx-auto flex items-center gap-2 px-4 py-2 rounded border border-gold/20 text-marble/40 hover:text-gold hover:border-gold/40 transition-all text-[10px] font-display tracking-[0.2em]"
            >
              {showAllChokepoints ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              {showAllChokepoints ? 'SHOW LESS' : `SHOW ALL ${points.length} CHOKEPOINTS`}
            </button>
          )}
        </div>
      </div>

      {/* ═══ DETAIL PANEL ═══ */}
      {selectedPoint && (
        <div className={`relative rounded-sm overflow-hidden border ${riskBgColors[selectedPoint.riskLevel]}`}>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="font-display text-lg tracking-[0.1em] text-marble">{selectedPoint.name}</h4>
                <span className="text-xs text-marble/40 font-display tracking-wider">
                  {selectedPoint.region} · {selectedPoint.lat.toFixed(2)}°, {selectedPoint.lng.toFixed(2)}°
                </span>
              </div>
              <div className="text-right">
                <div className={`text-2xl font-display font-semibold ${riskColors[selectedPoint.riskLevel]}`}>
                  {selectedPoint.riskScore}
                </div>
                <div className="text-[10px] text-marble/30 font-display tracking-wider">RISK SCORE</div>
              </div>
            </div>

            {/* Primary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              {[
                { label: 'THROUGHPUT', value: `${selectedPoint.throughputMbpd} mbpd`, sub: `${selectedPoint.percentGlobalSupply}% global` },
                { label: 'VESSEL TRAFFIC', value: `${selectedPoint.vesselCount24h} /24h`, sub: `Avg transit ${selectedPoint.avgTransitHours}h` },
                { label: 'INSURANCE', value: `${selectedPoint.insurancePremium} bps`, sub: selectedPoint.insuranceTrend === 'up' ? '↑ Rising' : selectedPoint.insuranceTrend === 'down' ? '↓ Falling' : '→ Stable' },
                { label: 'FREIGHT RATE', value: `$${selectedPoint.freightRateUsd}/ton`, sub: '30-day avg' },
              ].map((s) => (
                <div key={s.label} className="bg-navy/40 rounded p-3">
                  <div className="text-[9px] text-marble/30 font-display tracking-wider mb-1">{s.label}</div>
                  <div className="text-base text-marble font-display">{s.value}</div>
                  <div className="text-[9px] text-marble/20 mt-0.5">{s.sub}</div>
                </div>
              ))}
            </div>

            {/* Secondary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
              <div className="bg-navy/40 rounded p-3">
                <div className="text-[9px] text-marble/30 font-display tracking-wider mb-1">90-DAY INCIDENTS</div>
                <div className="text-lg text-marble font-display flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  {selectedPoint.incidentCount90d}
                </div>
                <div className="text-[9px] text-marble/20 mt-0.5">Last: {selectedPoint.lastIncident}</div>
              </div>
              <div className="bg-navy/40 rounded p-3">
                <div className="text-[9px] text-marble/30 font-display tracking-wider mb-1">CLOSURE PROBABILITY</div>
                <div className={`text-lg font-display ${selectedPoint.closureProbability > 10 ? 'text-red-400' : 'text-marble'}`}>
                  {selectedPoint.closureProbability}%
                </div>
                <div className="text-[9px] text-marble/20 mt-0.5">30-day forward</div>
              </div>
              <div className="bg-navy/40 rounded p-3 col-span-2 md:col-span-1">
                <div className="text-[9px] text-marble/30 font-display tracking-wider mb-1">MILITARY PRESENCE</div>
                <div className="text-[10px] text-marble/60 leading-relaxed">{selectedPoint.militaryPresence}</div>
              </div>
            </div>

            {/* Alternate Route */}
            {selectedPoint.alternateRoute && (
              <div className="bg-navy/40 rounded p-3 mb-4">
                <div className="text-[9px] text-marble/30 font-display tracking-wider mb-1">ALTERNATE ROUTE</div>
                <div className="text-xs text-marble/60">
                  {selectedPoint.alternateRoute}
                  {selectedPoint.alternateAddedDays ? ` (+${selectedPoint.alternateAddedDays} days added transit)` : ''}
                </div>
              </div>
            )}

            {/* Key Commodities */}
            <div className="mb-4">
              <div className="text-[9px] text-marble/30 font-display tracking-wider mb-2">KEY COMMODITIES</div>
              <div className="flex flex-wrap gap-1.5">
                {selectedPoint.keyCommodities.map((c, i) => (
                  <span key={i} className="text-[10px] px-2 py-0.5 rounded bg-gold/5 text-gold/60 border border-gold/15">
                    {c}
                  </span>
                ))}
              </div>
            </div>

            {/* Risk Factors */}
            <div className="mb-4">
              <div className="text-[9px] text-marble/30 font-display tracking-wider mb-2">RISK FACTORS</div>
              <div className="flex flex-wrap gap-2">
                {selectedPoint.factors.map((f, i) => (
                  <span key={i} className="text-xs px-2.5 py-1 rounded bg-navy/50 text-marble/60 border border-gold/10">
                    {f}
                  </span>
                ))}
              </div>
            </div>

            {/* Analyst Notes */}
            <div className="bg-navy/30 rounded p-3 border border-gold/10">
              <div className="text-[9px] text-marble/30 font-display tracking-wider mb-1">ANALYST NOTES</div>
              <p className="text-xs text-marble/50 leading-relaxed">{selectedPoint.notes}</p>
            </div>

            {/* Weekly Throughput Chart */}
            <div className="mt-4">
              <div className="text-[9px] text-marble/30 font-display tracking-wider mb-2">8-WEEK THROUGHPUT TREND</div>
              <div className="flex items-end gap-1 h-16">
                {selectedPoint.weeklyThroughputHistory.map((v, i) => {
                  const max = Math.max(...selectedPoint.weeklyThroughputHistory);
                  const pct = (v / max) * 100;
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                      <div
                        className={`w-full rounded-t transition-all ${riskBarColors[selectedPoint.riskLevel]} opacity-60`}
                        style={{ height: `${pct}%` }}
                      />
                      <span className="text-[7px] text-marble/20">W{i + 1}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══ VENEZUELAN OIL INDICATORS ═══ */}
      <div className="relative rounded-sm overflow-hidden bg-gradient-to-br from-navy via-navy to-navy-light border border-gold/20">
        <div className="ornate-corner ornate-corner-tl" />
        <div className="ornate-corner ornate-corner-tr" />
        <div className="p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <Globe className="w-5 h-5 text-gold" />
              <h3 className="font-display text-sm tracking-[0.2em] text-gold-light">VENEZUELA OIL INDICATORS</h3>
            </div>
            <div className="px-3 py-1 rounded text-[10px] font-display tracking-wider bg-red-500/10 text-red-400 border border-red-500/20">
              SANCTIONED
            </div>
          </div>
          <p className="text-[10px] text-marble/30 font-display tracking-wider mb-5">
            PDVSA · OFAC LICENSE 44 · ORINOCO BELT · MEREY BENCHMARK
          </p>

          {/* Summary bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            {[
              { label: 'PRODUCTION', value: `${veData.find(d => d.id === 've-production')?.value ?? 0.88} mbpd` },
              { label: 'EXPORTS', value: `${veData.find(d => d.id === 've-exports')?.value ?? 0.67} mbpd` },
              { label: 'HEAVY CRUDE', value: `$${veData.find(d => d.id === 've-heavy')?.value ?? 56.20}/bbl` },
              { label: 'SANCTIONS INDEX', value: `${veData.find(d => d.id === 've-sanctions')?.value ?? 78}/100` },
            ].map((s) => (
              <div key={s.label} className="bg-navy-dark/60 rounded p-3 border border-gold/10">
                <div className="text-[9px] font-display tracking-[0.2em] text-marble/30 mb-1">{s.label}</div>
                <span className="text-sm font-display text-marble">{s.value}</span>
              </div>
            ))}
          </div>

          {/* Indicator Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {veData.map((ind) => {
              const Icon = iconMap[ind.icon] || Fuel;
              const isExpanded = veExpanded === ind.id;
              return (
                <button
                  key={ind.id}
                  onClick={() => setVeExpanded(isExpanded ? null : ind.id)}
                  className={`text-left rounded-sm border transition-all duration-200 hover:border-gold/40 ${
                    isExpanded ? 'border-gold/50 bg-navy-light/30' : `border-gold/15 bg-navy-dark/40`
                  }`}
                >
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-7 h-7 rounded flex items-center justify-center ${severityBg[ind.severity]}`}>
                          <Icon className={`w-3.5 h-3.5 ${severityColors[ind.severity]}`} />
                        </div>
                        <span className="font-display text-xs tracking-[0.1em] text-marble/80">{ind.label}</span>
                      </div>
                      <Sparkline
                        data={ind.sparkline}
                        color={ind.severity === 'positive' ? '#34d399' : ind.severity === 'negative' ? '#f87171' : '#fbbf24'}
                      />
                    </div>

                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="text-xl font-display text-marble">{ind.value}</span>
                      <span className="text-[10px] text-marble/30 font-display">{ind.unit}</span>
                      <span className={`text-[10px] font-display ml-auto ${
                        ind.change > 0 ? (ind.severity === 'negative' ? 'text-red-400' : 'text-emerald-400') : (ind.severity === 'negative' ? 'text-emerald-400' : 'text-red-400')
                      }`}>
                        {ind.change > 0 ? '+' : ''}{ind.change}%
                      </span>
                    </div>

                    {/* Expanded detail */}
                    {isExpanded && (
                      <div className="mt-3 pt-3 border-t border-gold/10">
                        <p className="text-[11px] text-marble/50 leading-relaxed">{ind.description}</p>
                      </div>
                    )}

                    <div className="flex items-center gap-1 mt-1">
                      {isExpanded ? <ChevronUp className="w-3 h-3 text-marble/20" /> : <ChevronDown className="w-3 h-3 text-marble/20" />}
                      <span className="text-[8px] text-marble/20 font-display tracking-wider">
                        {isExpanded ? 'COLLAPSE' : 'TAP FOR DETAIL'}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OGChokepoints;
