import React from 'react';
import { ShoppingCart } from 'lucide-react';
import { useSiteSettings } from '../hooks/useSiteSettings';

interface HeaderProps {
  cartItemsCount: number;
  onCartClick: () => void;
  onMenuClick: () => void;
  onTrackOrder?: () => void;
}

const Header: React.FC<HeaderProps> = ({ cartItemsCount, onCartClick, onMenuClick, onTrackOrder }) => {
  const { siteSettings, loading } = useSiteSettings();

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md border-b border-alchemy-smoke/70 shadow-[0_12px_24px_-18px_rgba(0,0,0,0.85)] bg-gradient-to-r from-alchemy-dusk/90 via-alchemy-emberDeep/80 to-alchemy-night/85">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <button 
            onClick={onMenuClick}
            className="flex items-center space-x-3 text-alchemy-cream hover:text-alchemy-gold transition-colors duration-200"
          >
            {loading ? (
              <div className="w-12 h-12 bg-alchemy-smoke/60 rounded-full animate-pulse" />
            ) : (
              <img 
                src={siteSettings?.site_logo || "/alchemy-logo.png"} 
                alt={siteSettings?.site_name || "The Alchemy - Mobile Bar"}
                className="w-12 h-12 rounded-full object-cover ring-2 ring-alchemy-gold/70 shadow-lg shadow-black/40"
                onError={(e) => {
                  e.currentTarget.src = "/logo.jpg";
                }}
              />
            )}
            <h1 className="text-2xl sm:text-3xl font-playfair font-semibold tracking-wide">
              {loading ? (
                <div className="w-28 h-6 bg-alchemy-smoke/60 rounded animate-pulse" />
              ) : (
                siteSettings?.site_name || "The Alchemy - Mobile Bar"
              )}
            </h1>
          </button>

          <div className="flex items-center space-x-3">
            {onTrackOrder && (
              <button
                onClick={onTrackOrder}
                className="inline-flex items-center space-x-2 px-3 py-2 rounded-full border border-white/15 text-xs sm:text-sm font-medium text-alchemy-cream/80 hover:text-alchemy-gold hover:border-alchemy-gold/60 hover:bg-white/10 transition-all duration-200"
              >
                <span>Track Order</span>
              </button>
            )}
            <button 
              onClick={onCartClick}
              className="relative p-3 text-alchemy-cream hover:text-alchemy-gold hover:bg-white/10 rounded-full transition-all duration-200 backdrop-blur-sm border border-white/10"
            >
              <ShoppingCart className="h-6 w-6" />
              {cartItemsCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-alchemy-gold text-alchemy-night text-xs rounded-full h-5 w-5 flex items-center justify-center animate-bounce-gentle shadow-lg shadow-black/40">
                  {cartItemsCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
