import fs from 'fs';
import path from 'path';
import { Order } from '@/types';
import { formatPriceUZS } from './format';

export interface TelegramReceiptPayload {
  order: Order;
  botToken?: string;
  chatId?: string;
  imageFile?: File | Blob | null;
}

export function getTelegramCredentials(): { token: string; chatId: string } {
  let token = process.env.TELEGRAM_BOT_TOKEN || '';
  let chatId = process.env.TELEGRAM_RECEIPTS_CHAT_ID || process.env.TELEGRAM_ADMIN_CHAT_ID || '';

  // Dynamically inspect .env.local on disk if empty in memory
  if (!token || !chatId) {
    try {
      const envPath = path.join(process.cwd(), '.env.local');
      if (fs.existsSync(envPath)) {
        const content = fs.readFileSync(envPath, 'utf8');
        const tokenMatch = content.match(/TELEGRAM_BOT_TOKEN=["']?([^"'\r\n]+)["']?/);
        if (tokenMatch && tokenMatch[1]) {
          token = tokenMatch[1].trim();
          process.env.TELEGRAM_BOT_TOKEN = token;
        }
        const chatMatch = content.match(/TELEGRAM_RECEIPTS_CHAT_ID=["']?([^"'\r\n]+)["']?/);
        if (chatMatch && chatMatch[1]) {
          chatId = chatMatch[1].trim();
          process.env.TELEGRAM_RECEIPTS_CHAT_ID = chatId;
        }
      }
    } catch {
      // Ignore read errors
    }
  }

  return { token, chatId };
}

export function generateTelegramReceiptMessage(order: Order): string {
  const dateFormatted = new Date(order.createdAt).toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const paymentLabels: Record<Order['paymentMethod'], string> = {
    click: 'Click Up (Онлайн)',
    payme: 'Payme (Онлайн)',
    cash: 'Наличными при получении',
    telegram: 'Оплата в Telegram Bot',
  };

  let itemsText = '';
  order.items.forEach((item, index) => {
    const itemTotal = formatPriceUZS(item.product.priceUZS * item.quantity);
    itemsText += `<b>${index + 1}. ${item.product.name}</b>\n`;
    itemsText += `   └ ${item.quantity} шт. × ${formatPriceUZS(item.product.priceUZS)} = <code>${itemTotal}</code>\n`;
  });

  const tgHandle = order.customerTelegram?.trim() ? order.customerTelegram : '<i>Не указан</i>';

  const message = `
🧾 <b>ЭЛЕКТРОННЫЙ ФИСКАЛЬНЫЙ ЧЕК ЗАКАЗА №${order.orderNumber}</b>
🏬 <b>CYBERFORGE COMPUTERS TASHKENT</b>
───────────────
📅 <b>Дата:</b> ${dateFormatted}
👤 <b>Клиент:</b> ${order.customerName}
📞 <b>Тел:</b> <code>${order.customerPhone}</code>
💬 <b>Telegram:</b> ${tgHandle}
📍 <b>Адрес:</b> ${order.city}, ${order.address}
💳 <b>Оплата:</b> ${paymentLabels[order.paymentMethod] || order.paymentMethod}
${order.receiptImageUrl ? '📎 <b>Чек оплаты:</b> Прикреплен к заказу' : ''}
───────────────
📦 <b>СОСТАВ ЗАКАЗА:</b>
${itemsText}
───────────────
💰 <b>ИТОГО К ОПЛАТЕ:</b> <code>${formatPriceUZS(order.totalUZS)}</code>
🛡️ <b>Гарантия:</b> 12-36 мес. Официальный гарантийный талон вложен.
QR-код проверки чека: https://cyberforge.uz/check/${order.orderNumber}
───────────────
<i>Спасибо за покупку в CYBERFORGE!</i>
`.trim();

  return message;
}

export async function sendTelegramReceipt(
  order: Order,
  customBotToken?: string,
  customChatId?: string,
  imageFile?: File | Blob | null
): Promise<{ success: boolean; message: string; simulated?: boolean; targetId?: string; details?: any }> {
  const creds = getTelegramCredentials();
  const token = customBotToken || creds.token;

  // The destination Telegram chat/user ID
  const targetChatId =
    creds.chatId ||
    customChatId ||
    (order.customerTelegram ? order.customerTelegram.replace('@', '') : '');

  // 1. Check if token is configured
  if (!token) {
    return {
      success: false,
      simulated: true,
      message:
        '⚠️ Токен бота (TELEGRAM_BOT_TOKEN) пуст в файле .env.local! Создайте бота в @BotFather, скопируйте токен и вставьте в .env.local.',
      targetId: targetChatId,
    };
  }

  // 2. Check if destination Chat ID is configured
  if (!targetChatId) {
    return {
      success: false,
      message:
        '⚠️ Не указан TELEGRAM_RECEIPTS_CHAT_ID в .env.local! Укажите ваш числовой ID (например, 894671663), чтобы бот знал, куда отправлять чеки.',
      targetId: targetChatId,
    };
  }

  const text = generateTelegramReceiptMessage(order);

  try {
    // A. If user uploaded a receipt screenshot/photo, send via sendPhoto
    if (imageFile) {
      const formData = new FormData();
      formData.append('chat_id', targetChatId);
      formData.append('photo', imageFile);

      // Short caption (max 1024 chars for Telegram sendPhoto)
      const caption = `📸 <b>ПРИКРЕПЛЕННЫЙ ЧЕК ОБ ОПЛАТЕ</b>\n` +
        `📦 Заказ: <b>№${order.orderNumber}</b>\n` +
        `👤 Клиент: ${order.customerName} (${order.customerPhone})\n` +
        `💰 Сумма: <b>${formatPriceUZS(order.totalUZS)}</b>\n` +
        `💳 Метод: ${order.paymentMethod.toUpperCase()}`;

      formData.append('caption', caption);
      formData.append('parse_mode', 'HTML');

      const photoRes = await fetch(`https://api.telegram.org/bot${token}/sendPhoto`, {
        method: 'POST',
        body: formData,
      });

      const photoData = await photoRes.json();
      if (!photoData.ok) {
        console.error('Telegram sendPhoto error:', photoData);
        // Continue to send full text message even if photo upload had an issue
      }
    }

    // B. Send full detailed receipt text
    const textRes = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: targetChatId,
        text: text,
        parse_mode: 'HTML',
      }),
    });

    const textData = await textRes.json();

    if (textData.ok) {
      return {
        success: true,
        message: `Чек${imageFile ? ' с фото' : ''} успешно отправлен в ваш Telegram (${targetChatId})!`,
        targetId: targetChatId,
      };
    } else {
      let help = '';
      if (textData.error_code === 401) {
        help = ' (Неверный TELEGRAM_BOT_TOKEN! Проверьте токен, выданный @BotFather)';
      } else if (textData.error_code === 400 && textData.description?.includes('chat not found')) {
        help = ' (Чат не найден! Вы должны открыть бота в Telegram и нажать кнопку "Старт" /start, чтобы бот мог вам писать)';
      } else if (textData.error_code === 403) {
        help = ' (Бот заблокирован или вы еще не нажали "Старт" в диалоге с ботом)';
      }

      return {
        success: false,
        message: `Ошибка Telegram API: ${textData.description}${help}`,
        targetId: targetChatId,
        details: textData,
      };
    }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error';
    return {
      success: false,
      message: `Сетевая ошибка при обращении к Telegram: ${errorMsg}`,
      targetId: targetChatId,
    };
  }
}
