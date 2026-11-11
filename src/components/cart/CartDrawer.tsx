'use client';

import React from 'react';
import { useStore } from '@/store/useStore';
import { formatPriceUZS } from '@/lib/format';
import { getTranslation } from '@/lib/i18n';
import { ShoppingBag, Trash2, X, Plus, Minus, ArrowRight } from 'lucide-react';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onCheckout: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  onCheckout,
}) => {
  const { language, cart, removeFromCart, updateQuantity, clearCart } = useStore();

  if (!isOpen) return null;

  const totalUZS = cart.reduce(
    (sum, item) => sum + item.product.priceUZS * item.quantity,
    0
  );

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 h-full flex flex-col shadow-2xl">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-cyan-500" />
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
              {getTranslation(language, 'cartTitle')} ({cart.length})
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cart Item List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 space-y-3">
              <ShoppingBag className="w-12 h-12 opacity-30" />
              <p className="text-sm font-medium">
                {getTranslation(language, 'cartEmpty')}
              </p>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item.product.id}
                className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 flex gap-3 items-center"
              >
                <img
                  src={item.product.image}
                  alt={item.product.name}
                  className="w-14 h-14 rounded-xl object-cover bg-slate-800 shrink-0"
                />

                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1">
                    {item.product.name}
                  </h4>
                  {item.buildSummary && (
                    <span className="text-[10px] text-cyan-500 font-medium block">
                      {item.buildSummary}
                    </span>
                  )}
                  <span className="text-xs font-bold text-cyan-600 dark:text-cyan-400 block mt-0.5">
                    {formatPriceUZS(item.product.priceUZS, language)}
                  </span>
                </div>

                {/* Quantity Controls */}
                <div className="flex items-center gap-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg p-0.5">
                  <button
                    onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                    className="p-1 hover:text-cyan-500"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="text-xs font-bold px-1.5">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                    className="p-1 hover:text-cyan-500"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>

                <button
                  onClick={() => removeFromCart(item.product.id)}
                  className="p-1.5 text-slate-400 hover:text-red-500 transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {cart.length > 0 && (
          <div className="p-5 border-t border-slate-200 dark:border-slate-800 space-y-4 bg-slate-50/50 dark:bg-slate-950/50">
            <div className="flex items-baseline justify-between">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {getTranslation(language, 'cartTotal')}
              </span>
              <span className="text-xl font-black text-cyan-600 dark:text-cyan-400">
                {formatPriceUZS(totalUZS, language)}
              </span>
            </div>

            <button
              onClick={() => {
                onClose();
                onCheckout();
              }}
              className="w-full py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/25 transition active:scale-95"
            >
              <span>{getTranslation(language, 'checkoutButton')}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
