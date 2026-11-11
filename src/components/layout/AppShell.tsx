'use client';

import React, { useState, useEffect } from 'react';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { CartDrawer } from '@/components/cart/CartDrawer';
import { OrderModal } from '@/components/cart/OrderModal';
import { useStore } from '@/store/useStore';

export const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const {
    theme,
    isCartOpen,
    openCart,
    closeCart,
    isOrderModalOpen,
    openOrderModal,
    closeOrderModal,
  } = useStore();

  // Synchronize dark mode class on <html>
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Check query params e.g. ?openCart=true
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('openCart') === 'true') {
        openCart();
      }
    }
  }, [openCart]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      <Navbar onOpenCart={openCart} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      <Footer />

      {/* Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={closeCart}
        onCheckout={openOrderModal}
      />

      {/* Order & Telegram Receipt Modal */}
      <OrderModal
        isOpen={isOrderModalOpen}
        onClose={closeOrderModal}
      />
    </div>
  );
};
