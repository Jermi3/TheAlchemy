import { useState, useCallback } from 'react';
import { CartItem, MenuItem, Variation, AddOn } from '../types';
import { useSiteSettings } from './useSiteSettings';

export const useCart = () => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const { siteSettings } = useSiteSettings();

  const calculateItemPrice = (item: MenuItem, variation?: Variation, addOns?: AddOn[]) => {
    let price = item.basePrice;
    if (variation) {
      price += variation.price;
    }
    if (addOns) {
      addOns.forEach(addOn => {
        price += addOn.price;
      });
    }
    return price;
  };

  const addToCart = useCallback((item: MenuItem, quantity: number = 1, variation?: Variation, addOns?: AddOn[]) => {
    console.log('Adding to cart:', item.name, 'ID:', item.id, 'Base Price:', item.basePrice);
    const totalPrice = calculateItemPrice(item, variation, addOns);
    console.log('Calculated total price:', totalPrice);
    const cartLimit = siteSettings?.cart_item_limit || 50;
    
    // Group add-ons by ID and sum their quantities
    const groupedAddOns = addOns && addOns.length > 0 ? addOns.reduce((groups, addOn) => {
      const existing = groups.find(g => g.id === addOn.id);
      if (existing) {
        existing.quantity = (existing.quantity || 1) + 1;
      } else {
        groups.push({ ...addOn, quantity: 1 });
      }
      return groups;
    }, [] as (AddOn & { quantity: number })[]) : undefined;
    
    setCartItems(prev => {
      // Create a more reliable comparison key for finding existing items
      const createComparisonKey = (itemId: string, variationId?: string, addOns?: (AddOn & { quantity: number })[]) => {
        const addOnsKey = addOns?.map(a => `${a.id}:${a.quantity}`).sort().join(',') || 'none';
        return `${itemId}|${variationId || 'default'}|${addOnsKey}`;
      };
      
      const newItemKey = createComparisonKey(item.id, variation?.id, groupedAddOns);
      console.log('New item key:', newItemKey);
      
      const existingItem = prev.find(cartItem => {
        // Extract the base menu item ID from the cart item ID
        const cartItemBaseId = cartItem.id.split('-')[0];
        const existingKey = createComparisonKey(cartItemBaseId, cartItem.selectedVariation?.id, cartItem.selectedAddOns as (AddOn & { quantity: number })[],);
        console.log('Existing item:', cartItem.name, 'Key:', existingKey, 'Match:', existingKey === newItemKey);
        return existingKey === newItemKey;
      });
      
      // Check if adding this quantity would exceed the cart limit
      const currentTotal = prev.reduce((sum, cartItem) => sum + cartItem.quantity, 0);
      const newTotal = currentTotal + quantity;
      
      if (newTotal > cartLimit) {
        // Don't add if it would exceed the limit
        console.warn(`Cannot add ${quantity} items. Cart limit is ${cartLimit}, current total is ${currentTotal}`);
        return prev;
      }
      
      if (existingItem) {
        return prev.map(cartItem =>
          cartItem === existingItem
            ? { ...cartItem, quantity: cartItem.quantity + quantity }
            : cartItem
        );
      } else {
        // Generate a unique ID for this cart item
        const uniqueId = `${item.id}-${Date.now()}-${Math.random().toString(36).substring(2)}`;
        const newCartItem = { 
          ...item,
          id: uniqueId,
          quantity,
          selectedVariation: variation,
          selectedAddOns: groupedAddOns || [],
          totalPrice
        };
        return [...prev, newCartItem];
      }
    });
  }, [siteSettings?.cart_item_limit]);

  const updateQuantity = useCallback((id: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(id);
      return;
    }
    
    const cartLimit = siteSettings?.cart_item_limit || 50;
    
    setCartItems(prev => {
      // Check if updating this item would exceed the cart limit
      const currentTotal = prev.reduce((sum, item) => sum + item.quantity, 0);
      const currentItemQuantity = prev.find(item => item.id === id)?.quantity || 0;
      const newTotal = currentTotal - currentItemQuantity + quantity;
      
      if (newTotal > cartLimit) {
        console.warn(`Cannot update quantity to ${quantity}. Cart limit is ${cartLimit}, would result in ${newTotal} total items`);
        return prev;
      }
      
      return prev.map(item =>
        item.id === id ? { ...item, quantity } : item
      );
    });
  }, [siteSettings?.cart_item_limit]);

  const removeFromCart = useCallback((id: string) => {
    setCartItems(prev => prev.filter(item => item.id !== id));
  }, []);

  const clearCart = useCallback(() => {
    setCartItems([]);
  }, []);

  const getTotalPrice = useCallback(() => {
    return cartItems.reduce((total, item) => total + (item.totalPrice * item.quantity), 0);
  }, [cartItems]);

  const getTotalItems = useCallback(() => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  }, [cartItems]);

  const canAddToCart = useCallback((quantity: number = 1) => {
    const currentTotal = getTotalItems();
    const cartLimit = siteSettings?.cart_item_limit || 50;
    return (currentTotal + quantity) <= cartLimit;
  }, [getTotalItems, siteSettings?.cart_item_limit]);

  const getCartLimit = useCallback(() => {
    return siteSettings?.cart_item_limit || 50;
  }, [siteSettings?.cart_item_limit]);

  const openCart = useCallback(() => setIsCartOpen(true), []);
  const closeCart = useCallback(() => setIsCartOpen(false), []);

  return {
    cartItems,
    isCartOpen,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    getTotalPrice,
    getTotalItems,
    canAddToCart,
    getCartLimit,
    openCart,
    closeCart
  };
};