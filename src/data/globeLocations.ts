export type MarkerCategory = 'chokepoint' | 'producer' | 'exchange' | 'venezuela';

export interface GlobeMarker {
  id: string;
  name: string;
  category: MarkerCategory;
  lat: number;
  lng: number;
  color: string;         // CSS colour
  riskLevel?: string;
  description: string;
  meta?: Record<string, string | number>;
}

// ─── CHOKEPOINTS ──────────────────────────────────────
export const CHOKEPOINT_MARKERS: GlobeMarker[] = [
  { id: 'hormuz', name: 'Strait of Hormuz', category: 'chokepoint', lat: 26.56, lng: 56.25, color: '#f97316', riskLevel: 'elevated', description: 'Most critical chokepoint globally — 20.5 mbpd (21 % of global supply). Any disruption spikes Brent +$15-25.', meta: { throughput: 20.5, vessels24h: 42, riskScore: 68 } },
  { id: 'suez', name: 'Suez Canal', category: 'chokepoint', lat: 30.46, lng: 32.34, color: '#ef4444', riskLevel: 'high', description: 'Houthi attacks forced rerouting via Cape. 9.2 mbpd (9 %).', meta: { throughput: 9.2, vessels24h: 58, riskScore: 78 } },
  { id: 'malacca', name: 'Strait of Malacca', category: 'chokepoint', lat: 2.5, lng: 101.2, color: '#22c55e', riskLevel: 'low', description: '80 % of China oil imports transit here — 16 mbpd.', meta: { throughput: 16.0, vessels24h: 95, riskScore: 22 } },
  { id: 'bab', name: 'Bab el-Mandeb', category: 'chokepoint', lat: 12.58, lng: 43.33, color: '#ef4444', riskLevel: 'critical', description: 'Active conflict zone — missile & drone attacks. 6.2 mbpd.', meta: { throughput: 6.2, vessels24h: 18, riskScore: 91 } },
  { id: 'cape', name: 'Cape of Good Hope', category: 'chokepoint', lat: -34.35, lng: 18.47, color: '#eab308', riskLevel: 'moderate', description: 'Surge in traffic from Suez diversions. 8.7 mbpd.', meta: { throughput: 8.7, vessels24h: 64, riskScore: 38 } },
  { id: 'panama', name: 'Panama Canal', category: 'chokepoint', lat: 9.08, lng: -79.68, color: '#eab308', riskLevel: 'moderate', description: 'Drought restrictions easing. 1.0 mbpd LNG/oil transit.', meta: { throughput: 1.0, vessels24h: 28, riskScore: 45 } },
  { id: 'turkish', name: 'Turkish Straits', category: 'chokepoint', lat: 41.12, lng: 29.05, color: '#f97316', riskLevel: 'elevated', description: 'Bosphorus & Dardanelles. Dark-fleet tanker inspections. 3.4 mbpd.', meta: { throughput: 3.4, vessels24h: 38, riskScore: 55 } },
  { id: 'denmark', name: 'Danish Straits', category: 'chokepoint', lat: 55.7, lng: 12.6, color: '#eab308', riskLevel: 'moderate', description: 'Baltic exit route — Russian oil shipments. 3.2 mbpd.', meta: { throughput: 3.2, vessels24h: 52, riskScore: 35 } },
];

