'use client';

import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { useStore } from '@/store/useStore';
import { formatPriceUZS } from '@/lib/format';
import { getTranslation } from '@/lib/i18n';
import { Order } from '@/types';
import {
  CheckCircle2,
  Send,
  CreditCard,
  QrCode,
  ShieldCheck,
  Receipt,
  X,
  Smartphone,
  MapPin,
  User,
  Upload,
  Image as ImageIcon,
  Trash2,
  AlertTriangle,
} from 'lucide-react';

interface OrderModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OrderModal: React.FC<OrderModalProps> = ({ isOpen, onClose }) => {
  const { language, cart, clearCart } = useStore();

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('+998 ');
  const [customerTelegram, setCustomerTelegram] = useState(''); // Optional!
  const [city, setCity] = useState('Ташкент');
  const [address, setAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<Order['paymentMethod']>('click');

  // Receipt image upload state
  const [receiptImageFile, setReceiptImageFile] = useState<File | null>(null);
  const [receiptImagePreview, setReceiptImagePreview] = useState<string | null>(null);

  // Completed order state
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);
  const [telegramStatusMessage, setTelegramStatusMessage] = useState<string | null>(null);
  const [isTelegramError, setIsTelegramError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const totalUZS = cart.reduce(
    (sum, item) => sum + item.product.priceUZS * item.quantity,
    0
  );

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setReceiptImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setReceiptImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setReceiptImageFile(null);
    setReceiptImagePreview(null);
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !customerPhone || cart.length === 0) return;

    setIsSubmitting(true);

    const formattedTelegram = customerTelegram.trim()
      ? customerTelegram.startsWith('@')
        ? customerTelegram
        : `@${customerTelegram}`
      : undefined;

    const orderData: Order = {
      id: `ord-${Date.now()}`,
      orderNumber: `CF-${Math.floor(10000 + Math.random() * 90000)}`,
      createdAt: new Date().toISOString(),
      customerName,
      customerPhone,
      customerTelegram: formattedTelegram || '',
      city,
      address,
      paymentMethod,
      status: 'confirmed',
      items: [...cart],
      totalUZS,
    };

