'use client';

import React, { useState } from 'react';
import { useStore } from '@/store/useStore';
import { ComponentCategory, Product } from '@/types';
import { INITIAL_PRODUCTS } from '@/data/products';
import { formatPriceUZS } from '@/lib/format';
import { getTranslation } from '@/lib/i18n';
import {
  calculateRecommendedPsu,
  calculateTotalTdp,
  checkCompatibility,
} from '@/lib/compatibility';
import {
  AUTO_BUILD_PRESETS,
  buildFromPreset,
  fixCompatibilityIssues,
  generateAutoBuildByBudget,
} from '@/lib/autoBuilder';
import {
  AlertTriangle,
  CheckCircle,
  Plus,
  Trash2,
  Cpu,
  Layers,
  HardDrive,
  Zap,
  Box,
  Fan,
  Gauge,
  ShoppingCart,
  RotateCcw,
  Sparkles,
  Wrench,
  Wand2,
  Sliders,
  Check,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface StepMeta {
  key: ComponentCategory;
  titleKey:
    | 'stepCase'
    | 'stepMb'
    | 'stepCpu'
    | 'stepCooler'
    | 'stepRam'
    | 'stepGpu'
    | 'stepStorage'
    | 'stepPsu';
  icon: React.ElementType;
}

const STEPS: StepMeta[] = [
  { key: 'case', titleKey: 'stepCase', icon: Box },
  { key: 'motherboard', titleKey: 'stepMb', icon: Layers },
  { key: 'cpu', titleKey: 'stepCpu', icon: Cpu },
  { key: 'cooler', titleKey: 'stepCooler', icon: Fan },
  { key: 'ram', titleKey: 'stepRam', icon: Layers },
  { key: 'gpu', titleKey: 'stepGpu', icon: Layers },
  { key: 'storage', titleKey: 'stepStorage', icon: HardDrive },
  { key: 'psu', titleKey: 'stepPsu', icon: Zap },
];

export const BuilderStepSelector: React.FC = () => {
  const router = useRouter();
  const {
    language,
    builder,
    setBuilderPart,
    loadBuilderState,
    clearBuilder,
    addCompleteBuildToCart,
    openCart,
  } = useStore();

  const [activeCategoryModal, setActiveCategoryModal] = useState<ComponentCategory | null>(null);
  const [showAutoBuildModal, setShowAutoBuildModal] = useState(false);
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [showEmptyWarning, setShowEmptyWarning] = useState(false);

  // Auto Build Budget Generator State
  const [customBudget, setCustomBudget] = useState(22000000);
  const [customPlatform, setCustomPlatform] = useState<'amd' | 'intel'>('amd');

  // Computations
  const issues = checkCompatibility(builder);
  const hasErrors = issues.some((i) => i.type === 'error');
  const totalTdp = calculateTotalTdp(builder);
  const recommendedPsu = calculateRecommendedPsu(builder);

  const totalPriceUZS = Object.values(builder).reduce(
    (sum, part) => sum + (part ? part.priceUZS : 0),
    0
  );

  const selectedCount = Object.values(builder).filter(Boolean).length;

  const handleBuyBuild = () => {
    if (selectedCount === 0) {
      setShowEmptyWarning(true);
      return;
    }

    if (hasErrors) {
      // Don't silently block! Show the conflict resolution dialog
      setShowConflictModal(true);
      return;
    }

    // All good -> Add to cart & immediately open Cart Drawer on the same page
    addCompleteBuildToCart(builder);
    openCart();
  };

  const handleForceBuyAnyway = () => {
    setShowConflictModal(false);
    addCompleteBuildToCart(builder);
    openCart();
  };

  const handleAutoFix = () => {
    const fixed = fixCompatibilityIssues(builder);
    loadBuilderState(fixed);
    setShowConflictModal(false);
  };

  const handleApplyPreset = (presetId: string) => {
    const state = buildFromPreset(presetId);
    loadBuilderState(state);
    setShowAutoBuildModal(false);
  };

  const handleApplyBudgetBuild = () => {
    const state = generateAutoBuildByBudget(customBudget, customPlatform);
    loadBuilderState(state);
    setShowAutoBuildModal(false);
  };

  const handleTestFps = () => {
    router.push('/fps-calculator');
  };

  // Products available for category picker modal
  const availableProducts = activeCategoryModal
    ? INITIAL_PRODUCTS.filter((p) => p.category === activeCategoryModal)
    : [];

  return (
    <div className="space-y-6">
      {/* Build Summary Header Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          {/* Price */}
          <div>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block">
              {getTranslation(language, 'totalBuildPrice')}
            </span>
            <span className="text-2xl font-black text-cyan-600 dark:text-cyan-400">
              {formatPriceUZS(totalPriceUZS, language)}
            </span>
            <span className="text-[11px] text-slate-400 block">
              Выбрано: {selectedCount} из 8 компонентов
            </span>
          </div>

          {/* Power & TDP */}
          <div>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block">
              {getTranslation(language, 'totalPowerDraw')}
            </span>
            <div className="flex items-center gap-2 mt-0.5">
              <Zap className="w-5 h-5 text-amber-500" />
              <span className="text-lg font-bold text-slate-800 dark:text-slate-200">
                ~{totalTdp} W
              </span>
            </div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              {getTranslation(language, 'recommendedPsu')} {recommendedPsu}W+
            </span>
          </div>

          {/* Compatibility Status Banner */}
          <div className="flex flex-col justify-center">
            {issues.length === 0 ? (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 flex items-center gap-2 text-xs font-semibold">
                <CheckCircle className="w-5 h-5 shrink-0" />
                <span>{getTranslation(language, 'compatibilityPassed')}</span>
              </div>
            ) : (
              <div
                onClick={() => setShowConflictModal(true)}
                className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 flex items-center justify-between gap-2 text-xs font-semibold cursor-pointer hover:bg-amber-500/20 transition"
                title="Нажмите, чтобы исправить несовместимости"
              >
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 shrink-0" />
                  <span>
                    {issues.length} {language === 'ru' ? 'проблемы с совместимостью' : 'moslik muammosi'}
                  </span>
                </div>
                <span className="text-[10px] underline">Исправить</span>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons Toolbar */}
        <div className="pt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {/* 1-CLICK AUTO-BUILD BUTTON */}
            <button
              onClick={() => setShowAutoBuildModal(true)}
              className="px-4 py-2.5 rounded-xl text-xs font-extrabold bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600 text-white shadow-lg shadow-cyan-500/20 hover:scale-105 transition-all flex items-center gap-2 active:scale-95"
            >
              <Wand2 className="w-4 h-4 text-cyan-200 animate-pulse" />
              <span>Автоматическая сборка ПК</span>
            </button>

            <button
              onClick={clearBuilder}
              className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-red-500 hover:bg-red-500/10 transition flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{getTranslation(language, 'clearBuild')}</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleTestFps}
              className="px-4 py-2.5 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-600/20 transition flex items-center gap-2"
            >
              <Gauge className="w-4 h-4" />
              <span>{getTranslation(language, 'testInFps')}</span>
            </button>

            {/* Buy Complete Build Button */}
            <button
              onClick={handleBuyBuild}
              className={`px-5 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-2 shadow-lg transition ${
                selectedCount > 0
                  ? hasErrors
                    ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20 active:scale-95'
                    : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-cyan-500/25 active:scale-95'
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-pointer hover:bg-slate-300 dark:hover:bg-slate-700'
              }`}
              title={
                hasErrors
                  ? 'Внимание: в сборке есть несовместимые детали. Нажмите, чтобы посмотреть или исправить.'
                  : selectedCount === 0
                  ? 'Выберите комплектующие или воспользуйтесь автоматической сборкой'
                  : 'Оформить заказ на выбранную сборку'
              }
            >
              <ShoppingCart className="w-4 h-4" />
              <span>
                {selectedCount === 0
                  ? 'Купить сборку (пусто)'
                  : hasErrors
                  ? 'Купить сборку (есть ошибки)'
                  : getTranslation(language, 'buyCompleteBuild')}
              </span>
            </button>
          </div>
        </div>

        {/* If issues exist, print detailed list */}
        {issues.length > 0 && (
          <div className="mt-4 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-amber-500 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" />
                {getTranslation(language, 'compatibilityWarning')}
              </h4>
              <button
                onClick={handleAutoFix}
                className="px-2.5 py-1 rounded-lg bg-amber-500 text-slate-950 text-[11px] font-extrabold flex items-center gap-1 hover:bg-amber-400 transition"
              >
                <Wrench className="w-3 h-3" />
                <span>Исправить автоматически</span>
              </button>
            </div>
            {issues.map((issue, idx) => (
              <div key={idx} className="text-xs text-amber-600 dark:text-amber-300">
                • <b>{language === 'uz' ? issue.titleUz : issue.titleRu}:</b>{' '}
                {language === 'uz' ? issue.descUz : issue.descRu}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 8 Step Component Slots */}
      <div className="space-y-3">
        {STEPS.map((step) => {
          const Icon = step.icon;
          const selectedPart = builder[step.key];

          return (
            <div
              key={step.key}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm hover:border-cyan-500/40 transition flex items-center justify-between gap-4"
            >
              {/* Left: Step label + Icon */}
              <div className="flex items-center gap-3.5 min-w-[160px]">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    selectedPart
                      ? 'bg-cyan-500/10 text-cyan-500'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                    {getTranslation(language, step.titleKey)}
                  </span>
                  <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                    {selectedPart ? selectedPart.brand : 'Не выбрано'}
                  </span>
                </div>
              </div>

              {/* Center: Selected component details or Empty Prompt */}
              <div className="flex-1 px-2 hidden sm:block">
                {selectedPart ? (
                  <div className="flex items-center gap-3">
                    <img
                      src={selectedPart.image}
                      alt={selectedPart.name}
                      className="w-12 h-12 rounded-lg object-cover bg-slate-800"
                    />
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1">
                        {selectedPart.name}
                      </h4>
                      <div className="flex gap-2 text-[11px] text-slate-400">
                        {selectedPart.specs.socket && <span>Сокет: {selectedPart.specs.socket}</span>}
                        {selectedPart.specs.vramGB && <span>VRAM: {selectedPart.specs.vramGB}GB</span>}
                        {selectedPart.specs.ramType && <span>{selectedPart.specs.ramType}</span>}
                        {selectedPart.specs.tdpWatts && <span>TDP: {selectedPart.specs.tdpWatts}W</span>}
                        <span className="text-cyan-400 font-bold flex items-center gap-0.5">
                          <Box className="w-3 h-3" /> 3D Модель
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <span className="text-xs text-slate-400 italic">
                    Нажмите кнопку справа, чтобы выбрать деталь, или используйте автосборку
                  </span>
                )}
              </div>

              {/* Right: Price & Button */}
              <div className="flex items-center gap-3">
                {selectedPart ? (
                  <>
                    <span className="font-extrabold text-sm sm:text-base text-cyan-600 dark:text-cyan-400">
                      {formatPriceUZS(selectedPart.priceUZS, language)}
                    </span>
                    <button
                      onClick={() => setActiveCategoryModal(step.key)}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition"
                    >
                      Изменить
                    </button>
                    <button
                      onClick={() => setBuilderPart(step.key, null)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-500/10 transition"
                      title="Удалить"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setActiveCategoryModal(step.key)}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30 flex items-center gap-1.5 transition active:scale-95"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Выбрать</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL 1: AUTOMATIC PC BUILDER (АВТОМАТИЧЕСКАЯ СБОРКА) */}
      {showAutoBuildModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl relative space-y-6">
            <button
              onClick={() => setShowAutoBuildModal(false)}
              className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white"
            >
              ✕
            </button>

            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-400 text-xs font-bold uppercase tracking-wider mb-2">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Умный конфигуратор ПК</span>
              </div>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white">
                Автоматическая сборка компьютера
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Выберите один из 4 проверенных геймерских пресетов со 100% совместимостью или соберите под ваш точный бюджет
              </p>
            </div>

            {/* SECTION A: 4 PROVEN PRESETS */}
            <div className="space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                1. Готовые сбалансированные сборки (в 1 клик):
              </span>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {AUTO_BUILD_PRESETS.map((preset) => (
                  <div
                    key={preset.id}
                    onClick={() => handleApplyPreset(preset.id)}
                    className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 hover:border-cyan-500 dark:hover:border-cyan-500 transition-all cursor-pointer group flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-2xl">{preset.icon}</span>
                        <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                          {language === 'uz' ? preset.tagUz : preset.tagRu}
                        </span>
                      </div>

                      <h4 className="font-bold text-slate-900 dark:text-white text-base group-hover:text-cyan-500 transition">
                        {language === 'uz' ? preset.nameUz : preset.nameRu}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                        {language === 'uz' ? preset.descUz : preset.descRu}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                      <span className="text-base font-black text-cyan-600 dark:text-cyan-400">
                        {formatPriceUZS(preset.targetPriceUZS, language)}
                      </span>
                      <button className="px-3 py-1.5 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs flex items-center gap-1 group-hover:bg-cyan-400 transition">
                        <span>Применить</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* SECTION B: BUDGET GENERATOR SLIDER */}
            <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 space-y-4">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                2. Сгенерировать автосборку под ваш бюджет:
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
                <div className="sm:col-span-2 space-y-2">
                  <div className="flex justify-between text-xs font-semibold">
                    <span>Бюджет:</span>
                    <span className="font-mono text-cyan-500 font-black text-sm">
                      {formatPriceUZS(customBudget, language)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="10000000"
                    max="60000000"
                    step="1000000"
                    value={customBudget}
                    onChange={(e) => setCustomBudget(Number(e.target.value))}
                    className="w-full accent-cyan-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                    <span>10 000 000 сум</span>
                    <span>35 000 000 сум</span>
                    <span>60 000 000 сум</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-xs font-semibold block">Платформа:</span>
                  <div className="grid grid-cols-2 gap-2 text-xs font-bold">
                    <button
                      onClick={() => setCustomPlatform('amd')}
                      className={`p-2 rounded-xl border transition ${
                        customPlatform === 'amd'
                          ? 'bg-red-500/20 border-red-500 text-red-400'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-400'
                      }`}
                    >
                      AMD Ryzen
                    </button>
                    <button
                      onClick={() => setCustomPlatform('intel')}
                      className={`p-2 rounded-xl border transition ${
                        customPlatform === 'intel'
                          ? 'bg-blue-500/20 border-blue-500 text-blue-400'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-400'
                      }`}
                    >
                      Intel Core
                    </button>
                  </div>

                  <button
                    onClick={handleApplyBudgetBuild}
                    className="w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 transition active:scale-95"
                  >
                    ✨ Собрать под этот бюджет
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: COMPATIBILITY CONFLICT RESOLVER */}
      {showConflictModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl relative space-y-5">
            <button
              onClick={() => setShowConflictModal(false)}
              className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white"
            >
              ✕
            </button>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  Обнаружены несовместимости в сборке
                </h3>
                <p className="text-xs text-slate-400">
                  Пожалуйста, устраните конфликты перед заказом или исправьте их в 1 клик
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-2 text-xs">
              {issues.map((issue, idx) => (
                <div key={idx} className="text-amber-700 dark:text-amber-300">
                  • <b>{issue.titleRu}:</b> {issue.descRu}
                </div>
              ))}
            </div>

            <div className="space-y-2 pt-2">
              <button
                onClick={handleAutoFix}
                className="w-full py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 transition active:scale-95"
              >
                <Wrench className="w-4 h-4" />
                <span>Автоматически исправить несовместимость (Рекомендуется)</span>
              </button>

              <button
                onClick={handleForceBuyAnyway}
                className="w-full py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs transition"
              >
                Все равно добавить эти позиции в корзину
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: EMPTY BUILD WARNING */}
      {showEmptyWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 text-cyan-500 flex items-center justify-center mx-auto">
              <Wand2 className="w-7 h-7" />
            </div>

            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                Сборка еще не укомплектована
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Выберите компоненты вручную по слотам ниже или нажмите кнопку автоматической сборки для сборки компьютера в 1 клик.
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => {
                  setShowEmptyWarning(false);
                  setShowAutoBuildModal(true);
                }}
                className="flex-1 py-2.5 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs"
              >
                ✨ Автосборка ПК
              </button>
              <button
                onClick={() => setShowEmptyWarning(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 font-semibold text-xs"
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Component Picker Modal */}
      {activeCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Выбор компонента: {activeCategoryModal.toUpperCase()}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Доступно {availableProducts.length} позиций в каталоге Ташкента
                </p>
              </div>
              <button
                onClick={() => setActiveCategoryModal(null)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-500"
              >
                ✕
              </button>
            </div>

            {/* List of items */}
            <div className="overflow-y-auto flex-1 py-4 space-y-3">
              {availableProducts.map((product) => {
                const isSelected = builder[activeCategoryModal]?.id === product.id;

                return (
                  <div
                    key={product.id}
                    onClick={() => {
                      setBuilderPart(activeCategoryModal, product);
                      setActiveCategoryModal(null);
                    }}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-4 ${
                      isSelected
                        ? 'border-cyan-500 bg-cyan-500/5'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-600 bg-slate-50/50 dark:bg-slate-950/40'
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-14 h-14 rounded-xl object-cover bg-slate-800 shrink-0"
                      />
                      <div>
                        <span className="text-[10px] font-bold text-cyan-500 uppercase">
                          {product.brand}
                        </span>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                          {product.name}
                        </h4>
                        <div className="flex flex-wrap gap-2 text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                          {product.specs.socket && <span>Сокет: {product.specs.socket}</span>}
                          {product.specs.vramGB && <span>VRAM: {product.specs.vramGB}GB</span>}
                          {product.specs.ramType && <span>{product.specs.ramType}</span>}
                          {product.specs.tdpWatts && <span>TDP: {product.specs.tdpWatts}W</span>}
                          {product.specs.formFactor && <span>Форм-фактор: {product.specs.formFactor}</span>}
                          <span className="px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 font-bold flex items-center gap-0.5">
                            <Box className="w-2.5 h-2.5" /> 3D запчасть
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-base font-black text-cyan-600 dark:text-cyan-400">
                        {formatPriceUZS(product.priceUZS, language)}
                      </div>
                      <span className="text-[11px] font-semibold text-emerald-500">
                        В наличии
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
