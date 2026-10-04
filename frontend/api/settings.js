import { ensureSchema, isAdmin, parseBody, requireAdmin, send, sql } from "./_lib/db.js";
import { ALL_SETTINGS, PUBLIC_SETTINGS, readSettings } from "./_lib/settings.js";

/**
 * GET /api/settings            öffentliche Einstellungen (WhatsApp, Adresse, Öffnungszeiten ...)
 * GET /api/settings  (Admin)   alle Einstellungen
 * PUT /api/settings  (Admin)   { key: value, ... }
 */
export default async function handler(req, res) {
  try {
    await ensureSchema();
    const admin = isAdmin(req);

    if (req.method === "GET") {
      return send(res, 200, await readSettings(admin ? ALL_SETTINGS : PUBLIC_SETTINGS));
    }

    if (req.method === "PUT") {
      if (!requireAdmin(req, res)) return undefined;
      const payload = parseBody(req);
      for (const [key, value] of Object.entries(payload)) {
        if (!(key in ALL_SETTINGS)) continue;
        await sql`
          INSERT INTO settings (key, value) VALUES (${key}, ${String(value ?? "").trim()})
          ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`;
      }
      return send(res, 200, await readSettings(ALL_SETTINGS));
    }

    return send(res, 405, { error: "Methode nicht erlaubt." });
  } catch (error) {
    return send(res, 400, { error: error.message || "Unbekannter Fehler" });
  }
}
