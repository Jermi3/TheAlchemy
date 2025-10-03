import React from 'react';
import { Trash2, Plus, Minus, ArrowLeft, AlertCircle } from 'lucide-react';
import { CartItem } from '../types';
import { useSiteSettings } from '../hooks/useSiteSettings';

interface CartProps {
  cartItems: CartItem[];
  updateQuantity: (id: string, quantity: number) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
  getTotalPrice: () => number;
  onContinueShopping: () => void;
  onCheckout: () => void;
}

const Cart: React.FC<CartProps> = ({
  cartItems,
  updateQuantity,
  removeFromCart,
  clearCart,
  getTotalPrice,
  onContinueShopping,
  onCheckout
}) => {
  const { siteSettings } = useSiteSettings();
  
  // Calculate total items in cart
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const cartLimit = siteSettings?.cart_item_limit || 50;
  const isOverLimit = totalItems > cartLimit;
  if (cartItems.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-alchemy-cream">
        <div className="text-center py-16 alchemy-panel rounded-3xl border border-white/10">
          <div className="text-6xl mb-4 text-alchemy-gold">☾</div>
          <h2 className="text-2xl font-playfair font-medium text-alchemy-cream mb-2">Your cart is empty</h2>
          <p className="text-alchemy-cream/70 mb-6">Add some delicious items to get started!</p>
          <button
            onClick={onContinueShopping}
            className="bg-gradient-to-r from-alchemy-gold via-alchemy-copper to-alchemy-gold text-alchemy-night px-8 py-3 rounded-full hover:from-alchemy-copper hover:to-alchemy-gold transition-all duration-200 shadow-lg shadow-black/40"
          >
            Browse Menu
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 text-alchemy-cream">
      <div className="flex items-center justify-between mb-8">
        <button
          onClick={onContinueShopping}
          className="flex items-center space-x-2 text-alchemy-cream/70 hover:text-alchemy-gold transition-colors duration-200"
        >
          <ArrowLeft className="h-5 w-5" />
          <span>Continue Shopping</span>
        </button>
        <h1 className="text-3xl font-playfair font-semibold text-alchemy-gold tracking-wide">Your Cart</h1>
        <button
          onClick={clearCart}
          className="text-alchemy-cream/60 hover:text-alchemy-gold transition-colors duration-200"
        >
          Clear All
        </button>
      </div>

      <div className="alchemy-panel rounded-2xl overflow-hidden mb-8 border border-white/10">
        {cartItems.map((item, index) => (
          <div key={item.id} className={`p-6 ${index !== cartItems.length - 1 ? 'border-b border-white/10' : ''}`}>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h3 className="text-lg font-playfair font-medium text-alchemy-cream mb-1 tracking-wide">{item.name}</h3>
                {item.selectedVariation && (
                  <p className="text-sm text-alchemy-cream/60 mb-1">Size: {item.selectedVariation.name}</p>
                )}
                {item.selectedAddOns && item.selectedAddOns.length > 0 && (
                  <p className="text-sm text-alchemy-cream/60 mb-1">
                    Add-ons: {item.selectedAddOns.map(addOn => 
                      addOn.quantity && addOn.quantity > 1 
                        ? `${addOn.name} x${addOn.quantity}`
                        : addOn.name
                    ).join(', ')}
                  </p>
                )}
                <p className="text-lg font-semibold text-alchemy-gold">₱{item.totalPrice} each</p>
              </div>
              
              <div className="flex items-center space-x-4 ml-4">
                <div className="flex items-center space-x-3 bg-white/5 rounded-full p-1 border border-white/10">
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    className="p-2 hover:bg-white/10 rounded-full transition-colors duration-200"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="font-semibold text-alchemy-gold min-w-[32px] text-center">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    className="p-2 hover:bg-white/10 rounded-full transition-colors duration-200"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                
                <div className="text-right">
                  <p className="text-lg font-semibold text-alchemy-gold">₱{item.totalPrice * item.quantity}</p>
                </div>
                
                <button
                  onClick={() => removeFromCart(item.id)}
                  className="p-2 text-alchemy-cream/60 hover:text-alchemy-gold hover:bg-white/10 rounded-full transition-all duration-200"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="alchemy-panel rounded-2xl p-6 border border-white/10">
        {/* Cart Limit Warning */}
        {isOverLimit && (
          <div className="mb-4 bg-red-500/10 border border-red-500/40 text-red-200 px-4 py-3 rounded-xl flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <div>
              <div className="font-semibold">Cart Limit Exceeded</div>
              <div className="text-xs text-red-100/80">
                You have {totalItems} items in your cart, but the limit is {cartLimit}. Please remove some items to proceed.
              </div>
            </div>
          </div>
        )}

        {/* Cart Summary */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-sm text-alchemy-cream/70 mb-2">
            <span>Items: {totalItems} / {cartLimit}</span>
            <span>{((totalItems / cartLimit) * 100).toFixed(0)}% of limit</span>
          </div>
          <div className="w-full bg-white/10 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${
                isOverLimit 
                  ? 'bg-red-500' 
                  : totalItems / cartLimit > 0.8 
                    ? 'bg-yellow-500' 
                    : 'bg-alchemy-gold'
              }`}
              style={{ width: `${Math.min((totalItems / cartLimit) * 100, 100)}%` }}
            />
          </div>
        </div>

        <div className="flex items-center justify-between text-2xl font-playfair font-semibold text-alchemy-gold mb-6">
          <span>Total:</span>
          <span>₱{parseFloat(getTotalPrice() || 0).toFixed(2)}</span>
        </div>
        
        <button
          onClick={onCheckout}
          disabled={isOverLimit}
          className={`w-full py-4 rounded-xl font-medium text-lg transition-all duration-200 transform shadow-lg shadow-black/40 ${
            isOverLimit
              ? 'bg-white/10 text-alchemy-cream/40 cursor-not-allowed'
              : 'bg-gradient-to-r from-alchemy-gold via-alchemy-copper to-alchemy-gold text-alchemy-night hover:from-alchemy-copper hover:to-alchemy-gold hover:scale-[1.02]'
          }`}
        >
          {isOverLimit ? 'Cart Limit Exceeded' : 'Proceed to Checkout'}
        </button>
      </div>
    </div>
  );
};

export default Cart;
