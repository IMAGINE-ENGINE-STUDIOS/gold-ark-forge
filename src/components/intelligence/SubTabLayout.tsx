import { useState } from 'react';
import type { ReactNode } from 'react';

/* ── Shared UI ─────────────────────────────────── */

export const SectionDivider = ({ label }: { label: string }) => (
  <div className="divider-ornate mb-8">
    <span className="font-display text-xs tracking-[0.3em] text-gold/50">{label}</span>
  </div>
);

export const TierBanner = ({ label, sub }: { label: string; sub: string }) => (
  <div className="relative py-6 mb-8">
    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gold/5 to-transparent" />
    <div className="relative text-center">
      <h2 className="font-display text-2xl tracking-[0.2em] text-gold-light">{label}</h2>
      <p className="text-[10px] font-display tracking-[0.3em] text-marble/30 mt-1">{sub}</p>
    </div>
  </div>
);

/* ── Sub-tab switcher ──────────────────────────── */

export interface SubTab {
  key: string;
  label: string;
  content: () => ReactNode;
}

export const SubTabLayout = ({
  banner,
  bannerSub,
  tabs,
}: {
  banner: string;
  bannerSub: string;
  tabs: SubTab[];
}) => {
  const [active, setActive] = useState(tabs[0]?.key ?? '');
  const activeTab = tabs.find((t) => t.key === active) ?? tabs[0];

  return (
    <div className="space-y-8">
      <TierBanner label={banner} sub={bannerSub} />

      {/* Sub-category pills */}
      <div className="overflow-x-auto scrollbar-thin -mx-6 px-6">
        <div className="flex flex-nowrap md:flex-wrap md:justify-center gap-1.5 min-w-max md:min-w-0">
          {tabs.map((t) => {
            const isActive = t.key === active;
            return (
              <button
                key={t.key}
                onClick={() => setActive(t.key)}
                className={`px-3 py-1.5 rounded text-[9px] font-display tracking-[0.15em] whitespace-nowrap transition-all border ${
                  isActive
                    ? 'border-gold/60 bg-gold/10 text-gold'
                    : 'border-gold/15 text-marble/40 hover:text-gold/70 hover:border-gold/30'
                }`}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Active sub-tab content */}
      <div>{activeTab?.content()}</div>
    </div>
  );
};
