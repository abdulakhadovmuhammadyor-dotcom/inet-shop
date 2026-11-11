'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useStore } from '@/store/useStore';
import { getTranslation } from '@/lib/i18n';
import {
  Cpu,
  Monitor,
  ShoppingBag,
  Moon,
  Sun,
  Globe,
  Gauge,
  Lock,
  Menu,
  X,
} from 'lucide-react';

interface NavbarProps {
  onOpenCart: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenCart }) => {
  const pathname = usePathname();
  const { language, setLanguage, theme, toggleTheme, cart } = useStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const totalCartItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  const navLinks = [
    { href: '/', labelKey: 'navCatalog' as const, icon: ShoppingBag },
    { href: '/builder', labelKey: 'navBuilder' as const, icon: Cpu },
    { href: '/fps-calculator', labelKey: 'navFps' as const, icon: Gauge },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 dark:border-slate-800/80 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <span className="font-extrabold text-lg sm:text-xl tracking-wider text-slate-900 dark:text-white flex items-center gap-1">
              CYBER<span className="text-cyan-500">FORGE</span>
            </span>
            <span className="hidden sm:block text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-widest font-semibold">
              Tashkent PC Custom
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1 lg:gap-2">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3.5 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all ${
                  isActive
                    ? 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
                }`}
              >
                <Icon className="w-4 h-4" />
                {getTranslation(language, link.labelKey)}
              </Link>
            );
          })}
        </nav>

        {/* Right Action Icons: Language, Theme, Cart, Hidden Admin */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Language Switcher */}
          <div className="flex items-center rounded-xl bg-slate-100 dark:bg-slate-900 p-0.5 border border-slate-200 dark:border-slate-800 text-xs font-semibold">
            <button
              onClick={() => setLanguage('ru')}
              className={`px-2 py-1 rounded-lg transition ${
                language === 'ru'
                  ? 'bg-white dark:bg-slate-800 text-cyan-600 dark:text-cyan-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              RU
            </button>
            <button
              onClick={() => setLanguage('uz')}
              className={`px-2 py-1 rounded-lg transition ${
                language === 'uz'
                  ? 'bg-white dark:bg-slate-800 text-cyan-600 dark:text-cyan-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              UZ
            </button>
          </div>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:text-cyan-500 dark:hover:text-cyan-400 border border-slate-200 dark:border-slate-800 transition"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Cart Button */}
          <button
            onClick={onOpenCart}
            className="relative px-3 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm flex items-center gap-2 shadow-lg shadow-cyan-500/25 transition active:scale-95"
          >
            <ShoppingBag className="w-4 h-4" />
            <span className="hidden sm:inline">{getTranslation(language, 'navCart')}</span>
            {totalCartItems > 0 && (
              <span className="w-5 h-5 rounded-full bg-slate-950 text-cyan-400 text-xs flex items-center justify-center font-extrabold">
                {totalCartItems}
              </span>
            )}
          </button>

          {/* Discreet Hidden Admin Portal Link */}
          <Link
            href="/admin"
            title="Админ-панель управления (/admin)"
            className="p-2 rounded-xl text-slate-400 dark:text-slate-600 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900 transition"
          >
            <Lock className="w-3.5 h-3.5 opacity-60 hover:opacity-100" />
          </Link>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-slate-600 dark:text-slate-300 hover:text-white"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 pt-2 pb-4 space-y-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-base font-semibold ${
                  isActive
                    ? 'bg-cyan-500/10 text-cyan-500'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900'
                }`}
              >
                <Icon className="w-5 h-5" />
                {getTranslation(language, link.labelKey)}
              </Link>
            );
          })}
        </div>
      )}
    </header>
  );
};
