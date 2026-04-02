import { X, TrendingUp, TrendingDown, Minus, Ship, Shield, AlertTriangle, Droplets, MapPin } from 'lucide-react';
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

  return (
    <div className="absolute top-0 right-0 h-full w-[380px] bg-navy/95 backdrop-blur-md border-l-2 border-gold/30 z-30 overflow-y-auto animate-fade-in">
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
