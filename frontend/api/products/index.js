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

    if (req.method === "GET") {
      const products = await sql`
        SELECT * FROM products
        ORDER BY featured DESC, name ASC
      `;
      return send(res, 200, products.map(normalizeProduct));
    }

    if (req.method === "POST") {
      if (!isAdmin(req)) return send(res, 401, { error: "Zugangscode fehlt oder ist falsch." });

      const payload = parseBody(req);
      requireFields(payload, ["name", "category", "brand", "description", "image"]);

      const [product] = await sql`
        INSERT INTO products (
          name, category, brand, description, image, featured, available,
          unit, origin, allergens, details, barcode, tags
        )
        VALUES (
          ${payload.name}, ${payload.category}, ${payload.brand}, ${payload.description},
          ${payload.image}, ${Boolean(payload.featured)}, ${payload.available !== false},
          ${payload.unit || ""}, ${payload.origin || ""}, ${payload.allergens || ""},
          ${payload.details || ""}, ${payload.barcode || ""}, ${payload.tags || ""}
        )
        RETURNING *
      `;

      return send(res, 201, normalizeProduct(product));
    }

    return send(res, 405, { error: "Methode nicht erlaubt." });
  } catch (error) {
    return send(res, 400, { error: error.message || "Unbekannter Fehler" });
  }
}
