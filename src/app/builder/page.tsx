'use client';

import React from 'react';
import { useStore } from '@/store/useStore';
import { getTranslation } from '@/lib/i18n';
import { BuilderStepSelector } from '@/components/builder/BuilderStepSelector';
import { PcVisualizer } from '@/components/builder/PcVisualizer';
import { Pc3DVisualizer } from '@/components/builder/Pc3DVisualizer';
import { Cpu, Sparkles } from 'lucide-react';

export default function BuilderPage() {
  const { language, visualizerMode } = useStore();

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-bold uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Живая визуализация сборки</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white">
          {getTranslation(language, 'builderTitle')}
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-2xl">
          {getTranslation(language, 'builderSubtitle')}
        </p>
      </div>

      {/* 2-Column Responsive Layout: Configurator Steps + Interactive Visualizer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left / Main: Step by Step Component Slots */}
        <div className="lg:col-span-7 space-y-6">
          <BuilderStepSelector />
        </div>

        {/* Right / Sticky: Interactive Live Visualizer of PC Chassis (2D or 3D) */}
        <div className="lg:col-span-5 lg:sticky lg:top-20 space-y-4">
          {visualizerMode === '3d' ? <Pc3DVisualizer /> : <PcVisualizer />}
        </div>
      </div>
    </div>
  );
}
