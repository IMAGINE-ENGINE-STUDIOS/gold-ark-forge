import { useState, lazy, Suspense } from 'react';
import SlideLayout from '../SlideLayout';
import { BarChart3, LineChart, ArrowLeftRight, Vault, Fuel, Globe } from 'lucide-react';

/* Lazy-load heavy widgets so the slide itself stays snappy */
const GAMarketSummary = lazy(() => import('@/components/ga-widgets/GAMarketSummary'));
const GACrossAssetDashboard = lazy(() => import('@/components/ga-widgets/GACrossAssetDashboard'));
const TradingPanel = lazy(() => import('@/components/trading/TradingPanel'));
const GAVaultMatrix = lazy(() => import('@/components/ga-widgets/GAVaultMatrix'));
const OGEnergyDashboard = lazy(() => import('@/components/og-widgets/OGEnergyDashboard'));
const GAMarketPulse = lazy(() => import('@/components/ga-widgets/GAMarketPulse'));

interface Screen {
  label: string;
  desc: string;
  icon: React.ElementType;
  component: React.ReactNode;
}

const screens: Screen[] = [
  {
    label: 'Homepage',
    desc: 'Institutional landing with live market data across metals, crypto, forex, and energy.',
    icon: Globe,
    component: <GAMarketSummary />,
  },
  {
    label: 'Market Intelligence',
    desc: '35+ proprietary analytics widgets with real-time cross-asset data streams.',
    icon: BarChart3,
    component: <GACrossAssetDashboard />,
  },
  {
    label: 'Trading Bridge',
    desc: 'Full trading suite — order entry, positions, history, broker connections, and multi-asset swap execution.',
    icon: LineChart,
    component: <TradingPanel activeSymbol="XAUUSD" />,
  },
  {
    label: 'Marketplace',
    desc: '101+ instruments across 9 asset classes with live WebSocket pricing.',
    icon: ArrowLeftRight,
    component: <GAMarketPulse />,
  },
  {
    label: 'The Vault',
    desc: 'Institutional-grade custody with insured, encrypted, and verified bullion holdings.',
    icon: Vault,
    component: <GAVaultMatrix />,
  },
  {
    label: 'Oil & Gas Intelligence',
    desc: 'Real-time energy analytics powered by EIA, Baker Hughes, IEA, and OPEC data.',
    icon: Fuel,
    component: <OGEnergyDashboard />,
  },
];

const WidgetFallback = () => (
  <div className="w-full h-full flex items-center justify-center" style={{ background: 'hsla(213,35%,10%,0.8)' }}>
    <div className="flex flex-col items-center gap-3">
      <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'hsla(43,72%,50%,0.5)', borderTopColor: 'transparent' }} />
      <span className="text-[14px] text-secondary-foreground/40">Loading widget…</span>
    </div>
  </div>
);

const PlatformSlide = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const active = screens[activeIndex];

  return (
    <SlideLayout>
      <div className="flex flex-col h-full px-[80px] py-[50px]">
        <p className="text-[20px] tracking-[0.3em] uppercase text-primary/60 mb-3">The Platform</p>
        <h2 className="text-[60px] leading-tight text-secondary-foreground mb-2" style={{ fontFamily: 'Cinzel, serif' }}>
          Tokenization <span className="text-gradient-gold">Platform</span>
        </h2>
        <div className="greek-key-border-rich w-[140px] h-[4px] mb-6 rounded-sm" />

        <div className="flex gap-8 flex-1 min-h-0">
          {/* Interactive widget area */}
          <div
            className="flex-1 relative rounded-xl overflow-hidden"
            style={{
              border: '2px solid hsla(43,72%,50%,0.25)',
              boxShadow: '0 0 60px hsla(43,72%,50%,0.1), 0 20px 60px hsla(0,0%,0%,0.4)',
              background: 'hsla(213,35%,8%,0.9)',
            }}
          >
            {/* Embedded widget */}
            <div className="absolute inset-0 overflow-auto">
              <Suspense fallback={<WidgetFallback />}>
                <div className="p-4 min-h-full">
                  {active.component}
                </div>
              </Suspense>
            </div>

            {/* Label overlay at bottom */}
            <div className="absolute inset-x-0 bottom-0 h-[90px] pointer-events-none" style={{ background: 'linear-gradient(to top, hsla(213,35%,8%,0.95) 0%, transparent 100%)' }} />
            <div className="absolute bottom-0 inset-x-0 px-8 pb-5 pointer-events-none">
              <h3 className="text-[30px] text-secondary-foreground" style={{ fontFamily: 'Cinzel, serif' }}>{active.label}</h3>
              <p className="text-[16px] text-secondary-foreground/50 mt-0.5">{active.desc}</p>
            </div>

            {/* Corner accents */}
            <span className="absolute top-0 left-0 w-[32px] h-[32px] border-t-2 border-l-2 rounded-tl-xl pointer-events-none" style={{ borderColor: 'hsla(43,72%,50%,0.5)' }} />
            <span className="absolute top-0 right-0 w-[32px] h-[32px] border-t-2 border-r-2 rounded-tr-xl pointer-events-none" style={{ borderColor: 'hsla(43,72%,50%,0.5)' }} />
          </div>

          {/* Selector sidebar */}
          <div className="w-[420px] flex flex-col gap-3 justify-start overflow-y-auto pr-2" style={{ maxHeight: '100%' }}>
            {screens.map((s, i) => {
              const isActive = i === activeIndex;
              return (
                <button
                  key={i}
                  onClick={() => setActiveIndex(i)}
                  className="relative rounded-lg overflow-hidden text-left transition-all duration-500"
                  style={{
                    border: isActive ? '2px solid hsla(43,72%,50%,0.5)' : '1px solid hsla(43,72%,50%,0.12)',
                    background: isActive
                      ? 'linear-gradient(135deg, hsla(213,32%,16%,0.8) 0%, hsla(43,72%,50%,0.06) 100%)'
                      : 'linear-gradient(135deg, hsla(213,32%,16%,0.4) 0%, hsla(213,35%,10%,0.3) 100%)',
                    boxShadow: isActive ? '0 0 30px hsla(43,72%,50%,0.12)' : 'none',
                    transform: isActive ? 'scale(1.02)' : 'scale(1)',
                    padding: isActive ? undefined : '1px',
                  }}
                >
                  <div className="flex items-center gap-4 p-5">
                    <div
                      className="w-[52px] h-[52px] rounded-lg flex items-center justify-center shrink-0"
                      style={{
                        border: `1px solid hsla(43,72%,50%,${isActive ? 0.4 : 0.15})`,
                        background: isActive
                          ? 'radial-gradient(circle, hsla(43,72%,50%,0.15) 0%, hsla(213,35%,10%,0.8) 100%)'
                          : 'hsla(213,35%,12%,0.5)',
                      }}
                    >
                      <s.icon className={`w-6 h-6 ${isActive ? 'text-primary' : 'text-secondary-foreground/40'}`} />
                    </div>
                    <div>
                      <h4 className="text-[20px] text-secondary-foreground" style={{ fontFamily: 'Cinzel, serif' }}>{s.label}</h4>
                      <p className="text-[14px] text-secondary-foreground/45 mt-0.5 line-clamp-2">{s.desc}</p>
                    </div>
                  </div>

                  {/* Active indicator bar */}
                  {isActive && (
                    <div className="absolute bottom-0 left-0 right-0 h-[3px]" style={{ background: 'linear-gradient(90deg, hsla(43,72%,50%,0.8), hsla(43,72%,50%,0.3))' }} />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </SlideLayout>
  );
};

export default PlatformSlide;
