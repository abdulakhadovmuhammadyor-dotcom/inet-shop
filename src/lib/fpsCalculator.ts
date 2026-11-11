import { Game, GraphicPreset, Product, Resolution } from '@/types';

export interface FpsResult {
  game: Game;
  averageFps: number;
  onePercentLowFps: number;
  tier: 'ultra-smooth' | 'smooth' | 'playable' | 'unplayable';
}

export interface BottleneckAnalysis {
  status: 'balanced' | 'cpu_bottleneck' | 'gpu_bottleneck';
  percentage: number;
  explanationRu: string;
  explanationUz: string;
}

export function calculateGameFps(
  game: Game,
  cpu: Product | null,
  gpu: Product | null,
  ram: Product | null,
  preset: GraphicPreset = 'ultra',
  resolution: Resolution = '1080p'
): FpsResult {
  // Baseline fallback scores if not selected
  const cpuScore = cpu?.specs.benchmarkScore ?? 50;
  const gpuScore = gpu?.specs.benchmarkScore ?? 45;

  // Resolution factors affect GPU heavy games most
  const resFactors: Record<Resolution, { gpuMult: number; cpuMult: number }> = {
    '1080p': { gpuMult: 1.0, cpuMult: 1.0 },
    '1440p': { gpuMult: 0.72, cpuMult: 0.95 },
    '4k': { gpuMult: 0.42, cpuMult: 0.88 },
  };

  // Preset factors
  const presetFactors: Record<GraphicPreset, { gpuMult: number; cpuMult: number }> = {
    low: { gpuMult: 1.48, cpuMult: 1.15 },
    medium: { gpuMult: 1.22, cpuMult: 1.08 },
    high: { gpuMult: 1.0, cpuMult: 1.0 },
    ultra: { gpuMult: 0.76, cpuMult: 0.94 },
  };

  const resSetting = resFactors[resolution];
  const presetSetting = presetFactors[preset];

  // Effective power calculation
  const effectiveGpuPower = gpuScore * resSetting.gpuMult * presetSetting.gpuMult;
  const effectiveCpuPower = cpuScore * resSetting.cpuMult * presetSetting.cpuMult;

  // Weighted score according to game profile
  const compositeScore =
    effectiveGpuPower * game.gpuWeight + effectiveCpuPower * game.cpuWeight;

  // Ram capacity and DDR5 bonus/penalty
  let ramFactor = 1.0;
  if (ram) {
    const capacity = ram.specs.ramCapacityGB || 16;
    if (capacity < game.ramMinGB) {
      ramFactor *= 0.75; // Stuttering from low ram
    } else if (capacity >= 32) {
      ramFactor *= 1.06;
    }
    if (ram.specs.ramType === 'DDR5') {
      ramFactor *= 1.05;
    }
  }

  // Base FPS scaling inversely with game difficulty
  // difficulty 10 (Alan Wake 2) => scale 1.0, difficulty 5 => scale 2.0
  const difficultyFactor = (11 - game.baseDifficulty) / 5.5;
  const rawFps = compositeScore * 1.35 * difficultyFactor * ramFactor;

  // Realistic bounds
  const averageFps = Math.max(15, Math.round(rawFps));
  // 1% Low is usually 68% - 82% of average FPS depending on CPU strength
  const lowRatio = Math.min(0.85, 0.62 + (cpuScore / 100) * 0.22);
  const onePercentLowFps = Math.max(10, Math.round(averageFps * lowRatio));

  let tier: FpsResult['tier'] = 'playable';
  if (averageFps >= 140) {
    tier = 'ultra-smooth';
  } else if (averageFps >= 60) {
    tier = 'smooth';
  } else if (averageFps >= 35) {
    tier = 'playable';
  } else {
    tier = 'unplayable';
  }

  return {
    game,
    averageFps,
    onePercentLowFps,
    tier,
  };
}

export function analyzeBottleneck(cpu: Product | null, gpu: Product | null): BottleneckAnalysis {
  const cpuScore = cpu?.specs.benchmarkScore ?? 50;
  const gpuScore = gpu?.specs.benchmarkScore ?? 50;

  const ratio = cpuScore / gpuScore;

  if (ratio < 0.72) {
    const lossPct = Math.round((0.72 - ratio) * 45);
    return {
      status: 'cpu_bottleneck',
      percentage: Math.min(lossPct, 35),
      explanationRu: `Процессор слабее видеокарты. Видеокарта недогружена приблизительно на ${lossPct}%. Рекомендуется выбрать более мощный процессор.`,
      explanationUz: `Protsessor videokartadan kuchsizroq. Videokarta quvvati taxminan ${lossPct}% ga to'liq ishlatilmaydi. Kuchliroq protsessor tavsiya etiladi.`,
    };
  }

  if (ratio > 1.45) {
    return {
      status: 'gpu_bottleneck',
      percentage: Math.round((ratio - 1.45) * 25),
      explanationRu: 'Процессор имеет большой запас мощности. Графический процессор (GPU) загружен на 100%, что является идеальным для игр.',
      explanationUz: "Protsessorda katta zaxira quvvat bor. Videokarta (GPU) 100% yuklanishda ishlamoqda, bu o'yinlar uchun eng yaxshi holat.",
    };
  }

  return {
    status: 'balanced',
    percentage: 98,
    explanationRu: 'Идеальный баланс! Процессор и видеокарта отлично дополняют друг друга без существенных потерь производительности.',
    explanationUz: "Ideal muvozanat! Protsessor va videokarta unumdorlik yo'qotishlarisiz birgalikda to'liq uyg'unlikda ishlaydi.",
  };
}
