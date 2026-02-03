import { Link } from 'react-router-dom';
import marketplaceBg from '@/assets/marketplace-bg.jpg';
import vaultDoor from '@/assets/vault-door-new.jpg';

const VaultPreview = () => {
  return (
    <section className="py-0 bg-navy">
      {/* Gold border top */}
      <div className="h-2 bg-gradient-to-r from-gold-dark via-gold to-gold-dark" />

      <div className="container mx-auto px-0">
        {/* Two Column Layout */}
        <div className="grid lg:grid-cols-2">
          {/* Marketplace Card */}
          <Link
            to="/marketplace"
            className="group relative overflow-hidden min-h-[350px] md:min-h-[450px] flex items-end"
          >
            {/* Background Image */}
            <div 
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${marketplaceBg})` }}
            />
            {/* Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/70 to-transparent" />
            
            {/* Gold Frame Border */}
            <div className="absolute inset-4 border-4 border-gold/50 group-hover:border-gold transition-colors" />
            <div className="absolute inset-6 border border-gold/30" />
            
            {/* Content */}
            <div className="relative z-10 p-8 md:p-12 w-full">
              <h3 className="font-display text-2xl md:text-3xl text-gold mb-2 tracking-[0.1em] uppercase">
                Enter the Marketplace
              </h3>
              <p className="text-marble/70 font-display text-sm tracking-wider">
                Buy & Sell Precious Metals
              </p>
            </div>
          </Link>

          {/* Vault Card */}
          <Link
            to="/vault"
            className="group relative overflow-hidden min-h-[350px] md:min-h-[450px] flex items-end"
          >
            {/* Background Image */}
            <div 
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${vaultDoor})` }}
            />
            {/* Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/60 to-transparent" />
            
            {/* Gold Frame Border */}
            <div className="absolute inset-4 border-4 border-gold/50 group-hover:border-gold transition-colors" />
            <div className="absolute inset-6 border border-gold/30" />
            
            {/* Content */}
            <div className="relative z-10 p-8 md:p-12 w-full">
              <h3 className="font-display text-2xl md:text-3xl text-gold mb-2 tracking-[0.1em] uppercase">
                Access The Vault
              </h3>
              <p className="text-marble/70 font-display text-sm tracking-wider">
                Safeguard Your Investments
              </p>
            </div>
          </Link>
        </div>
      </div>

      {/* Gold border bottom */}
      <div className="h-2 bg-gradient-to-r from-gold-dark via-gold to-gold-dark" />
    </section>
  );
};

export default VaultPreview;
