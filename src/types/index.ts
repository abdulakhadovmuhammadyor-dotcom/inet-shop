export type ComponentCategory =
  | 'cpu'
  | 'gpu'
  | 'motherboard'
  | 'ram'
  | 'storage'
  | 'psu'
  | 'case'
  | 'cooler';

export interface ProductSpecs {
  socket?: string; // e.g. "AM5", "LGA1700", "AM4"
  formFactor?: string; // "ATX", "Micro-ATX", "Mini-ITX"
  ramType?: 'DDR4' | 'DDR5';
  ramSlots?: number;
  maxRamGB?: number;
  ramSpeedMHz?: number;
  ramCapacityGB?: number;
  tdpWatts?: number; // Power consumed or cooler dissipation rating
  recommendedPsuWatts?: number;
  vramGB?: number;
  gpuLengthMm?: number;
  caseMaxGpuLengthMm?: number;
  caseMaxCoolerHeightMm?: number;
  coolerHeightMm?: number;
  coolerType?: 'Air' | 'Liquid240' | 'Liquid360';
  storageType?: 'NVMe M.2' | 'SATA SSD' | 'HDD';
  storageCapacityGB?: number;
  psuWattage?: number;
  psuEfficiency?: string; // "80+ Gold", "80+ Bronze", "80+ Platinum"
  rgb?: boolean;
  benchmarkScore?: number; // CPU or GPU performance index (1-100)
}

export interface Product {
  id: string;
  name: string;
  category: ComponentCategory;
  brand: string;
  priceUZS: number;
  image: string;
  inStock: boolean;
  stockCount: number;
  descriptionRu: string;
  descriptionUz: string;
  specs: ProductSpecs;
  featured?: boolean;
  model3D?: string; // Path to .glb 3D asset e.g. "/models/gpu.glb"
}

export interface Game {
  id: string;
  title: string;
  genre: string;
  releaseYear: number;
  coverImage: string;
  cpuWeight: number; // 0.1 to 1.0 (how CPU intensive)
  gpuWeight: number; // 0.1 to 1.0 (how GPU intensive)
  ramMinGB: number;
  vramMinGB: number;
  baseDifficulty: number; // 1 to 10 (10 = Alan Wake 2, Cyberpunk Ultra RT)
  optimalFpsTarget: number;
}

export type GraphicPreset = 'low' | 'medium' | 'high' | 'ultra';
export type Resolution = '1080p' | '1440p' | '4k';

export interface BuilderState {
  cpu: Product | null;
  gpu: Product | null;
  motherboard: Product | null;
  ram: Product | null;
  storage: Product | null;
  psu: Product | null;
  case: Product | null;
  cooler: Product | null;
}

export interface CompatibilityIssue {
  type: 'error' | 'warning';
  titleRu: string;
  titleUz: string;
  descRu: string;
  descUz: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  isCustomBuild?: boolean;
  buildSummary?: string;
}

export type OrderStatus = 'pending' | 'confirmed' | 'assembling' | 'shipped' | 'completed' | 'cancelled';

export interface Order {
  id: string;
  orderNumber: string;
  createdAt: string;
  customerName: string;
  customerPhone: string;
  customerTelegram?: string; // Optional customer telegram handle
  city: string;
  address: string;
  paymentMethod: 'click' | 'payme' | 'cash' | 'telegram';
  status: OrderStatus;
  items: CartItem[];
  totalUZS: number;
  notes?: string;
  isBuilderPc?: boolean;
  builderSpecs?: Partial<Record<ComponentCategory, string>>;
  receiptKey?: string; // Neon Object Storage key (bucket "assets")
  receiptImageUrl?: string; // Uploaded payment proof/receipt (presigned URL)
}

export type Language = 'ru' | 'uz';
export type Theme = 'dark' | 'light';
