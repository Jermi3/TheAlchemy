import React from 'react';
import { MenuItem, CartItem } from '../types';
import { useCategories } from '../hooks/useCategories';
import MenuItemCard from './MenuItemCard';
import MobileNav from './MobileNav';

// Preload images for better performance
const preloadImages = (items: MenuItem[]) => {
  items.forEach(item => {
    if (item.image) {
      const img = new Image();
      img.src = item.image;
    }
  });
};

interface MenuProps {
  menuItems: MenuItem[];
  addToCart: (item: MenuItem, quantity?: number, variation?: any, addOns?: any[]) => void;
  cartItems: CartItem[];
  updateQuantity: (id: string, quantity: number) => void;
  canAddToCart: (quantity?: number) => boolean;
  onTrackOrder?: () => void;
}

const Menu: React.FC<MenuProps> = ({ menuItems, addToCart, cartItems, updateQuantity, canAddToCart, onTrackOrder }) => {
  const { categories } = useCategories();
  const [activeCategory, setActiveCategory] = React.useState('hot-coffee');

  // Preload images when menu items change
  React.useEffect(() => {
    if (menuItems.length > 0) {
      // Preload images for visible category first
      const visibleItems = menuItems.filter(item => item.category === activeCategory);
      preloadImages(visibleItems);
      
      // Then preload other images after a short delay
      setTimeout(() => {
        const otherItems = menuItems.filter(item => item.category !== activeCategory);
        preloadImages(otherItems);
      }, 1000);
    }
  }, [menuItems, activeCategory]);

  const handleCategoryClick = (categoryId: string) => {
    setActiveCategory(categoryId);
    const element = document.getElementById(categoryId);
    if (element) {
      const headerHeight = 64; // Header height
      const mobileNavHeight = 60; // Mobile nav height
      const offset = headerHeight + mobileNavHeight + 20; // Extra padding
      const elementPosition = element.offsetTop - offset;
      
      window.scrollTo({
        top: elementPosition,
        behavior: 'smooth'
      });
    }
  };

  React.useEffect(() => {
    if (categories.length > 0) {
      // Set default to dim-sum if it exists, otherwise first category
      const defaultCategory = categories.find(cat => cat.id === 'dim-sum') || categories[0];
      if (!categories.find(cat => cat.id === activeCategory)) {
        setActiveCategory(defaultCategory.id);
      }
    }
  }, [categories, activeCategory]);

  React.useEffect(() => {
    const handleScroll = () => {
      const sections = categories.map(cat => document.getElementById(cat.id)).filter(Boolean);
      const scrollPosition = window.scrollY + 200;

      for (let i = sections.length - 1; i >= 0; i--) {
        const section = sections[i];
        if (section && section.offsetTop <= scrollPosition) {
          setActiveCategory(categories[i].id);
          break;
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);


  return (
    <>
      <MobileNav 
        activeCategory={activeCategory}
        onCategoryClick={handleCategoryClick}
        onTrackOrder={onTrackOrder}
      />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 text-alchemy-cream">
      <div className="text-center mb-12">
        <h2 className="text-4xl md:text-5xl font-playfair font-semibold text-alchemy-cream mb-5 tracking-wide">Signature Libations</h2>
        <p className="text-alchemy-cream/70 max-w-2xl mx-auto leading-relaxed">
          Elixirs, infusions, and elevated bites crafted for twilight conversations. Sip through layered cocktails,
          smoky signatures, and unexpected pairings designed by The Alchemy bar team.
        </p>
      </div>

      {categories.map((category) => {
        const categoryItems = menuItems.filter(item => item.category === category.id);
        
        if (categoryItems.length === 0) return null;
        
        return (
          <section key={category.id} id={category.id} className="mb-16">
            <div className="flex items-center mb-8">
              <span className="text-3xl mr-4 text-alchemy-gold">{category.icon}</span>
              <h3 className="text-3xl font-playfair font-medium text-alchemy-cream tracking-wide uppercase">
                {category.name}
              </h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
              {categoryItems.map((item) => {
                // Find cart item that matches the base item (without variations/add-ons)
                // We need to find cart items that have the same base menu item ID and no variations/add-ons
                const baseCartItem = cartItems.find(cartItem => {
                  // Extract the base menu item ID from the cart item ID
                  const baseId = cartItem.id.split('-')[0];
                  return baseId === item.id && 
                         !cartItem.selectedVariation && 
                         (!cartItem.selectedAddOns || cartItem.selectedAddOns.length === 0);
                });
                
                return (
                  <MenuItemCard
                    key={item.id}
                    item={item}
                    onAddToCart={addToCart}
                    quantity={baseCartItem?.quantity || 0}
                    onUpdateQuantity={updateQuantity}
                    canAddToCart={canAddToCart}
                    cartItemId={baseCartItem?.id}
                  />
                );
              })}
            </div>
          </section>
        );
      })}
      </main>
    </>
  );
};

export default Menu;
