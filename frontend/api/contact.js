import { ensureSchema, parseBody, requireFields, send, sql } from "./_lib/db.js";

const allowedPurposes = new Set([
  "Produktwunsch",
  "Produktverfuegbarkeit",
  "Partneranfrage",
  "Lieferant / Zusammenarbeit",
  "Allgemeine Anfrage"
]);

export default async function handler(req, res) {
  if (req.method !== "POST") return send(res, 405, { error: "Methode nicht erlaubt." });

  try {
    await ensureSchema();
    const payload = parseBody(req);
    requireFields(payload, ["contact", "purpose", "message"]);

    const purpose = allowedPurposes.has(payload.purpose) ? payload.purpose : "Allgemeine Anfrage";

    const [request] = await sql`
      INSERT INTO contact_requests (name, contact, purpose, message)
      VALUES (
        ${payload.name || ""},
        ${payload.contact},
        ${purpose},
        ${payload.message}
      )
      RETURNING id, created_at
    `;

    return send(res, 201, { ok: true, id: request.id, created_at: request.created_at });
  } catch (error) {
    return send(res, 400, { error: error.message || "Anfrage konnte nicht gesendet werden." });
  }
}
