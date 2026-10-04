import { ensureSchema, isAdmin, parseBody, requireAdmin, requireFields, send, sql } from "../_lib/db.js";
import { loadOffers, replaceOfferItems } from "../_lib/offers.js";

/**
 * GET  /api/offers           aktive Angebote im Zeitraum, mit Positionen
 * GET  /api/offers?all=1     (Admin) alle Angebote
 * POST /api/offers           (Admin) { title, description, starts_at, ends_at, active, image, price, items: [...] }
 */
export default async function handler(req, res) {
  try {
    await ensureSchema();

    if (req.method === "GET") {
      const all = Boolean(req.query?.all) && isAdmin(req);
      return send(res, 200, await loadOffers({ all }));
    }

    if (req.method === "POST") {
      if (!requireAdmin(req, res)) return undefined;
      const payload = parseBody(req);
      requireFields(payload, ["title"]);

      const [offer] = await sql`
        INSERT INTO offers (title, description, price, image, starts_at, ends_at, active)
        VALUES (
          ${payload.title.trim()}, ${payload.description || ""}, ${payload.price || ""},
          ${payload.image || ""}, ${payload.starts_at || ""}, ${payload.ends_at || ""},
          ${payload.active !== false}
        )
        RETURNING *`;
      await replaceOfferItems(offer.id, payload.items);
      const [full] = await loadOffers({ id: offer.id });
      return send(res, 201, full);
    }

    return send(res, 405, { error: "Methode nicht erlaubt." });
  } catch (error) {
    return send(res, 400, { error: error.message || "Unbekannter Fehler" });
  }
}
