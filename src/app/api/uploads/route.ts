import { NextResponse } from 'next/server';
import {
  buildReceiptKey,
  getDownloadUrl,
  isStorageConfigured,
  uploadObject,
} from '@/lib/storage';

const MAX_FILE_SIZE_BYTES = 8 * 1024 * 1024; // 8 MB
const ALLOWED_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf',
]);

/**
 * Uploads a payment receipt to the Neon Object Storage bucket `assets`
 * and returns its key plus a short-lived presigned URL.
 */
export async function POST(req: Request) {
  try {
    if (!isStorageConfigured()) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Neon Object Storage не настроен: выполните `neon deploy`, чтобы получить AWS_* переменные.',
        },
        { status: 503 }
      );
    }

    const formData = await req.formData();
    const file = formData.get('file');

    if (!(file instanceof File)) {
      return NextResponse.json(
        { success: false, message: 'Файл не передан (поле "file")' },
        { status: 400 }
      );
    }

    if (file.size === 0) {
      return NextResponse.json({ success: false, message: 'Файл пустой' }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { success: false, message: 'Файл больше 8 МБ' },
        { status: 413 }
      );
    }

    const contentType = file.type || 'application/octet-stream';
    if (!ALLOWED_TYPES.has(contentType)) {
      return NextResponse.json(
        { success: false, message: `Неподдерживаемый тип файла: ${contentType}` },
        { status: 415 }
      );
    }

    const key = buildReceiptKey(file.name || 'receipt');
    const buffer = Buffer.from(await file.arrayBuffer());
    await uploadObject(key, buffer, contentType);

    return NextResponse.json({
      success: true,
      key,
      url: await getDownloadUrl(key, 3600),
      size: file.size,
      contentType,
    });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, message: errorMsg }, { status: 500 });
  }
}
