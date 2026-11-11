import { BuilderState, CompatibilityIssue } from '@/types';

export function calculateTotalTdp(builder: BuilderState): number {
  let total = 0;
  if (builder.cpu?.specs.tdpWatts) total += builder.cpu.specs.tdpWatts;
  if (builder.gpu?.specs.tdpWatts) total += builder.gpu.specs.tdpWatts;
  if (builder.motherboard?.specs.tdpWatts) total += builder.motherboard.specs.tdpWatts;
  if (builder.ram?.specs.tdpWatts) total += builder.ram.specs.tdpWatts;
  if (builder.storage?.specs.tdpWatts) total += builder.storage.specs.tdpWatts;
  if (builder.cooler?.specs.tdpWatts) total += 15; // Pump / fan draw
  // Baseline system & case fans draw
  total += 35;
  return total;
}

export function calculateRecommendedPsu(builder: BuilderState): number {
  const totalTdp = calculateTotalTdp(builder);
  // Give 25-30% overhead for transient spikes
  const target = Math.ceil((totalTdp * 1.3) / 50) * 50;
  return Math.max(target, 550);
}

export function checkCompatibility(builder: BuilderState): CompatibilityIssue[] {
  const issues: CompatibilityIssue[] = [];

  // 1. CPU vs Motherboard Socket
  if (builder.cpu && builder.motherboard) {
    const cpuSocket = builder.cpu.specs.socket;
    const mbSocket = builder.motherboard.specs.socket;
    if (cpuSocket && mbSocket && cpuSocket !== mbSocket) {
      issues.push({
        type: 'error',
        titleRu: 'Несовместимость сокетов CPU и материнской платы',
        titleUz: 'CPU va Ona plata soketi mos emas',
        descRu: `Процессор ${builder.cpu.name} использует сокет ${cpuSocket}, а материнская плата ${builder.motherboard.name} имеет сокет ${mbSocket}. Они физически несовместимы.`,
        descUz: `${builder.cpu.name} protsessori ${cpuSocket} soketiga ega, ammo ${builder.motherboard.name} platasi ${mbSocket} soketini talab qiladi.`,
      });
    }
  }

  // 2. Motherboard RAM Type vs RAM Module Type
  if (builder.motherboard && builder.ram) {
    const mbRamType = builder.motherboard.specs.ramType;
    const ramType = builder.ram.specs.ramType;
    if (mbRamType && ramType && mbRamType !== ramType) {
      issues.push({
        type: 'error',
        titleRu: 'Несовместимость типа оперативной памяти',
        titleUz: 'Operativ xotira (RAM) turi mos emas',
        descRu: `Плата ${builder.motherboard.name} поддерживает только память стандарта ${mbRamType}, а вы выбрали модуль ${ramType}.`,
        descUz: `${builder.motherboard.name} platasi faqat ${mbRamType} xotirani qo'llaydi, siz esa ${ramType} tanladingiz.`,
      });
    }
  }

  // 3. Motherboard Form Factor vs Case Form Factor
  if (builder.motherboard && builder.case) {
    const mbForm = builder.motherboard.specs.formFactor; // e.g. "ATX", "Micro-ATX"
    const caseForm = builder.case.specs.formFactor;
    if (mbForm === 'ATX' && caseForm === 'Micro-ATX') {
      issues.push({
        type: 'error',
        titleRu: 'Форм-фактор материнской платы превышает размер корпуса',
        titleUz: 'Ona plata o‘lchami korpusga sig‘maydi',
        descRu: `Материнская плата стандарта ${mbForm} не поместится в компактный корпус ${builder.case.name} (${caseForm}).`,
        descUz: `${mbForm} formatidagi ona plata ${builder.case.name} (${caseForm}) ixcham korpusiga sig'maydi.`,
      });
    }
  }

  // 4. GPU Length vs Case Max GPU Clearance
  if (builder.gpu && builder.case) {
    const gpuLen = builder.gpu.specs.gpuLengthMm || 0;
    const caseMaxGpu = builder.case.specs.caseMaxGpuLengthMm || 999;
    if (gpuLen > caseMaxGpu) {
      issues.push({
        type: 'error',
        titleRu: 'Видеокарта слишком длинная для выбранного корпуса',
        titleUz: 'Videokarta korpus uchun juda uzun',
        descRu: `Длина видеокарты (${gpuLen} мм) превышает максимальное допустимое пространство корпуса (${caseMaxGpu} мм).`,
        descUz: `Videokarta uzunligi (${gpuLen} mm) korpus ruxsat bergan maksimal o'lchamdan (${caseMaxGpu} mm) katta.`,
      });
    }
  }

  // 5. Air Cooler Height vs Case Max Cooler Clearance
  if (builder.cooler && builder.case && builder.cooler.specs.coolerType === 'Air') {
    const coolerH = builder.cooler.specs.coolerHeightMm || 0;
    const caseMaxH = builder.case.specs.caseMaxCoolerHeightMm || 999;
    if (coolerH > caseMaxH) {
      issues.push({
        type: 'error',
        titleRu: 'Кулер процессора не помещается по высоте',
        titleUz: 'Sovutgich balandligi korpusga to‘g‘ri kelmaydi',
        descRu: `Высота кулера (${coolerH} мм) превышает максимальную высоту кулера в корпусе (${caseMaxH} мм). Боковая крышка не закроется.`,
        descUz: `Kuler balandligi (${coolerH} mm) korpus ruxsatidan (${caseMaxH} mm) baland. Yon qopqoq yopilmaydi.`,
      });
    }
  }

  // 6. Power Supply Wattage vs Required System TDP
  if (builder.psu) {
    const psuW = builder.psu.specs.psuWattage || 0;
    const recommendedW = calculateRecommendedPsu(builder);
    if (psuW < recommendedW) {
      issues.push({
        type: 'warning',
        titleRu: 'Рекомендуется более мощный блок питания',
        titleUz: 'Kattaroq quvvatga ega PSU tavsiya etiladi',
        descRu: `Выбран блок питания на ${psuW}W, тогда как для пиковых нагрузок данной сборки рекомендуется не менее ${recommendedW}W.`,
        descUz: `${psuW}W quvvat manbai tanlangan, ammo ushbu tizim uchun kamida ${recommendedW}W tavsiya etiladi.`,
      });
    }
  }

  return issues;
}
