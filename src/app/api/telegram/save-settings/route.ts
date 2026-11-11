import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getTelegramCredentials } from '@/lib/telegram';

export async function GET() {
  const { token, chatId } = getTelegramCredentials();

  return NextResponse.json({
    token: token || '',
    tokenMasked: token ? `${token.substring(0, 10)}...${token.slice(-5)}` : '',
    hasToken: Boolean(token),
    chatId: chatId || '',
  });
}

export async function POST(req: Request) {
  try {
    const { token, chatId } = await req.json();

    const envPath = path.join(process.cwd(), '.env.local');
    let content = '';

    if (fs.existsSync(envPath)) {
      content = fs.readFileSync(envPath, 'utf8');
    }

    // Only update TELEGRAM_BOT_TOKEN if provided
    if (token && token.trim()) {
      if (content.includes('TELEGRAM_BOT_TOKEN=')) {
        content = content.replace(/TELEGRAM_BOT_TOKEN=.*(\r?\n|$)/, `TELEGRAM_BOT_TOKEN="${token.trim()}"$1`);
      } else {
        content += `\nTELEGRAM_BOT_TOKEN="${token.trim()}"\n`;
      }
      process.env.TELEGRAM_BOT_TOKEN = token.trim();
    }

    // Update or add TELEGRAM_RECEIPTS_CHAT_ID
    if (chatId && chatId.trim()) {
      if (content.includes('TELEGRAM_RECEIPTS_CHAT_ID=')) {
        content = content.replace(/TELEGRAM_RECEIPTS_CHAT_ID=.*(\r?\n|$)/, `TELEGRAM_RECEIPTS_CHAT_ID="${chatId.trim()}"$1`);
      } else {
        content += `\nTELEGRAM_RECEIPTS_CHAT_ID="${chatId.trim()}"\n`;
      }
      process.env.TELEGRAM_RECEIPTS_CHAT_ID = chatId.trim();
    }

    fs.writeFileSync(envPath, content, 'utf8');

    return NextResponse.json({
      success: true,
      message: 'Настройки Telegram бота успешно сохранены!',
      hasToken: Boolean(process.env.TELEGRAM_BOT_TOKEN),
      chatId: process.env.TELEGRAM_RECEIPTS_CHAT_ID,
    });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, message: errorMsg }, { status: 500 });
  }
}
