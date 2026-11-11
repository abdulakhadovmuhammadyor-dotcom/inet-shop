import { Pool } from 'pg';
import { INITIAL_PRODUCTS } from '@/data/products';
import { INITIAL_GAMES } from '@/data/games';
import { Game, Product } from '@/types';

/**
 * Neon Postgres connection pool.
 *
 * Next.js route handlers run on the Node.js runtime, so `pg` (node-postgres)
 * with the pooled Neon connection string (`DATABASE_URL`, PgBouncer) is the
 * right driver here. The pool is cached on `globalThis` so dev hot reloads
 * do not open a new pool on every request.
 */
const globalForDb = globalThis as unknown as {
  __neonPool?: Pool;
  __neonSchemaReady?: Promise<void>;
};

export function getPool(): Pool {
  if (!globalForDb.__neonPool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('DATABASE_URL is not set. Run `neon deploy` or `neon env pull`.');
    }

    globalForDb.__neonPool = new Pool({
      connectionString,
      max: 5,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 10_000,
    });
  }

  return globalForDb.__neonPool;
}

export type Queryable = {
  query: (text: string, values?: unknown[]) => Promise<{ rows: unknown[] }>;
};

export async function query<T = Record<string, unknown>>(
  text: string,
  params: unknown[] = []
): Promise<T[]> {
  const result = await getPool().query(text, params);
  return result.rows as T[];
}

const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS products (
  id             TEXT PRIMARY KEY,
  name           TEXT NOT NULL,
  category       TEXT NOT NULL,
  brand          TEXT NOT NULL,
  price_uzs      BIGINT NOT NULL,
  image          TEXT NOT NULL DEFAULT '',
  in_stock       BOOLEAN NOT NULL DEFAULT TRUE,
  stock_count    INTEGER NOT NULL DEFAULT 0,
  description_ru TEXT NOT NULL DEFAULT '',
  description_uz TEXT NOT NULL DEFAULT '',
  specs          JSONB NOT NULL DEFAULT '{}'::jsonb,
  featured       BOOLEAN NOT NULL DEFAULT FALSE,
  model_3d       TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS products_category_idx ON products (category);

CREATE TABLE IF NOT EXISTS games (
  id                 TEXT PRIMARY KEY,
  title              TEXT NOT NULL,
  genre              TEXT NOT NULL,
  release_year       INTEGER NOT NULL,
  cover_image        TEXT NOT NULL DEFAULT '',
  cpu_weight         DOUBLE PRECISION NOT NULL,
  gpu_weight         DOUBLE PRECISION NOT NULL,
  ram_min_gb         INTEGER NOT NULL,
  vram_min_gb        INTEGER NOT NULL,
  base_difficulty    DOUBLE PRECISION NOT NULL,
  optimal_fps_target INTEGER NOT NULL,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS orders (
  id                TEXT PRIMARY KEY,
  order_number      TEXT NOT NULL UNIQUE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  customer_name     TEXT NOT NULL,
  customer_phone    TEXT NOT NULL,
  customer_telegram TEXT,
  city              TEXT NOT NULL,
  address           TEXT NOT NULL,
  payment_method    TEXT NOT NULL,
  status            TEXT NOT NULL DEFAULT 'pending',
  items             JSONB NOT NULL DEFAULT '[]'::jsonb,
  total_uzs         BIGINT NOT NULL DEFAULT 0,
  notes             TEXT,
  is_builder_pc     BOOLEAN NOT NULL DEFAULT FALSE,
  builder_specs     JSONB,
  receipt_key       TEXT,
  receipt_image_url TEXT
);

CREATE INDEX IF NOT EXISTS orders_status_idx ON orders (status);
CREATE INDEX IF NOT EXISTS orders_created_at_idx ON orders (created_at DESC);
`;

/** Creates the schema and seeds the catalog once per process. */
export function ensureSchema(): Promise<void> {
  if (!globalForDb.__neonSchemaReady) {
    globalForDb.__neonSchemaReady = (async () => {
      await query(SCHEMA_SQL);
      await seedCatalog();
    })().catch((error) => {
      // Allow a later request to retry if the database was unreachable.
      globalForDb.__neonSchemaReady = undefined;
      throw error;
    });
  }

  return globalForDb.__neonSchemaReady;
}

/**
 * Seeds the shipped catalog into an empty database. Existing rows are never
 * overwritten, so admin edits survive redeploys and cold starts.
 */
async function seedCatalog(): Promise<void> {
  const products = await query<{ count: string }>('SELECT COUNT(*)::text AS count FROM products');
  if (products[0]?.count === '0') {
    for (const product of INITIAL_PRODUCTS) {
      await insertProduct(getPool(), product);
    }
  }

  const games = await query<{ count: string }>('SELECT COUNT(*)::text AS count FROM games');
  if (games[0]?.count === '0') {
    for (const game of INITIAL_GAMES) {
      await insertGame(getPool(), game);
    }
  }
}

export async function insertProduct(db: Queryable, product: Product): Promise<void> {
  await db.query(
    `INSERT INTO products
       (id, name, category, brand, price_uzs, image, in_stock, stock_count,
        description_ru, description_uz, specs, featured, model_3d)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
     ON CONFLICT (id) DO NOTHING`,
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
}

export async function insertGame(db: Queryable, game: Game): Promise<void> {
  await db.query(
    `INSERT INTO games
       (id, title, genre, release_year, cover_image, cpu_weight, gpu_weight,
        ram_min_gb, vram_min_gb, base_difficulty, optimal_fps_target)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
     ON CONFLICT (id) DO NOTHING`,
    [
      game.id,
      game.title,
      game.genre,
      game.releaseYear,
      game.coverImage ?? '',
      game.cpuWeight,
      game.gpuWeight,
      game.ramMinGB,
      game.vramMinGB,
      game.baseDifficulty,
      game.optimalFpsTarget,
    ]
  );
}
