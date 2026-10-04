export const DEFAULT_SETTINGS = {
  whatsapp_number: "",
  phone: "0911 / 40870524",
  contact_email: "",
  address: "Burgsalacher Str. 1, 90449 Nürnberg",
  opening_hours: "Mo–Sa 08:00–20:00",
  instagram: "",
  imprint_text: "",
  privacy_text: ""
};

export function formatPrice(value) {
  if (value === null || value === undefined || value === "" || Number.isNaN(Number(value))) return "";
  return `${Number(value).toFixed(2).replace(".", ",")} €`;
}

/** 2.59 → { euros: "2", cents: "59" } für das Preisschild */
export function splitPrice(value) {
  const [euros, cents] = Number(value).toFixed(2).split(".");
  return { euros, cents };
}

/**
 * Grundpreis nach Preisangabenverordnung aus Preis + Einheit,
 * z. B. 2,59 € für „315 g“ → „8,22 €/kg“. Ohne Gewicht/Volumen: leer.
 */
export function basePrice(price, unit) {
  if (price === null || price === undefined) return "";
  const match = String(unit || "").replace(",", ".").match(/^(\d+(?:\.\d+)?)\s*(g|kg|ml|l)$/i);
  if (!match) return "";
  const amount = Number(match[1]);
  const kind = match[2].toLowerCase();
  if (!amount) return "";
  const perBase = kind === "g" || kind === "ml" ? (Number(price) / amount) * 1000 : Number(price) / amount;
  const base = kind === "g" || kind === "kg" ? "kg" : "l";
  if ((kind === "kg" || kind === "l") && amount === 1) return "";
  return `${perBase.toFixed(2).replace(".", ",")} €/${base}`;
}

export function formatDate(iso, withYear = false) {
  if (!iso) return "";
  const [year, month, day] = String(iso).slice(0, 10).split("-");
  return withYear ? `${day}.${month}.${year}` : `${day}.${month}.`;
}

export function offerPeriod(offer) {
  if (!offer) return "";
  if (offer.starts_on && offer.ends_on) return `${formatDate(offer.starts_on)} bis ${formatDate(offer.ends_on)}`;
  if (offer.ends_on) return `bis ${formatDate(offer.ends_on)}`;
  return "solange der Vorrat reicht";
}

export function whatsappLink(settings, text = "") {
  const digits = String(settings?.whatsapp_number || "").replace(/[^\d]/g, "").replace(/^00/, "").replace(/^0/, "49");
  if (!digits) return "";
  return `https://wa.me/${digits}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
}

export function telLink(phone) {
  const digits = String(phone || "").replace(/[^\d+]/g, "");
  return digits ? `tel:${digits.startsWith("0") ? `+49${digits.slice(1)}` : digits}` : "";
}

export function mapsLink(address) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address || "")}`;
}
