import { NextResponse } from 'next/server';
import { sendTelegramReceipt } from '@/lib/telegram';
import { Order } from '@/types';

export async function POST(req: Request) {
  try {
    const contentType = req.headers.get('content-type') || '';

    let order: Order | null = null;
    let botToken: string | undefined = undefined;
    let chatId: string | undefined = undefined;
    let imageFile: File | null = null;

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const orderStr = formData.get('order') as string;
      if (orderStr) {
        order = JSON.parse(orderStr);
      }
      botToken = (formData.get('botToken') as string) || undefined;
      chatId = (formData.get('chatId') as string) || undefined;
      imageFile = formData.get('receiptImage') as File | null;
    } else {
      const body = await req.json();
      order = body.order;
      botToken = body.botToken;
      chatId = body.chatId;
    }

    if (!order || !order.orderNumber) {
      return NextResponse.json({ success: false, message: 'Некорректные данные заказа' }, { status: 400 });
    }

    const result = await sendTelegramReceipt(order, botToken, chatId, imageFile);
    return NextResponse.json(result);
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, message: errorMsg }, { status: 500 });
  }
}
