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

export default async function handler(req, res) {
  try {
    await ensureSchema();

    const id = Number(req.query.id);
    if (!Number.isInteger(id)) return send(res, 400, { error: "Ungueltige Produkt-ID." });

    if (req.method === "GET") {
      const [product] = await sql`SELECT * FROM products WHERE id = ${id}`;
      if (!product || (!product.visible && !isAdmin(req))) {
        return send(res, 404, { error: "Produkt nicht gefunden." });
      }
      return send(res, 200, normalizeProduct(product));
    }

    if (!requireAdmin(req, res)) return undefined;

    if (req.method === "PUT") {
      const payload = parseBody(req);
      requireFields(payload, ["name", "category"]);

      const [product] = await sql`
        UPDATE products
        SET name = ${payload.name.trim()},
          category = ${payload.category.trim()},
          brand = ${payload.brand || ""},
          description = ${payload.description || ""},
          image = ${payload.image || ""},
          featured = ${Boolean(payload.featured)},
          available = ${payload.available !== false},
          visible = ${payload.visible !== false},
          unit = ${payload.unit || ""},
          origin = ${payload.origin || ""},
          allergens = ${payload.allergens || ""},
          details = ${payload.details || ""},
          barcode = ${(payload.barcode || "").trim()},
          tags = ${payload.tags || ""},
          price = ${toPrice(payload.price)},
          updated_at = NOW()
        WHERE id = ${id}
        RETURNING *
      `;

      if (!product) return send(res, 404, { error: "Produkt nicht gefunden." });
      await ensureCategory(payload.category.trim());
      return send(res, 200, normalizeProduct(product));
    }

    if (req.method === "PATCH") {
      // Schnelle Einzeländerung aus Listen: { visible } | { featured } | { available } | { price }
      const payload = parseBody(req);
      const [product] = await sql`
        UPDATE products
        SET visible = COALESCE(${nullableBool(payload.visible)}, visible),
          featured = COALESCE(${nullableBool(payload.featured)}, featured),
          available = COALESCE(${nullableBool(payload.available)}, available),
          price = CASE WHEN ${payload.price !== undefined} THEN ${toPrice(payload.price)} ELSE price END,
          updated_at = NOW()
        WHERE id = ${id}
        RETURNING *
      `;
      if (!product) return send(res, 404, { error: "Produkt nicht gefunden." });
      return send(res, 200, normalizeProduct(product));
    }

    if (req.method === "DELETE") {
      await sql`DELETE FROM products WHERE id = ${id}`;
      return send(res, 200, { ok: true });
    }

    return send(res, 405, { error: "Methode nicht erlaubt." });
  } catch (error) {
    if (String(error.message).includes("products_barcode_unique")) {
      return send(res, 400, { error: "Dieser Barcode ist schon bei einem anderen Produkt hinterlegt." });
    }
    return send(res, 400, { error: error.message || "Unbekannter Fehler" });
  }
}

function nullableBool(value) {
  if (value === undefined || value === null) return null;
  return Boolean(value);
}
