import { useEffect, useState } from 'react';

const NEWS = [
  '🔴 Houthi missile strikes tanker near Bab el-Mandeb — war-risk premiums spike',
  '🟡 Panama Canal eases draft restrictions — LNG slot auctions drop 22 %',
  '🔵 US production hits 13.3 mbpd record — Permian Basin output surges',
  '🟠 Strait of Hormuz tension as IRGC conducts naval drills',
  '🟢 Brazil pre-salt output up 500 kbpd YoY — Petrobras targets 3.8 mbpd',
  '⚡ OPEC+ signals deeper cuts if Brent falls below $70',
  '🛢️ Venezuela dark fleet grows to 48 tankers — sanctions enforcement tightens',
  '📊 WTI-Brent spread narrows to -$3.40 — logistics bottleneck easing',
];

const GlobeNewsTicker = () => {
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setOffset((o) => o - 1), 40);
    return () => clearInterval(id);
  }, []);

  const text = NEWS.join('    ●    ');

  return (
    <div className="absolute bottom-0 left-0 right-0 h-10 bg-navy/85 backdrop-blur-sm border-t border-gold/15 z-30 overflow-hidden flex items-center">
      <div
        className="whitespace-nowrap text-xs font-display tracking-wider text-marble/60"
        style={{ transform: `translateX(${offset}px)` }}
      >
        {text}    ●    {text}
      </div>
    </div>
  );
};

export default GlobeNewsTicker;
