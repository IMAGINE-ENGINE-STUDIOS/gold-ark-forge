import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CheckCircle2, Circle, Loader2, ArrowRight, FileText } from 'lucide-react';

type Step = {
  key: string;
  title: string;
  detail: string;
  legacyHours: number;
  gaSeconds: number;
};

const SCENARIOS = [
  {
    id: 'sa-crude',
    flag: '🇸🇦',
    title: 'Saudi Crude Oil Settlement',
    pitch: 'Aramco sells 2M barrels to an Asian refiner. Smart contract executes, IoT cargo confirms, HSBC custody settles in under 4 hours.',
    deal: '2,000,000 barrels · ~$160M',
    saving: '$2.5B / yr in projected sovereign savings',
    available: true,
  },
  {
    id: 'drc-cobalt',
    flag: '🇨🇩',
    title: 'DRC Cobalt with EU Compliance',
    pitch: 'Cobalt to a European EV battery manufacturer. EU Battery Regulation traceability built in.',
    deal: 'EV-grade cobalt · revenue retention 28% → 52%',
    saving: '$1.9B / yr additional revenue retained by DRC',
    available: false,
  },
  {
    id: 'au-wheat',
    flag: '🇦🇺',
    title: 'Australian SME Agricultural Export',
    pitch: 'Wheat exporter sells $3M to a Japanese buyer. Same-day settlement, financing 14% → 5%.',
    deal: '$3M wheat shipment · 60-day → same-day cycle',
    saving: 'Working capital freed for 303,000 SME exporters',
    available: false,
  },
];

const STEPS: Step[] = [
  { key: 'contract', title: 'Smart Contract Execution', detail: 'Buyer & seller obligations encoded and signed.', legacyHours: 18, gaSeconds: 2 },
  { key: 'cargo', title: 'IoT Cargo Confirmation', detail: 'Loading, weight & quality oracles write attestation.', legacyHours: 26, gaSeconds: 3 },
  { key: 'custody', title: 'HSBC Custody Anchor', detail: 'Funds locked at custody, commitment anchored to Bitcoin.', legacyHours: 38, gaSeconds: 3 },
  { key: 'settlement', title: 'Final Settlement', detail: 'Title transfer & payment release confirmed.', legacyHours: 33, gaSeconds: 2 },
];

const LEGACY_HOURS = STEPS.reduce((s, x) => s + x.legacyHours, 0); // 115h ~ 4.8d
const GA_SECONDS = STEPS.reduce((s, x) => s + x.gaSeconds, 0);

