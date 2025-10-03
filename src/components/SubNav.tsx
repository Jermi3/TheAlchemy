import React from 'react';
import { useCategories } from '../hooks/useCategories';

interface SubNavProps {
  selectedCategory: string;
  onCategoryClick: (categoryId: string) => void;
}

const SubNav: React.FC<SubNavProps> = ({ selectedCategory, onCategoryClick }) => {
  const { categories, loading } = useCategories();

  return (
    <div className="sticky top-20 z-40 bg-gradient-to-r from-alchemy-dusk/85 via-alchemy-emberDeep/65 to-alchemy-night/80 backdrop-blur-xl border-b border-white/10 shadow-[0_10px_20px_-18px_rgba(0,0,0,0.9)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center space-x-4 overflow-x-auto py-3 scrollbar-hide">
          {loading ? (
            <div className="flex space-x-4">
              {[1,2,3,4,5].map(i => (
                <div key={i} className="h-8 w-20 bg-white/10 rounded animate-pulse" />
              ))}
            </div>
          ) : (
            <>
              <button
                onClick={() => onCategoryClick('all')}
                className={`px-4 py-1.5 rounded-full text-sm tracking-wide transition-colors duration-200 border ${
                  selectedCategory === 'all'
                    ? 'bg-alchemy-gold text-alchemy-night border-alchemy-gold shadow-lg shadow-black/40'
                    : 'bg-transparent text-alchemy-cream border-white/15 hover:border-alchemy-gold/70'
                }`}
              >
                All
              </button>
              {categories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => onCategoryClick(c.id)}
                  className={`px-4 py-1.5 rounded-full text-sm transition-colors duration-200 border flex items-center space-x-2 ${
                    selectedCategory === c.id
                      ? 'bg-alchemy-gold text-alchemy-night border-alchemy-gold shadow-lg shadow-black/40'
                      : 'bg-transparent text-alchemy-cream border-white/15 hover:border-alchemy-gold/70'
                  }`}
                >
                  <span className="text-lg">{c.icon}</span>
                  <span className="whitespace-nowrap tracking-wide">{c.name}</span>
                </button>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SubNav;

