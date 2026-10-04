import { seedCategories, seedProducts } from "./seed.js";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL ist nicht gesetzt.");
}

/**
 * Datenbank-Treiber.
 * Produktion (Vercel + Neon): HTTP-Treiber von Neon.
 * Lokale Entwicklung/Tests: mit LOCAL_PG=1 wird stattdessen "pg" genutzt
 * (nur devDependency, wird in Produktion nie geladen).
 */
export const sql = await createDriver();

async function createDriver() {
  if (process.env.LOCAL_PG === "1") {
    const { default: pg } = await import("pg");
    const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
    const tagged = async (strings, ...values) => {
      const text = strings.reduce((acc, part, i) => acc + part + (i < values.length ? `$${i + 1}` : ""), "");
      const { rows } = await pool.query(text, values);
      return rows;
    };
    tagged.query = async (text, params = []) => (await pool.query(text, params)).rows;
    return tagged;
  }

  const { neon } = await import("@neondatabase/serverless");
  return neon(process.env.DATABASE_URL);
}

let schemaReady;

export async function ensureSchema() {
  schemaReady ??= createSchema().catch((error) => {
    schemaReady = undefined;
    throw error;
  });
  return schemaReady;
}

async function createSchema() {
  await sql`
    CREATE TABLE IF NOT EXISTS products (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      brand TEXT NOT NULL,
      description TEXT NOT NULL,
      image TEXT NOT NULL,
      featured BOOLEAN NOT NULL DEFAULT FALSE,
      available BOOLEAN NOT NULL DEFAULT TRUE,
      unit TEXT DEFAULT '',
      origin TEXT DEFAULT '',
      allergens TEXT DEFAULT '',
      details TEXT DEFAULT '',
      barcode TEXT DEFAULT '',
      tags TEXT DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  // Erweiterungen (idempotent, damit bestehende Datenbanken ohne manuelle Migration mitziehen).
  await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS price NUMERIC(10,2)`;
  await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS visible BOOLEAN NOT NULL DEFAULT TRUE`;
  await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS kassen_id INTEGER`;
  await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS pos_group TEXT NOT NULL DEFAULT ''`;
  await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'manuell'`;
  await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`;
  await sql`ALTER TABLE products ALTER COLUMN brand SET DEFAULT ''`;
  await sql`ALTER TABLE products ALTER COLUMN description SET DEFAULT ''`;
  await sql`ALTER TABLE products ALTER COLUMN image SET DEFAULT ''`;
  await sql`CREATE UNIQUE INDEX IF NOT EXISTS products_barcode_unique ON products (barcode) WHERE barcode <> ''`;
  await sql`CREATE INDEX IF NOT EXISTS products_category_idx ON products (category)`;
  await sql`CREATE INDEX IF NOT EXISTS products_visible_idx ON products (visible, featured)`;
  await sql`CREATE INDEX IF NOT EXISTS products_name_idx ON products (lower(name))`;

  await sql`
    CREATE TABLE IF NOT EXISTS categories (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      description TEXT NOT NULL DEFAULT '',
      image TEXT NOT NULL DEFAULT '',
      sort_order INTEGER NOT NULL DEFAULT 100,
      visible BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS offers (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      price TEXT DEFAULT '',
      image TEXT DEFAULT '',
      starts_at TEXT DEFAULT '',
      ends_at TEXT DEFAULT '',
      active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`ALTER TABLE offers ALTER COLUMN description SET DEFAULT ''`;

  await sql`
    CREATE TABLE IF NOT EXISTS offer_items (
      id SERIAL PRIMARY KEY,
      offer_id INTEGER NOT NULL REFERENCES offers(id) ON DELETE CASCADE,
      product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      offer_price NUMERIC(10,2),
      old_price NUMERIC(10,2),
      note TEXT NOT NULL DEFAULT '',
      sort_order INTEGER NOT NULL DEFAULT 0,
      UNIQUE (offer_id, product_id)
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS contact_requests (
      id SERIAL PRIMARY KEY,
      name TEXT DEFAULT '',
      contact TEXT NOT NULL,
      purpose TEXT NOT NULL,
      message TEXT NOT NULL,
      handled BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL DEFAULT ''
    )
  `;

  await seedIfEmpty();
  await renameLegacyCategories();
}

/** Alte Kategorienamen der ersten Website-Version auf die heutige Struktur ziehen (idempotent). */
async function renameLegacyCategories() {
  const renames = {
    "Fleischwaren": "Wurst & Fleischwaren",
    "Süßwaren": "Süßwaren & Snacks",
    "Konserven": "Konserven & Vorrat",
    "Gewürze": "Gewürze & Würzpasten",
    "Milchprodukte": "Milchprodukte & Käse",
    "Frühstück": "Frühstück & Aufstriche",
    "Nudeln & Reis": "Nudeln, Reis & Getreide",
    "Tiefkühlprodukte": "Tiefkühl",
    "Käse": "Milchprodukte & Käse"
  };
  for (const [from, to] of Object.entries(renames)) {
    await sql`INSERT INTO categories (name, sort_order) VALUES (${to}, 500) ON CONFLICT (name) DO NOTHING`;
    await sql`UPDATE products SET category = ${to} WHERE category = ${from}`;
    await sql`DELETE FROM categories WHERE name = ${from}`;
  }
  // Platzhalter-Angebot der ersten Version (ohne Produkte, mit Hero-Bild) entfernen.
  await sql`
    DELETE FROM offers o
    WHERE o.image = '/assets/hero.png'
      AND NOT EXISTS (SELECT 1 FROM offer_items oi WHERE oi.offer_id = o.id)`;
}

async function seedIfEmpty() {
  const [{ count: productCount }] = await sql`SELECT COUNT(*)::int AS count FROM products`;
  if (productCount === 0) {
    for (const product of seedProducts) {
      await sql`
        INSERT INTO products (
          name, category, brand, description, image, featured, available,
          unit, origin, allergens, details, barcode, tags
        )
        VALUES (
          ${product.name}, ${product.category}, ${product.brand}, ${product.description},
          ${product.image}, ${product.featured}, ${product.available}, ${product.unit},
          ${product.origin}, ${product.allergens}, ${product.details}, ${product.barcode},
          ${product.tags}
        )
      `;
    }
  }

  // Kategorien: Startliste + alles, was in Produkten schon als Kategorie steht.
  const [{ count: categoryCount }] = await sql`SELECT COUNT(*)::int AS count FROM categories`;
  if (categoryCount === 0) {
    for (const category of seedCategories) {
      await sql`
        INSERT INTO categories (name, description, image, sort_order)
        VALUES (${category.name}, ${category.description}, ${category.image}, ${category.sort_order})
        ON CONFLICT (name) DO NOTHING
      `;
    }
  }
  await sql`
    INSERT INTO categories (name, sort_order)
    SELECT DISTINCT category, 500 FROM products
    WHERE category <> '' AND category NOT IN (SELECT name FROM categories)
  `;
}

export async function ensureCategory(name) {
  const clean = String(name ?? "").trim();
  if (!clean) return;
  await sql`INSERT INTO categories (name, sort_order) VALUES (${clean}, 500) ON CONFLICT (name) DO NOTHING`;
}

export function send(res, status, payload) {
  res.status(status).json(payload);
}

export function isAdmin(req) {
  return req.headers.authorization === `Bearer ${process.env.ADMIN_TOKEN || "change-me"}`;
}

export function requireAdmin(req, res) {
  if (isAdmin(req)) return true;
  send(res, 401, { error: "Zugangscode fehlt oder ist falsch." });
  return false;
}

export function requireFields(payload, fields) {
  const missing = fields.filter((field) => !String(payload[field] ?? "").trim());
  if (missing.length) throw new Error(`Fehlende Felder: ${missing.join(", ")}`);
}

export function parseBody(req) {
  if (!req.body) return {};
  if (typeof req.body === "string") return JSON.parse(req.body);
  return req.body;
}

/** "2,59" | "2.59" | 2.59 | "" → Zahl oder null */
export function toPrice(value) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(String(value).replace(/\s|€/g, "").replace(",", "."));
  if (!Number.isFinite(number) || number < 0) return null;
  return Math.round(number * 100) / 100;
}

export function publicAssetPath(path) {
  if (!path) return "";
  return path.replace(/^\/src\/assets\//, "/assets/");
}

export function normalizeProduct(product) {
  return {
    ...product,
    image: publicAssetPath(product.image),
    price: product.price === null || product.price === undefined ? null : Number(product.price),
    featured: Boolean(product.featured),
    available: Boolean(product.available),
    visible: product.visible !== false
  };
}

export function normalizeOffer(offer) {
  return {
    ...offer,
    image: publicAssetPath(offer.image),
    active: Boolean(offer.active),
    items: (offer.items || []).map(normalizeOfferItem)
  };
}

export function normalizeOfferItem(item) {
  const offerPrice = item.offer_price === null || item.offer_price === undefined ? null : Number(item.offer_price);
  const oldPrice = item.old_price === null || item.old_price === undefined ? null : Number(item.old_price);
  const discount =
    offerPrice !== null && oldPrice !== null && oldPrice > 0 && offerPrice < oldPrice
      ? Math.round((1 - offerPrice / oldPrice) * 100)
      : null;

  return {
    ...item,
    image: publicAssetPath(item.image),
    offer_price: offerPrice,
    old_price: oldPrice,
    discount_percent: discount
  };
}

export function todayIso() {
  return new Date().toISOString().slice(0, 10);
}
