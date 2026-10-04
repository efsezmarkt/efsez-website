import { ensureSchema, parseBody, requireFields, send, sql } from "./_lib/db.js";
import { PRIVATE_SETTINGS, readSettings } from "./_lib/settings.js";

const allowedPurposes = new Set([
  "Produktwunsch",
  "Produktverfügbarkeit",
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
    const name = String(payload.name || "").slice(0, 200);
    const contact = String(payload.contact).slice(0, 200);
    const message = String(payload.message).slice(0, 4000);

    const [request] = await sql`
      INSERT INTO contact_requests (name, contact, purpose, message)
      VALUES (${name}, ${contact}, ${purpose}, ${message})
      RETURNING id, created_at
    `;

    // Mail-Benachrichtigung ist optional: nur wenn RESEND_API_KEY gesetzt ist und eine Zieladresse gepflegt wurde.
    notifyByEmail({ id: request.id, name, contact, purpose, message }).catch(() => {});

    return send(res, 201, { ok: true, id: request.id, created_at: request.created_at });
  } catch (error) {
    return send(res, 400, { error: error.message || "Anfrage konnte nicht gesendet werden." });
  }
}

async function notifyByEmail(request) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return;
  const { notify_email: to } = await readSettings(PRIVATE_SETTINGS);
  if (!to) return;

  const text = [
    `Neue Anfrage über efsez-markt.de (#${request.id})`,
    "",
    `Anliegen: ${request.purpose}`,
    `Name: ${request.name || "-"}`,
    `Kontakt: ${request.contact}`,
    "",
    request.message,
    "",
    "Alle Anfragen: https://www.efsez-markt.de/#/admin"
  ].join("\n");

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: process.env.CONTACT_FROM_EMAIL || "EFSE'Z Website <onboarding@resend.dev>",
      to: [to],
      reply_to: /\S+@\S+\.\S+/.test(request.contact) ? request.contact : undefined,
      subject: `Website-Anfrage: ${request.purpose}${request.name ? ` von ${request.name}` : ""}`,
      text
    })
  });
}
