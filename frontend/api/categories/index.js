import { ensureSchema, isAdmin, parseBody, publicAssetPath, requireAdmin, requireFields, send, sql } from "../_lib/db.js";

/**
 * GET  /api/categories            sichtbare Kategorien mit Anzahl sichtbarer Produkte
 * GET  /api/categories?all=1      (Admin) alle Kategorien inkl. unsichtbarer + Gesamtzahl Produkte
 * POST /api/categories            (Admin) { name, description, image, sort_order, visible }
 */
export default async function handler(req, res) {
  try {
    await ensureSchema();

    if (req.method === "GET") {
      const admin = isAdmin(req) && req.query?.all;
      const rows = admin
        ? await sql`
            SELECT c.*,
              (SELECT COUNT(*)::int FROM products p WHERE p.category = c.name) AS product_count,
              (SELECT COUNT(*)::int FROM products p WHERE p.category = c.name AND p.visible) AS visible_count
            FROM categories c ORDER BY c.sort_order, c.name`
        : await sql`
            SELECT c.id, c.name, c.description, c.image, c.sort_order,
              (SELECT COUNT(*)::int FROM products p WHERE p.category = c.name AND p.visible) AS product_count
            FROM categories c WHERE c.visible ORDER BY c.sort_order, c.name`;
      return send(res, 200, rows.map(normalize));
    }

    if (req.method === "POST") {
      if (!requireAdmin(req, res)) return undefined;
      const payload = parseBody(req);
      requireFields(payload, ["name"]);
      const [category] = await sql`
        INSERT INTO categories (name, description, image, sort_order, visible)
        VALUES (${payload.name.trim()}, ${payload.description || ""}, ${payload.image || ""},
          ${Number(payload.sort_order) || 500}, ${payload.visible !== false})
        RETURNING *`;
      return send(res, 201, normalize(category));
    }

    return send(res, 405, { error: "Methode nicht erlaubt." });
  } catch (error) {
    if (String(error.message).includes("categories_name_key")) {
      return send(res, 400, { error: "Diese Kategorie gibt es schon." });
    }
    return send(res, 400, { error: error.message || "Unbekannter Fehler" });
  }
}

export function normalize(category) {
  return { ...category, image: publicAssetPath(category.image), visible: category.visible !== false };
}
