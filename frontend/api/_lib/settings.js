import { sql } from "./db.js";

/** Einstellungen, die auf der Website sichtbar sind (öffentlich lesbar). */
export const PUBLIC_SETTINGS = {
  whatsapp_number: "",
  phone: "",
  contact_email: "",
  address: "Burgsalacher Str. 1, 90449 Nürnberg",
  opening_hours: "Montag - Samstag: 08:00 - 20:00 Uhr\nSonntag: Geschlossen",
  instagram: "",
  product_count_label: ""
};

/** Nur intern (Admin): wohin Kontaktanfragen per Mail gehen. */
export const PRIVATE_SETTINGS = {
  notify_email: ""
};

export const ALL_SETTINGS = { ...PUBLIC_SETTINGS, ...PRIVATE_SETTINGS };

export async function readSettings(defaults) {
  const keys = Object.keys(defaults);
  const rows = await sql`SELECT key, value FROM settings WHERE key = ANY(${keys}::text[])`;
  const result = { ...defaults };
  for (const row of rows) result[row.key] = row.value;
  return result;
}
