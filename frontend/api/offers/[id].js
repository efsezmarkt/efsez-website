import { ensureSchema, parseBody, requireAdmin, requireFields, send, sql } from "../_lib/db.js";
import { loadOffers, replaceOfferItems } from "../_lib/offers.js";

export default async function handler(req, res) {
  try {
    await ensureSchema();

    const id = Number(req.query.id);
    if (!Number.isInteger(id)) return send(res, 400, { error: "Ungueltige Angebots-ID." });
    if (!requireAdmin(req, res)) return undefined;

    if (req.method === "GET") {
      const [offer] = await loadOffers({ id });
      if (!offer) return send(res, 404, { error: "Angebot nicht gefunden." });
      return send(res, 200, offer);
    }

    if (req.method === "PUT") {
      const payload = parseBody(req);
      requireFields(payload, ["title"]);

      const [offer] = await sql`
        UPDATE offers
        SET title = ${payload.title.trim()},
          description = ${payload.description || ""},
          price = ${payload.price || ""},
          image = ${payload.image || ""},
          starts_at = ${payload.starts_at || ""},
          ends_at = ${payload.ends_at || ""},
          active = ${payload.active !== false}
        WHERE id = ${id}
        RETURNING id`;
      if (!offer) return send(res, 404, { error: "Angebot nicht gefunden." });

      if (payload.items !== undefined) await replaceOfferItems(id, payload.items);
      const [full] = await loadOffers({ id });
      return send(res, 200, full);
    }

    if (req.method === "PATCH") {
      const payload = parseBody(req);
      if (typeof payload.active === "boolean") {
        await sql`UPDATE offers SET active = ${payload.active} WHERE id = ${id}`;
      }
      const [full] = await loadOffers({ id });
      if (!full) return send(res, 404, { error: "Angebot nicht gefunden." });
      return send(res, 200, full);
    }

    if (req.method === "DELETE") {
      await sql`DELETE FROM offers WHERE id = ${id}`;
      return send(res, 200, { ok: true });
    }

    return send(res, 405, { error: "Methode nicht erlaubt." });
  } catch (error) {
    return send(res, 400, { error: error.message || "Unbekannter Fehler" });
  }
}
