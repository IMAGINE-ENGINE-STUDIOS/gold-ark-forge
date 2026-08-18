import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, LogIn, LogOut, Store, BarChart3, ArrowLeftRight, Brain, Vault, ShieldCheck, Info, Fuel, Lightbulb, Settings, Globe } from 'lucide-react';
import ConnectWalletButton from '@/components/wallet/ConnectWalletButton';
import { useAuth } from '@/hooks/useAuth';
import goldArrowLogo from '@/assets/gold-arrow-logo.png';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, signOut } = useAuth();
  const navItems = [
    { label: 'Marketplace', href: '/marketplace', icon: Store },
    { label: 'Markets', href: '/marketplace', icon: BarChart3 },
    { label: 'Swap', href: '/trading-bridge', icon: ArrowLeftRight },
    { label: 'Pipeline', href: '/pipeline', icon: Workflow },
    { label: 'Intelligence', href: '/intelligence', icon: Brain },
    { label: 'The Vault', href: '/vault', icon: Vault },
    { label: 'Verify', href: '/verify', icon: ShieldCheck },
    { label: 'About Us', href: '/about', icon: Info },
    { label: 'Oil & Gas', href: '/oil-gas', icon: Fuel },
    { label: 'Insights', href: '/certification', icon: Lightbulb },
    { label: 'Admin', href: '/admin', icon: Settings },
    { label: 'Globe', href: '/globe', icon: Globe },
  ];

  return (
    <header className="relative z-50">
      {/* Greek Key Border Top */}
      <div className="h-3 bg-gradient-to-r from-gold-dark via-gold to-gold-dark" />
      
      {/* Main Header - Navy Background */}
      <div className="bg-navy border-b-4 border-gold">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3 group">
              <img src={goldArrowLogo} alt="Gold Arrow" className="w-14 h-12 object-contain" />
              <div className="flex flex-col">
                <span className="font-display text-2xl md:text-3xl tracking-[0.1em] text-gold group-hover:text-gold-light transition-colors">
                  GOLD ARROW
                </span>
                <span className="text-[10px] md:text-xs tracking-[0.15em] text-gold/70 uppercase">
                  The New Standard in Asset Certification
                </span>
              </div>
            </Link>

            {/* Wallet Auth - Desktop */}
            <div className="hidden md:flex items-center gap-3">
              {user ? (
                <button onClick={signOut} className="flex items-center gap-1 text-gold/60 hover:text-gold text-xs font-display tracking-wider transition-colors">
                  <LogOut className="w-3.5 h-3.5" /> Sign Out
                </button>
              ) : (
                <Link to="/login" className="flex items-center gap-1 text-gold/60 hover:text-gold text-xs font-display tracking-wider transition-colors">
                  <LogIn className="w-3.5 h-3.5" /> Sign In
                </Link>
              )}
              <ConnectWalletButton />
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden text-gold p-2"
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Bar - Cream/Marble Background */}
      <div className="bg-gradient-to-b from-marble-warm to-marble border-b-2 border-gold/30 hidden lg:block">
        <div className="h-2 greek-key-border opacity-50" />
        <nav className="container mx-auto px-4 py-2.5">
          <div className="flex items-center justify-center gap-1">
            {navItems.map((item, index) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="flex items-center gap-1">
                  <Link
                    to={item.href}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 font-display text-xs tracking-[0.1em] text-navy/80 hover:text-gold-dark transition-colors uppercase relative group"
                  >
                    <Icon className="w-3.5 h-3.5 text-gold" />
                    {item.label}
                    <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gold group-hover:w-full transition-all" />
                  </Link>
                  {index < navItems.length - 1 && (
                    <span className="text-gold/30 text-[8px]">|</span>
                  )}
                </div>
              );
            })}
          </div>
        </nav>
        <div className="h-2 greek-key-border opacity-50" />
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="lg:hidden absolute top-full left-0 right-0 bg-navy border-b-2 border-gold">
          <nav className="container mx-auto px-4 py-6 flex flex-col gap-4">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.label}
                  to={item.href}
                  className="flex items-center gap-2 font-display text-sm tracking-wider text-gold hover:text-gold-light transition-colors uppercase py-2 border-b border-gold/20"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Icon className="w-4 h-4 text-gold" />
                  {item.label}
                </Link>
              );
            })}
            <div className="pt-4 flex flex-col gap-3">
              {user ? (
                <button onClick={() => { signOut(); setIsMenuOpen(false); }} className="flex items-center gap-1 text-gold/60 hover:text-gold text-sm font-display tracking-wider transition-colors">
                  <LogOut className="w-4 h-4" /> Sign Out
                </button>
              ) : (
                <Link to="/login" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-1 text-gold/60 hover:text-gold text-sm font-display tracking-wider transition-colors">
                  <LogIn className="w-4 h-4" /> Sign In
                </Link>
              )}
              <ConnectWalletButton />
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
