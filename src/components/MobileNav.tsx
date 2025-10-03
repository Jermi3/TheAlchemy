import React from 'react';
import { useCategories } from '../hooks/useCategories';

interface MobileNavProps {
  activeCategory: string;
  onCategoryClick: (categoryId: string) => void;
  onTrackOrder?: () => void;
}

const MobileNav: React.FC<MobileNavProps> = ({ activeCategory, onCategoryClick, onTrackOrder }) => {
  const { categories } = useCategories();

  return (
    <div className="sticky top-20 z-40 bg-gradient-to-r from-alchemy-dusk/90 via-alchemy-emberDeep/75 to-alchemy-night/85 backdrop-blur-xl border-b border-white/10 md:hidden shadow-[0_10px_25px_-18px_rgba(0,0,0,0.9)]">
      <div className="flex overflow-x-auto scrollbar-hide px-4 py-3">
        {onTrackOrder && (
          <button
            onClick={onTrackOrder}
            className="flex-shrink-0 flex items-center space-x-2 px-4 py-2 rounded-full mr-3 transition-all duration-200 border border-white/15 bg-white/10 text-alchemy-night font-medium hover:border-alchemy-gold/60 hover:bg-alchemy-gold/80"
          >
            <span className="text-lg">🔍</span>
            <span className="text-sm font-medium whitespace-nowrap">Track Order</span>
          </button>
        )}
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => onCategoryClick(category.id)}
            className={`flex-shrink-0 flex items-center space-x-2 px-4 py-2 rounded-full mr-3 transition-all duration-200 border ${
              activeCategory === category.id
                ? 'bg-alchemy-gold text-alchemy-night border-alchemy-gold shadow-lg shadow-black/40'
                : 'bg-transparent text-alchemy-cream border-white/15 hover:border-alchemy-gold/70'
            }`}
          >
            <span className="text-lg">{category.icon}</span>
            <span className="text-sm font-medium whitespace-nowrap">{category.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default MobileNav;
