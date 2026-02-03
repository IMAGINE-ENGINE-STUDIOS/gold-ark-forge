import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import ConnectWalletButton from '@/components/wallet/ConnectWalletButton';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navItems = [
    { label: 'Marketplace', href: '/marketplace' },
    { label: 'The Vault', href: '/vault' },
    { label: 'Certification', href: '/certification' },
    { label: 'About', href: '/about' },
  ];

  return (
    <header className="relative z-50">
      {/* Greek Key Border Top */}
      <div className="h-2 greek-key-border" />
      
      {/* Main Header */}
      <div className="navy-overlay">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3 group">
              {/* Temple Icon */}
              <div className="relative">
                <svg 
                  viewBox="0 0 60 50" 
                  className="w-12 h-10 text-gold"
                  fill="currentColor"
                >
                  {/* Roof */}
                  <polygon points="30,2 58,18 2,18" fill="currentColor" />
                  {/* Frieze */}
                  <rect x="5" y="18" width="50" height="4" fill="currentColor" />
                  {/* Columns */}
                  <rect x="8" y="22" width="5" height="26" fill="currentColor" />
                  <rect x="18" y="22" width="5" height="26" fill="currentColor" />
                  <rect x="28" y="22" width="5" height="26" fill="currentColor" />
                  <rect x="38" y="22" width="5" height="26" fill="currentColor" />
                  <rect x="48" y="22" width="5" height="26" fill="currentColor" />
                  {/* Base */}
                  <rect x="3" y="48" width="54" height="2" fill="currentColor" />
                </svg>
              </div>
              <div className="flex flex-col">
                <span className="font-display text-xl md:text-2xl tracking-wider text-gold-light group-hover:text-gold transition-colors">
                  GOLD ARROW
                </span>
                <span className="text-[10px] md:text-xs tracking-[0.2em] text-silver-light uppercase">
                  The New Standard in Asset Certification
                </span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-8">
              {navItems.map((item) => (
                <Link
                  key={item.label}
                  to={item.href}
                  className="font-display text-sm tracking-wider text-marble hover:text-gold transition-colors uppercase"
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            {/* Connect Vault Button */}
            <div className="hidden md:flex items-center">
              <ConnectWalletButton />
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="lg:hidden text-gold p-2"
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="lg:hidden absolute top-full left-0 right-0 navy-overlay border-t border-gold/20">
          <nav className="container mx-auto px-4 py-6 flex flex-col gap-4">
            {navItems.map((item) => (
              <Link
                key={item.label}
                to={item.href}
                className="font-display text-sm tracking-wider text-marble hover:text-gold transition-colors uppercase py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <div className="pt-4 border-t border-gold/20">
              <ConnectWalletButton />
            </div>
          </nav>
        </div>
      )}

      {/* Greek Key Border Bottom */}
      <div className="h-1 greek-key-border" />
    </header>
  );
};

export default Header;
