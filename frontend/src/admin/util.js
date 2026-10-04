export function parsePrice(value) {
  const text = String(value ?? "").trim().replace(/\s|€/g, "").replace(",", ".");
  if (!text) return null;
  const number = Number(text);
  return Number.isFinite(number) && number >= 0 ? Math.round(number * 100) / 100 : null;
}

export function priceText(value) {
  return value === null || value === undefined ? "" : Number(value).toFixed(2).replace(".", ",");
}

export function confirmAction(text) {
  return window.confirm(text);
}

export function todayIso(offsetDays = 0) {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  return date.toLocaleDateString("sv-SE", { timeZone: "Europe/Berlin" });
}

export function nextSundayIso() {
  const now = new Date();
  const diff = (7 - now.getDay()) % 7 || 7;
  return todayIso(diff);
}
