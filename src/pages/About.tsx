import { useEffect, useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent } from '@/components/ui/card';
import { Shield, Bitcoin, Link as LinkIcon, Building2, Users, Lock, TrendingUp, TrendingDown, Wallet, DollarSign } from 'lucide-react';
import { Link } from 'react-router-dom';
import goldArrowLogo from '@/assets/gold-arrow-logo.png';

// Read paper trading state from localStorage for the indicator
function usePaperMoneySnapshot() {
  const [snapshot, setSnapshot] = useState<{ equity: number; cash: number; totalPnl: number; positions: number; winRate: number } | null>(null);

  useEffect(() => {
    const load = () => {
      try {
        const raw = localStorage.getItem('ga_paper_trading_v2');
        if (!raw) return;
        const data = JSON.parse(raw);
        const positions = data.positions ?? [];
        const cash = data.cash ?? 100000;
        const positionsValue = positions.reduce((s: number, p: any) => {
          return s + (p.side === 'buy' ? (p.currentPrice ?? p.entryPrice) * p.qty : (2 * p.entryPrice - (p.currentPrice ?? p.entryPrice)) * p.qty);
        }, 0);
        const equity = cash + positionsValue;
        const totalPnl = equity - 100000;
        const wc = data.winCount ?? 0;
        const lc = data.lossCount ?? 0;
        const winRate = (wc + lc) > 0 ? (wc / (wc + lc)) * 100 : 0;
        setSnapshot({ equity, cash, totalPnl, positions: positions.length, winRate });
      } catch { /* ignore */ }
    };
    load();
    const interval = setInterval(load, 2000);
    return () => clearInterval(interval);
  }, []);

  return snapshot;
}

