import { X, TrendingUp, TrendingDown, Minus, Ship, Shield, AlertTriangle, Droplets, MapPin, DollarSign, Users, BarChart3, Fuel } from 'lucide-react';
import type { GlobeMarker } from '@/data/globeLocations';

interface Props {
  marker: GlobeMarker | null;
  onClose: () => void;
}

const riskBadge: Record<string, string> = {
  low: 'bg-emerald-400/15 text-emerald-400 border-emerald-400/30',
  moderate: 'bg-amber-400/15 text-amber-400 border-amber-400/30',
  elevated: 'bg-orange-400/15 text-orange-400 border-orange-400/30',
  high: 'bg-red-400/15 text-red-400 border-red-400/30',
  critical: 'bg-red-500/20 text-red-400 border-red-500/40',
};

const GlobeInfoPanel = ({ marker, onClose }: Props) => {
  if (!marker) return null;

  const meta = marker.meta ?? {};
  const econ = marker.economicData;

  return (
    <div className="absolute top-0 right-0 h-full w-[400px] bg-navy/95 backdrop-blur-md border-l-2 border-gold/30 z-30 overflow-y-auto animate-fade-in">
      {/* Header */}
      <div className="sticky top-0 bg-navy/95 backdrop-blur-md border-b border-gold/20 p-5 flex items-start justify-between z-10">
        <div>
          <p className="text-[10px] font-display tracking-[0.25em] text-gold/60 uppercase mb-1">{marker.category}</p>
          <h2 className="font-display text-lg tracking-[0.1em] text-gold-light">{marker.name}</h2>
        </div>
        <button onClick={onClose} className="text-marble/40 hover:text-gold transition-colors p-1">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="p-5 space-y-5">
        {/* Coordinates */}
        <div className="flex items-center gap-2 text-[10px] text-marble/30 font-display tracking-wider">
          <MapPin className="w-3 h-3 text-gold/50" />
          {marker.lat.toFixed(2)}°, {marker.lng.toFixed(2)}°
        </div>

        {/* Risk badge for chokepoints */}
        {marker.riskLevel && (
          <div className="flex items-center gap-3">
            <span className={`px-3 py-1 rounded text-xs font-display tracking-wider border ${riskBadge[marker.riskLevel] ?? ''}`}>
              {marker.riskLevel.toUpperCase()}
            </span>
            {meta.riskScore != null && (
              <span className="font-display text-2xl text-marble">{meta.riskScore}<span className="text-xs text-marble/30 ml-1">/100</span></span>
            )}
          </div>
        )}

        {/* Description */}
        <p className="text-sm text-marble/70 leading-relaxed">{marker.description}</p>

        {/* Chokepoint stats */}
        {marker.category === 'chokepoint' && (
          <div className="grid grid-cols-2 gap-3">
            <Stat label="Throughput" value={`${meta.throughput} mbpd`} icon={<Droplets className="w-3.5 h-3.5 text-gold/60" />} />
            <Stat label="Vessels (24h)" value={String(meta.vessels24h ?? '—')} icon={<Ship className="w-3.5 h-3.5 text-gold/60" />} />
          </div>
        )}

        {/* Producer stats */}
        {marker.category === 'producer' && (
          <div className="grid grid-cols-2 gap-3">
            <Stat label="Production" value={`${meta.production} mbpd`} icon={<Droplets className="w-3.5 h-3.5 text-gold/60" />} />
            <Stat
              label="YoY Change"
              value={`${Number(meta.change) > 0 ? '+' : ''}${meta.change} mbpd`}
              icon={Number(meta.change) > 0 ? <TrendingUp className="w-3.5 h-3.5 text-emerald-400" /> : Number(meta.change) < 0 ? <TrendingDown className="w-3.5 h-3.5 text-red-400" /> : <Minus className="w-3.5 h-3.5 text-marble/40" />}
            />
          </div>
        )}

        {/* Venezuela full dashboard */}
        {marker.category === 'venezuela' && (
          <div className="space-y-3">
            <Stat label="Crude Production" value={`${meta.production} mbpd`} icon={<Droplets className="w-3.5 h-3.5 text-gold/60" />} />
            <Stat label="Crude Exports" value={`${meta.exports} mbpd`} icon={<Ship className="w-3.5 h-3.5 text-gold/60" />} />
            <Stat label="Dark Fleet Tankers" value={`${meta.darkFleet} vessels`} icon={<AlertTriangle className="w-3.5 h-3.5 text-red-400" />} />
            <Stat label="Sanctions Pressure" value={`${meta.sanctionsPressure}/100`} icon={<Shield className="w-3.5 h-3.5 text-red-400" />} />
          </div>
        )}

        {/* Exchange info */}
        {marker.category === 'exchange' && (
          <div className="bg-gold/5 border border-gold/15 rounded p-3">
            <p className="text-xs text-marble/50 font-display tracking-wider">MAJOR COMMODITIES EXCHANGE</p>
            <p className="text-sm text-marble/70 mt-1">{marker.description}</p>
          </div>
        )}

        {/* Organization info */}
        {marker.category === 'organization' && (
          <div className="space-y-3">
            <div className="bg-emerald-500/5 border border-emerald-500/15 rounded p-3">
              <p className="text-xs text-emerald-400/70 font-display tracking-wider">DATA SOURCE</p>
              <p className="text-sm text-marble/70 mt-1">{marker.description}</p>
            </div>
            {meta.members && <Stat label="Member States" value={String(meta.members)} icon={<Users className="w-3.5 h-3.5 text-emerald-400/60" />} />}
            {meta.dataPoints && <Stat label="Data Points" value={`${meta.dataPoints}+`} icon={<BarChart3 className="w-3.5 h-3.5 text-emerald-400/60" />} />}
            {meta.dailyFlights && <Stat label="Daily Flights" value={Number(meta.dailyFlights).toLocaleString()} icon={<BarChart3 className="w-3.5 h-3.5 text-emerald-400/60" />} />}
          </div>
        )}

        {/* ── ECONOMIC DATA ── */}
        {econ && (
          <div className="space-y-3 border-t border-gold/10 pt-4">
            <p className="text-[10px] font-display tracking-[0.25em] text-gold/60">ECONOMIC INDICATORS</p>
            <div className="grid grid-cols-2 gap-3">
              <Stat label="GDP" value={`$${econ.gdp?.toLocaleString()}B`} icon={<DollarSign className="w-3.5 h-3.5 text-gold/60" />} />
              <Stat
                label="GDP Growth"
                value={`${(econ.gdpGrowth ?? 0) > 0 ? '+' : ''}${econ.gdpGrowth}%`}
                icon={(econ.gdpGrowth ?? 0) > 0 ? <TrendingUp className="w-3.5 h-3.5 text-emerald-400" /> : <TrendingDown className="w-3.5 h-3.5 text-red-400" />}
              />
              {econ.population && <Stat label="Population" value={`${econ.population}M`} icon={<Users className="w-3.5 h-3.5 text-gold/60" />} />}
              {econ.tradeVolume && <Stat label="Trade Volume" value={`$${econ.tradeVolume}B`} icon={<BarChart3 className="w-3.5 h-3.5 text-gold/60" />} />}
              {econ.creditRating && <Stat label="Credit Rating" value={econ.creditRating} icon={<Shield className="w-3.5 h-3.5 text-gold/60" />} />}
              {econ.inflation != null && <Stat label="Inflation" value={`${econ.inflation}%`} icon={<TrendingUp className="w-3.5 h-3.5 text-orange-400" />} />}
              {econ.unemployment != null && <Stat label="Unemployment" value={`${econ.unemployment}%`} icon={<Users className="w-3.5 h-3.5 text-marble/40" />} />}
              {econ.oilReserves != null && <Stat label="Oil Reserves" value={`${econ.oilReserves}B bbl`} icon={<Fuel className="w-3.5 h-3.5 text-gold/60" />} />}
              {econ.debtToGdp != null && <Stat label="Debt/GDP" value={`${econ.debtToGdp}%`} icon={<DollarSign className="w-3.5 h-3.5 text-red-400" />} />}
            </div>
            {econ.keyIndustries && econ.keyIndustries.length > 0 && (
              <div>
                <p className="text-[9px] font-display tracking-[0.2em] text-marble/40 mb-2">KEY INDUSTRIES</p>
                <div className="flex flex-wrap gap-1.5">
                  {econ.keyIndustries.map((ind) => (
                    <span key={ind} className="px-2 py-0.5 rounded text-[10px] font-display tracking-wider bg-gold/5 border border-gold/15 text-marble/60">{ind}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const Stat = ({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) => (
  <div className="bg-navy-light/30 border border-gold/10 rounded p-3">
    <div className="flex items-center gap-1.5 mb-1">
      {icon}
      <span className="text-[9px] font-display tracking-[0.2em] text-marble/40">{label}</span>
    </div>
    <span className="font-display text-sm text-marble">{value}</span>
  </div>
);

export default GlobeInfoPanel;
