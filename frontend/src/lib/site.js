/** Kleine Helfer, die Website und Admin gemeinsam nutzen. */

export const DEFAULT_SETTINGS = {
  whatsapp_number: "",
  phone: "0911 / 40870524",
  contact_email: "",
  address: "Burgsalacher Str. 1, 90449 Nürnberg",
  opening_hours: "Montag - Samstag: 08:00 - 20:00 Uhr\nSonntag: Geschlossen",
  instagram: "",
  product_count_label: ""
};

/** WhatsApp-Link aus der gepflegten Nummer. Ohne Nummer → Kontaktseite. */
export function whatsappLink(settings, text = "") {
  const digits = String(settings?.whatsapp_number || "").replace(/[^\d]/g, "").replace(/^0/, "49");
  if (!digits) return "#/contact";
  return `https://wa.me/${digits}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
}

export function formatPrice(value) {
  if (value === null || value === undefined || value === "" || Number.isNaN(Number(value))) return "";
  return `${Number(value).toFixed(2).replace(".", ",")} €`;
}

export function formatDate(iso) {
  if (!iso) return "";
  const [year, month, day] = String(iso).split("-");
  if (!year || !month || !day) return iso;
  return `${day}.${month}.${year}`;
}

/** Abkürzende Kassen-Namen etwas lesbarer machen (nur Anzeige). */
export function displayName(name) {
  return String(name || "").trim();
}

export const PAGE_SIZE = 24;
