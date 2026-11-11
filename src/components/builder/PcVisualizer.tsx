'use client';

import React, { useState } from 'react';
import { useStore } from '@/store/useStore';
import { getTranslation } from '@/lib/i18n';
import { Eye, Shield, Zap, Sparkles, Sliders, CheckCircle2, Box } from 'lucide-react';

const RGB_PRESETS = [
  { name: 'Cyan Neon', hex: '#00f0ff' },
  { name: 'Cyberpunk Violet', hex: '#a855f7' },
  { name: 'Emerald Matrix', hex: '#10b981' },
  { name: 'Crimson Red', hex: '#ef4444' },
  { name: 'Sunset Amber', hex: '#f59e0b' },
  { name: 'Pure Ice White', hex: '#ffffff' },
  { name: 'Stealth Black', hex: '#18181b' },
];

export const PcVisualizer: React.FC = () => {
  const {
    language,
    builder,
    visualizerRgb,
    setVisualizerRgb,
    visualizerGlassOpen,
    toggleVisualizerGlass,
    visualizerView,
    setVisualizerView,
    visualizerMode,
    setVisualizerMode,
  } = useStore();

  const [fanSpeed, setFanSpeed] = useState<'normal' | 'turbo'>('normal');

  const rgbColor = visualizerRgb;
  const isRgbOff = rgbColor === '#18181b';

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-2xl backdrop-blur-md flex flex-col items-center">
      {/* Top Controls Bar */}
      <div className="w-full flex flex-wrap items-center justify-between gap-3 mb-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-white text-sm sm:text-base">
              {getTranslation(language, 'visualizerHeader')}
            </h3>
            <p className="text-xs text-slate-400">
              {builder.case ? builder.case.name : 'Базовый панорамный корпус'}
            </p>
          </div>
        </div>

        {/* View toggles */}
        <div className="flex items-center gap-2 text-xs">
          {/* 2D / 3D Mode Switcher */}
          <div className="inline-flex rounded-lg bg-slate-800 p-0.5 border border-slate-700">
            <button
              onClick={() => setVisualizerMode('2d')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold flex items-center gap-1 transition ${
                visualizerMode === '2d'
                  ? 'bg-cyan-500 text-slate-950 shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Eye className="w-3 h-3" />
              <span>2D</span>
            </button>
            <button
              onClick={() => setVisualizerMode('3d')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold flex items-center gap-1 transition ${
                visualizerMode === '3d'
                  ? 'bg-cyan-500 text-slate-950 shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Box className="w-3 h-3" />
              <span>3D</span>
            </button>
          </div>

          <button
            onClick={() => setVisualizerView(visualizerView === 'inside' ? 'outside' : 'inside')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition font-medium ${
              visualizerView === 'inside'
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            {visualizerView === 'inside'
              ? getTranslation(language, 'visualizerInside')
              : getTranslation(language, 'visualizerOutside')}
          </button>

          <button
            onClick={toggleVisualizerGlass}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition font-medium ${
              visualizerGlassOpen
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            {visualizerGlassOpen
              ? getTranslation(language, 'visualizerGlassOpen')
              : getTranslation(language, 'visualizerGlassClosed')}
          </button>

          <button
            onClick={() => setFanSpeed(fanSpeed === 'normal' ? 'turbo' : 'normal')}
            className={`px-2.5 py-1.5 rounded-lg flex items-center gap-1 transition ${
              fanSpeed === 'turbo'
                ? 'bg-purple-500/20 text-purple-400 border border-purple-500/40'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
            title="Скорость вентиляторов"
          >
            <Zap className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{fanSpeed === 'turbo' ? 'Turbo' : 'Silent'}</span>
          </button>
        </div>
      </div>

      {/* Main SVG/Canvas PC Chassis Render */}
      <div className="relative w-full max-w-[520px] aspect-[4/5] bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 rounded-xl border-2 border-slate-800/80 p-4 shadow-inner overflow-hidden select-none">
        {/* ARGB Ambient Glow in background */}
        <div
          className="absolute inset-0 pointer-events-none opacity-20 transition-all duration-700 blur-3xl"
          style={{
            backgroundColor: isRgbOff ? 'transparent' : rgbColor,
          }}
        />

        {/* The Full Computer Case Drawing */}
        <svg
          viewBox="0 0 500 620"
          className="w-full h-full relative z-10 drop-shadow-2xl"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Custom Gradients */}
            <linearGradient id="caseMetal" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1e293b" />
              <stop offset="50%" stopColor="#0f172a" />
              <stop offset="100%" stopColor="#020617" />
            </linearGradient>

            <linearGradient id="pcbGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0f172a" />
              <stop offset="100%" stopColor="#1e293b" />
            </linearGradient>

            <linearGradient id="glassReflection" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgba(255,255,255,0.15)" />
              <stop offset="35%" stopColor="rgba(255,255,255,0.03)" />
              <stop offset="70%" stopColor="rgba(0,240,255,0.05)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0.08)" />
            </linearGradient>

            <filter id="glowFilter" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* 1. OUTER CASE CHASSIS */}
          <rect
            x="20"
            y="20"
            width="460"
            height="580"
            rx="16"
            fill="url(#caseMetal)"
            stroke="#334155"
            strokeWidth="3"
          />

          {/* Top Panel Vent & Ports */}
          <rect x="50" y="26" width="360" height="8" rx="4" fill="#090d16" />
          {/* Front Power button */}
          <circle cx="430" cy="30" r="4" fill="#00f0ff" className="animate-pulse" />
          <circle cx="445" cy="30" r="2.5" fill="#64748b" />
          <circle cx="455" cy="30" r="2.5" fill="#64748b" />

          {/* Internal Chamber Cutout */}
          <rect
            x="36"
            y="44"
            width="428"
            height="536"
            rx="8"
            fill="#090d16"
            stroke="#1e293b"
            strokeWidth="2"
          />

          {/* 2. TOP RADIATOR / FANS (Liquid Cooler or Exhaust) */}
          <g transform="translate(60, 52)">
            {builder.cooler?.specs.coolerType?.startsWith('Liquid') ? (
              // 360mm AIO Radiator
              <g>
                <rect x="0" y="0" width="340" height="26" rx="4" fill="#1e293b" stroke="#334155" />
                {/* 3x Radiator Fans */}
                {[20, 130, 240].map((fx, i) => (
                  <g key={i} transform={`translate(${fx}, 2)`}>
                    <rect x="0" y="0" width="80" height="22" rx="3" fill="#0f172a" />
                    <circle
                      cx="40"
                      cy="11"
                      r="8"
                      fill="none"
                      stroke={isRgbOff ? '#475569' : rgbColor}
                      strokeWidth="2"
                      filter={isRgbOff ? undefined : 'url(#glowFilter)'}
                    />
                  </g>
                ))}
              </g>
            ) : (
              // Case Top Mesh
              <rect x="0" y="0" width="340" height="12" rx="3" fill="#1e293b" stroke="#334155" strokeDasharray="3 3" />
            )}
          </g>

          {/* 3. REAR EXHAUST FAN (Left side) */}
          <g transform="translate(48, 120)">
            <rect x="0" y="0" width="46" height="70" rx="6" fill="#1e293b" stroke="#334155" />
            <circle
              cx="23"
              cy="35"
              r="18"
              fill="none"
              stroke={isRgbOff ? '#334155' : rgbColor}
              strokeWidth="2.5"
              filter={isRgbOff ? undefined : 'url(#glowFilter)'}
            />
            {/* Spinning blades */}
            <circle
              cx="23"
              cy="35"
              r="6"
              fill="#0f172a"
              stroke="#64748b"
              strokeWidth="1"
            />
          </g>

          {/* 4. MOTHERBOARD PCB AREA */}
          <g transform="translate(104, 96)">
            {/* Motherboard Base Plate */}
            <rect
              x="0"
              y="0"
              width="270"
              height="280"
              rx="8"
              fill={builder.motherboard ? 'url(#pcbGradient)' : '#0f172a'}
              stroke={builder.motherboard ? '#3b82f6' : '#1e293b'}
              strokeWidth="1.5"
              strokeDasharray={builder.motherboard ? undefined : '5 5'}
            />

            {/* Motherboard Circuit Lines & VRM Heatsinks */}
            {builder.motherboard ? (
              <g>
                {/* VRM Heatsink Top & Left */}
                <rect x="10" y="10" width="160" height="22" rx="4" fill="#1e293b" stroke="#475569" />
                <rect x="10" y="32" width="26" height="85" rx="4" fill="#1e293b" stroke="#475569" />
                {/* Chipset Heatsink Bottom Right */}
                <rect x="190" y="210" width="70" height="58" rx="6" fill="#1e293b" stroke="#334155" />
                <text x="200" y="245" fill="#64748b" fontSize="9" fontFamily="monospace" fontWeight="bold">
                  {builder.motherboard.specs.socket || 'CHIPSET'}
                </text>

                {/* PCIe x16 Slot (Where GPU sits) */}
                <rect x="20" y="195" width="220" height="8" rx="2" fill="#334155" stroke="#64748b" />
                <rect x="20" y="250" width="140" height="6" rx="2" fill="#1e293b" stroke="#334155" />

                {/* M.2 SSD Slot with Shield */}
                <g transform="translate(48, 175)">
                  <rect
                    x="0"
                    y="0"
                    width="85"
                    height="14"
                    rx="2"
                    fill={builder.storage ? '#334155' : '#1e293b'}
                    stroke={builder.storage ? '#06b6d4' : '#475569'}
                  />
                  {builder.storage && (
                    <text x="6" y="10" fill="#a5f3fc" fontSize="7" fontWeight="bold">
                      NVMe M.2 4.0
                    </text>
                  )}
                </g>

                {/* 5. CPU SOCKET & INSTALLED CPU */}
                <g transform="translate(56, 42)">
                  <rect
                    x="0"
                    y="0"
                    width="78"
                    height="78"
                    rx="4"
                    fill={builder.cpu ? '#1e293b' : '#111827'}
                    stroke={builder.cpu ? '#00f0ff' : '#334155'}
                    strokeWidth="1.5"
                  />
                  {builder.cpu ? (
                    <g>
                      {/* Metallic Heatspreader */}
                      <rect x="8" y="8" width="62" height="62" rx="3" fill="#cbd5e1" stroke="#94a3b8" />
                      <text
                        x="15"
                        y="35"
                        fill="#0f172a"
                        fontSize="9"
                        fontWeight="bold"
                        fontFamily="sans-serif"
                      >
                        {builder.cpu.brand.toUpperCase()}
                      </text>
                      <text x="15" y="48" fill="#334155" fontSize="7" fontWeight="600">
                        {builder.cpu.specs.socket}
                      </text>
                    </g>
                  ) : (
                    <text x="12" y="44" fill="#475569" fontSize="9">
                      [CPU SOCKET]
                    </text>
                  )}
                </g>

                {/* 6. RAM SLOTS & MODULES */}
                <g transform="translate(148, 42)">
                  {[0, 10, 20, 30].map((rx, idx) => {
                    const isOccupied = builder.ram && (idx === 1 || idx === 3);
                    return (
                      <g key={rx} transform={`translate(${rx}, 0)`}>
                        <rect
                          x="0"
                          y="0"
                          width="7"
                          height="85"
                          rx="2"
                          fill={isOccupied ? '#1e293b' : '#0f172a'}
                          stroke={isOccupied ? '#38bdf8' : '#334155'}
                          strokeWidth="1"
                        />
                        {/* Glowing ARGB Lightbar on top of RAM */}
                        {isOccupied && (
                          <rect
                            x="1"
                            y="2"
                            width="5"
                            height="81"
                            rx="1"
                            fill={isRgbOff ? '#94a3b8' : rgbColor}
                            filter={isRgbOff ? undefined : 'url(#glowFilter)'}
                          />
                        )}
                      </g>
                    );
                  })}
                </g>
              </g>
            ) : (
              <text x="60" y="145" fill="#475569" fontSize="12" fontWeight="500">
                + Выберите материнскую плату
              </text>
            )}

            {/* 7. CPU COOLER MOUNTED OVER CPU */}
            {builder.cooler && (
              <g transform="translate(42, 30)">
                {builder.cooler.specs.coolerType === 'Air' ? (
                  // Big Dual-Tower Air Cooler
                  <g filter="url(#glowFilter)">
                    <rect x="4" y="2" width="102" height="102" rx="10" fill="#1e293b" stroke="#64748b" strokeWidth="2" />
                    {/* Aluminum fin stacks */}
                    <line x1="8" y1="20" x2="102" y2="20" stroke="#334155" strokeWidth="2" />
                    <line x1="8" y1="35" x2="102" y2="35" stroke="#334155" strokeWidth="2" />
                    <line x1="8" y1="50" x2="102" y2="50" stroke="#334155" strokeWidth="2" />
                    <line x1="8" y1="65" x2="102" y2="65" stroke="#334155" strokeWidth="2" />
                    <line x1="8" y1="80" x2="102" y2="80" stroke="#334155" strokeWidth="2" />
                    {/* Center Fan with ARGB */}
                    <circle
                      cx="55"
                      cy="53"
                      r="26"
                      fill="#0f172a"
                      stroke={isRgbOff ? '#475569' : rgbColor}
                      strokeWidth="3"
                    />
                    <circle cx="55" cy="53" r="8" fill="#334155" />
                  </g>
                ) : (
                  // AIO Liquid Pump Block + Braided Tubes
                  <g>
                    {/* Braided water tubes curving up to the top radiator */}
                    <path
                      d="M 65 30 Q 80 -10 120 -8"
                      fill="none"
                      stroke="#0f172a"
                      strokeWidth="9"
                      strokeLinecap="round"
                    />
                    <path
                      d="M 65 30 Q 80 -10 120 -8"
                      fill="none"
                      stroke="#334155"
                      strokeWidth="7"
                      strokeDasharray="2 3"
                    />
                    <path
                      d="M 80 40 Q 110 5 150 -8"
                      fill="none"
                      stroke="#0f172a"
                      strokeWidth="9"
                      strokeLinecap="round"
                    />
                    <path
                      d="M 80 40 Q 110 5 150 -8"
                      fill="none"
                      stroke="#334155"
                      strokeWidth="7"
                      strokeDasharray="2 3"
                    />

                    {/* Circular Pump with Infinity Mirror / LCD */}
                    <circle
                      cx="70"
                      cy="60"
                      r="32"
                      fill="#0f172a"
                      stroke={isRgbOff ? '#475569' : rgbColor}
                      strokeWidth="3.5"
                      filter={isRgbOff ? undefined : 'url(#glowFilter)'}
                    />
                    <circle cx="70" cy="60" r="22" fill="#020617" />
                    <text
                      x="54"
                      y="64"
                      fill={isRgbOff ? '#64748b' : rgbColor}
                      fontSize="9"
                      fontWeight="bold"
                      fontFamily="monospace"
                    >
                      36°C
                    </text>
                  </g>
                )}
              </g>
            )}
          </g>

          {/* 8. GRAPHICS CARD (GPU) */}
          <g transform="translate(70, 290)">
            {builder.gpu ? (
              <g className="transition-all duration-300">
                {/* GPU Main Body Shroud */}
                <rect
                  x="0"
                  y="0"
                  width="335"
                  height="72"
                  rx="8"
                  fill="#0f172a"
                  stroke="#334155"
                  strokeWidth="2"
                />

                {/* Backplate / Top accent plate */}
                <rect x="0" y="0" width="335" height="12" rx="4" fill="#1e293b" />

                {/* Glowing RGB Logo & Edge Strip */}
                <rect
                  x="18"
                  y="16"
                  width="110"
                  height="14"
                  rx="3"
                  fill="#020617"
                  stroke={isRgbOff ? '#334155' : rgbColor}
                  strokeWidth="1.5"
                  filter={isRgbOff ? undefined : 'url(#glowFilter)'}
                />
                <text
                  x="24"
                  y="27"
                  fill={isRgbOff ? '#94a3b8' : rgbColor}
                  fontSize="8"
                  fontWeight="bold"
                  letterSpacing="1"
                >
                  {builder.gpu.brand.toUpperCase()} GEFORCE
                </text>

                {/* Triple Cooling Fans Shroud */}
                {[140, 205, 270].map((fx, i) => (
                  <g key={i} transform={`translate(${fx}, 18)`}>
                    <circle
                      cx="22"
                      cy="22"
                      r="20"
                      fill="#020617"
                      stroke={isRgbOff ? '#334155' : '#475569'}
                      strokeWidth="1.5"
                    />
                    <circle
                      cx="22"
                      cy="22"
                      r="7"
                      fill="#1e293b"
                      stroke={isRgbOff ? '#475569' : rgbColor}
                      strokeWidth="1"
                    />
                  </g>
                ))}

                {/* Braided 12VHPWR Power Cables plunging into PSU basement */}
                <g transform="translate(290, 70)">
                  <path d="M 0 0 L 0 80" stroke="#1e293b" strokeWidth="8" strokeLinecap="round" />
                  <path d="M 0 0 L 0 80" stroke="#38bdf8" strokeWidth="2" strokeDasharray="3 3" />
                </g>
              </g>
            ) : (
              // Empty PCIe slot placeholder
              <g>
                <rect
                  x="30"
                  y="10"
                  width="280"
                  height="50"
                  rx="6"
                  fill="#090d16"
                  stroke="#1e293b"
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                />
                <text x="100" y="40" fill="#475569" fontSize="11" fontWeight="500">
                  + Слот для видеокарты (PCIe)
                </text>
              </g>
            )}
          </g>

          {/* 9. BOTTOM PSU BASEMENT & SHROUD */}
          <g transform="translate(36, 470)">
            <rect
              x="0"
              y="0"
              width="428"
              height="110"
              rx="6"
              fill="#0f172a"
              stroke="#1e293b"
              strokeWidth="2"
            />
            {/* Ventilation Honeycomb Pattern */}
            <line x1="20" y1="20" x2="380" y2="20" stroke="#1e293b" strokeWidth="4" strokeDasharray="8 6" />
            <line x1="20" y1="35" x2="380" y2="35" stroke="#1e293b" strokeWidth="4" strokeDasharray="8 6" />
            <line x1="20" y1="50" x2="380" y2="50" stroke="#1e293b" strokeWidth="4" strokeDasharray="8 6" />

            {/* PSU Window / Badge */}
            <g transform="translate(30, 20)">
              <rect
                x="0"
                y="0"
                width="160"
                height="70"
                rx="6"
                fill="#020617"
                stroke={builder.psu ? '#22c55e' : '#334155'}
                strokeWidth="1.5"
              />
              {builder.psu ? (
                <g>
                  <text x="14" y="32" fill="#f8fafc" fontSize="10" fontWeight="bold">
                    {builder.psu.brand}
                  </text>
                  <text x="14" y="48" fill="#22c55e" fontSize="9" fontWeight="bold">
                    {builder.psu.specs.psuWattage}W {builder.psu.specs.psuEfficiency}
                  </text>
                </g>
              ) : (
                <text x="16" y="40" fill="#475569" fontSize="9">
                  [Блок питания]
                </text>
              )}
            </g>
          </g>

          {/* 10. FRONT INTAKE FANS (Right side) */}
          <g transform="translate(412, 80)">
            {[0, 125, 250].map((fy, i) => (
              <g key={i} transform={`translate(0, ${fy})`}>
                <rect x="0" y="0" width="38" height="110" rx="6" fill="#1e293b" stroke="#334155" />
                <circle
                  cx="19"
                  cy="55"
                  r="28"
                  fill="none"
                  stroke={isRgbOff ? '#334155' : rgbColor}
                  strokeWidth="2.5"
                  filter={isRgbOff ? undefined : 'url(#glowFilter)'}
                />
                <circle cx="19" cy="55" r="8" fill="#0f172a" />
              </g>
            ))}
          </g>

          {/* 11. TEMPERED GLASS SIDE PANEL (Layer on top if not removed) */}
          {!visualizerGlassOpen && (
            <g>
              {/* Glass reflection gradient */}
              <rect
                x="36"
                y="44"
                width="428"
                height="536"
                rx="8"
                fill="url(#glassReflection)"
                stroke="rgba(255, 255, 255, 0.2)"
                strokeWidth="1.5"
                className="pointer-events-none transition-opacity duration-500"
              />
              {/* Glass Corner Thumbscrews */}
              <circle cx="48" cy="56" r="4.5" fill="#475569" stroke="#94a3b8" />
              <circle cx="452" cy="56" r="4.5" fill="#475569" stroke="#94a3b8" />
              <circle cx="48" cy="568" r="4.5" fill="#475569" stroke="#94a3b8" />
              <circle cx="452" cy="568" r="4.5" fill="#475569" stroke="#94a3b8" />
            </g>
          )}
        </svg>

        {/* Status Pills inside visualizer */}
        <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between pointer-events-none z-20">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900/80 border border-slate-700/60 backdrop-blur-md text-[11px] text-slate-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
            <span>
              {Object.values(builder).filter(Boolean).length} / 8 {getTranslation(language, 'visualizerMounted')}
            </span>
          </div>

          {!visualizerGlassOpen && (
            <span className="text-[10px] text-slate-400 bg-slate-900/80 px-2 py-0.5 rounded border border-slate-700/40">
              {getTranslation(language, 'visualizerGlassClosed')}
            </span>
          )}
        </div>
      </div>

      {/* ARGB Lighting Control Palette */}
      <div className="w-full mt-4 pt-3 border-t border-slate-800">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-cyan-400" />
            {getTranslation(language, 'visualizerRgb')}
          </span>
          <span className="text-[11px] text-slate-400 font-mono">
            {RGB_PRESETS.find((p) => p.hex.toLowerCase() === rgbColor.toLowerCase())?.name || rgbColor}
          </span>
        </div>

        <div className="flex items-center justify-between gap-2 overflow-x-auto py-1">
          {RGB_PRESETS.map((preset) => {
            const isSelected = preset.hex.toLowerCase() === rgbColor.toLowerCase();
            return (
              <button
                key={preset.hex}
                onClick={() => setVisualizerRgb(preset.hex)}
                className={`relative flex-1 min-w-[36px] h-7 rounded-lg transition-all duration-200 border ${
                  isSelected
                    ? 'ring-2 ring-cyan-400 scale-105 border-white'
                    : 'border-slate-700 hover:border-slate-500 opacity-80 hover:opacity-100'
                }`}
                style={{ backgroundColor: preset.hex }}
                title={preset.name}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};
