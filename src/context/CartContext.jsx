import React, { createContext, useState, useEffect, useContext } from 'react';
import { getProductCategorySnapshot } from '../utils/orderRouting';

const CART_STORAGE_KEY = 'eye_web_cart';

function normalizeStoredCartItems(items) {
  if (!Array.isArray(items)) return [];

  return items.map((item) => ({
    ...item,
    categoryName: item.categoryName || getProductCategorySnapshot(item.product),
  }));
}

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState(() => {
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      return stored ? normalizeStoredCartItems(JSON.parse(stored)) : [];
    } catch (e) {
      return [];
    }
  });

  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
  }, [cartItems]);

  const addToCart = (product, selectedColor, selectedLens, quantity = 1) => {
    setCartItems(prev => {
      // Check if exact same product + options already exists
      const existingIndex = prev.findIndex(item => 
        item.product.id === product.id && 
        item.selectedColor === selectedColor && 
        (item.selectedLens?.id === selectedLens?.id)
      );

      if (existingIndex >= 0) {
        const newCart = [...prev];
        newCart[existingIndex].quantity += quantity;
        return newCart;
      }

      // Generate a unique ID for the cart item
      const cartItemId = `${product.id}-${selectedColor || 'none'}-${selectedLens?.id || 'none'}-${Date.now()}`;

      return [...prev, {
        id: cartItemId,
        product,
        categoryName: getProductCategorySnapshot(product),
        selectedColor,
        selectedLens,
        quantity
      }];
    });
    
    setIsCartOpen(true); // Auto open cart on add
  };

  const removeFromCart = (cartItemId) => {
    setCartItems(prev => prev.filter(item => item.id !== cartItemId));
  };

  const updateQuantity = (cartItemId, newQuantity) => {
    if (newQuantity < 1) return;
    setCartItems(prev => prev.map(item => 
      item.id === cartItemId ? { ...item, quantity: newQuantity } : item
    ));
  };

  const clearCart = () => {
    setCartItems([]);
  };

  return (
    <CartContext.Provider value={{
      cartItems,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      isCartOpen,
      setIsCartOpen
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
