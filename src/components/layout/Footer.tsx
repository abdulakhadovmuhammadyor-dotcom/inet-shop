'use client';

import React from 'react';
import Link from 'next/link';
import { useStore } from '@/store/useStore';
import { getTranslation } from '@/lib/i18n';
import { Cpu, Phone, Send, MapPin, ShieldCheck, Clock } from 'lucide-react';

export const Footer: React.FC = () => {
  const { language } = useStore();

  return (
    <footer className="border-t border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-950 text-slate-600 dark:text-slate-400 mt-20 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand & Mission */}
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-purple-600 flex items-center justify-center text-white">
                <Cpu className="w-5 h-5" />
              </div>
              <span className="font-extrabold text-lg text-slate-900 dark:text-white tracking-wider">
                CYBER<span className="text-cyan-500">FORGE</span>
              </span>
            </div>
            <p className="text-xs leading-relaxed">
              {language === 'ru'
                ? 'Премиальный магазин компьютерных комплектующих и профессиональной сборки ПК в Узбекистане.'
                : "O'zbekistonda kompyuter ehtiyot qismlari va professional PK yig'ish bo'yicha yetakchi do'kon."}
            </p>
            <div className="flex items-center gap-2 text-xs text-cyan-600 dark:text-cyan-400">
              <ShieldCheck className="w-4 h-4" />
              <span>{language === 'ru' ? 'Гарантия до 3 лет на все комплектующие' : 'Barcha qismlarga 3 yilgacha rasmiy kafolat'}</span>
            </div>
          </div>

          {/* Quick Navigation */}
          <div>
            <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">
              {language === 'ru' ? 'Навигация' : 'Bo‘limlar'}
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/" className="hover:text-cyan-500 transition">
                  {getTranslation(language, 'navCatalog')}
                </Link>
              </li>
              <li>
                <Link href="/builder" className="hover:text-cyan-500 transition">
                  {getTranslation(language, 'navBuilder')}
                </Link>
              </li>
              <li>
                <Link href="/fps-calculator" className="hover:text-cyan-500 transition">
                  {getTranslation(language, 'navFps')}
                </Link>
              </li>
              <li>
                <Link href="/admin" className="hover:text-cyan-500 transition">
                  {getTranslation(language, 'navAdmin')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Contacts Tashkent */}
          <div>
            <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">
              {language === 'ru' ? 'Контакты' : 'Bog‘lanish'}
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-cyan-500 shrink-0 mt-0.5" />
                <span>г. Ташкент, ул. Навои, 18, ТЦ "Малика", Магазин А-12</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-cyan-500 shrink-0" />
                <a href="tel:+998901234567" className="hover:text-cyan-500">
                  +998 (90) 123-45-67
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Send className="w-4 h-4 text-cyan-500 shrink-0" />
                <a
                  href="https://t.me/cyberforge_pc"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-cyan-500"
                >
                  @cyberforge_pc (Telegram)
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-cyan-500 shrink-0" />
                <span>10:00 - 20:00 (Без выходных)</span>
              </li>
            </ul>
          </div>

          {/* Payment & Currency */}
          <div>
            <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">
              {language === 'ru' ? 'Оплата и чеки' : "To'lov va cheklar"}
            </h4>
            <p className="text-xs mb-3">
              {language === 'ru'
                ? 'Принимаем оплату в узбекских сумах (UZS) через Click Up, Payme, наличными, а также отправляем чек прямо в ваш Telegram бот.'
                : "To'lovlar O'zbekiston so'mida Click, Payme va naqd qabul qilinadi. Cheklar to'g'ridan-to'g'ri Telegramingizga yuboriladi."}
            </p>
            <div className="flex flex-wrap gap-2 text-xs font-semibold">
              <span className="px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-blue-500">
                Click Up
              </span>
              <span className="px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-emerald-500">
                Payme
              </span>
              <span className="px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-cyan-500">
                Telegram Bot
              </span>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-200 dark:border-slate-800/60 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© 2026 CYBERFORGE PC. Все права защищены. Ташкент, Узбекистан.</p>
          <p className="font-mono text-[11px]">Валюта: Узбекский сум (UZS)</p>
        </div>
      </div>
    </footer>
  );
};
