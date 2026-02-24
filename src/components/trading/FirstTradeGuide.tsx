import { useState, useEffect } from 'react';
import { X, ArrowRight, TrendingUp, Hash, MousePointerClick } from 'lucide-react';
import { Button } from '@/components/ui/button';

const GUIDE_KEY = 'ga_first_trade_done';

export default function FirstTradeGuide() {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    try {
      if (!localStorage.getItem(GUIDE_KEY)) setVisible(true);
    } catch { /* ignore */ }
  }, []);

  const dismiss = () => {
    setVisible(false);
    try { localStorage.setItem(GUIDE_KEY, '1'); } catch { /* ignore */ }
  };

  if (!visible) return null;

  const steps = [
    { icon: TrendingUp, title: 'Pick an Asset', desc: 'Use the watchlist on the left to select any asset — gold, crypto, stocks, or energy.' },
    { icon: Hash, title: 'Set Quantity', desc: 'Enter how many units to trade. Use the quick-size buttons (25%, 50%, MAX) to size by your available cash.' },
    { icon: MousePointerClick, title: 'Click BUY or SELL', desc: "Confirm your order and you're trading! Track positions in the BOOK tab and performance in ANALYTICS." },
  ];

  const current = steps[step];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-navy-dark border border-gold/20 rounded-xl p-6 max-w-sm mx-4 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <span className="text-[10px] font-display tracking-[0.2em] text-gold/60">YOUR FIRST TRADE</span>
          <button onClick={dismiss} className="text-marble/30 hover:text-marble transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-2 mb-1">
          {steps.map((_, i) => (
            <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i <= step ? 'bg-gold' : 'bg-gold/15'}`} />
          ))}
        </div>

        <div className="text-center py-6">
          <div className="w-12 h-12 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center mx-auto mb-3">
            <current.icon className="w-6 h-6 text-gold" />
          </div>
          <div className="text-[9px] font-display tracking-[0.2em] text-marble/30 mb-1">STEP {step + 1} OF 3</div>
          <h3 className="text-lg font-display tracking-wider text-marble mb-2">{current.title}</h3>
          <p className="text-xs text-marble/50 leading-relaxed">{current.desc}</p>
        </div>

        <div className="flex gap-2">
          {step < 2 ? (
            <Button onClick={() => setStep(s => s + 1)} className="flex-1 bg-gold/20 text-gold border border-gold/30 font-display text-xs tracking-wider hover:bg-gold/30">
              Next <ArrowRight className="w-3 h-3 ml-1" />
            </Button>
          ) : (
            <Button onClick={dismiss} className="flex-1 bg-gold text-navy-dark font-display text-xs tracking-wider hover:bg-gold-light">
              Start Trading
            </Button>
          )}
          <Button variant="ghost" onClick={dismiss} className="text-marble/30 text-xs">Skip</Button>
        </div>
      </div>
    </div>
  );
}