const TradeSimulation = () => {
  const [scenarioId, setScenarioId] = useState<string | null>(null);
  const [stepIdx, setStepIdx] = useState(-1);
  const [done, setDone] = useState(false);
  const [savedAmount, setSavedAmount] = useState(0);

  // Personalize
  const [vol, setVol] = useState('160000000');
  const [days, setDays] = useState('5');
  const [feePct, setFeePct] = useState('3');

  const scenario = SCENARIOS.find((s) => s.id === scenarioId) ?? null;

  useEffect(() => {
    if (stepIdx < 0 || stepIdx >= STEPS.length) return;
    const t = setTimeout(() => {
      if (stepIdx + 1 >= STEPS.length) {
        setDone(true);
        // count up savings
        const target = 2_500_000_000;
        const start = performance.now();
        const tick = (now: number) => {
          const p = Math.min(1, (now - start) / 1500);
          setSavedAmount(Math.floor(target * (0.5 - 0.5 * Math.cos(Math.PI * p))));
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }
      setStepIdx((i) => i + 1);
    }, 1400);
    return () => clearTimeout(t);
  }, [stepIdx]);

  const start = (id: string) => {
    setScenarioId(id);
    setDone(false);
    setSavedAmount(0);
    setStepIdx(0);
  };

  const reset = () => {
    setScenarioId(null);
    setStepIdx(-1);
    setDone(false);
    setSavedAmount(0);
  };

  // Personalize calc
  const v = Number(vol) || 0;
  const d = Number(days) || 0;
  const f = Number(feePct) || 0;
  const legacyFee = v * (f / 100);
  const gaFee = v * 0.001;
  const feeSaved = Math.max(0, legacyFee - gaFee);
  const daysSaved = Math.max(0, d - 0.17);

  const fmtUSD = (n: number) =>
    n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

  return (
    <div className="min-h-screen bg-navy">
      <Header />
      <main>
        {/* Hero strip */}
        <section className="bg-gradient-to-r from-navy-dark via-navy to-navy-dark border-b-2 border-gold/30 py-10">
          <div className="container mx-auto px-4">
            <p className="font-display text-[10px] tracking-[0.4em] text-gold/70 uppercase">◆ Live Trade Simulation</p>
            <h1 className="font-display text-3xl md:text-5xl text-gold-light mt-2">
              Run a sovereign-grade settlement scenario.
            </h1>
            <p className="text-marble/70 max-w-2xl mt-3 text-sm md:text-base">
              No login. No wallet. Watch a real trade flow execute in seconds — and see what your nation, institution, or business would save.
            </p>
          </div>
        </section>

        {/* Scenario picker */}
        {!scenario && (
          <section className="container mx-auto px-4 py-12">
            <h2 className="font-display text-lg tracking-[0.25em] text-gold uppercase mb-6">Choose a scenario</h2>
            <div className="grid md:grid-cols-3 gap-5">
              {SCENARIOS.map((s) => (
                <button
                  key={s.id}
                  disabled={!s.available}
                  onClick={() => s.available && start(s.id)}
                  className={`text-left border p-5 transition-all bg-navy-light/30 ${
                    s.available
                      ? 'border-gold/30 hover:border-gold hover:-translate-y-0.5 cursor-pointer'
                      : 'border-marble/10 opacity-50 cursor-not-allowed'
                  }`}
                >
                  <div className="text-3xl mb-3">{s.flag}</div>
                  <div className="font-display text-base tracking-[0.1em] text-gold uppercase mb-2">{s.title}</div>
                  <p className="text-marble/70 text-xs leading-relaxed mb-4">{s.pitch}</p>
                  <div className="text-[11px] text-marble/50 border-t border-gold/15 pt-3">{s.deal}</div>
                  <div className="text-[11px] text-gold-light font-semibold mt-1">{s.saving}</div>
                  {!s.available && <div className="mt-3 text-[10px] tracking-[0.2em] text-marble/40 uppercase">Coming Soon</div>}
                  {s.available && (
                    <div className="mt-4 inline-flex items-center gap-1 text-gold font-display text-xs tracking-[0.2em] uppercase">
                      Run scenario <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Live scenario */}
        {scenario && (
          <section className="container mx-auto px-4 py-10">
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="text-xs text-gold/60 tracking-[0.3em] uppercase">{scenario.flag} Scenario</div>
                <h2 className="font-display text-2xl md:text-3xl text-gold-light">{scenario.title}</h2>
              </div>
              <Button variant="outline" onClick={reset} className="border-gold/30 text-gold">Pick another</Button>
            </div>

            <div className="grid lg:grid-cols-[1fr_360px] gap-6">
              {/* Timeline */}
              <div className="border border-gold/20 bg-navy-light/30 p-6">
                <ol className="space-y-5">
                  {STEPS.map((s, i) => {
                    const state = i < stepIdx ? 'done' : i === stepIdx ? 'active' : 'pending';
                    return (
                      <li key={s.key} className="flex gap-4">
                        <div className="mt-0.5">
                          {state === 'done' && <CheckCircle2 className="w-6 h-6 text-emerald-400" />}
                          {state === 'active' && <Loader2 className="w-6 h-6 text-gold animate-spin" />}
                          {state === 'pending' && <Circle className="w-6 h-6 text-marble/30" />}
                        </div>
                        <div className="flex-1">
                          <div className={`font-display text-sm tracking-[0.15em] uppercase ${state === 'pending' ? 'text-marble/40' : 'text-gold'}`}>
                            {s.title}
                          </div>
                          <div className="text-xs text-marble/60 mt-1">{s.detail}</div>
                        </div>
                        <div className="text-right text-[11px]">
                          <div className="text-marble/40 line-through">{s.legacyHours}h legacy</div>
                          <div className="text-emerald-300">{s.gaSeconds}s GA</div>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              </div>

              {/* Side: comparison + savings */}
              <aside className="space-y-4">
                <div className="border border-gold/20 bg-navy-light/30 p-5">
                  <div className="font-display text-xs tracking-[0.25em] text-gold/70 uppercase mb-3">Time to settle</div>
                  <div className="flex justify-between items-baseline mb-2">
                    <span className="text-marble/50 text-xs">Legacy</span>
                    <span className="text-marble/70 line-through">{(LEGACY_HOURS / 24).toFixed(1)} days</span>
                  </div>
                  <div className="flex justify-between items-baseline">
                    <span className="text-gold text-xs">Gold Arrow</span>
                    <span className="text-gold-light font-display text-2xl">{GA_SECONDS}s</span>
                  </div>
                </div>

                <div className="border border-gold/30 bg-gradient-to-br from-navy to-navy-dark p-5">
                  <div className="font-display text-xs tracking-[0.25em] text-gold/70 uppercase mb-2">Projected sovereign savings</div>
                  <div className="font-display text-3xl text-gold-light">
                    {fmtUSD(savedAmount)}
                    <span className="text-xs text-marble/50 ml-1">/ yr</span>
                  </div>
                  {done && (
                    <p className="text-[11px] text-marble/60 mt-3">
                      Based on Saudi Aramco crude export volume modeled in GA-2026-001.
                    </p>
                  )}
                </div>
              </aside>
            </div>

            {/* Personalize + convert */}
            {done && (
              <div className="mt-10 grid md:grid-cols-2 gap-6">
                <div className="border border-gold/20 bg-navy-light/30 p-6">
                  <h3 className="font-display text-sm tracking-[0.25em] text-gold uppercase mb-4">Run with your numbers</h3>
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <div>
                      <Label className="text-[10px] tracking-[0.2em] uppercase text-marble/60">Trade value (USD)</Label>
                      <Input className="bg-navy border-gold/20 text-marble text-xs h-9 mt-1" value={vol} onChange={(e) => setVol(e.target.value)} />
                    </div>
                    <div>
                      <Label className="text-[10px] tracking-[0.2em] uppercase text-marble/60">Settlement (days)</Label>
                      <Input className="bg-navy border-gold/20 text-marble text-xs h-9 mt-1" value={days} onChange={(e) => setDays(e.target.value)} />
                    </div>
                    <div>
                      <Label className="text-[10px] tracking-[0.2em] uppercase text-marble/60">Current fee %</Label>
                      <Input className="bg-navy border-gold/20 text-marble text-xs h-9 mt-1" value={feePct} onChange={(e) => setFeePct(e.target.value)} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="border border-gold/15 p-3">
                      <div className="text-[10px] text-marble/50 uppercase tracking-[0.2em]">Fees saved / trade</div>
                      <div className="font-display text-xl text-gold-light">{fmtUSD(feeSaved)}</div>
                    </div>
                    <div className="border border-gold/15 p-3">
                      <div className="text-[10px] text-marble/50 uppercase tracking-[0.2em]">Days freed</div>
                      <div className="font-display text-xl text-gold-light">{daysSaved.toFixed(1)}d</div>
                    </div>
                  </div>
                </div>

                <div className="border border-gold/30 bg-navy-light/40 p-6 flex flex-col justify-between">
                  <div>
                    <h3 className="font-display text-sm tracking-[0.25em] text-gold uppercase mb-3">Send me this scenario</h3>
                    <p className="text-marble/70 text-xs mb-4">
                      Receive a procurement-ready PDF report tailored for your team.
                    </p>
                    <Input placeholder="name@ministry.gov" className="bg-navy border-gold/30 text-marble text-xs h-10" />
                  </div>
                  <Button className="mt-4 bg-gold hover:bg-gold/90 text-navy font-display tracking-[0.2em]">
                    <FileText className="w-4 h-4 mr-2" /> Email me the report
                  </Button>
                </div>
              </div>
            )}
          </section>
        )}

        <div className="container mx-auto px-4 pb-16">
          <Link to="/" className="text-xs tracking-[0.2em] text-gold/60 hover:text-gold uppercase">← Back to home</Link>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default TradeSimulation;