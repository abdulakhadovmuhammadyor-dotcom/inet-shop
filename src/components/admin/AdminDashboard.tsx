'use client';

import React, { useState, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { Game, Order, Product, ComponentCategory } from '@/types';
import { INITIAL_PRODUCTS } from '@/data/products';
import { INITIAL_GAMES } from '@/data/games';
import { formatPriceUZS, formatDate } from '@/lib/format';
import { getTranslation } from '@/lib/i18n';
import {
  Lock,
  KeyRound,
  Shield,
  Layers,
  Gamepad2,
  Receipt,
  BarChart3,
  Plus,
  Trash2,
  CheckCircle,
  Clock,
  Send,
  AlertCircle,
  Eye,
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const { language } = useStore();

  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);

  // Active Tab
  const [activeTab, setActiveTab] = useState<'products' | 'games' | 'orders' | 'stats'>('orders');

  // Stores
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [games, setGames] = useState<Game[]>(INITIAL_GAMES);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [showAddGameModal, setShowAddGameModal] = useState(false);
  const [previewReceiptImage, setPreviewReceiptImage] = useState<string | null>(null);
  const [testingTg, setTestingTg] = useState(false);

  // Telegram Config State
  const [tgBotToken, setTgBotToken] = useState('');
  const [tgChatId, setTgChatId] = useState('894671663');
  const [tgStatus, setTgStatus] = useState<string | null>(null);
  const [tgStatusType, setTgStatusType] = useState<'success' | 'error' | 'idle'>('idle');

  // New Product Form State
  const [newProdName, setNewProdName] = useState('');
  const [newProdCategory, setNewProdCategory] = useState<ComponentCategory>('gpu');
  const [newProdBrand, setNewProdBrand] = useState('NVIDIA');
  const [newProdPrice, setNewProdPrice] = useState(5000000);
  const [newProdImage, setNewProdImage] = useState('https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=600&q=80');
  const [newProdSocket, setNewProdSocket] = useState('');
  const [newProdTdp, setNewProdTdp] = useState(200);
  const [newProdVram, setNewProdVram] = useState(16);
  const [newProdScore, setNewProdScore] = useState(75);

  // New Game Form State
  const [newGameTitle, setNewGameTitle] = useState('');
  const [newGameGenre, setNewGameGenre] = useState('Action RPG');
  const [newGameYear, setNewGameYear] = useState(2025);
  const [newGameDifficulty, setNewGameDifficulty] = useState(9.0);
  const [newGameCover, setNewGameCover] = useState('https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=600&q=80');

  // Fetch initial dynamic data
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [pRes, gRes, oRes] = await Promise.all([
        fetch('/api/products').then((r) => r.json()),
        fetch('/api/games').then((r) => r.json()),
        fetch('/api/orders').then((r) => r.json()),
      ]);

      if (pRes.success) setProducts(pRes.products);
      if (gRes.success) setGames(gRes.games);
      if (oRes.success) setOrders(oRes.orders);

      // Fetch Telegram settings
      fetch('/api/telegram/save-settings')
        .then((r) => r.json())
        .then((d) => {
          if (d.token) setTgBotToken(d.token);
          if (d.chatId) setTgChatId(d.chatId);
          if (d.hasToken) {
            setTgStatus('🟢 Бот успешно подключен: @PcShop_abdulla_bot. Чек и заказы отправляются на ID ' + (d.chatId || '894671663'));
            setTgStatusType('success');
          }
        })
        .catch(() => {});
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Default PIN: 2026 or 7777
    if (pinInput === '2026' || pinInput === '7777') {
      setIsAuthenticated(true);
      setPinError(false);
    } else {
      setPinError(true);
    }
  };

  // Add Product Handler
  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const newProduct: Product = {
      id: `prod-${Date.now()}`,
      name: newProdName,
      category: newProdCategory,
      brand: newProdBrand,
      priceUZS: Number(newProdPrice),
      image: newProdImage,
      inStock: true,
      stockCount: 10,
      descriptionRu: `Новое поступление: ${newProdName}`,
      descriptionUz: `Yangi tovar: ${newProdName}`,
      specs: {
        socket: newProdSocket || undefined,
        tdpWatts: Number(newProdTdp),
        vramGB: newProdCategory === 'gpu' ? Number(newProdVram) : undefined,
        benchmarkScore: Number(newProdScore),
      },
    };

    const res = await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newProduct),
    });

    const data = await res.json();
    if (data.success) {
      setProducts([data.product, ...products]);
      setShowAddProductModal(false);
      setNewProdName('');
    }
  };

  // Add Game Handler
  const handleCreateGame = async (e: React.FormEvent) => {
    e.preventDefault();
    const newGame: Game = {
      id: newGameTitle.toLowerCase().replace(/[^a-z0-9]/g, '-'),
      title: newGameTitle,
      genre: newGameGenre,
      releaseYear: Number(newGameYear),
      coverImage: newGameCover,
      cpuWeight: 0.7,
      gpuWeight: 0.9,
      ramMinGB: 16,
      vramMinGB: 8,
      baseDifficulty: Number(newGameDifficulty),
      optimalFpsTarget: 80,
    };

    const res = await fetch('/api/games', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newGame),
    });

    const data = await res.json();
    if (data.success) {
      setGames([data.game, ...games]);
      setShowAddGameModal(false);
      setNewGameTitle('');
    }
  };

  // Update Order Status Handler
  const handleUpdateOrderStatus = async (orderId: string, status: Order['status']) => {
    const res = await fetch('/api/orders', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId, status }),
    });
    const data = await res.json();
    if (data.success) {
      setOrders(orders.map((o) => (o.id === orderId ? { ...o, status } : o)));
    }
  };

  // Delete product
  const handleDeleteProduct = async (id: string) => {
    await fetch(`/api/products?id=${id}`, { method: 'DELETE' });
    setProducts(products.filter((p) => p.id !== id));
  };

  // Delete game
  const handleDeleteGame = async (id: string) => {
    await fetch(`/api/games?id=${id}`, { method: 'DELETE' });
    setGames(games.filter((g) => g.id !== id));
  };

  // Calculate statistics
  const totalRevenueUZS = orders.reduce((sum, o) => sum + o.totalUZS, 0);
  const averageCheckUZS = orders.length > 0 ? Math.round(totalRevenueUZS / orders.length) : 0;

  // 1. PIN LOCK SCREEN
  if (!isAuthenticated) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 max-w-md w-full shadow-2xl text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 text-cyan-500 flex items-center justify-center mx-auto border border-cyan-500/30">
            <Lock className="w-8 h-8" />
          </div>

          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white">
              {getTranslation(language, 'adminTitle')}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {getTranslation(language, 'adminLoginRequired')}
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <input
                type="password"
                placeholder={getTranslation(language, 'adminPinPlaceholder')}
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                autoFocus
                className={`w-full px-4 py-3 rounded-xl text-center text-lg tracking-widest font-mono bg-slate-50 dark:bg-slate-800 border ${
                  pinError
                    ? 'border-red-500 ring-2 ring-red-500/20'
                    : 'border-slate-200 dark:border-slate-700 focus:border-cyan-500'
                } text-slate-900 dark:text-white focus:outline-none`}
              />
              {pinError && (
                <span className="text-xs text-red-500 mt-1 block">
                  {getTranslation(language, 'adminPinError')}
                </span>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm shadow-lg shadow-cyan-500/25 transition active:scale-95"
            >
              {getTranslation(language, 'adminLoginButton')}
            </button>

            <span className="text-[11px] text-slate-400 block">
              Подсказка: мастер PIN-код по умолчанию: <b>2026</b>
            </span>
          </form>
        </div>
      </div>
    );
  }

  // 2. AUTHENTICATED ADMIN PANEL DASHBOARD
  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-cyan-500" />
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              {getTranslation(language, 'adminTitle')}
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {getTranslation(language, 'adminSubtitle')}
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="inline-flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 border border-slate-200 dark:border-slate-700 text-xs font-bold">
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeTab === 'orders'
                ? 'bg-cyan-500 text-slate-950 shadow'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {getTranslation(language, 'adminTabOrders', orders.length)}
          </button>
          <button
            onClick={() => setActiveTab('products')}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeTab === 'products'
                ? 'bg-cyan-500 text-slate-950 shadow'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {getTranslation(language, 'adminTabProducts', products.length)}
          </button>
          <button
            onClick={() => setActiveTab('games')}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeTab === 'games'
                ? 'bg-cyan-500 text-slate-950 shadow'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {getTranslation(language, 'adminTabGames', games.length)}
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeTab === 'stats'
                ? 'bg-cyan-500 text-slate-950 shadow'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {getTranslation(language, 'adminTabStats')}
          </button>
        </div>
      </div>

      {/* TAB 1: ORDERS & RECEIPTS */}
      {activeTab === 'orders' && (
        <div className="space-y-6">
          {/* TELEGRAM BOT SETUP CARD */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center shrink-0 border border-cyan-500/20">
                  <Send className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm sm:text-base text-white">
                    Настройка Telegram бота для получения чеков
                  </h4>
                  <p className="text-xs text-slate-400">
                    Укажите токен бота из @BotFather и ваш Telegram ID, чтобы все заказы с фото чеков моментально приходили вам
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-2">
              <div className="sm:col-span-6 space-y-1">
                <label className="text-[11px] font-bold text-slate-300 block">
                  1. Токен бота из @BotFather (TELEGRAM_BOT_TOKEN):
                </label>
                <input
                  type="text"
                  placeholder="Например: 7812948123:AAFnJk2..."
                  value={tgBotToken}
                  onChange={(e) => setTgBotToken(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs font-mono text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="sm:col-span-4 space-y-1">
                <label className="text-[11px] font-bold text-slate-300 block">
                  2. Ваш числовой ID (TELEGRAM_RECEIPTS_CHAT_ID):
                </label>
                <input
                  type="text"
                  placeholder="894671663"
                  value={tgChatId}
                  onChange={(e) => setTgChatId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs font-mono text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="sm:col-span-2 flex items-end">
                <button
                  type="button"
                  onClick={async () => {
                    setTestingTg(true);
                    setTgStatus('Сохранение настроек и отправка тестового чека...');
                    setTgStatusType('idle');
                    try {
                      await fetch('/api/telegram/save-settings', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ token: tgBotToken, chatId: tgChatId }),
                      });

                      const testRes = await fetch('/api/telegram/test-connection');
                      const testData = await testRes.json();

                      setTgStatus(testData.message);
                      setTgStatusType(testData.success ? 'success' : 'error');
                    } catch (e: any) {
                      setTgStatus('Ошибка: ' + e.message);
                      setTgStatusType('error');
                    } finally {
                      setTestingTg(false);
                    }
                  }}
                  disabled={testingTg}
                  className="w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 transition active:scale-95 disabled:opacity-50"
                >
                  {testingTg ? 'Проверка...' : 'Сохранить и Тест'}
                </button>
              </div>
            </div>

            {tgStatus && (
              <div
                className={`p-3 rounded-xl text-xs font-medium border ${
                  tgStatusType === 'success'
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    : tgStatusType === 'error'
                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                    : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'
                }`}
              >
                {tgStatus}
              </div>
            )}
          </div>

          {/* ORDERS TABLE */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Receipt className="w-5 h-5 text-cyan-500" />
                Список заказов и отправка чеков
              </h3>
            </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="p-3 rounded-l-xl">Номер заказа</th>
                  <th className="p-3">Дата</th>
                  <th className="p-3">Клиент</th>
                  <th className="p-3">Telegram / Тел</th>
                  <th className="p-3">Сумма (UZS)</th>
                  <th className="p-3">Чек оплаты</th>
                  <th className="p-3">Статус</th>
                  <th className="p-3 rounded-r-xl">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {orders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="p-3 font-mono font-bold text-cyan-600 dark:text-cyan-400">
                      {ord.orderNumber}
                    </td>
                    <td className="p-3 text-slate-500">
                      {formatDate(ord.createdAt, language)}
                    </td>
                    <td className="p-3 font-semibold text-slate-800 dark:text-slate-200">
                      {ord.customerName}
                    </td>
                    <td className="p-3 font-mono">
                      <div className="text-cyan-500">{ord.customerTelegram || 'Не указан'}</div>
                      <div className="text-[11px] text-slate-400">{ord.customerPhone}</div>
                    </td>
                    <td className="p-3 font-extrabold text-slate-900 dark:text-white">
                      {formatPriceUZS(ord.totalUZS, language)}
                    </td>
                    <td className="p-3">
                      {ord.receiptImageUrl ? (
                        <button
                          onClick={() => setPreviewReceiptImage(ord.receiptImageUrl!)}
                          className="px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-[11px] font-bold flex items-center gap-1 hover:bg-emerald-500/20 transition"
                        >
                          <Eye className="w-3 h-3" />
                          <span>Фото чека</span>
                        </button>
                      ) : (
                        <span className="text-slate-400 text-[11px]">Нет фото</span>
                      )}
                    </td>
                    <td className="p-3">
                      <select
                        value={ord.status}
                        onChange={(e) =>
                          handleUpdateOrderStatus(ord.id, e.target.value as Order['status'])
                        }
                        className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 font-semibold text-[11px] border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200"
                      >
                        <option value="pending">Ожидает</option>
                        <option value="confirmed">Подтвержден</option>
                        <option value="assembling">На сборке</option>
                        <option value="shipped">Передан курьеру</option>
                        <option value="completed">Выполнен</option>
                      </select>
                    </td>
                    <td className="p-3">
                      <button
                        onClick={async () => {
                          const res = await fetch('/api/telegram/send-receipt', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ order: ord }),
                          });
                          const data = await res.json();
                          alert(data.message || 'Чек отправлен в Telegram!');
                        }}
                        className="px-2.5 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30 text-[11px] font-bold flex items-center gap-1 transition"
                      >
                        <Send className="w-3 h-3" />
                        <span>Чек в TG</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      )}

      {/* TAB 2: PRODUCTS */}
      {activeTab === 'products' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Каталог комплектующих ({products.length})
            </h3>
            <button
              onClick={() => setShowAddProductModal(true)}
              className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>{getTranslation(language, 'adminAddProduct')}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map((p) => (
              <div
                key={p.id}
                className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 flex items-center justify-between gap-3"
              >
                <img
                  src={p.image}
                  alt={p.name}
                  className="w-12 h-12 rounded-xl object-cover bg-slate-800 shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] font-bold text-cyan-500 uppercase">{p.category}</span>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1">{p.name}</h4>
                  <span className="text-xs font-black text-cyan-600 dark:text-cyan-400">
                    {formatPriceUZS(p.priceUZS, language)}
                  </span>
                </div>
                <button
                  onClick={() => handleDeleteProduct(p.id)}
                  className="p-2 text-slate-400 hover:text-red-500 transition"
                  title="Удалить"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: GAMES (FPS Benchmark database) */}
      {activeTab === 'games' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                База игр в FPS-калькуляторе ({games.length})
              </h3>
              <p className="text-xs text-slate-400">
                Предустановленная база тяжелых игр с возможностью добавления новых
              </p>
            </div>
            <button
              onClick={() => setShowAddGameModal(true)}
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5 transition active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>{getTranslation(language, 'adminAddGame')}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {games.map((g) => (
              <div
                key={g.id}
                className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 overflow-hidden flex flex-col justify-between"
              >
                <div className="relative aspect-[16/9] w-full">
                  <img src={g.coverImage} alt={g.title} className="w-full h-full object-cover" />
                  <button
                    onClick={() => handleDeleteGame(g.id)}
                    className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 text-red-400 hover:text-red-300 backdrop-blur-sm"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="p-3">
                  <span className="text-[10px] font-semibold text-purple-400 uppercase">{g.genre}</span>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1">{g.title}</h4>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2">
                    <span>Сложность: {g.baseDifficulty}/10</span>
                    <span>{g.releaseYear} г.</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: STATS */}
      {activeTab === 'stats' && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <span className="text-xs font-bold text-slate-400 uppercase">Общая выручка</span>
            <div className="text-2xl font-black text-cyan-500 mt-1">
              {formatPriceUZS(totalRevenueUZS, language)}
            </div>
          </div>
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <span className="text-xs font-bold text-slate-400 uppercase">Всего заказов</span>
            <div className="text-2xl font-black text-purple-500 mt-1">{orders.length}</div>
          </div>
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <span className="text-xs font-bold text-slate-400 uppercase">Средний чек</span>
            <div className="text-2xl font-black text-emerald-500 mt-1">
              {formatPriceUZS(averageCheckUZS, language)}
            </div>
          </div>
        </div>
      )}

      {/* Modal: Add Product */}
      {showAddProductModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <form
            onSubmit={handleCreateProduct}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-2xl"
          >
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Добавить новый компонент в каталог
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold block mb-1">Название детали</label>
                <input
                  type="text"
                  required
                  placeholder="MSI GeForce RTX 5080 16GB"
                  value={newProdName}
                  onChange={(e) => setNewProdName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1">Категория</label>
                  <select
                    value={newProdCategory}
                    onChange={(e) => setNewProdCategory(e.target.value as ComponentCategory)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  >
                    <option value="cpu">Процессор (CPU)</option>
                    <option value="gpu">Видеокарта (GPU)</option>
                    <option value="motherboard">Материнская плата</option>
                    <option value="ram">Оперативная память</option>
                    <option value="storage">SSD Накопитель</option>
                    <option value="psu">Блок питания</option>
                    <option value="case">Корпус</option>
                    <option value="cooler">Охлаждение</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold block mb-1">Бренд</label>
                  <input
                    type="text"
                    required
                    value={newProdBrand}
                    onChange={(e) => setNewProdBrand(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1">Цена в сумах (UZS)</label>
                  <input
                    type="number"
                    required
                    value={newProdPrice}
                    onChange={(e) => setNewProdPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1">TDP (Ватт)</label>
                  <input
                    type="number"
                    value={newProdTdp}
                    onChange={(e) => setNewProdTdp(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold block mb-1">URL изображения</label>
                <input
                  type="text"
                  value={newProdImage}
                  onChange={(e) => setNewProdImage(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowAddProductModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Отмена
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs"
              >
                Сохранить
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal: Add Game */}
      {showAddGameModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <form
            onSubmit={handleCreateGame}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-2xl"
          >
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Добавить новую игру в базу FPS-калькулятора
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold block mb-1">Название игры</label>
                <input
                  type="text"
                  required
                  placeholder="Grand Theft Auto VI"
                  value={newGameTitle}
                  onChange={(e) => setNewGameTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1">Жанр</label>
                  <input
                    type="text"
                    required
                    value={newGameGenre}
                    onChange={(e) => setNewGameGenre(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1">Год релиза</label>
                  <input
                    type="number"
                    value={newGameYear}
                    onChange={(e) => setNewGameYear(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold block mb-1">Тяжесть / Сложность графики (от 1 до 10)</label>
                <input
                  type="number"
                  step="0.1"
                  min="1"
                  max="10"
                  value={newGameDifficulty}
                  onChange={(e) => setNewGameDifficulty(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">URL обложки игры</label>
                <input
                  type="text"
                  value={newGameCover}
                  onChange={(e) => setNewGameCover(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowAddGameModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Отмена
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-purple-600 text-white font-bold text-xs"
              >
                Добавить в калькулятор
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal: Preview Receipt Image */}
      {previewReceiptImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-2xl w-full shadow-2xl relative space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Receipt className="w-5 h-5 text-cyan-500" />
                Скриншот чека об оплате покупателя
              </h3>
              <button
                onClick={() => setPreviewReceiptImage(null)}
                className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
              >
                ✕
              </button>
            </div>

            <div className="max-h-[70vh] overflow-auto rounded-2xl border border-slate-200 dark:border-slate-800 flex justify-center bg-slate-950/40 p-2">
              <img
                src={previewReceiptImage}
                alt="Чек покупателя"
                className="max-w-full max-h-[65vh] object-contain rounded-xl"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
