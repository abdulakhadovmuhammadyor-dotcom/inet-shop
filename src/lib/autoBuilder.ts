import { BuilderState, Product } from '@/types';
import { INITIAL_PRODUCTS } from '@/data/products';

export interface AutoBuildPreset {
  id: string;
  nameRu: string;
  nameUz: string;
  tagRu: string;
  tagUz: string;
  descRu: string;
  descUz: string;
  targetPriceUZS: number;
  icon: string;
  build: {
    cpuId: string;
    mbId: string;
    ramId: string;
    gpuId: string;
    storageId: string;
    coolerId: string;
    psuId: string;
    caseId: string;
  };
}

const findProduct = (id: string): Product | null => {
  return INITIAL_PRODUCTS.find((p) => p.id === id) || null;
};

export const AUTO_BUILD_PRESETS: AutoBuildPreset[] = [
  {
    id: 'budget-1080p',
    nameRu: 'Бюджетный Киберспорт (1080p)',
    nameUz: 'Byudjet Kibersport (1080p)',
    tagRu: 'Хит до 13 млн сум',
    tagUz: '13 mln so‘mgacha eng yaxshi',
    descRu: 'Народный ПК для CS2, Dota 2, GTA V и Warzone на высоких настройках.',
    descUz: "CS2, Dota 2, GTA V va Warzone uchun yuqori sozlamalarda xalqona kompyuter.",
    targetPriceUZS: 12540000,
    icon: '🎮',
    build: {
      cpuId: 'cpu-r5-5600',
      mbId: 'mb-b550-gaming-plus',
      ramId: 'ram-kingston-fury-16-ddr4',
      gpuId: 'gpu-rtx-4060',
      storageId: 'ssd-kingston-nv2-1tb',
      coolerId: 'cooler-thermalright-assassin-120',
      psuId: 'psu-deepcool-pk650d',
      caseId: 'case-nzxt-h6-flow-rgb', // ATX case so B550 ATX board fits perfectly
    },
  },
  {
    id: 'optimal-2k',
    nameRu: 'Оптимальный Гейминг (2K / 1440p)',
    nameUz: 'Optimal O‘yin PK (2K / 1440p)',
    tagRu: 'Хит продаж ~22 млн сум',
    tagUz: 'Eng ko‘p sotilgan ~22 mln',
    descRu: 'Мощный ПК на платформе AM5 и DDR5 с видеокартой RTX 4070 SUPER для любых современных игр на Ультра.',
    descUz: "Har qanday og'ir o'yinlar uchun AM5, DDR5 va RTX 4070 SUPER bilan optimal yechim.",
    targetPriceUZS: 22820000,
    icon: '⚡',
    build: {
      cpuId: 'cpu-r5-7600x',
      mbId: 'mb-b650-aorus-elite',
      ramId: 'ram-gskill-trident-32-ddr5',
      gpuId: 'gpu-rtx-4070-super',
      storageId: 'ssd-kingston-nv2-1tb',
      coolerId: 'cooler-deepcool-ak620-digital',
      psuId: 'psu-corsair-rm850x-shift',
      caseId: 'case-nzxt-h6-flow-rgb',
    },
  },
  {
    id: 'pro-gaming',
    nameRu: 'Киберспорт Pro & Стриминг',
    nameUz: 'Kibersport Pro va Striming',
    tagRu: 'Топ для 240Hz / 4K',
    tagUz: '240Hz va 4K uchun TOP',
    descRu: 'Лучший игровой процессор Ryzen 7 7800X3D с RTX 4080 Super, 32GB DDR5 и водяным охлаждением 360мм.',
    descUz: "Dunyoning eng yaxshi o'yin protsessori 7800X3D va RTX 4080 Super bilan beqiyos quvvat.",
    targetPriceUZS: 37950000,
    icon: '🏆',
    build: {
      cpuId: 'cpu-r7-7800x3d',
      mbId: 'mb-b650-aorus-elite',
      ramId: 'ram-gskill-trident-32-ddr5',
      gpuId: 'gpu-rtx-4080-super',
      storageId: 'ssd-samsung-990-pro-2tb',
      coolerId: 'cooler-nzxt-kraken-360-elite',
      psuId: 'psu-corsair-rm850x-shift',
      caseId: 'case-lian-li-o11-dynamic-evo',
    },
  },
  {
    id: 'ultra-beast',
    nameRu: 'Ultra 4K Beast (Флагман)',
    nameUz: 'Ultra 4K Maxluq (Flagman)',
    tagRu: 'Максимум возможностей',
    tagUz: 'Mutlaq quvvat',
    descRu: 'Бескомпромиссная мощь: Intel Core i9-14900KS, ASUS ROG RTX 4090 24GB, 64GB RAM и блок питания 1000W Platinum.',
    descUz: "Cheksiz quvvat: Intel i9-14900KS, RTX 4090 24GB va 64GB DDR5.",
    targetPriceUZS: 57450000,
    icon: '👑',
    build: {
      cpuId: 'cpu-i9-14900ks',
      mbId: 'mb-z790-strix-f',
      ramId: 'ram-corsair-vengeance-64-ddr5',
      gpuId: 'gpu-rtx-4090-rog',
      storageId: 'ssd-samsung-990-pro-2tb',
      coolerId: 'cooler-nzxt-kraken-360-elite',
      psuId: 'psu-seasonic-vertex-gx-1000',
      caseId: 'case-lian-li-o11-dynamic-evo',
    },
  },
];

