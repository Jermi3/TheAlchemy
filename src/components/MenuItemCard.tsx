import React, { useState } from 'react';
import { Plus, Minus, X, ShoppingCart } from 'lucide-react';
import { MenuItem, Variation, AddOn } from '../types';

interface MenuItemCardProps {
  item: MenuItem;
  onAddToCart: (item: MenuItem, quantity?: number, variation?: Variation, addOns?: AddOn[]) => void;
  quantity: number;
  onUpdateQuantity: (id: string, quantity: number) => void;
  canAddToCart: (quantity?: number) => boolean;
  cartItemId?: string; // The actual cart item ID for this base item
}

const MenuItemCard: React.FC<MenuItemCardProps> = ({ 
  item, 
  onAddToCart, 
  quantity, 
  onUpdateQuantity,
  canAddToCart,
  cartItemId
}) => {
  const [showCustomization, setShowCustomization] = useState(false);
  const [selectedVariation, setSelectedVariation] = useState<Variation | undefined>(
    item.variations?.[0]
  );
  const [selectedAddOns, setSelectedAddOns] = useState<(AddOn & { quantity: number })[]>([]);

  const calculatePrice = () => {
    // Use effective price (discounted or regular) as base
    let price = item.effectivePrice || item.basePrice;
    if (selectedVariation) {
      price = (item.effectivePrice || item.basePrice) + selectedVariation.price;
    }
    selectedAddOns.forEach(addOn => {
      price += addOn.price * addOn.quantity;
    });
    return price;
  };

  const handleAddToCart = () => {
    if (item.variations?.length || item.addOns?.length) {
      setShowCustomization(true);
    } else {
      onAddToCart(item, 1);
    }
  };

  const handleCustomizedAddToCart = () => {
    // Convert selectedAddOns to regular AddOn array (without quantity property for cart)
    const addOnsForCart: AddOn[] = selectedAddOns.map(addOn => ({
      id: addOn.id,
      name: addOn.name,
      price: addOn.price,
      category: addOn.category
    }));
    onAddToCart(item, 1, selectedVariation, addOnsForCart);
    setShowCustomization(false);
    setSelectedAddOns([]);
  };

  const handleIncrement = () => {
    if (canAddToCart(1)) {
      if (cartItemId) {
        onUpdateQuantity(cartItemId, quantity + 1);
      } else {
        onAddToCart(item, 1);
      }
    }
  };

  const handleDecrement = () => {
    if (quantity > 0 && cartItemId) {
      onUpdateQuantity(cartItemId, quantity - 1);
    }
  };

  const updateAddOnQuantity = (addOn: AddOn, quantity: number) => {
    setSelectedAddOns(prev => {
      const existingIndex = prev.findIndex(a => a.id === addOn.id);
      
      if (quantity === 0) {
        // Remove add-on if quantity is 0
        return prev.filter(a => a.id !== addOn.id);
      }
      
      if (existingIndex >= 0) {
        // Update existing add-on quantity
        const updated = [...prev];
        updated[existingIndex] = { ...updated[existingIndex], quantity };
        return updated;
      } else {
        // Add new add-on with quantity
        return [...prev, { ...addOn, quantity }];
      }
    });
  };

  const groupedAddOns = item.addOns?.reduce((groups, addOn) => {
    const category = addOn.category;
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(addOn);
    return groups;
  }, {} as Record<string, AddOn[]>);

  return (
    <>
      <div className={`alchemy-panel rounded-2xl border border-white/10 hover:border-alchemy-gold/40 transition-all duration-300 overflow-hidden group animate-scale-in ${!item.available ? 'opacity-50' : ''}`}>
        {/* Image Container with Badges */}
        <div className="relative h-48 bg-gradient-to-br from-alchemy-emberDeep/40 via-alchemy-ember/35 to-alchemy-night/30">
          {item.image ? (
            <img
              src={item.image}
              alt={item.name}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 mix-blend-screen"
              loading="lazy"
              decoding="async"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.nextElementSibling?.classList.remove('hidden');
              }}
            />
          ) : null}
          <div className={`absolute inset-0 flex items-center justify-center ${item.image ? 'hidden' : ''}`}>
            <div className="text-6xl opacity-20 text-alchemy-cream/40">⚗️</div>
          </div>
          
          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-2">
            {item.isOnDiscount && item.discountPrice !== undefined && item.discountPrice < item.basePrice && (
              <div className="bg-gradient-to-r from-alchemy-gold to-alchemy-copper text-alchemy-night text-xs font-bold px-3 py-1.5 rounded-full shadow-lg animate-pulse">
                SALE
              </div>
            )}
            {item.popular && (
              <div className="bg-white/10 text-alchemy-gold text-xs font-bold px-3 py-1.5 rounded-full shadow-lg border border-alchemy-gold/40">
                ⭐ POPULAR
              </div>
            )}
          </div>
          
          {!item.available && (
            <div className="absolute top-3 right-3 bg-alchemy-emberDeep text-alchemy-cream text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
              UNAVAILABLE
            </div>
          )}
          
          {/* Discount Percentage Badge */}
          {item.isOnDiscount && item.discountPrice !== undefined && item.basePrice > 0 && (
            <div className="absolute bottom-3 right-3 bg-alchemy-night/85 backdrop-blur-sm text-alchemy-gold text-xs font-bold px-2 py-1 rounded-full shadow-lg border border-white/10">
              {Math.round(((item.basePrice - item.discountPrice) / item.basePrice) * 100)}% OFF
            </div>
          )}
        </div>
        
        {/* Content */}
        <div className="p-5">
          <div className="flex items-start justify-between mb-3">
            <h4 className="text-lg font-semibold text-alchemy-cream leading-tight flex-1 pr-2 font-playfair tracking-wide">{item.name}</h4>
            {item.variations && item.variations.length > 0 && (
              <div className="text-xs text-alchemy-gold bg-white/10 px-2 py-1 rounded-full whitespace-nowrap border border-white/10">
                {item.variations.length} sizes
              </div>
            )}
          </div>
          
          <p className={`text-sm mb-4 leading-relaxed ${!item.available ? 'text-alchemy-cream/30' : 'text-alchemy-cream/70'}`}>
            {!item.available ? 'Currently Unavailable' : item.description}
          </p>
          
          {/* Pricing Section */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1">
              {item.isOnDiscount && item.discountPrice !== undefined ? (
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl font-bold text-alchemy-gold">
                      {item.discountPrice === 0 ? 'Free' : `₱${item.discountPrice.toFixed(2)}`}
                    </span>
                    <span className="text-sm text-alchemy-cream/50 line-through">
                      {item.basePrice === 0 ? 'Free' : `₱${item.basePrice.toFixed(2)}`}
                    </span>
                  </div>
                  {item.discountPrice > 0 && item.basePrice > 0 && (
                    <div className="text-xs text-alchemy-cream/60">
                      Save ₱{(item.basePrice - item.discountPrice).toFixed(2)}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-2xl font-bold text-alchemy-gold">
                  {item.basePrice === 0 ? 'Free' : `₱${item.basePrice.toFixed(2)}`}
                </div>
              )}
              
              {item.variations && item.variations.length > 0 && (
                <div className="text-xs text-alchemy-cream/60 mt-1">
                  Starting price
                </div>
              )}
            </div>
            
            {/* Action Buttons */}
            <div className="flex-shrink-0">
              {!item.available ? (
                <button
                  disabled
                  className="bg-white/10 text-alchemy-cream/40 px-4 py-2.5 rounded-xl cursor-not-allowed font-medium text-sm"
                >
                  Unavailable
                </button>
              ) : quantity === 0 ? (
                <button
                  onClick={handleAddToCart}
                  className="bg-gradient-to-r from-alchemy-gold via-alchemy-copper to-alchemy-gold text-alchemy-night px-6 py-2.5 rounded-xl hover:from-alchemy-copper hover:to-alchemy-gold transition-all duration-200 transform hover:scale-105 font-medium text-sm shadow-lg shadow-black/40 hover:shadow-xl"
                >
                  {item.variations?.length || item.addOns?.length ? 'Customize' : 'Add to Cart'}
                </button>
              ) : (
                <div className="flex items-center space-x-2 bg-white/5 rounded-xl p-1 border border-white/10">
                  <button
                    onClick={handleDecrement}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors duration-200 hover:scale-110 text-alchemy-cream"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="font-bold text-alchemy-gold min-w-[28px] text-center text-sm">{quantity}
                  </span>
                  <button
                    onClick={handleIncrement}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors duration-200 hover:scale-110 text-alchemy-cream"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Add-ons indicator */}
          {item.addOns && item.addOns.length > 0 && (
            <div className="flex items-center space-x-1 text-xs text-alchemy-cream/70 bg-white/5 px-2 py-1 rounded-lg border border-white/10">
              <span>+</span>
              <span>{item.addOns.length} add-on{item.addOns.length > 1 ? 's' : ''} available</span>
            </div>
          )}
        </div>
      </div>

      {/* Customization Modal */}
      {showCustomization && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-alchemy-dusk to-alchemy-night rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-[0_40px_80px_-40px_rgba(0,0,0,0.9)] border border-white/10">
            <div className="sticky top-0 bg-alchemy-night/80 border-b border-white/10 p-6 flex items-center justify-between rounded-t-2xl">
              <div>
                <h3 className="text-xl font-semibold text-alchemy-gold font-playfair tracking-wide">Customize {item.name}</h3>
                <p className="text-sm text-alchemy-cream/70 mt-1">Choose your preferences</p>
              </div>
              <button
                onClick={() => setShowCustomization(false)}
                className="p-2 hover:bg-white/10 rounded-full transition-colors duration-200 text-alchemy-cream"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 text-alchemy-cream">
              {/* Size Variations */}
              {item.variations && item.variations.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-semibold text-alchemy-gold mb-4">Choose Size</h4>
                  <div className="space-y-3">
                    {item.variations.map((variation) => (
                      <label
                        key={variation.id}
                        className={`flex items-center justify-between p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                          selectedVariation?.id === variation.id
                            ? 'border-alchemy-gold bg-alchemy-gold/10 shadow-lg shadow-black/30'
                            : 'border-white/10 hover:border-alchemy-gold/60 hover:bg-white/5'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <input
                            type="radio"
                            name="variation"
                            checked={selectedVariation?.id === variation.id}
                            onChange={() => setSelectedVariation(variation)}
                            className="text-alchemy-gold focus:ring-alchemy-gold"
                          />
                          <span className="font-medium text-alchemy-cream">{variation.name}</span>
                        </div>
                        <span className="text-alchemy-gold font-semibold">
                          {(() => {
                            const price = (item.effectivePrice || item.basePrice) + variation.price;
                            return price === 0 ? 'Free' : `₱${price.toFixed(2)}`;
                          })()}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Add-ons */}
              {groupedAddOns && Object.keys(groupedAddOns).length > 0 && (
                <div className="mb-6">
                  <h4 className="font-semibold text-alchemy-gold mb-4">Add-ons</h4>
                  {Object.entries(groupedAddOns).map(([category, addOns]) => (
                    <div key={category} className="mb-4">
                      <h5 className="text-sm font-medium text-alchemy-cream/80 mb-3 capitalize">
                        {category.replace('-', ' ')}
                      </h5>
                      <div className="space-y-3">
                        {addOns.map((addOn) => (
                          <div
                            key={addOn.id}
                            className="flex items-center justify-between p-4 border border-white/10 rounded-xl hover:border-alchemy-gold/60 hover:bg-white/5 transition-all duration-200"
                          >
                            <div className="flex-1">
                              <span className="font-medium text-alchemy-cream">{addOn.name}</span>
                              <div className="text-sm text-alchemy-cream/70">
                                {addOn.price > 0 ? `₱${addOn.price.toFixed(2)} each` : 'Free'}
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              {selectedAddOns.find(a => a.id === addOn.id) ? (
                                <div className="flex items-center space-x-2 bg-alchemy-gold/15 rounded-xl p-1 border border-alchemy-gold/50">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const current = selectedAddOns.find(a => a.id === addOn.id);
                                      updateAddOnQuantity(addOn, (current?.quantity || 1) - 1);
                                    }}
                                    className="p-1.5 hover:bg-alchemy-gold/25 rounded-lg transition-colors duration-200"
                                  >
                                    <Minus className="h-3 w-3 text-alchemy-night" />
                                  </button>
                                  <span className="font-semibold text-alchemy-cream min-w-[24px] text-center text-sm">
                                    {selectedAddOns.find(a => a.id === addOn.id)?.quantity || 0}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const current = selectedAddOns.find(a => a.id === addOn.id);
                                      updateAddOnQuantity(addOn, (current?.quantity || 0) + 1);
                                    }}
                                    className="p-1.5 hover:bg-alchemy-gold/25 rounded-lg transition-colors duration-200"
                                  >
                                    <Plus className="h-3 w-3 text-alchemy-night" />
                                  </button>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => updateAddOnQuantity(addOn, 1)}
                                  className="flex items-center space-x-1 px-4 py-2 bg-gradient-to-r from-alchemy-gold via-alchemy-copper to-alchemy-gold text-alchemy-night rounded-xl hover:from-alchemy-copper hover:to-alchemy-gold transition-all duration-200 text-sm font-medium shadow-lg shadow-black/30"
                                >
                                  <Plus className="h-3 w-3" />
                                  <span>Add</span>
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Price Summary */}
              <div className="border-t border-white/10 pt-4 mb-6">
                <div className="flex items-center justify-between text-2xl font-bold text-alchemy-gold">
                  <span>Total:</span>
                  <span className="text-alchemy-gold">
                    {calculatePrice() === 0 ? 'Free' : `₱${calculatePrice().toFixed(2)}`}
                  </span>
                </div>
              </div>

              <button
                onClick={handleCustomizedAddToCart}
                className="w-full bg-gradient-to-r from-alchemy-gold via-alchemy-copper to-alchemy-gold text-alchemy-night py-4 rounded-xl hover:from-alchemy-copper hover:to-alchemy-gold transition-all duration-200 font-semibold flex items-center justify-center space-x-2 shadow-lg shadow-black/30 hover:shadow-xl transform hover:scale-105"
              >
                <ShoppingCart className="h-5 w-5" />
                <span>
                  Add to Cart - {calculatePrice() === 0 ? 'Free' : `₱${calculatePrice().toFixed(2)}`}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default MenuItemCard;
