import { useState } from 'react';
import { X, Database, Globe, Building2, Plane, Pill, BarChart3, Anchor, Scale } from 'lucide-react';

interface FeedItem {
  id: string;
  source: string;
  icon: React.ReactNode;
  title: string;
  time: string;
  category: string;
  severity: 'info' | 'warning' | 'alert';
}

const FEEDS: FeedItem[] = [
  { id: '1', source: 'World Bank', icon: <Globe className="w-3.5 h-3.5" />, title: 'Global GDP growth revised to 2.4% for 2026 — emerging markets lead recovery', time: '2m ago', category: 'economy', severity: 'info' },
  { id: '2', source: 'IMF', icon: <Building2 className="w-3.5 h-3.5" />, title: 'Special Drawing Rights allocation expanded — $650B new reserve assets', time: '8m ago', category: 'economy', severity: 'info' },
  { id: '3', source: 'FDA', icon: <Pill className="w-3.5 h-3.5" />, title: 'New drug approval: Sarepta\'s gene therapy for DMD — $3.2M per dose', time: '15m ago', category: 'pharma', severity: 'info' },
  { id: '4', source: 'FAA', icon: <Plane className="w-3.5 h-3.5" />, title: 'NOTAM: Restricted airspace over Persian Gulf expanded — military exercises', time: '22m ago', category: 'aviation', severity: 'warning' },
  { id: '5', source: 'EIA', icon: <BarChart3 className="w-3.5 h-3.5" />, title: 'US crude inventories down 4.2M barrels — largest draw in 8 weeks', time: '34m ago', category: 'energy', severity: 'alert' },
  { id: '6', source: 'WTO', icon: <Scale className="w-3.5 h-3.5" />, title: 'New trade dispute: EU challenges China EV subsidies — $22B at stake', time: '41m ago', category: 'trade', severity: 'warning' },
  { id: '7', source: 'IMO', icon: <Anchor className="w-3.5 h-3.5" />, title: 'CII rating deadline approaching — 1,200 vessels risk downgrade to D/E', time: '52m ago', category: 'shipping', severity: 'warning' },
  { id: '8', source: 'OPEC', icon: <BarChart3 className="w-3.5 h-3.5" />, title: 'Monthly Oil Market Report: demand forecast raised by 200 kbpd for Q3', time: '1h ago', category: 'energy', severity: 'info' },
  { id: '9', source: 'UN', icon: <Globe className="w-3.5 h-3.5" />, title: 'UNCTAD: FDI flows to developing nations up 12% — Africa leads growth', time: '1h ago', category: 'economy', severity: 'info' },
  { id: '10', source: 'IEA', icon: <BarChart3 className="w-3.5 h-3.5" />, title: 'Clean energy investment set to surpass $2T for first time in 2026', time: '2h ago', category: 'energy', severity: 'info' },
  { id: '11', source: 'BIS', icon: <Building2 className="w-3.5 h-3.5" />, title: 'Cross-border payments: mBridge CBDC pilot expands to 12 central banks', time: '2h ago', category: 'finance', severity: 'info' },
  { id: '12', source: 'ECB', icon: <Building2 className="w-3.5 h-3.5" />, title: 'Rate decision: holding at 4.5% — inflation still above 2% target', time: '3h ago', category: 'finance', severity: 'alert' },
  { id: '13', source: 'ICAO', icon: <Plane className="w-3.5 h-3.5" />, title: 'Global air traffic exceeds 2019 levels by 4% — Asia-Pacific recovery accelerates', time: '3h ago', category: 'aviation', severity: 'info' },
  { id: '14', source: 'FDA', icon: <Pill className="w-3.5 h-3.5" />, title: 'Recall: Teva blood pressure medication — nitrosamine contamination detected', time: '4h ago', category: 'pharma', severity: 'alert' },
  { id: '15', source: 'World Bank', icon: <Globe className="w-3.5 h-3.5" />, title: 'Commodity Markets Outlook: metals prices to rise 8% on EV demand', time: '5h ago', category: 'economy', severity: 'info' },
];

const CATEGORIES = ['all', 'economy', 'energy', 'finance', 'trade', 'pharma', 'aviation', 'shipping'];

const severityStyles = {
  info: 'border-l-blue-500/40',
  warning: 'border-l-amber-500/40',
  alert: 'border-l-red-500/40',
};

interface Props {
  onClose: () => void;
}

const GlobeDataFeed = ({ onClose }: Props) => {
  const [filter, setFilter] = useState('all');

  const filtered = filter === 'all' ? FEEDS : FEEDS.filter((f) => f.category === filter);

  return (
    <div className="absolute top-16 left-4 w-[360px] max-h-[calc(100vh-120px)] bg-navy/95 backdrop-blur-md border border-gold/20 rounded-lg z-30 animate-fade-in flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gold/15 flex-shrink-0">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-emerald-400" />
          <span className="font-display text-sm tracking-[0.15em] text-gold">GOV & ORG FEED</span>
        </div>
        <button onClick={onClose} className="text-marble/40 hover:text-gold transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Category filter */}
      <div className="flex gap-1 p-3 border-b border-gold/10 flex-shrink-0 overflow-x-auto">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => setFilter(c)}
            className={`px-2 py-1 rounded text-[9px] font-display tracking-wider whitespace-nowrap transition-all ${
              filter === c
                ? 'bg-gold/15 text-gold border border-gold/30'
                : 'text-marble/40 hover:text-marble/60 border border-transparent'
            }`}
          >
            {c.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Feed items */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {filtered.map((item) => (
          <div
            key={item.id}
            className={`border-l-2 ${severityStyles[item.severity]} bg-navy-light/20 rounded-r p-3 hover:bg-navy-light/30 transition-colors cursor-pointer`}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="text-emerald-400/60">{item.icon}</span>
              <span className="text-[9px] font-display tracking-[0.2em] text-emerald-400/70">{item.source}</span>
              <span className="text-[9px] text-marble/25 ml-auto">{item.time}</span>
            </div>
            <p className="text-xs text-marble/70 leading-relaxed">{item.title}</p>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-gold/10 flex-shrink-0">
        <p className="text-[8px] text-marble/25 font-display tracking-wider text-center">
          DATA FROM: WORLD BANK · IMF · FDA · FAA · EIA · WTO · UN · OPEC · BIS · ECB · IEA · ICAO · IMO
        </p>
      </div>
    </div>
  );
};

export default GlobeDataFeed;
