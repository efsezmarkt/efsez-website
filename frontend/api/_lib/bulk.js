import { ensureCategory, parseBody, send, sql } from "./db.js";

/**
 * POST /api/admin/bulk  (nur Admin)
 * Auswahl:  { ids: [1,2,3] }  oder  { category: "Getränke" }  oder  { all: true }
 * Änderung: { set: { visible?: bool, featured?: bool, available?: bool, category?: "Neuer Name" } }
 * Löschen:  { delete: true } (nur mit ids)
 */
export async function bulkHandler(req, res) {
  try {
    if (req.method !== "POST") return send(res, 405, { error: "Methode nicht erlaubt." });

    const payload = parseBody(req);
    const { where, params } = selection(payload);

    if (payload.delete) {
      if (!Array.isArray(payload.ids) || !payload.ids.length) {
        throw new Error("Löschen geht nur mit einer konkreten Auswahl (ids).");
      }
      const rows = await sql.query(`DELETE FROM products ${where} RETURNING id`, params);
      return send(res, 200, { ok: true, affected: rows.length });
    }

    const set = payload.set || {};
    const assignments = [];
    if (typeof set.visible === "boolean") { params.push(set.visible); assignments.push(`visible = $${params.length}`); }
    if (typeof set.featured === "boolean") { params.push(set.featured); assignments.push(`featured = $${params.length}`); }
    if (typeof set.available === "boolean") { params.push(set.available); assignments.push(`available = $${params.length}`); }
    if (typeof set.category === "string" && set.category.trim()) {
      await ensureCategory(set.category.trim());
      params.push(set.category.trim());
      assignments.push(`category = $${params.length}`);
    }
    if (!assignments.length) throw new Error("Keine Änderung angegeben.");
    assignments.push("updated_at = NOW()");

    const rows = await sql.query(`UPDATE products SET ${assignments.join(", ")} ${where} RETURNING id`, params);
    return send(res, 200, { ok: true, affected: rows.length });
  } catch (error) {
    return send(res, 400, { error: error.message || "Unbekannter Fehler" });
  }
}

function selection(payload) {
  const params = [];
  if (Array.isArray(payload.ids) && payload.ids.length) {
    params.push(payload.ids.map(Number).filter(Number.isInteger));
    return { where: `WHERE id = ANY($1::int[])`, params };
  }
  if (typeof payload.category === "string" && payload.category) {
    params.push(payload.category);
    return { where: `WHERE category = $1`, params };
  }
  if (payload.all === true) return { where: "", params };
  throw new Error("Keine Auswahl angegeben (ids, category oder all).");
}
