import { NextResponse } from 'next/server';
import { ensureSchema, query } from '@/lib/db';
import { getDownloadUrl, isStorageConfigured } from '@/lib/storage';
import { CartItem, Order } from '@/types';

interface OrderRow {
  id: string;
  order_number: string;
  created_at: Date;
  customer_name: string;
  customer_phone: string;
  customer_telegram: string | null;
  city: string;
  address: string;
  payment_method: Order['paymentMethod'];
  status: Order['status'];
  items: CartItem[];
  total_uzs: string;
  notes: string | null;
  is_builder_pc: boolean;
  builder_specs: Order['builderSpecs'] | null;
  receipt_key: string | null;
  receipt_image_url: string | null;
}

const SELECT_ORDERS = `
  SELECT id, order_number, created_at, customer_name, customer_phone, customer_telegram,
         city, address, payment_method, status, items, total_uzs, notes, is_builder_pc,
         builder_specs, receipt_key, receipt_image_url
  FROM orders
`;

async function toOrder(row: OrderRow): Promise<Order> {
  // Private bucket: hand the admin a short-lived presigned URL for the receipt.
  let receiptImageUrl = row.receipt_image_url ?? undefined;
  if (row.receipt_key && isStorageConfigured()) {
    try {
      receiptImageUrl = await getDownloadUrl(row.receipt_key, 3600);
    } catch {
      // Keep whatever was stored if presigning fails.
    }
  }

  return {
    id: row.id,
    orderNumber: row.order_number,
    createdAt: new Date(row.created_at).toISOString(),
    customerName: row.customer_name,
    customerPhone: row.customer_phone,
    customerTelegram: row.customer_telegram ?? undefined,
    city: row.city,
    address: row.address,
    paymentMethod: row.payment_method,
    status: row.status,
    items: row.items ?? [],
    totalUZS: Number(row.total_uzs),
    notes: row.notes ?? undefined,
    isBuilderPc: row.is_builder_pc,
    builderSpecs: row.builder_specs ?? undefined,
    receiptKey: row.receipt_key ?? undefined,
    receiptImageUrl,
  };
}

export async function GET() {
  try {
    await ensureSchema();
    const rows = await query<OrderRow>(`${SELECT_ORDERS} ORDER BY created_at DESC`);
    const orders = await Promise.all(rows.map(toOrder));
    return NextResponse.json({ success: true, orders });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, message: errorMsg }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await ensureSchema();
    const order = (await req.json()) as Order;

    if (!order.orderNumber) {
      order.orderNumber = `CF-${Math.floor(10000 + Math.random() * 90000)}`;
    }
    if (!order.id) {
      order.id = `ord-${Date.now()}`;
    }
    if (!order.createdAt) {
      order.createdAt = new Date().toISOString();
    }
    if (!order.status) {
      order.status = 'pending';
    }

    const rows = await query<OrderRow>(
      `INSERT INTO orders
         (id, order_number, created_at, customer_name, customer_phone, customer_telegram,
          city, address, payment_method, status, items, total_uzs, notes, is_builder_pc,
          builder_specs, receipt_key, receipt_image_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
       ON CONFLICT (id) DO NOTHING
       RETURNING id, order_number, created_at, customer_name, customer_phone, customer_telegram,
                 city, address, payment_method, status, items, total_uzs, notes, is_builder_pc,
                 builder_specs, receipt_key, receipt_image_url`,
      [
        order.id,
        order.orderNumber,
        order.createdAt,
        order.customerName,
        order.customerPhone,
        order.customerTelegram ?? null,
        order.city,
        order.address,
        order.paymentMethod,
        order.status,
        JSON.stringify(order.items ?? []),
        order.totalUZS,
        order.notes ?? null,
        order.isBuilderPc ?? false,
        order.builderSpecs ? JSON.stringify(order.builderSpecs) : null,
        order.receiptKey ?? null,
        order.receiptImageUrl ?? null,
      ]
    );

    // Idempotent retry: the order already exists, return the stored row.
    const stored =
      rows[0] ??
      (await query<OrderRow>(`${SELECT_ORDERS} WHERE id = $1`, [order.id]))[0];

    return NextResponse.json({ success: true, order: await toOrder(stored) });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, message: errorMsg }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    await ensureSchema();
    const { orderId, status } = (await req.json()) as {
      orderId: string;
      status: Order['status'];
    };

    const rows = await query<OrderRow>(
      `UPDATE orders SET status = $2 WHERE id = $1
       RETURNING id, order_number, created_at, customer_name, customer_phone, customer_telegram,
                 city, address, payment_method, status, items, total_uzs, notes, is_builder_pc,
                 builder_specs, receipt_key, receipt_image_url`,
      [orderId, status]
    );

    if (rows.length === 0) {
      return NextResponse.json({ success: false, message: 'Order not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, order: await toOrder(rows[0]) });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, message: errorMsg }, { status: 500 });
  }
}
