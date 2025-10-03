import React from 'react';
import { ShoppingCart } from 'lucide-react';

interface FloatingCartButtonProps {
  itemCount: number;
  onCartClick: () => void;
}

const FloatingCartButton: React.FC<FloatingCartButtonProps> = ({ itemCount, onCartClick }) => {
  if (itemCount === 0) return null;

  return (
    <button
      onClick={onCartClick}
      className="fixed bottom-6 right-6 bg-gradient-to-r from-alchemy-gold via-alchemy-copper to-alchemy-gold text-alchemy-night p-4 rounded-full shadow-xl shadow-black/50 hover:from-alchemy-copper hover:to-alchemy-gold transition-all duration-200 transform hover:scale-110 z-40 md:hidden"
    >
      <div className="relative">
        <ShoppingCart className="h-6 w-6" />
        <span className="absolute -top-2 -right-2 bg-alchemy-night text-alchemy-gold text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium border border-alchemy-gold/60">
          {itemCount}
        </span>
      </div>
    </button>
  );
};

export default FloatingCartButton;
