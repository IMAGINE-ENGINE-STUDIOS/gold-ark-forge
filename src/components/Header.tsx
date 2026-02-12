import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import ConnectWalletButton from '@/components/wallet/ConnectWalletButton';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navItems = [
    { label: 'Marketplace', href: '/marketplace' },
    { label: 'The Vault', href: '/vault' },
    { label: 'About Us', href: '/about' },
    { label: 'Insights', href: '/certification' },
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
              {/* Temple Icon */}
              <div className="relative">
                <svg 
                  viewBox="0 0 60 50" 
                  className="w-14 h-12 text-gold"
                  fill="currentColor"
                >
                  {/* Roof */}
                  <polygon points="30,0 58,16 2,16" />
                  {/* Frieze */}
                  <rect x="5" y="16" width="50" height="4" />
                  {/* Columns */}
                  <rect x="8" y="20" width="5" height="26" />
                  <rect x="18" y="20" width="5" height="26" />
                  <rect x="28" y="20" width="5" height="26" />
                  <rect x="38" y="20" width="5" height="26" />
                  <rect x="48" y="20" width="5" height="26" />
                  {/* Base */}
                  <rect x="3" y="46" width="54" height="4" />
                </svg>
              </div>
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
            <div className="hidden md:flex items-center">
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
        <nav className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-center gap-12">
            {navItems.map((item, index) => (
              <div key={item.label} className="flex items-center gap-12">
                <Link
                  to={item.href}
                  className="font-display text-sm tracking-[0.15em] text-navy/80 hover:text-gold-dark transition-colors uppercase relative group"
                >
                  {item.label}
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gold group-hover:w-full transition-all" />
                </Link>
                {index < navItems.length - 1 && (
                  <span className="text-gold/40">◆</span>
                )}
              </div>
            ))}
          </div>
        </nav>
        <div className="h-2 greek-key-border opacity-50" />
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="lg:hidden absolute top-full left-0 right-0 bg-navy border-b-2 border-gold">
          <nav className="container mx-auto px-4 py-6 flex flex-col gap-4">
            {navItems.map((item) => (
              <Link
                key={item.label}
                to={item.href}
                className="font-display text-sm tracking-wider text-gold hover:text-gold-light transition-colors uppercase py-2 border-b border-gold/20"
                onClick={() => setIsMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <div className="pt-4">
              <ConnectWalletButton />
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
