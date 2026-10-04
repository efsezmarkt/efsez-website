import {
  ensureCategory,
  ensureSchema,
  isAdmin,
  normalizeProduct,
  parseBody,
  requireAdmin,
  requireFields,
  send,
  sql,
  toPrice
} from "../_lib/db.js";

const MAX_LIMIT = 100;

/**
 * GET /api/products
 *   ?page=1&limit=24          Seitenweise (Standard 24, max. 100)
 *   ?category=Getränke        nur eine Kategorie
 *   ?q=tee                    Suche in Name, Marke, Barcode, Tags
 *   ?featured=1               nur "Beliebt"
 *   ?all=1 (nur Admin)        auch unsichtbare Produkte
 *   ?visible=0 (nur Admin)    nur unsichtbare
 *   ?ids=1,2,3                bestimmte Produkte
 * Antwort: { items, total, page, limit, hasMore }
 */
export default async function handler(req, res) {
  try {
    await ensureSchema();

    if (req.method === "GET") {
      return send(res, 200, await listProducts(req));
    }

    if (req.method === "POST") {
      if (!requireAdmin(req, res)) return undefined;
      const payload = parseBody(req);
      requireFields(payload, ["name", "category"]);

      const [product] = await sql`
        INSERT INTO products (
          name, category, brand, description, image, featured, available, visible,
          unit, origin, allergens, details, barcode, tags, price, source
        )
        VALUES (
          ${payload.name.trim()}, ${payload.category.trim()}, ${payload.brand || ""}, ${payload.description || ""},
          ${payload.image || ""}, ${Boolean(payload.featured)}, ${payload.available !== false}, ${payload.visible !== false},
          ${payload.unit || ""}, ${payload.origin || ""}, ${payload.allergens || ""},
          ${payload.details || ""}, ${(payload.barcode || "").trim()}, ${payload.tags || ""},
          ${toPrice(payload.price)}, 'manuell'
        )
        RETURNING *
      `;
      await ensureCategory(payload.category.trim());

      return send(res, 201, normalizeProduct(product));
    }

    return send(res, 405, { error: "Methode nicht erlaubt." });
  } catch (error) {
    if (String(error.message).includes("products_barcode_unique")) {
      return send(res, 400, { error: "Dieser Barcode ist schon bei einem anderen Produkt hinterlegt." });
    }
    return send(res, 400, { error: error.message || "Unbekannter Fehler" });
  }
}

async function listProducts(req) {
  const admin = isAdmin(req);
  const query = req.query || {};
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(MAX_LIMIT, Math.max(1, Number(query.limit) || 24));
  const offset = (page - 1) * limit;

  const where = [];
  const params = [];
  const add = (clause, value) => {
    params.push(value);
    where.push(clause.replace("?", `$${params.length}`));
  };

  if (!admin || !query.all) {
    if (admin && query.visible === "0") where.push("visible = FALSE");
    else where.push("visible = TRUE");
  }
  if (query.category) add("category = ?", String(query.category));
  if (query.featured === "1") where.push("featured = TRUE");
  if (query.ids) {
    const ids = String(query.ids).split(",").map(Number).filter(Number.isInteger);
    if (ids.length) add("id = ANY(?::int[])", ids);
    else where.push("FALSE");
  }
  if (query.q) {
    params.push(`%${String(query.q).trim().toLowerCase()}%`);
    const p = `$${params.length}`;
    where.push(`(lower(name) LIKE ${p} OR lower(brand) LIKE ${p} OR barcode LIKE ${p} OR lower(tags) LIKE ${p})`);
  }

  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const order =
    query.sort === "name" ? "ORDER BY name ASC" :
    query.sort === "newest" ? "ORDER BY created_at DESC" :
    "ORDER BY featured DESC, (image <> '') DESC, name ASC";

  const [{ total }] = await sql.query(`SELECT COUNT(*)::int AS total FROM products ${whereSql}`, params);
  const items = await sql.query(
    `SELECT * FROM products ${whereSql} ${order} LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    [...params, limit, offset]
  );

  return {
    items: items.map(normalizeProduct),
    total,
    page,
    limit,
    hasMore: offset + items.length < total
  };
}
