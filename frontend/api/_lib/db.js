import { neon } from "@neondatabase/serverless";
import { seedOffer, seedProducts } from "./seed.js";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL ist nicht gesetzt.");
}

export const sql = neon(process.env.DATABASE_URL);

let schemaReady;

export async function ensureSchema() {
  schemaReady ??= createSchema();
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

  const [{ count: offerCount }] = await sql`SELECT COUNT(*)::int AS count FROM offers`;
  if (offerCount === 0) {
    await sql`
      INSERT INTO offers (title, description, price, image, starts_at, ends_at, active)
      VALUES (
        ${seedOffer.title}, ${seedOffer.description}, ${seedOffer.price},
        ${seedOffer.image}, ${seedOffer.starts_at}, ${seedOffer.ends_at},
        ${seedOffer.active}
      )
    `;
  }
}

export function send(res, status, payload) {
  res.status(status).json(payload);
}

export function isAdmin(req) {
  return req.headers.authorization === `Bearer ${process.env.ADMIN_TOKEN || "change-me"}`;
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

export function normalizeProduct(product) {
  return {
    ...product,
    featured: Boolean(product.featured),
    available: Boolean(product.available)
  };
}

export function normalizeOffer(offer) {
  return {
    ...offer,
    active: Boolean(offer.active)
  };
}
