import { Link, useLocation } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import TrustBar from '@/components/TrustBar';
import { Landmark, Building2, Truck, ArrowRight, CheckCircle2, PlayCircle } from 'lucide-react';

type PersonaKey = 'sovereigns' | 'institutions' | 'exporters';

const PERSONAS: Record<PersonaKey, {
  icon: typeof Landmark;
  eyebrow: string;
  title: string;
  lede: string;
  metrics: { value: string; label: string }[];
  pillars: { title: string; body: string }[];
  outcomes: string[];
  cta: string;
}> = {
  sovereigns: {
    icon: Landmark,
    eyebrow: 'For Sovereigns & Producing Nations',
    title: 'Capture the value your nation produces.',
    lede: 'Producer states leak 150–400 bps to intermediaries on every commodity export. Gold Arrow gives finance ministries and central banks direct access to settlement, custody and price discovery — without giving up sovereignty.',
    metrics: [
      { value: '$1.2T', label: 'Annual producer-state leakage' },
      { value: '<4 hrs', label: 'Sovereign settlement window' },
      { value: '10 bps', label: 'All-in transaction cost' },
    ],
    pillars: [
      { title: 'Sovereign Custody Anchors', body: 'HSBC and LBMA-grade vaulting with dual-control access. Reserves stay verifiable on Bitcoin, never custodied by Gold Arrow.' },
      { title: 'Direct Price Discovery', body: 'Bypass single-venue benchmark pricing. Multi-venue oracle medianisation auditable in real time.' },
      { title: 'Compliant by Design', body: 'OFAC, FinCEN and EUDR screening at the protocol layer. Designed alongside named counsel.' },
    ],
    outcomes: [
      'Reduce trade-finance cost from 200–400 bps to 10 bps',
      'Settle export receipts in hours, not weeks',
      'Anchor reserve attestations to public Bitcoin proofs',
      'Retain full sovereign control of vault, keys and policy',
    ],
    cta: 'Request a Sovereign Briefing',
  },
  institutions: {
    icon: Building2,
    eyebrow: 'For Banks, Funds & Trading Houses',
    title: 'Institutional rails for tokenised real-world assets.',
    lede: 'Trade, custody and settle commodity exposure across metals, energy and bullion through a single non-custodial venue. Built around the controls your risk and compliance teams already use.',
    metrics: [
      { value: '95%', label: 'Settlement cost reduction' },
      { value: '24/7', label: 'Continuous market access' },
      { value: 'T+0', label: 'Atomic delivery vs payment' },
    ],
    pillars: [
      { title: 'Non-Custodial by Mandate', body: 'You hold the keys. Gold Arrow never custodies funds, never pools client assets, never books principal risk.' },
      { title: 'Auditable Anchoring', body: 'Every certificate, transfer and reserve snapshot is Merkle-batched and committed to Bitcoin via OP_RETURN.' },
      { title: 'Connectivity', body: 'SIWE, MetaMask Institutional, multi-broker proxy (Alpaca, Coinbase, IBKR) and a permissioned API.' },
    ],
    outcomes: [
      'Replace 4.8-day commodity settlement with sub-4-hour finality',
      'Plug into existing custody, KYC and risk pipelines',
      'Expose tokenised commodity desks without principal balance-sheet use',
      'Real-time reserves and obligations reporting',
    ],
    cta: 'Schedule an Institutional Demo',
  },
  exporters: {
    icon: Truck,
    eyebrow: 'For Exporters, Refiners & Producers',
    title: 'Get paid the day you ship.',
    lede: 'Stop financing your buyers. Gold Arrow turns every cargo and refined batch into an instantly-settleable instrument so you collect cash on bill-of-lading, not on arrival.',
    metrics: [
      { value: '0 days', label: 'Days sales outstanding' },
      { value: '–80%', label: 'Trade-finance fees vs LC' },
      { value: '100%', label: 'Cargo IoT auditability' },
    ],
    pillars: [
      { title: 'Cash on Cargo', body: 'IoT-confirmed shipment triggers smart-contract release of buyer funds. No 30-90 day collection cycle.' },
      { title: 'No Letter-of-Credit Spread', body: 'Replace LC bank fees and confirming-bank cost with a flat 10 bps protocol fee.' },
      { title: 'Verified Origin', body: 'EUDR, LBMA Good Delivery and conflict-free attestations carried with the asset, not in a PDF.' },
    ],
    outcomes: [
      'Convert receivables to cash within hours of cargo confirmation',
      'Cut working-capital cost by 70–90% versus traditional trade finance',
      'Access a global buyer base without bank-by-bank onboarding',
      'Carry compliance attestations on-chain alongside the asset',
    ],
    cta: 'Talk to an Exporter Specialist',
  },
};