export function buildFromPreset(presetId: string): BuilderState {
  const preset = AUTO_BUILD_PRESETS.find((p) => p.id === presetId) || AUTO_BUILD_PRESETS[1];
  return {
    cpu: findProduct(preset.build.cpuId),
    motherboard: findProduct(preset.build.mbId),
    ram: findProduct(preset.build.ramId),
    gpu: findProduct(preset.build.gpuId),
    storage: findProduct(preset.build.storageId),
    cooler: findProduct(preset.build.coolerId),
    psu: findProduct(preset.build.psuId),
    case: findProduct(preset.build.caseId),
  };
}

export function generateAutoBuildByBudget(
  budgetUZS: number,
  platform: 'amd' | 'intel' = 'amd'
): BuilderState {
  if (budgetUZS < 16000000) {
    // Budget build
    if (platform === 'intel') {
      return {
        cpu: findProduct('cpu-i5-14600kf'),
        motherboard: findProduct('mb-b760m-mortar'),
        ram: findProduct('ram-gskill-trident-32-ddr5'),
        gpu: findProduct('gpu-rtx-4060'),
        storage: findProduct('ssd-kingston-nv2-1tb'),
        cooler: findProduct('cooler-thermalright-assassin-120'),
        psu: findProduct('psu-deepcool-pk650d'),
        case: findProduct('case-deepcool-ch370'),
      };
    }
    return buildFromPreset('budget-1080p');
  }

  if (budgetUZS < 30000000) {
    // Mid-high build
    if (platform === 'intel') {
      return {
        cpu: findProduct('cpu-i7-14700k'),
        motherboard: findProduct('mb-z790-strix-f'),
        ram: findProduct('ram-gskill-trident-32-ddr5'),
        gpu: findProduct('gpu-rtx-4070-super'),
        storage: findProduct('ssd-kingston-nv2-1tb'),
        cooler: findProduct('cooler-deepcool-ak620-digital'),
        psu: findProduct('psu-corsair-rm850x-shift'),
        case: findProduct('case-nzxt-h6-flow-rgb'),
      };
    }
    return buildFromPreset('optimal-2k');
  }

  if (budgetUZS < 45000000) {
    // High tier
    return buildFromPreset('pro-gaming');
  }

  // Ultra enthusiast
  return buildFromPreset('ultra-beast');
}

/**
 * Automatically fixes any compatibility conflicts in an existing user build
 */
export function fixCompatibilityIssues(builder: BuilderState): BuilderState {
  const fixed: BuilderState = { ...builder };

  // 1. If CPU selected, fix Motherboard socket
  if (fixed.cpu) {
    const socket = fixed.cpu.specs.socket;
    if (fixed.motherboard && fixed.motherboard.specs.socket !== socket) {
      if (socket === 'AM5') fixed.motherboard = findProduct('mb-b650-aorus-elite');
      else if (socket === 'LGA1700') fixed.motherboard = findProduct('mb-z790-strix-f');
      else if (socket === 'AM4') fixed.motherboard = findProduct('mb-b550-gaming-plus');
    }
  }

  // 2. Fix RAM matching motherboard
  if (fixed.motherboard) {
    const reqRamType = fixed.motherboard.specs.ramType;
    if (fixed.ram && fixed.ram.specs.ramType !== reqRamType) {
      if (reqRamType === 'DDR5') fixed.ram = findProduct('ram-gskill-trident-32-ddr5');
      else fixed.ram = findProduct('ram-kingston-fury-16-ddr4');
    }
  }

  // 3. Fix Case matching ATX board
  if (fixed.motherboard?.specs.formFactor === 'ATX' && fixed.case?.specs.formFactor === 'Micro-ATX') {
    fixed.case = findProduct('case-nzxt-h6-flow-rgb');
  }

  // 4. Fix Cooler height
  if (fixed.cooler?.specs.coolerType === 'Air' && fixed.case) {
    const coolerH = fixed.cooler.specs.coolerHeightMm || 0;
    const caseH = fixed.case.specs.caseMaxCoolerHeightMm || 999;
    if (coolerH > caseH) {
      fixed.cooler = findProduct('cooler-thermalright-assassin-120');
    }
  }

  // 5. Fix PSU if underpowered
  if (fixed.gpu && fixed.gpu.specs.recommendedPsuWatts) {
    const reqW = fixed.gpu.specs.recommendedPsuWatts;
    if (!fixed.psu || (fixed.psu.specs.psuWattage || 0) < reqW) {
      if (reqW >= 1000) fixed.psu = findProduct('psu-seasonic-vertex-gx-1000');
      else if (reqW >= 750) fixed.psu = findProduct('psu-corsair-rm850x-shift');
      else fixed.psu = findProduct('psu-deepcool-pk650d');
    }
  }

  return fixed;
}
