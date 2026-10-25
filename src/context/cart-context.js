"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { DEFAULT_DELIVERY_FEE, DEFAULT_PLATFORM_FEE } from "@/lib/constants";
import { toast } from "sonner";

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);
  const [shop, setShop] = useState(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const savedCart = localStorage.getItem("campuseats_cart");
      if (savedCart) {
        const parsed = JSON.parse(savedCart);
        setItems(parsed.items || []);
        setShop(parsed.shop || null);
      }
    } catch {
      // ignore
    }
  }, []);

  const saveCart = (newItems, newShop) => {
    setItems(newItems);
    setShop(newShop);
    try {
      localStorage.setItem(
        "campuseats_cart",
        JSON.stringify({ items: newItems, shop: newShop })
      );
    } catch {
      // ignore
    }
  };

  const addItem = (menuItem, itemShop) => {
    // Single shop rule enforcement
    if (shop && shop.id !== itemShop.id && items.length > 0) {
      if (
        window.confirm(
          `Your cart contains food from "${shop.name}". Would you like to clear your current cart to order from "${itemShop.name}" instead?`
        )
      ) {
        const newItems = [{ item: menuItem, quantity: 1 }];
        saveCart(newItems, itemShop);
        toast.success(`Started new order from ${itemShop.name}`);
      }
      return;
    }

    const currentShop = shop || itemShop;
    const existingIndex = items.findIndex((i) => i.item.id === menuItem.id);

    let updatedItems;
    if (existingIndex > -1) {
      updatedItems = [...items];
      updatedItems[existingIndex].quantity += 1;
      toast.info(`Updated quantity for ${menuItem.name}`);
    } else {
      updatedItems = [...items, { item: menuItem, quantity: 1 }];
      toast.success(`Added ${menuItem.name} to cart`);
    }

    saveCart(updatedItems, currentShop);
  };

  const updateQuantity = (menuItemId, newQuantity) => {
    if (newQuantity <= 0) {
      removeItem(menuItemId);
      return;
    }

    const updatedItems = items.map((i) =>
      i.item.id === menuItemId ? { ...i, quantity: newQuantity } : i
    );
    saveCart(updatedItems, shop);
  };

  const removeItem = (menuItemId) => {
    const updatedItems = items.filter((i) => i.item.id !== menuItemId);
    const updatedShop = updatedItems.length === 0 ? null : shop;
    saveCart(updatedItems, updatedShop);
    toast.info("Item removed from cart");
  };

  const clearCart = () => {
    saveCart([], null);
  };

  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);
  const subtotal = items.reduce(
    (sum, i) => sum + (i.item.priceBDT || 0) * i.quantity,
    0
  );
  const deliveryFee = items.length > 0 ? DEFAULT_DELIVERY_FEE : 0;
  const platformFee = items.length > 0 ? DEFAULT_PLATFORM_FEE : 0;
  const total = subtotal + deliveryFee + platformFee;

  return (
    <CartContext.Provider
      value={{
        items,
        shop,
        itemCount,
        subtotal,
        deliveryFee,
        platformFee,
        total,
        addItem,
        updateQuantity,
        removeItem,
        clearCart,
        mounted,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
