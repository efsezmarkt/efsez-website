import {
  ensureSchema,
  isAdmin,
  normalizeProduct,
  parseBody,
  requireFields,
  send,
  sql
} from "../_lib/db.js";

export default async function handler(req, res) {
  try {
    await ensureSchema();

    const id = Number(req.query.id);
    if (!Number.isInteger(id)) return send(res, 400, { error: "Ungueltige Produkt-ID." });

    if (req.method === "GET") {
      const [product] = await sql`SELECT * FROM products WHERE id = ${id}`;
      if (!product) return send(res, 404, { error: "Produkt nicht gefunden." });
      return send(res, 200, normalizeProduct(product));
    }

    if (!isAdmin(req)) return send(res, 401, { error: "Zugangscode fehlt oder ist falsch." });

    if (req.method === "PUT") {
      const payload = parseBody(req);
      requireFields(payload, ["name", "category", "brand", "description", "image"]);

      const [product] = await sql`
        UPDATE products
        SET name = ${payload.name},
          category = ${payload.category},
          brand = ${payload.brand},
          description = ${payload.description},
          image = ${payload.image},
          featured = ${Boolean(payload.featured)},
          available = ${payload.available !== false},
          unit = ${payload.unit || ""},
          origin = ${payload.origin || ""},
          allergens = ${payload.allergens || ""},
          details = ${payload.details || ""},
          barcode = ${payload.barcode || ""},
          tags = ${payload.tags || ""}
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
    return send(res, 400, { error: error.message || "Unbekannter Fehler" });
  }
}
