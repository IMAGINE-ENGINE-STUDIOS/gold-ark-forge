import { Link } from 'react-router-dom';
import goldArrowLogo from '@/assets/gold-arrow-logo.png';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    platform: [
      { label: 'Marketplace', href: '/marketplace' },
      { label: 'The Vault', href: '/vault' },
      { label: 'Certification', href: '/certification' },
    ],
    company: [
      { label: 'About Us', href: '/about' },
    ],
    legal: [
    ],
  };

  return (
    <footer className="navy-overlay pt-16 pb-8">
      {/* Greek Key Border Top */}
      <div className="greek-key-border h-2 mb-12" />

      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-12 mb-12">
          {/* Brand Column */}
          <div className="lg:col-span-2">
            <Link to="/" className="flex items-center gap-3 mb-6">
              <img src={goldArrowLogo} alt="Gold Arrow" className="w-10 h-10 object-contain" />
              <div className="flex flex-col">
                <span className="font-display text-xl tracking-wider text-gold-light">
                  GOLD ARROW
                </span>
                <span className="text-[10px] tracking-[0.15em] text-silver-light uppercase">
                  The New Standard in Asset Certification
                </span>
              </div>
            </Link>
            <p className="text-marble/60 max-w-sm mb-6">
              A non-custodial digital bullion verification platform combining 
              blockchain transparency with institutional-grade security.
            </p>
            <p className="text-sm text-marble/40">
              Secure • Verified • Certified
            </p>
          </div>

          {/* Platform Links */}
          <div>
            <h4 className="font-display text-sm tracking-wider text-gold uppercase mb-6">
              Platform
            </h4>
            <ul className="space-y-3">
              {footerLinks.platform.map((link) => (
                <li key={link.label}>
                  <Link 
                    to={link.href}
                    className="text-marble/60 hover:text-gold transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h4 className="font-display text-sm tracking-wider text-gold uppercase mb-6">
              Company
            </h4>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.label}>
                  <Link 
                    to={link.href}
                    className="text-marble/60 hover:text-gold transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h4 className="font-display text-sm tracking-wider text-gold uppercase mb-6">
              Legal
            </h4>
            <ul className="space-y-3">
              {footerLinks.legal.map((link) => (
                <li key={link.label}>
                  <Link 
                    to={link.href}
                    className="text-marble/60 hover:text-gold transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-gold/20">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-marble/40">
              © {currentYear} Gold Arrow. All rights reserved.
            </p>
            <div className="flex items-center gap-4">
              <span className="text-xs text-marble/30">
                Non-Custodial • Blockchain Verified • Bitcoin Anchored
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