const About = () => {
  const paperMoney = usePaperMoneySnapshot();
  return (
    <div className="min-h-screen bg-navy">
      <Header />
      <main className="container mx-auto px-4 py-12">
        {/* Page Header */}
        <div className="text-center mb-16">
          <img src={goldArrowLogo} alt="Gold Arrow" className="w-[100px] h-auto mx-auto mb-6 drop-shadow-xl" />
          <h1 className="font-display text-4xl md:text-5xl text-gold-light mb-4">
            ABOUT GOLD ARROW
          </h1>
          <p className="text-marble/70 max-w-2xl mx-auto text-lg">
            The New Standard for Trading Tokenized Commodities
          </p>
        </div>

        {/* Mission */}
        <div className="max-w-4xl mx-auto mb-16">
          <div className="greek-key-border h-1 mb-8" />
          <h2 className="font-display text-2xl text-gold mb-6 text-center">
            Our Mission
          </h2>
          <p className="text-marble/80 text-lg leading-relaxed text-center">
            Gold Arrow is an institutional-grade platform that tokenizes, trades, 
            and monitors commodities through blockchain infrastructure. Starting with 
            crude oil and energy reserves, we create a new global standard for trading, 
            custody, and settlement — spanning precious metals, agriculture, rare earth 
            minerals, and beyond.
          </p>
          <div className="greek-key-border h-1 mt-8" />
        </div>

        {/* Core Principles */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <Card className="bg-navy-light/30 border-gold/20">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gold/10 flex items-center justify-center">
                <Lock className="text-gold" size={28} />
              </div>
               <h3 className="font-display text-xl text-gold-light mb-4">
                Non-Custodial Ownership
              </h3>
              <p className="text-marble/60">
                You hold your tokenized assets directly in your own wallet. 
                No intermediaries, no custody risk. Your keys, your commodities.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-navy-light/30 border-gold/20">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gold/10 flex items-center justify-center">
                <Shield className="text-gold" size={28} />
              </div>
               <h3 className="font-display text-xl text-gold-light mb-4">
                Asset-Backed Tokens
              </h3>
              <p className="text-marble/60">
                Every token represents a verified physical commodity — attested 
                by independent authorities and anchored to the Bitcoin blockchain 
                for immutable proof.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-navy-light/30 border-gold/20">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gold/10 flex items-center justify-center">
                <Building2 className="text-gold" size={28} />
              </div>
               <h3 className="font-display text-xl text-gold-light mb-4">
                Instant Settlement
              </h3>
              <p className="text-marble/60">
                Trade tokenized commodities with real-time pricing and 
                near-instant on-chain settlement — no clearing houses, 
                no T+2 delays.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Technology Stack */}
        <div className="max-w-4xl mx-auto mb-16">
          <h2 className="font-display text-2xl text-gold mb-8 text-center">
            Technology Stack
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-start gap-4 p-6 bg-navy-light/20 rounded-lg border border-gold/10">
              <LinkIcon className="text-gold flex-shrink-0 mt-1" size={24} />
              <div>
                <h4 className="font-display text-lg text-marble mb-2">
                  Chainlink Proof-of-Reserve
                </h4>
                <p className="text-marble/60 text-sm">
                  Decentralized oracles continuously verify that tokenized 
                  bullion matches physical reserves in certified vaults.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-6 bg-navy-light/20 rounded-lg border border-gold/10">
              <Bitcoin className="text-gold flex-shrink-0 mt-1" size={24} />
              <div>
                <h4 className="font-display text-lg text-marble mb-2">
                  Bitcoin Anchoring
                </h4>
                <p className="text-marble/60 text-sm">
                  Reserve Merkle roots are permanently inscribed on the 
                  Bitcoin blockchain, providing immutable proof of reserves.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-6 bg-navy-light/20 rounded-lg border border-gold/10">
              <svg
                viewBox="0 0 24 24"
                className="w-6 h-6 text-gold flex-shrink-0 mt-1"
                fill="currentColor"
              >
                <path d="M11.944 17.97L4.58 13.62 11.943 24l7.37-10.38-7.372 4.35h.003zM12.056 0L4.69 12.223l7.365 4.354 7.365-4.35L12.056 0z" />
              </svg>
              <div>
                <h4 className="font-display text-lg text-marble mb-2">
                  Ethereum Integration
                </h4>
                <p className="text-marble/60 text-sm">
                  MetaMask wallet connection for seamless, secure access 
                  to your bullion holdings without custody risk.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-6 bg-navy-light/20 rounded-lg border border-gold/10">
              <Shield className="text-gold flex-shrink-0 mt-1" size={24} />
              <div>
                <h4 className="font-display text-lg text-marble mb-2">
                  Government Attestations
                </h4>
                <p className="text-marble/60 text-sm">
                  Physical bullion verified by Swiss, Singaporean, and 
                  other jurisdictional authorities with cryptographic signatures.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Paper Trading Indicator */}
        {paperMoney && (
          <div className="max-w-4xl mx-auto mb-16">
            <h2 className="font-display text-2xl text-gold mb-8 text-center">
              Paper Trading Portfolio
            </h2>
            <Link to="/trading-bridge" className="block">
              <Card className="bg-navy-light/30 border-gold/20 hover:border-gold/40 transition-colors cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center">
                      <Wallet className="text-gold" size={20} />
                    </div>
                    <div>
                      <div className="font-display text-sm text-marble/50 tracking-wider">SIMULATED PORTFOLIO</div>
                      <div className="font-mono text-2xl text-marble">
                        ${paperMoney.equity.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    </div>
                    <div className="ml-auto text-right">
                      <div className={`flex items-center gap-1 font-mono text-lg ${paperMoney.totalPnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {paperMoney.totalPnl >= 0 ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
                        {paperMoney.totalPnl >= 0 ? '+' : ''}${paperMoney.totalPnl.toFixed(2)}
                      </div>
                      <div className={`text-xs font-mono ${paperMoney.totalPnl >= 0 ? 'text-emerald-400/60' : 'text-red-400/60'}`}>
                        {paperMoney.totalPnl >= 0 ? '+' : ''}{((paperMoney.totalPnl / 100000) * 100).toFixed(2)}%
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 border-t border-gold/10 pt-4">
                    <div className="text-center">
                      <div className="text-[10px] text-marble/30 font-display tracking-wider">CASH</div>
                      <div className="text-sm font-mono text-marble/70">${paperMoney.cash.toLocaleString('en-US', { maximumFractionDigits: 0 })}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-[10px] text-marble/30 font-display tracking-wider">POSITIONS</div>
                      <div className="text-sm font-mono text-marble/70">{paperMoney.positions}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-[10px] text-marble/30 font-display tracking-wider">WIN RATE</div>
                      <div className="text-sm font-mono text-marble/70">{paperMoney.winRate.toFixed(1)}%</div>
                    </div>
                  </div>
                  <div className="text-center mt-3 text-[9px] text-marble/20 font-display tracking-widest">TAP TO OPEN TRADING BRIDGE →</div>
                </CardContent>
              </Card>
            </Link>
          </div>
        )}

        {/* Client Types */}
        <div className="max-w-4xl mx-auto">
          <h2 className="font-display text-2xl text-gold mb-8 text-center">
            Who We Serve
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-6">
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-gold/10 flex items-center justify-center">
                <Users className="text-gold" size={20} />
              </div>
              <h4 className="font-display text-marble mb-2">Family Offices</h4>
              <p className="text-marble/50 text-sm">
                Multi-generational wealth preservation
              </p>
            </div>
            <div className="text-center p-6">
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-gold/10 flex items-center justify-center">
                <Building2 className="text-gold" size={20} />
              </div>
              <h4 className="font-display text-marble mb-2">Institutions</h4>
              <p className="text-marble/50 text-sm">
                Pension funds and sovereign wealth
              </p>
            </div>
            <div className="text-center p-6">
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-gold/10 flex items-center justify-center">
                <Shield className="text-gold" size={20} />
              </div>
              <h4 className="font-display text-marble mb-2">HNWI</h4>
              <p className="text-marble/50 text-sm">
                High-net-worth portfolio diversification
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default About;
