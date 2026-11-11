'use client';

import React, { useState, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { Game, GraphicPreset, Product, Resolution } from '@/types';
import { INITIAL_GAMES } from '@/data/games';
import { INITIAL_PRODUCTS } from '@/data/products';
import {
  analyzeBottleneck,
  calculateGameFps,
  FpsResult,
} from '@/lib/fpsCalculator';
import { getTranslation } from '@/lib/i18n';
import {
  Gauge,
  Monitor,
  Sliders,
  Cpu,
  Layers,
  Search,
  Sparkles,
  AlertCircle,
  PlusCircle,
  Flame,
  CheckCircle2,
} from 'lucide-react';
import Link from 'next/link';

export const FpsCalculatorView: React.FC = () => {
  const { language, builder, setBuilderPart } = useStore();

  const [games, setGames] = useState<Game[]>(INITIAL_GAMES);
  const [preset, setPreset] = useState<GraphicPreset>('ultra');
  const [resolution, setResolution] = useState<Resolution>('1080p');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState<string>('all');

  // Load latest games from API if available
  useEffect(() => {
    fetch('/api/games')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.games) {
          setGames(data.games);
        }
      })
      .catch(() => {});
  }, []);

  // Quick fallback CPU & GPU picker if user hasn't set one yet
  const cpus = INITIAL_PRODUCTS.filter((p) => p.category === 'cpu');
  const gpus = INITIAL_PRODUCTS.filter((p) => p.category === 'gpu');

  const activeCpu = builder.cpu || cpus[0]; // Fallback to Ryzen 7 7800X3D
  const activeGpu = builder.gpu || gpus[1]; // Fallback to RTX 4080 Super

  // Calculate bottleneck
  const bottleneck = analyzeBottleneck(activeCpu, activeGpu);

  // Compute FPS for all games
  const fpsResults: FpsResult[] = games.map((game) =>
    calculateGameFps(game, activeCpu, activeGpu, builder.ram, preset, resolution)
  );

  // Filter games
  const filteredResults = fpsResults.filter((item) => {
    const matchesSearch = item.game.title
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesGenre =
      selectedGenre === 'all' || item.game.genre.includes(selectedGenre);
    return matchesSearch && matchesGenre;
  });

  const genres = ['all', 'Action', 'RPG', 'FPS', 'Horror', 'Open World', 'Shooter'];

  return (
    <div className="space-y-8">
      {/* Hardware Selection & Status Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Flame className="w-5 h-5 text-red-500" />
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                {getTranslation(language, 'fpsTitle')}
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {getTranslation(language, 'fpsSubtitle')}
            </p>
          </div>

          {/* Quick Select CPU / GPU dropdowns if needed */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
              <Cpu className="w-4 h-4 text-cyan-500" />
              <select
                value={activeCpu?.id}
                onChange={(e) => {
                  const found = cpus.find((c) => c.id === e.target.value);
                  if (found) setBuilderPart('cpu', found);
                }}
                className="bg-transparent text-xs font-semibold text-slate-900 dark:text-white focus:outline-none"
              >
                {cpus.map((c) => (
                  <option key={c.id} value={c.id} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
              <Layers className="w-4 h-4 text-purple-500" />
              <select
                value={activeGpu?.id}
                onChange={(e) => {
                  const found = gpus.find((g) => g.id === e.target.value);
                  if (found) setBuilderPart('gpu', found);
                }}
                className="bg-transparent text-xs font-semibold text-slate-900 dark:text-white focus:outline-none"
              >
                {gpus.map((g) => (
                  <option key={g.id} value={g.id} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                    {g.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Bottleneck Bar */}
        <div className="pt-4 grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
          <div className="md:col-span-2">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-bold text-slate-700 dark:text-slate-300">
                {getTranslation(language, 'fpsBottleneck')}
              </span>
              <span className="font-mono text-cyan-500 font-bold">
                {bottleneck.status === 'balanced'
                  ? 'Сбалансировано (98%)'
                  : bottleneck.status === 'cpu_bottleneck'
                  ? `Потери CPU: -${bottleneck.percentage}%`
                  : `Загрузка GPU: 100%`}
              </span>
            </div>
            <div className="w-full h-2.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden flex">
              <div
                className={`h-full transition-all duration-500 ${
                  bottleneck.status === 'balanced'
                    ? 'bg-emerald-500 w-full'
                    : bottleneck.status === 'cpu_bottleneck'
                    ? 'bg-amber-500 w-3/4'
                    : 'bg-cyan-500 w-full'
                }`}
              />
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5">
              {language === 'uz' ? bottleneck.explanationUz : bottleneck.explanationRu}
            </p>
          </div>

          <div className="flex justify-end">
            <Link
              href="/admin"
              className="text-xs font-semibold text-cyan-600 dark:text-cyan-400 hover:underline flex items-center gap-1.5"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Добавить новую игру в базу</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Preset & Resolution Controllers */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Resolution Tabs */}
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
              {getTranslation(language, 'fpsResolution')}
            </span>
            <div className="inline-flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 border border-slate-200 dark:border-slate-700">
              {(['1080p', '1440p', '4k'] as Resolution[]).map((res) => (
                <button
                  key={res}
                  onClick={() => setResolution(res)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition uppercase ${
                    resolution === res
                      ? 'bg-cyan-500 text-slate-950 shadow-md'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {res === '1080p' ? 'Full HD (1080p)' : res === '1440p' ? '2K QHD (1440p)' : '4K UHD (2160p)'}
                </button>
              ))}
            </div>
          </div>

          {/* Graphic Preset Tabs */}
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
              {getTranslation(language, 'fpsPreset')}
            </span>
            <div className="inline-flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 border border-slate-200 dark:border-slate-700">
              {(['low', 'medium', 'high', 'ultra'] as GraphicPreset[]).map((pr) => {
                const label =
                  pr === 'low'
                    ? getTranslation(language, 'fpsLow')
                    : pr === 'medium'
                    ? getTranslation(language, 'fpsMed')
                    : pr === 'high'
                    ? getTranslation(language, 'fpsHigh')
                    : getTranslation(language, 'fpsUltra');

                return (
                  <button
                    key={pr}
                    onClick={() => setPreset(pr)}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
                      preset === pr
                        ? 'bg-purple-600 text-white shadow-md'
                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Search & Genre filters */}
        <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 dark:border-slate-800">
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder={getTranslation(language, 'fpsSearchGame')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
            {genres.map((g) => (
              <button
                key={g}
                onClick={() => setSelectedGenre(g)}
                className={`px-2.5 py-1 rounded-lg capitalize font-medium transition ${
                  selectedGenre === g
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                    : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {g === 'all' ? 'Все жанры' : g}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Games FPS Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {filteredResults.map((item) => {
          const fps = item.averageFps;
          const lowFps = item.onePercentLowFps;

          // Color coded progress
          let barColor = 'bg-cyan-500';
          let tierBadge = (
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              60+ FPS • Плавно
            </span>
          );

          if (fps >= 144) {
            barColor = 'bg-purple-500';
            tierBadge = (
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20">
                144+ FPS • Киберспорт
              </span>
            );
          } else if (fps < 45) {
            barColor = 'bg-amber-500';
            tierBadge = (
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                ~30 FPS • Играбельно
              </span>
            );
          }

          // Percentage width up to 165 FPS cap for gauge
          const widthPct = Math.min(100, Math.round((fps / 165) * 100));

          return (
            <div
              key={item.game.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:border-cyan-500/40 transition flex flex-col justify-between"
            >
              {/* Game Cover */}
              <div className="relative aspect-[16/9] w-full overflow-hidden bg-slate-950">
                <img
                  src={item.game.coverImage}
                  alt={item.game.title}
                  className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
                <div className="absolute top-2 right-2">{tierBadge}</div>
                <div className="absolute bottom-2 left-3 right-3">
                  <span className="text-[10px] font-semibold text-cyan-400 uppercase tracking-wider block">
                    {item.game.genre}
                  </span>
                  <h4 className="font-bold text-white text-sm line-clamp-1">
                    {item.game.title}
                  </h4>
                </div>
              </div>

              {/* FPS Scores & Progress */}
              <div className="p-4 space-y-3">
                <div className="flex items-baseline justify-between">
                  <div>
                    <span className="text-[11px] text-slate-400 font-medium block">
                      {getTranslation(language, 'fpsAvg')}
                    </span>
                    <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                      {fps}{' '}
                      <span className="text-xs font-semibold text-slate-400">
                        FPS
                      </span>
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-[11px] text-slate-400 font-medium block">
                      {getTranslation(language, 'fps1Low')}
                    </span>
                    <span className="text-sm font-bold text-slate-600 dark:text-slate-300">
                      {lowFps} FPS
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className={`h-full ${barColor} transition-all duration-300`}
                    style={{ width: `${widthPct}%` }}
                  />
                </div>

                {/* Difficulty & Resolution meta */}
                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800">
                  <span>Тяжесть: {item.game.baseDifficulty}/10</span>
                  <span className="uppercase font-mono">{resolution} • {preset}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
