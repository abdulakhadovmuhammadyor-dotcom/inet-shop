'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Product } from '@/types';
import { useStore } from '@/store/useStore';
import { formatPriceUZS } from '@/lib/format';
import { getTranslation } from '@/lib/i18n';
import { ShoppingBag, Wrench, Check, Info, Box } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const router = useRouter();
  const { language, addToCart, setBuilderPart } = useStore();
  const [justAdded, setJustAdded] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const handleAddToCart = () => {
    addToCart(product, 1);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1500);
  };

  const handleAddToBuild = () => {
    setBuilderPart(product.category, product);
    router.push('/builder');
  };

  const description = language === 'uz' ? product.descriptionUz : product.descriptionRu;

  return (
    <div className="group relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm hover:shadow-xl hover:border-cyan-500/50 transition-all duration-300 flex flex-col justify-between">
      <div>
        {/* Top badges: Category & Stock */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
            {product.category}
          </span>
          {product.inStock ? (
            <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {getTranslation(language, 'inStock')} ({product.stockCount})
            </span>
          ) : (
            <span className="text-[11px] font-medium text-amber-500">
              {getTranslation(language, 'outOfStock')}
            </span>
          )}
        </div>

        {/* Product Image */}
        <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-950 mb-3 group-hover:scale-[1.02] transition-transform duration-300">
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
          {product.featured && (
            <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-gradient-to-r from-cyan-500 to-purple-600 text-white text-[10px] font-extrabold uppercase tracking-wider shadow">
              ТОП
            </span>
          )}
          <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded-md bg-slate-900/80 backdrop-blur-md border border-cyan-500/40 text-cyan-400 text-[10px] font-extrabold flex items-center gap-1 shadow">
            <Box className="w-2.5 h-2.5" />
            3D
          </span>
        </div>

        {/* Brand & Name */}
        <div className="mb-2">
          <span className="text-xs font-semibold text-cyan-600 dark:text-cyan-400">
            {product.brand}
          </span>
          <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base line-clamp-2 mt-0.5">
            {product.name}
          </h3>
        </div>

        {/* Key Specs Pills */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {product.specs.socket && (
            <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono">
              Сокет: {product.specs.socket}
            </span>
          )}
          {product.specs.vramGB && (
            <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono">
              VRAM: {product.specs.vramGB} GB
            </span>
          )}
          {product.specs.ramType && (
            <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono">
              {product.specs.ramType}
            </span>
          )}
          {product.specs.tdpWatts && (
            <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono">
              TDP: {product.specs.tdpWatts}W
            </span>
          )}
          {product.specs.formFactor && (
            <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono">
              {product.specs.formFactor}
            </span>
          )}
          {product.specs.psuWattage && (
            <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono">
              {product.specs.psuWattage}W {product.specs.psuEfficiency}
            </span>
          )}
        </div>

        {/* Description snippet */}
        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-4">
          {description}
        </p>
      </div>

      {/* Price & Action Buttons */}
      <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80">
        <div className="mb-3">
          <span className="text-[11px] text-slate-400 font-medium block">
            Цена в Ташкенте:
          </span>
          <span className="text-lg font-black text-cyan-600 dark:text-cyan-400 tracking-tight">
            {formatPriceUZS(product.priceUZS, language)}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {/* Add to Cart */}
          <button
            onClick={handleAddToCart}
            className={`py-2 px-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition ${
              justAdded
                ? 'bg-emerald-500 text-white'
                : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200'
            }`}
          >
            {justAdded ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>{getTranslation(language, 'addedToCart')}</span>
              </>
            ) : (
              <>
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>{getTranslation(language, 'addToCart')}</span>
              </>
            )}
          </button>

          {/* Add to PC Builder */}
          <button
            onClick={handleAddToBuild}
            className="py-2 px-2.5 rounded-xl text-xs font-bold bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30 flex items-center justify-center gap-1.5 transition"
            title="Выбрать этот компонент для сборки в конфигураторе"
          >
            <Wrench className="w-3.5 h-3.5" />
            <span>В сборку</span>
          </button>
        </div>
      </div>
    </div>
  );
};
