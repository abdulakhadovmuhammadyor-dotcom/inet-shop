import { NextResponse } from 'next/server';
import { getTelegramCredentials } from '@/lib/telegram';

export async function GET() {
  const { token, chatId } = getTelegramCredentials();

  if (!token) {
    return NextResponse.json({
      success: false,
      status: 'missing_token',
      message: 'TELEGRAM_BOT_TOKEN не заполнен в файле .env.local! Получите токен у @BotFather.',
      chatId: chatId || null,
      hasToken: false,
    });
  }

  if (!chatId) {
    return NextResponse.json({
      success: false,
      status: 'missing_chat_id',
      message: 'TELEGRAM_RECEIPTS_CHAT_ID не заполнен в файле .env.local! Укажите числовой ID.',
      hasToken: true,
      chatId: null,
    });
  }

  try {
    // 1. Verify Bot Token with getMe
    const meRes = await fetch(`https://api.telegram.org/bot${token}/getMe`);
    const meData = await meRes.json();

    if (!meData.ok) {
      return NextResponse.json({
        success: false,
        status: 'invalid_token',
        message: `Токен бота недействителен: ${meData.description}`,
        hasToken: true,
        chatId,
      });
    }

    const botUsername = meData.result?.username;

    // 2. Try sending test message
    const sendRes = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: `🟢 <b>ТЕСТ СВЯЗИ CYBERFORGE STORE</b>\nПодключение к боту @${botUsername} успешно установлено! Чеки будут приходить сюда.`,
        parse_mode: 'HTML',
      }),
    });

    const sendData = await sendRes.json();

    if (sendData.ok) {
      return NextResponse.json({
        success: true,
        status: 'ok',
        botUsername,
        chatId,
        message: `Тестовое сообщение успешно доставлено ботом @${botUsername} в аккаунт ID: ${chatId}!`,
      });
    } else {
      let hint = '';
      if (sendData.error_code === 400 && sendData.description?.includes('chat not found')) {
        hint = `ОБЯЗАТЕЛЬНО откройте диалог с ботом @${botUsername} в Telegram и нажмите кнопку "Запустить" (/start)! Пока вы не нажали Start, бот не может отправить вам сообщение.`;
      } else if (sendData.error_code === 403) {
        hint = `Бот заблокирован. Разблокируйте бота @${botUsername} и отправьте /start.`;
      }

      return NextResponse.json({
        success: false,
        status: 'send_failed',
        botUsername,
        chatId,
        error_code: sendData.error_code,
        description: sendData.description,
        hint,
        message: `Бот найден (@${botUsername}), но не смог отправить сообщение в чат ${chatId}: ${sendData.description}. ${hint}`,
      });
    }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({
      success: false,
      status: 'network_error',
      message: `Сетевая ошибка: ${errorMsg}`,
    });
  }
}
