import { ensureSchema, parseBody, publicAssetPath, requireAdmin, requireFields, send, sql } from "../_lib/db.js";
import { FALLBACK_CATEGORY } from "../_lib/posGroups.js";

/**
 * PUT    /api/categories/:id   (Admin) umbenennen/bearbeiten – Produkte ziehen beim Umbenennen mit
 * DELETE /api/categories/:id   (Admin) löschen – Produkte wandern nach "Sonstiges" (oder ?move_to=Name)
 */
export default async function handler(req, res) {
  try {
    await ensureSchema();
    const id = Number(req.query.id);
    if (!Number.isInteger(id)) return send(res, 400, { error: "Ungueltige Kategorie-ID." });
    if (!requireAdmin(req, res)) return undefined;

    const [existing] = await sql`SELECT * FROM categories WHERE id = ${id}`;
    if (!existing) return send(res, 404, { error: "Kategorie nicht gefunden." });

    if (req.method === "PUT") {
      const payload = parseBody(req);
      requireFields(payload, ["name"]);
      const name = payload.name.trim();

      const [category] = await sql`
        UPDATE categories
        SET name = ${name},
          description = ${payload.description ?? existing.description},
          image = ${payload.image ?? existing.image},
          sort_order = ${Number.isFinite(Number(payload.sort_order)) ? Number(payload.sort_order) : existing.sort_order},
          visible = ${payload.visible === undefined ? existing.visible : Boolean(payload.visible)}
        WHERE id = ${id}
        RETURNING *`;

      if (name !== existing.name) {
        await sql`UPDATE products SET category = ${name}, updated_at = NOW() WHERE category = ${existing.name}`;
      }
      return send(res, 200, { ...category, image: publicAssetPath(category.image) });
    }

    if (req.method === "DELETE") {
      const target = String(req.query.move_to || FALLBACK_CATEGORY).trim() || FALLBACK_CATEGORY;
      if (target === existing.name) return send(res, 400, { error: "Zielkategorie darf nicht die gelöschte sein." });
      await sql`INSERT INTO categories (name, sort_order) VALUES (${target}, 900) ON CONFLICT (name) DO NOTHING`;
      const moved = await sql`UPDATE products SET category = ${target}, updated_at = NOW() WHERE category = ${existing.name} RETURNING id`;
      await sql`DELETE FROM categories WHERE id = ${id}`;
      return send(res, 200, { ok: true, moved: moved.length, moved_to: target });
    }

    return send(res, 405, { error: "Methode nicht erlaubt." });
  } catch (error) {
    if (String(error.message).includes("categories_name_key")) {
      return send(res, 400, { error: "Diese Kategorie gibt es schon." });
    }
    return send(res, 400, { error: error.message || "Unbekannter Fehler" });
  }
}