// ─── PRODUCERS ────────────────────────────────────────
export const PRODUCER_MARKERS: GlobeMarker[] = [
  { id: 'us', name: 'United States', category: 'producer', lat: 38.9, lng: -77.04, color: '#3b82f6', description: 'World\'s top producer — 13.3 mbpd.', meta: { production: 13.3, change: 0.4, flag: '🇺🇸' } },
  { id: 'saudi', name: 'Saudi Arabia', category: 'producer', lat: 24.71, lng: 46.68, color: '#3b82f6', description: 'OPEC+ leader — 9.0 mbpd.', meta: { production: 9.0, change: -0.2, flag: '🇸🇦' } },
  { id: 'russia', name: 'Russia', category: 'producer', lat: 55.75, lng: 37.62, color: '#3b82f6', description: 'Under sanctions — 9.2 mbpd.', meta: { production: 9.2, change: -0.5, flag: '🇷🇺' } },
  { id: 'canada', name: 'Canada', category: 'producer', lat: 45.42, lng: -75.70, color: '#3b82f6', description: 'Oil sands expansion — 5.8 mbpd.', meta: { production: 5.8, change: 0.3, flag: '🇨🇦' } },
  { id: 'iraq', name: 'Iraq', category: 'producer', lat: 33.31, lng: 44.37, color: '#3b82f6', description: 'OPEC member — 4.3 mbpd.', meta: { production: 4.3, change: 0.1, flag: '🇮🇶' } },
  { id: 'china', name: 'China', category: 'producer', lat: 39.91, lng: 116.39, color: '#3b82f6', description: 'Major consumer & producer — 4.2 mbpd.', meta: { production: 4.2, change: 0.0, flag: '🇨🇳' } },
  { id: 'uae', name: 'UAE', category: 'producer', lat: 24.45, lng: 54.65, color: '#3b82f6', description: 'OPEC+ — 2.95 mbpd.', meta: { production: 2.95, change: -0.1, flag: '🇦🇪' } },
  { id: 'brazil', name: 'Brazil', category: 'producer', lat: -15.79, lng: -47.88, color: '#3b82f6', description: 'Pre-salt deepwater — 3.7 mbpd.', meta: { production: 3.7, change: 0.5, flag: '🇧🇷' } },
  { id: 'kuwait', name: 'Kuwait', category: 'producer', lat: 29.38, lng: 47.99, color: '#3b82f6', description: 'OPEC member — 2.55 mbpd.', meta: { production: 2.55, change: -0.1, flag: '🇰🇼' } },
  { id: 'norway', name: 'Norway', category: 'producer', lat: 59.91, lng: 10.75, color: '#3b82f6', description: 'North Sea — 1.8 mbpd.', meta: { production: 1.8, change: 0.0, flag: '🇳🇴' } },
];

// ─── VENEZUELA ────────────────────────────────────────
export const VENEZUELA_MARKER: GlobeMarker = {
  id: 'venezuela', name: 'Venezuela', category: 'venezuela', lat: 10.49, lng: -66.88, color: '#a855f7',
  description: 'PDVSA output recovering from 2020 lows — 0.88 mbpd. Sanctions snapback curtailed exports. Chevron JV provides ~25 % of output.',
  meta: { production: 0.88, exports: 0.67, darkFleet: 48, sanctionsPressure: 78 },
};

// ─── EXCHANGES ────────────────────────────────────────
export const EXCHANGE_MARKERS: GlobeMarker[] = [
  { id: 'comex', name: 'COMEX / NYMEX', category: 'exchange', lat: 40.71, lng: -74.01, color: '#eab308', description: 'New York — gold, silver, WTI crude futures.' },
  { id: 'lme', name: 'London Metal Exchange', category: 'exchange', lat: 51.51, lng: -0.08, color: '#eab308', description: 'London — base & precious metals.' },
  { id: 'cme', name: 'CME Group', category: 'exchange', lat: 41.88, lng: -87.63, color: '#eab308', description: 'Chicago — agriculture, energy, metals futures.' },
  { id: 'ice', name: 'ICE / Brent', category: 'exchange', lat: 33.75, lng: -84.39, color: '#eab308', description: 'Atlanta — Brent crude, emissions, soft commodities.' },
  { id: 'shfe', name: 'Shanghai Futures', category: 'exchange', lat: 31.23, lng: 121.47, color: '#eab308', description: 'Shanghai — gold, copper, crude futures (INE).' },
];

export const ALL_MARKERS: GlobeMarker[] = [
  ...CHOKEPOINT_MARKERS,
  ...PRODUCER_MARKERS,
  VENEZUELA_MARKER,
  ...EXCHANGE_MARKERS,
];