const slugToKey = (path: string): PersonaKey => {
  if (path.includes('institutions')) return 'institutions';
  if (path.includes('exporters')) return 'exporters';
  return 'sovereigns';
};

const PersonaPage = () => {
  const { pathname } = useLocation();
  const key = slugToKey(pathname);
  const p = PERSONAS[key];
  const Icon = p.icon;

  return (
    <div className="min-h-screen bg-navy">
      <Header />
      <main>
        {/* Hero */}
        <section className="relative bg-gradient-to-b from-navy-dark via-navy to-navy-dark border-b border-gold/20">
          <div className="container mx-auto px-4 py-20 md:py-28 max-w-5xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-full bg-gold/10 border border-gold/40 flex items-center justify-center">
                <Icon className="w-6 h-6 text-gold" />
              </div>
              <span className="font-display text-[10px] md:text-xs tracking-[0.35em] text-gold/70 uppercase">
                {p.eyebrow}
              </span>
            </div>
            <h1 className="font-display text-4xl md:text-6xl text-gold-light leading-[1.05] mb-6">
              {p.title}
            </h1>
            <p className="text-marble/75 text-base md:text-lg max-w-3xl leading-relaxed">{p.lede}</p>

            <div className="mt-10 flex flex-col sm:flex-row gap-4">
              <Link
                to="/about#briefing"
                className="px-8 py-3.5 bg-gradient-to-r from-gold-dark via-gold to-gold-dark text-navy font-display text-xs md:text-sm tracking-[0.2em] uppercase border-2 border-gold-shine hover:scale-[1.02] transition-all"
                style={{ boxShadow: '0 8px 32px rgba(184,134,11,0.45)' }}
              >
                {p.cta}
              </Link>
              <Link
                to="/trade-simulation"
                className="px-8 py-3.5 border border-gold/40 text-gold-light font-display text-xs md:text-sm tracking-[0.2em] uppercase hover:bg-gold/10 transition-colors flex items-center justify-center gap-2"
              >
                <PlayCircle className="w-4 h-4" /> Run Trade Simulation
              </Link>
            </div>
          </div>
        </section>

        <TrustBar />

        {/* Metrics */}
        <section className="bg-navy py-16 border-b border-gold/15">
          <div className="container mx-auto px-4 max-w-5xl grid grid-cols-1 md:grid-cols-3 gap-6">
            {p.metrics.map((m) => (
              <div key={m.label} className="border border-gold/25 bg-navy-light/30 p-6 text-center">
                <div className="font-display text-4xl md:text-5xl text-gold mb-2">{m.value}</div>
                <div className="text-[11px] tracking-[0.2em] uppercase text-marble/60">{m.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Pillars */}
        <section className="bg-navy-dark py-20 border-b border-gold/15">
          <div className="container mx-auto px-4 max-w-5xl">
            <div className="text-center mb-12">
              <div className="h-1 w-24 mx-auto bg-gradient-to-r from-transparent via-gold to-transparent mb-5" />
              <h2 className="font-display text-3xl md:text-4xl text-gold-light">HOW IT WORKS FOR YOU</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {p.pillars.map((pl) => (
                <div key={pl.title} className="border border-gold/25 bg-navy/50 p-6">
                  <h3 className="font-display text-base tracking-[0.15em] text-gold uppercase mb-3">{pl.title}</h3>
                  <p className="text-marble/70 text-sm leading-relaxed">{pl.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Outcomes */}
        <section className="bg-navy py-20">
          <div className="container mx-auto px-4 max-w-3xl">
            <h2 className="font-display text-2xl md:text-3xl text-gold-light text-center mb-10">
              MEASURABLE OUTCOMES
            </h2>
            <ul className="space-y-4">
              {p.outcomes.map((o) => (
                <li key={o} className="flex items-start gap-3 border border-gold/15 bg-navy-light/20 p-4">
                  <CheckCircle2 className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                  <span className="text-marble/85 text-sm md:text-base">{o}</span>
                </li>
              ))}
            </ul>
            <div className="mt-12 text-center">
              <Link
                to="/about#briefing"
                className="inline-flex items-center gap-2 px-10 py-4 bg-gold text-navy font-display text-sm tracking-[0.2em] uppercase hover:bg-gold-light transition-colors"
              >
                {p.cta} <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default PersonaPage;
