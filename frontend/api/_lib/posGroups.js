/**
 * Zuordnung der Warengruppen aus der Kasse (Delta-A / DCO-Export)
 * zu den Kategorien der Website. Schlüssel = WarengruppenID aus dem Export.
 *
 * Nicht aufgeführte oder unbekannte Gruppen landen in "Sonstiges".
 * Gruppen mit Wert null werden beim Import übersprungen (Pfand, Waage usw.).
 */
export const POS_GROUP_TO_CATEGORY = {
  "001": "Obst & Gemüse",
  "002": "Obst & Gemüse",
  "003": "Lebensmittel",
  "004": "Brot & Backwaren",
  "005": "Getränke",
  "006": "Geschenke & Haushalt",
  "007": "Geschenke & Haushalt",
  "008": null,
  "009": null,
  "010": null,
  "011": "Brot & Backwaren",
  "012": "Oliven & Eingelegtes",
  "013": "Frische Theke",
  "014": "Frische Theke",
  "015": "Drogerie & Haushalt",
  "016": "Drogerie & Haushalt",
  "017": "Kaffee & Tee",
  "018": "Kaffee & Tee",
  "019": "Kaffee & Tee",
  "020": "Internationale Spezialitäten",
  "021": "Internationale Spezialitäten",
  "022": "Internationale Spezialitäten",
  "023": "Internationale Spezialitäten",
  "024": "Frische Theke",
  "025": "Öle, Essig & Soßen",
  "026": "Milchprodukte & Käse",
  "027": "Wurst & Fleischwaren",
  "028": "Wurst & Fleischwaren",
  "029": "Wurst & Fleischwaren",
  "030": "Nudeln, Reis & Getreide",
  "031": "Milchprodukte & Käse",
  "032": "Milchprodukte & Käse",
  "033": "Gewürze & Würzpasten",
  "034": "Tiefkühl",
  "035": "Konserven & Vorrat",
  "036": "Süßwaren & Snacks",
  "037": "Nüsse & Trockenfrüchte",
  "038": "Nüsse & Trockenfrüchte",
  "039": "Süßwaren & Snacks",
  "040": "Frühstück & Aufstriche",
  "041": "Frühstück & Aufstriche",
  "042": "Frühstück & Aufstriche",
  "043": "Frühstück & Aufstriche",
  "044": "Frühstück & Aufstriche",
  "045": "Süßwaren & Snacks",
  "046": "Oliven & Eingelegtes",
  "047": "Brot & Backwaren",
  "048": "Konserven & Vorrat",
  "049": "Öle, Essig & Soßen",
  "050": "Konserven & Vorrat",
  "051": "Gewürze & Würzpasten",
  "052": "Nudeln, Reis & Getreide",
  "053": "Nudeln, Reis & Getreide",
  "054": "Gewürze & Würzpasten",
  "055": null
};

export const FALLBACK_CATEGORY = "Sonstiges";

export function categoryForPosGroup(groupId) {
  const key = String(groupId ?? "").trim().padStart(3, "0");
  if (!(key in POS_GROUP_TO_CATEGORY)) return FALLBACK_CATEGORY;
  return POS_GROUP_TO_CATEGORY[key];
}

/** Einheit aus Menge + Einheit der Kasse, z. B. 0.315 kg → "315 g", 1 Stk → "Stück" */
export function formatUnit(amount, unit) {
  const value = Number(String(amount ?? "").replace(",", "."));
  const u = String(unit ?? "").trim().toLowerCase();
  if (!Number.isFinite(value) || value <= 0) return u ? unitLabel(u) : "";

  if (u === "kg") return value < 1 ? `${Math.round(value * 1000)} g` : `${trim(value)} kg`;
  if (u === "g") return `${trim(value)} g`;
  if (u === "l") return value < 1 ? `${Math.round(value * 1000)} ml` : `${trim(value)} l`;
  if (u === "ml") return `${trim(value)} ml`;
  if (u === "stk") return value === 1 ? "Stück" : `${trim(value)} Stück`;
  return `${trim(value)} ${unitLabel(u)}`.trim();
}

function unitLabel(u) {
  return { stk: "Stück", kg: "kg", g: "g", l: "l", ml: "ml" }[u] || u;
}

function trim(value) {
  return String(Math.round(value * 1000) / 1000).replace(".", ",");
}
