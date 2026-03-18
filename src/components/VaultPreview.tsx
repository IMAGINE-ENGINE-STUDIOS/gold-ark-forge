import { Link } from 'react-router-dom';
import marketplaceBg from '@/assets/marketplace-rich.jpg';
import vaultDoor from '@/assets/vault-door-rich.jpg';

const VaultPreview = () => {
  return (
    <section className="py-0 bg-navy relative">
      {/* Gold border top with Greek key */}
      <div className="h-3 bg-gradient-to-r from-gold-dark via-gold to-gold-dark" />
      <div className="h-4 greek-key-border-rich-dark" />

      <div className="container mx-auto px-0">
        {/* Two Column Layout */}
        <div className="grid lg:grid-cols-2">
          {/* Marketplace Card */}
          <Link
            to="/marketplace"
            className="group relative overflow-hidden min-h-[400px] md:min-h-[500px] flex items-end"
          >
            {/* Background Image */}
            <div 
              className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
              style={{ backgroundImage: `url(${marketplaceBg})` }}
            />
            {/* Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/60 to-transparent" />
            
            {/* Ornate Gold Frame */}
            <div className="absolute inset-6 border-4 border-gold/60 group-hover:border-gold transition-colors">
              {/* Corner ornaments */}
              <div className="absolute -top-2 -left-2 w-8 h-8 border-l-4 border-t-4 border-gold" />
              <div className="absolute -top-2 -right-2 w-8 h-8 border-r-4 border-t-4 border-gold" />
              <div className="absolute -bottom-2 -left-2 w-8 h-8 border-l-4 border-b-4 border-gold" />
              <div className="absolute -bottom-2 -right-2 w-8 h-8 border-r-4 border-b-4 border-gold" />
            </div>
            <div className="absolute inset-10 border border-gold/30" />
            
            {/* Content */}
            <div className="relative z-10 p-10 md:p-14 w-full">
              <h3 className="font-display text-3xl md:text-4xl text-gold mb-3 tracking-[0.1em] uppercase text-gradient-gold">
                Trade Tokenized Commodities
              </h3>
              <p className="text-marble/80 font-display text-base tracking-wider uppercase">
                A New Standard for Asset Trading
              </p>
              <div className="mt-4 w-24 h-1 bg-gradient-to-r from-gold to-transparent" />
            </div>
          </Link>

          {/* Vault Card */}
          <Link
            to="/vault"
            className="group relative overflow-hidden min-h-[400px] md:min-h-[500px] flex items-end"
          >
            {/* Background Image */}
            <div 
              className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
              style={{ backgroundImage: `url(${vaultDoor})` }}
            />
            {/* Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/50 to-transparent" />
            
            {/* Ornate Gold Frame */}
            <div className="absolute inset-6 border-4 border-gold/60 group-hover:border-gold transition-colors">
              {/* Corner ornaments */}
              <div className="absolute -top-2 -left-2 w-8 h-8 border-l-4 border-t-4 border-gold" />
              <div className="absolute -top-2 -right-2 w-8 h-8 border-r-4 border-t-4 border-gold" />
              <div className="absolute -bottom-2 -left-2 w-8 h-8 border-l-4 border-b-4 border-gold" />
              <div className="absolute -bottom-2 -right-2 w-8 h-8 border-r-4 border-b-4 border-gold" />
            </div>
            <div className="absolute inset-10 border border-gold/30" />
            
            {/* Content */}
            <div className="relative z-10 p-10 md:p-14 w-full">
              <h3 className="font-display text-3xl md:text-4xl text-gold mb-3 tracking-[0.1em] uppercase text-gradient-gold">
                Access The Vault
              </h3>
              <p className="text-marble/80 font-display text-base tracking-wider uppercase">
                Safeguard Your Investments
              </p>
              <div className="mt-4 w-24 h-1 bg-gradient-to-r from-gold to-transparent" />
            </div>
          </Link>
        </div>
      </div>

      {/* Gold border bottom with Greek key */}
      <div className="h-4 greek-key-border-rich-dark" />
      <div className="h-3 bg-gradient-to-r from-gold-dark via-gold to-gold-dark" />
    </section>
  );
};

export default VaultPreview;
