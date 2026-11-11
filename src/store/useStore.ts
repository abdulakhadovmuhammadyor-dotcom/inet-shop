'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { BuilderState, CartItem, ComponentCategory, Language, Product, Theme } from '@/types';

interface StoreState {
  // Theme & Language
  language: Language;
  theme: Theme;
  setLanguage: (lang: Language) => void;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;

  // Cart
  cart: CartItem[];
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  addCompleteBuildToCart: (builder: BuilderState) => void;

  // Cart & Order Drawer / Modal UI
  isCartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  isOrderModalOpen: boolean;
  openOrderModal: () => void;
  closeOrderModal: () => void;

  // PC Builder State
  builder: BuilderState;
  setBuilderPart: (category: ComponentCategory, product: Product | null) => void;
  loadBuilderState: (newState: BuilderState) => void;
  clearBuilder: () => void;

  // Builder Visualizer Settings
  visualizerMode: '2d' | '3d';
  setVisualizerMode: (mode: '2d' | '3d') => void;
  isExplodedView: boolean;
  toggleExplodedView: () => void;
  isAutoRotate: boolean;
  toggleAutoRotate: () => void;
  visualizerRgb: string;
  setVisualizerRgb: (color: string) => void;
  visualizerGlassOpen: boolean;
  toggleVisualizerGlass: () => void;
  visualizerView: 'inside' | 'outside';
  setVisualizerView: (view: 'inside' | 'outside') => void;
}

const initialBuilder: BuilderState = {
  cpu: null,
  gpu: null,
  motherboard: null,
  ram: null,
  storage: null,
  psu: null,
  case: null,
  cooler: null,
};

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      // Defaults
      language: 'ru',
      theme: 'dark',

      setLanguage: (language) => set({ language }),
      setTheme: (theme) => {
        set({ theme });
        if (typeof document !== 'undefined') {
          if (theme === 'dark') {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
        }
      },
      toggleTheme: () => {
        const next = get().theme === 'dark' ? 'light' : 'dark';
        get().setTheme(next);
      },

      // Cart
      cart: [],
      addToCart: (product, quantity = 1) => {
        const currentCart = get().cart;
        const existing = currentCart.find((item) => item.product.id === product.id);

        if (existing) {
          set({
            cart: currentCart.map((item) =>
              item.product.id === product.id
                ? { ...item, quantity: item.quantity + quantity }
                : item
            ),
          });
        } else {
          set({ cart: [...currentCart, { product, quantity }] });
        }
      },
      removeFromCart: (productId) => {
        set({
          cart: get().cart.filter((item) => item.product.id !== productId),
        });
      },
      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeFromCart(productId);
          return;
        }
        set({
          cart: get().cart.map((item) =>
            item.product.id === productId ? { ...item, quantity } : item
          ),
        });
      },
      clearCart: () => set({ cart: [] }),

      // UI Cart & Modal Controls
      isCartOpen: false,
      openCart: () => set({ isCartOpen: true }),
      closeCart: () => set({ isCartOpen: false }),
      isOrderModalOpen: false,
      openOrderModal: () => set({ isOrderModalOpen: true, isCartOpen: false }),
      closeOrderModal: () => set({ isOrderModalOpen: false }),

      addCompleteBuildToCart: (builderState) => {
        const itemsToAdd: CartItem[] = [];
        const categories: ComponentCategory[] = [
          'case',
          'motherboard',
          'cpu',
          'cooler',
          'ram',
          'gpu',
          'storage',
          'psu',
        ];

        categories.forEach((cat) => {
          const item = builderState[cat];
          if (item) {
            itemsToAdd.push({
              product: item,
              quantity: 1,
              isCustomBuild: true,
              buildSummary: `В составе кастомной сборки ПК (${cat.toUpperCase()})`,
            });
          }
        });

        if (itemsToAdd.length > 0) {
          const currentCart = get().cart;
          set({ cart: [...currentCart, ...itemsToAdd], isCartOpen: true });
        }
      },

      // Builder
      builder: initialBuilder,
      setBuilderPart: (category, product) => {
        set((state) => ({
          builder: {
            ...state.builder,
            [category]: product,
          },
        }));
      },
      loadBuilderState: (newState) => {
        set({ builder: { ...newState } });
      },
      clearBuilder: () => set({ builder: initialBuilder }),

      // Visualizer
      visualizerMode: '3d', // Default to 3D mode as requested
      setVisualizerMode: (mode) => set({ visualizerMode: mode }),
      isExplodedView: false,
      toggleExplodedView: () => set((state) => ({ isExplodedView: !state.isExplodedView })),
      isAutoRotate: true,
      toggleAutoRotate: () => set((state) => ({ isAutoRotate: !state.isAutoRotate })),
      visualizerRgb: '#00f0ff', // Cyber cyan
      setVisualizerRgb: (color) => set({ visualizerRgb: color }),
      visualizerGlassOpen: false,
      toggleVisualizerGlass: () =>
        set((state) => ({ visualizerGlassOpen: !state.visualizerGlassOpen })),
      visualizerView: 'inside',
      setVisualizerView: (view) => set({ visualizerView: view }),
    }),
    {
      name: 'cyberforge-storage',
      partialize: (state) => ({
        language: state.language,
        theme: state.theme,
        cart: state.cart,
        builder: state.builder,
        visualizerRgb: state.visualizerRgb,
      }),
    }
  )
);