    try {
      // 1. Upload the payment receipt to Neon Object Storage (bucket "assets")
      if (receiptImageFile) {
        const uploadData = new FormData();
        uploadData.append('file', receiptImageFile);

        const uploadRes = await fetch('/api/uploads', {
          method: 'POST',
          body: uploadData,
        });
        const uploaded = await uploadRes.json();

        if (uploaded.success) {
          orderData.receiptKey = uploaded.key;
          orderData.receiptImageUrl = uploaded.url;
        } else {
          console.error('Receipt upload failed:', uploaded.message);
        }
      }

      // 2. Save order to backend (Neon Postgres)
      await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
      });

      // 3. Dispatch to Telegram (with uploaded receipt image if attached)
      let tgRes: Response;

      if (receiptImageFile) {
        const formData = new FormData();
        formData.append('order', JSON.stringify(orderData));
        formData.append('receiptImage', receiptImageFile);

        tgRes = await fetch('/api/telegram/send-receipt', {
          method: 'POST',
          body: formData,
        });
      } else {
        tgRes = await fetch('/api/telegram/send-receipt', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            order: orderData,
          }),
        });
      }

      const tgData = await tgRes.json();
      setTelegramStatusMessage(tgData.message);
      setIsTelegramError(!tgData.success);

      // 3. Fireworks celebration!
      confetti({
        particleCount: 120,
        spread: 70,
        origin: { y: 0.6 },
      });

      setCompletedOrder(orderData);
      clearCart();
    } catch (err: unknown) {
      console.error(err);
      setCompletedOrder(orderData);
      clearCart();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {completedOrder ? (
          // DIGITAL FISCAL RECEIPT VIEW
          <div className="space-y-6 animate-in zoom-in-95 duration-300">
            {/* Header Success */}
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white">
                Заказ успешно оформлен!
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Электронный чек сформирован и передан в систему учета
              </p>
            </div>

            {/* Telegram Notification Banner */}
            <div
              className={`p-4 rounded-2xl border flex items-start gap-3 ${
                isTelegramError
                  ? 'bg-amber-500/10 border-amber-500/30'
                  : 'bg-cyan-500/10 border-cyan-500/30'
              }`}
            >
              {isTelegramError ? (
                <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              ) : (
                <Send className="w-5 h-5 text-cyan-500 shrink-0 mt-0.5" />
              )}
              <div className="text-xs">
                <span
                  className={`font-bold block mb-0.5 ${
                    isTelegramError
                      ? 'text-amber-600 dark:text-amber-400'
                      : 'text-cyan-600 dark:text-cyan-400'
                  }`}
                >
                  Статус отправки в Telegram:
                </span>
                <p className="text-slate-700 dark:text-slate-300">
                  {telegramStatusMessage ||
                    `Детали заказа направлены в Telegram.`}
                </p>
              </div>
            </div>

            {/* If receipt screenshot was uploaded, show miniature preview */}
            {receiptImagePreview && (
              <div className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center gap-3">
                <img
                  src={receiptImagePreview}
                  alt="Чек об оплате"
                  className="w-14 h-14 object-cover rounded-xl border border-slate-300 dark:border-slate-700 shrink-0"
                />
                <div className="text-xs">
                  <span className="font-bold text-slate-900 dark:text-white block">
                    Скриншот чека прикреплен:
                  </span>
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400">
                    ✓ Фото передано администратору в Telegram
                  </span>
                </div>
              </div>
            )}

            {/* Printable Digital Receipt Card */}
            <div className="p-5 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950/70 font-mono text-xs space-y-4 text-slate-800 dark:text-slate-200">
              <div className="text-center border-b border-dashed border-slate-300 dark:border-slate-700 pb-3">
                <h4 className="font-bold text-sm tracking-widest text-slate-900 dark:text-white">
                  {getTranslation(language, 'receiptStore')}
                </h4>
                <p className="text-[10px] text-slate-500">
                  {getTranslation(language, 'receiptInn')}
                </p>
                <p className="text-[10px] text-slate-500">г. Ташкент, ТЦ "Малика", А-12</p>
                <div className="mt-1 font-bold text-cyan-600 dark:text-cyan-400">
                  ЧЕК № {completedOrder.orderNumber}
                </div>
              </div>

              {/* Customer info */}
              <div className="space-y-1 text-[11px] pb-2 border-b border-dashed border-slate-300 dark:border-slate-700">
                <div>Клиент: <b>{completedOrder.customerName}</b></div>
                <div>Телефон: <b>{completedOrder.customerPhone}</b></div>
                <div>Telegram: <b>{completedOrder.customerTelegram || 'Не указан'}</b></div>
                <div>Адрес: <b>{completedOrder.city}, {completedOrder.address}</b></div>
                <div>Оплата: <b>{completedOrder.paymentMethod.toUpperCase()}</b></div>
              </div>

              {/* Items List */}
              <div className="space-y-2 py-1">
                {completedOrder.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-start text-[11px]">
                    <div className="flex-1 pr-2">
                      <div className="font-bold line-clamp-1">{item.product.name}</div>
                      <div className="text-[10px] text-slate-500">
                        {item.quantity} x {formatPriceUZS(item.product.priceUZS, language)}
                      </div>
                    </div>
                    <div className="font-bold">
                      {formatPriceUZS(item.product.priceUZS * item.quantity, language)}
                    </div>
                  </div>
                ))}
              </div>

              {/* Total */}
              <div className="border-t-2 border-slate-400 dark:border-slate-600 pt-3 flex justify-between items-baseline font-black text-sm text-slate-900 dark:text-white">
                <span>{getTranslation(language, 'receiptTotal')}</span>
                <span className="text-base text-cyan-600 dark:text-cyan-400">
                  {formatPriceUZS(completedOrder.totalUZS, language)}
                </span>
              </div>

              {/* QR and Barcode Mock */}
              <div className="pt-2 flex items-center justify-between border-t border-dashed border-slate-300 dark:border-slate-700 text-[10px] text-slate-400">
                <div className="flex items-center gap-2">
                  <QrCode className="w-8 h-8 text-slate-700 dark:text-slate-300" />
                  <span>Сканируйте для проверки чека</span>
                </div>
                <div className="text-right">
                  <ShieldCheck className="w-5 h-5 text-emerald-500 ml-auto" />
                  <span>Гарантия 12-36 мес.</span>
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:hover:bg-slate-200 dark:text-slate-950 font-bold text-sm transition"
            >
              {getTranslation(language, 'closeModal')}
            </button>
          </div>
        ) : (
          // CHECKOUT FORM VIEW
          <form onSubmit={handleSubmitOrder} className="space-y-5">
            <div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Receipt className="w-5 h-5 text-cyan-500" />
                {getTranslation(language, 'orderFormTitle')}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {getTranslation(language, 'telegramReceiptNote')}
              </p>
            </div>

            {/* Inputs */}
            <div className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  {getTranslation(language, 'customerName')} *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Алишер Усманов"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                    <Smartphone className="w-3.5 h-3.5 text-slate-400" />
                    {getTranslation(language, 'customerPhone')} *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="+998 90 123-45-67"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Send className="w-3.5 h-3.5 text-cyan-500" />
                      Telegram (@username)
                    </span>
                    <span className="text-[10px] text-slate-400 font-normal">Не обязательно</span>
                  </label>
                  <input
                    type="text"
                    placeholder="@alisher_pc (по желанию)"
                    value={customerTelegram}
                    onChange={(e) => setCustomerTelegram(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 block">
                    {getTranslation(language, 'city')}
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    {getTranslation(language, 'address')}
                  </label>
                  <input
                    type="text"
                    placeholder="ул. Амира Темура, дом 10"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              {/* Payment Method Selector */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 block">
                  {getTranslation(language, 'paymentMethod')}
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'click', label: 'Click Up', color: 'text-blue-500' },
                    { id: 'payme', label: 'Payme', color: 'text-emerald-500' },
                    { id: 'telegram', label: 'Telegram Bot', color: 'text-cyan-500' },
                    { id: 'cash', label: 'Наличными', color: 'text-slate-400' },
                  ].map((pm) => (
                    <button
                      key={pm.id}
                      type="button"
                      onClick={() => setPaymentMethod(pm.id as Order['paymentMethod'])}
                      className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center justify-center gap-1 transition ${
                        paymentMethod === pm.id
                          ? 'border-cyan-500 bg-cyan-500/10 text-slate-900 dark:text-white ring-2 ring-cyan-500/20'
                          : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-500 hover:border-slate-400'
                      }`}
                    >
                      <CreditCard className={`w-4 h-4 ${pm.color}`} />
                      <span>{pm.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* UPLOAD RECEIPT SCREENSHOT / PHOTO */}
              <div className="p-3.5 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-950/40 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-cyan-500" />
                    Загрузить фото / скриншот чека об оплате:
                  </span>
                  <span className="text-[10px] text-slate-400">Опционально</span>
                </div>

                {receiptImagePreview ? (
                  <div className="flex items-center justify-between gap-3 p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={receiptImagePreview}
                        alt="Чек"
                        className="w-12 h-12 object-cover rounded-lg border border-slate-200 dark:border-slate-700"
                      />
                      <div className="text-xs">
                        <span className="font-bold text-slate-900 dark:text-white block line-clamp-1">
                          {receiptImageFile?.name || 'Чек оплаты'}
                        </span>
                        <span className="text-[10px] text-emerald-500 font-semibold">
                          ✓ Фото готово к отправке в Telegram
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={removeImage}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-500/10 transition"
                      title="Удалить файл"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center p-3 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 hover:border-cyan-500 bg-white dark:bg-slate-900 cursor-pointer transition">
                    <Upload className="w-5 h-5 text-cyan-500 mb-1" />
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Нажмите, чтобы выбрать скриншот чека (Click / Payme)
                    </span>
                    <span className="text-[10px] text-slate-400 mt-0.5">
                      PNG, JPG, WEBP — скриншот придет прямо в Telegram администратора
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              {/* Telegram Delivery Badge */}
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                <Send className="w-4 h-4 shrink-0" />
                <span>
                  Чек и детали заказа отправятся прямо в ваш Telegram (@PcShop_abdulla_bot)
                </span>
              </div>
            </div>

            {/* Total and Submit */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
              <div className="flex items-baseline justify-between">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  {getTranslation(language, 'cartTotal')}
                </span>
                <span className="text-2xl font-black text-cyan-600 dark:text-cyan-400">
                  {formatPriceUZS(totalUZS, language)}
                </span>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || cart.length === 0}
                className="w-full py-3.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-cyan-500/25 transition active:scale-95 disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                <span>
                  {isSubmitting
                    ? 'Отправка чека...'
                    : getTranslation(language, 'confirmOrder')}
                </span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
