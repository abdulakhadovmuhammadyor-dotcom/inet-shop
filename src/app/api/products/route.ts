import { NextResponse } from 'next/server';
import { ensureSchema, getPool, insertProduct, query } from '@/lib/db';
import { Product, ProductSpecs } from '@/types';

interface ProductRow {
  id: string;
  name: string;
  category: Product['category'];
  brand: string;
  price_uzs: string;
  image: string;
  in_stock: boolean;
  stock_count: number;
  description_ru: string;
  description_uz: string;
  specs: ProductSpecs;
  featured: boolean;
  model_3d: string | null;
}

function toProduct(row: ProductRow): Product {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    brand: row.brand,
    priceUZS: Number(row.price_uzs),
    image: row.image,
    inStock: row.in_stock,
    stockCount: row.stock_count,
    descriptionRu: row.description_ru,
    descriptionUz: row.description_uz,
    specs: row.specs ?? {},
    featured: row.featured,
    model3D: row.model_3d ?? undefined,
  };
}

const SELECT_PRODUCTS = `
  SELECT id, name, category, brand, price_uzs, image, in_stock, stock_count,
         description_ru, description_uz, specs, featured, model_3d
  FROM products
`;

export async function GET() {
  try {
    await ensureSchema();
    const rows = await query<ProductRow>(`${SELECT_PRODUCTS} ORDER BY created_at ASC, id ASC`);
    return NextResponse.json({ success: true, products: rows.map(toProduct) });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, message: errorMsg }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await ensureSchema();
    const product = (await req.json()) as Product;
    if (!product.id) {
      product.id = `prod-${Date.now()}`;
    }
    await insertProduct(getPool(), product);
    const rows = await query<ProductRow>(`${SELECT_PRODUCTS} WHERE id = $1`, [product.id]);
    return NextResponse.json({ success: true, product: toProduct(rows[0]) });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, message: errorMsg }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    await ensureSchema();
    const product = (await req.json()) as Product;
    const rows = await query<ProductRow>(
      `UPDATE products SET
         name = $2, category = $3, brand = $4, price_uzs = $5, image = $6,
         in_stock = $7, stock_count = $8, description_ru = $9, description_uz = $10,
         specs = $11, featured = $12, model_3d = $13
       WHERE id = $1
       RETURNING id, name, category, brand, price_uzs, image, in_stock, stock_count,
                 description_ru, description_uz, specs, featured, model_3d`,
      [
        product.id,
        product.name,
        product.category,
        product.brand,
        product.priceUZS,
        product.image ?? '',
        product.inStock ?? true,
        product.stockCount ?? 0,
        product.descriptionRu ?? '',
        product.descriptionUz ?? '',
        JSON.stringify(product.specs ?? {}),
        product.featured ?? false,
        product.model3D ?? null,
      ]
    );

    if (rows.length === 0) {
      return NextResponse.json({ success: false, message: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, product: toProduct(rows[0]) });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, message: errorMsg }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    await ensureSchema();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, message: 'Missing product ID' }, { status: 400 });
    }

    const rows = await query<{ id: string }>('DELETE FROM products WHERE id = $1 RETURNING id', [id]);
    if (rows.length === 0) {
      return NextResponse.json({ success: false, message: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, deletedId: id });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, message: errorMsg }, { status: 500 });
  }
}
