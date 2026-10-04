/**
 * Kassen-Export (Delta-A / DCO, CSV mit Semikolon) im Browser lesen und
 * Warengruppen der Kasse den Website-Kategorien zuordnen.
 */

// Warengruppen-ID der Kasse → Kategorie auf der Website (null = nicht importieren)
export const POS_GROUP_TO_CATEGORY = {
  "001": "Obst & Gemüse", "002": "Obst & Gemüse", "003": "Lebensmittel", "004": "Brot & Backwaren",
  "005": "Getränke", "006": "Geschenke & Haushalt", "007": "Geschenke & Haushalt", "008": null,
  "009": null, "010": null, "011": "Brot & Backwaren", "012": "Oliven & Eingelegtes",
  "013": "Frische Theke", "014": "Frische Theke", "015": "Drogerie & Haushalt", "016": "Drogerie & Haushalt",
  "017": "Kaffee & Tee", "018": "Kaffee & Tee", "019": "Kaffee & Tee", "020": "Internationale Spezialitäten",
  "021": "Internationale Spezialitäten", "022": "Internationale Spezialitäten", "023": "Internationale Spezialitäten",
  "024": "Frische Theke", "025": "Öle, Essig & Soßen", "026": "Milchprodukte & Käse", "027": "Wurst & Fleischwaren",
  "028": "Wurst & Fleischwaren", "029": "Wurst & Fleischwaren", "030": "Nudeln, Reis & Getreide",
  "031": "Milchprodukte & Käse", "032": "Milchprodukte & Käse", "033": "Gewürze & Würzpasten", "034": "Tiefkühl",
  "035": "Konserven & Vorrat", "036": "Süßwaren & Snacks", "037": "Nüsse & Trockenfrüchte",
  "038": "Nüsse & Trockenfrüchte", "039": "Süßwaren & Snacks", "040": "Frühstück & Aufstriche",
  "041": "Frühstück & Aufstriche", "042": "Frühstück & Aufstriche", "043": "Frühstück & Aufstriche",
  "044": "Frühstück & Aufstriche", "045": "Süßwaren & Snacks", "046": "Oliven & Eingelegtes",
  "047": "Brot & Backwaren", "048": "Konserven & Vorrat", "049": "Öle, Essig & Soßen", "050": "Konserven & Vorrat",
  "051": "Gewürze & Würzpasten", "052": "Nudeln, Reis & Getreide", "053": "Nudeln, Reis & Getreide",
  "054": "Gewürze & Würzpasten", "055": null
};

const COLUMNS = {
  kassen_id: ["ID", "Artikelnummer", "ArtNr"],
  barcode: ["Barcode", "EAN", "GTIN"],
  name: ["Bezeichnung", "Name", "Artikel"],
  group_id: ["WarengruppenID", "Warengruppen-ID", "WG-ID"],
  group: ["Warengruppen", "Warengruppe"],
  amount: ["Gewicht", "Menge", "Inhalt"],
  unit: ["Einheit"],
  price: ["VK-Preis", "VK", "Preis", "Verkaufspreis"],
  favorit: ["Favorit"]
};

// Die Kasse speichert Umlaute teils im Mac-Roman-Zeichensatz (Steuerzeichen 0x80–0x9F).
const MAC_ROMAN = "ÄÅÇÉÑÖÜáàâäãåçéèêëíìîïñóòôöõúùûü";
const fixText = (value) =>
  String(value ?? "")
    .replace(/[\u0080-\u009f]/g, (ch) => MAC_ROMAN[ch.charCodeAt(0) - 0x80] || "")
    .replace(/\s+/g, " ")
    .trim();

function trim3(value) {
  return String(Math.round(value * 1000) / 1000).replace(".", ",");
}

export function formatUnit(amount, unit) {
  const value = Number(String(amount ?? "").replace(",", "."));
  const u = String(unit ?? "").trim().toLowerCase();
  if (!Number.isFinite(value) || value <= 0) return u === "stk" ? "Stück" : u;
  if (u === "kg") return value < 1 ? `${Math.round(value * 1000)} g` : `${trim3(value)} kg`;
  if (u === "l") return value < 1 ? `${Math.round(value * 1000)} ml` : `${trim3(value)} l`;
  if (u === "g" || u === "ml") return `${trim3(value)} ${u}`;
  if (u === "stk") return value === 1 ? "Stück" : `${trim3(value)} Stück`;
  return `${trim3(value)} ${u}`.trim();
}

export function parseCsv(text) {
  const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/).filter((line) => line.trim());
  if (lines.length < 2) throw new Error("Die Datei enthält keine Produktzeilen.");

  const separator = (lines[0].match(/;/g) || []).length >= (lines[0].match(/,/g) || []).length ? ";" : ",";
  const header = lines[0].split(separator).map((cell) => cell.trim().replace(/^"|"$/g, ""));
  const index = {};
  for (const [field, names] of Object.entries(COLUMNS)) {
    const position = header.findIndex((cell) => names.some((name) => name.toLowerCase() === cell.toLowerCase()));
    if (position >= 0) index[field] = position;
  }
  if (index.barcode === undefined || index.name === undefined) {
    throw new Error(`Spalten „Barcode“ und „Bezeichnung“ fehlen. Gefunden: ${header.join(", ")}`);
  }

  const rows = [];
  const skipped = { noName: 0, noBarcode: 0, excluded: 0, duplicate: 0 };
  const seen = new Set();

  for (const line of lines.slice(1)) {
    const cells = line.split(separator).map((cell) => cell.trim().replace(/^"|"$/g, ""));
    const pick = (field) => (index[field] === undefined ? "" : fixText(cells[index[field]]));
    const barcode = pick("barcode");
    const name = pick("name");
    const groupId = pick("group_id").padStart(3, "0");
    const category = groupId in POS_GROUP_TO_CATEGORY ? POS_GROUP_TO_CATEGORY[groupId] : "Sonstiges";

    if (!barcode) { skipped.noBarcode += 1; continue; }
    if (!name) { skipped.noName += 1; continue; }
    if (category === null) { skipped.excluded += 1; continue; }
    if (seen.has(barcode)) { skipped.duplicate += 1; continue; }
    seen.add(barcode);

    const price = Number(pick("price").replace(/\./g, "").replace(",", "."));
    rows.push({
      barcode,
      name,
      category,
      unit: formatUnit(pick("amount"), pick("unit")),
      price: Number.isFinite(price) && price > 0 ? price.toFixed(2) : "",
      kassen_id: /^\d+$/.test(pick("kassen_id")) ? pick("kassen_id") : "",
      pos_group: pick("group"),
      favorit: pick("favorit") === "J"
    });
  }

  return { rows, skipped };
}
