'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useStore } from '@/store/useStore';
import { ComponentCategory, Product } from '@/types';
import { INITIAL_PRODUCTS } from '@/data/products';
import { ProductCard } from '@/components/catalog/ProductCard';
import { getTranslation } from '@/lib/i18n';
import {
  Cpu,
  Search,
  SlidersHorizontal,
  Wrench,
  Gauge,
  Send,
  ShieldCheck,
  Truck,
  Sparkles,
  ArrowRight,
} from 'lucide-react';

const CATEGORIES: { key: ComponentCategory | 'all'; labelKey: string }[] = [
  { key: 'all', labelKey: 'cat_all' },
  { key: 'cpu', labelKey: 'cat_cpu' },
  { key: 'gpu', labelKey: 'cat_gpu' },
  { key: 'motherboard', labelKey: 'cat_motherboard' },
  { key: 'ram', labelKey: 'cat_ram' },
  { key: 'storage', labelKey: 'cat_storage' },
  { key: 'psu', labelKey: 'cat_psu' },
  { key: 'case', labelKey: 'cat_case' },
  { key: 'cooler', labelKey: 'cat_cooler' },
];

export default function HomePage() {
  const { language } = useStore();
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [selectedCategory, setSelectedCategory] = useState<ComponentCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('all');
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc'>('featured');

  // Load from API
  useEffect(() => {
    fetch('/api/products')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.products) {
          setProducts(data.products);
        }
      })
      .catch(() => {});
  }, []);

  // Filter products
  const brands = ['all', ...Array.from(new Set(products.map((p) => p.brand)))];

  const filteredProducts = products
    .filter((p) => {
      const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
      const matchesSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.specs.socket && p.specs.socket.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesBrand = selectedBrand === 'all' || p.brand === selectedBrand;
      return matchesCategory && matchesSearch && matchesBrand;
    })
    .sort((a, b) => {
      if (sortBy === 'price-asc') return a.priceUZS - b.priceUZS;
      if (sortBy === 'price-desc') return b.priceUZS - a.priceUZS;
      return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
    });

  return (
    <div className="space-y-12">
      {/* Hero Banner */}
      <section className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border border-slate-800 p-8 sm:p-12 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-2xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-bold tracking-wider uppercase">
            <Sparkles className="w-4 h-4" />
            <span>Новое поколение ПК в Узбекистане</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
            Собери ПК мечты с{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">
              живой визуализацией
            </span>{' '}
            и расчетом FPS
          </h1>

          <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
            {language === 'ru'
              ? 'Топовые комплектующие от мировых брендов, интерактивный конфигуратор совместимости и моментальный расчет частоты кадров в 20 самых тяжелых играх. Официальные фискальные чеки в Telegram бот.'
              : "Dunyo brendlarining eng so'nggi kompyuter qismlari, interaktiv moslik konstruktori va 20 ta eng og'ir o'yinda FPS hisoblash. Telegram orqali rasmiy cheklar."}
          </p>

          <div className="flex flex-wrap gap-3 pt-2">
            <Link
              href="/builder"
              className="px-6 py-3 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-sm flex items-center gap-2 shadow-xl shadow-cyan-500/25 transition active:scale-95"
            >
              <Wrench className="w-4 h-4" />
              <span>{getTranslation(language, 'navBuilder')}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/fps-calculator"
              className="px-6 py-3 rounded-2xl bg-slate-800/80 hover:bg-slate-700 text-white font-bold text-sm border border-slate-700 flex items-center gap-2 transition active:scale-95"
            >
              <Gauge className="w-4 h-4 text-purple-400" />
              <span>{getTranslation(language, 'navFps')}</span>
            </Link>
          </div>
        </div>

        {/* Feature Badges Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-10 pt-8 border-t border-slate-800/80 text-xs text-slate-300">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-cyan-400 shrink-0" />
            <span>Официальная гарантия до 36 мес</span>
          </div>
          <div className="flex items-center gap-2.5">
            <Send className="w-5 h-5 text-purple-400 shrink-0" />
            <span>Чек и заказ в Telegram бот</span>
          </div>
          <div className="flex items-center gap-2.5">
            <Truck className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>Быстрая доставка по Ташкенту</span>
          </div>
          <div className="flex items-center gap-2.5">
            <Cpu className="w-5 h-5 text-amber-400 shrink-0" />
            <span>100% проверка совместимости</span>
          </div>
        </div>
      </section>

      {/* Categories Horizontal Tabs */}
      <section className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              {language === 'ru' ? 'Каталог комплектующих' : 'Qismlar katalogi'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Найдено {filteredProducts.length} позиций в наличии в Ташкенте
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setSelectedCategory(cat.key)}
              className={`px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all ${
                selectedCategory === cat.key
                  ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/20'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-slate-400 dark:hover:border-slate-600'
              }`}
            >
              {getTranslation(language, cat.labelKey as any)}
            </button>
          ))}
        </div>

        {/* Search, Brand & Sort Toolbar */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Search bar */}
          <div className="relative w-full md:max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder={getTranslation(language, 'searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto">
            {/* Brand Filter */}
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400 font-medium hidden sm:inline">Бренд:</span>
              <select
                value={selectedBrand}
                onChange={(e) => setSelectedBrand(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none"
              >
                {brands.map((b) => (
                  <option key={b} value={b}>
                    {b === 'all' ? 'Все бренды' : b}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400 font-medium hidden sm:inline">Цена:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none"
              >
                <option value="featured">По популярности</option>
                <option value="price-asc">Сначала дешевле</option>
                <option value="price-desc">Сначала дороже</option>
              </select>
            </div>
          </div>
        </div>

        {/* Product Cards Grid */}
        {filteredProducts.length === 0 ? (
          <div className="py-16 text-center space-y-3 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
            <Cpu className="w-12 h-12 text-slate-400 mx-auto opacity-30" />
            <p className="text-sm font-semibold text-slate-500">
              {getTranslation(language, 'noProductsFound')}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
