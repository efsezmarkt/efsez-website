/** CSV-Export der Kasse (Delta-A / DCO) im Browser einlesen. */

/** Spalten des Delta-A/DCO-Exports → unsere Felder. Weitere Schreibweisen kann man hier ergänzen. */
const COLUMNS = {
  kassen_id: ["ID", "Artikelnummer", "ArtNr"],
  barcode: ["Barcode", "EAN", "GTIN"],
  name: ["Bezeichnung", "Name", "Artikel"],
  pos_group_id: ["WarengruppenID", "Warengruppen-ID", "WG-ID"],
  pos_group: ["Warengruppen", "Warengruppe"],
  amount: ["Gewicht", "Menge", "Inhalt"],
  unit: ["Einheit"],
  price: ["VK-Preis", "VK", "Preis", "Verkaufspreis"],
  favorit: ["Favorit"]
};

// Die Kasse speichert Umlaute teils im Mac-Roman-Zeichensatz.
const MAC_ROMAN = "ÄÅÇÉÑÖÜáàâäãåçéèêëíìîïñóòôöõúùûü";
const fixText = (value) => String(value ?? "").replace(/[\u0080-\u009f]/g, (ch) => MAC_ROMAN[ch.charCodeAt(0) - 0x80] || "");

export function parseCsv(text) {
  const clean = text.replace(/^\uFEFF/, "");
  const lines = clean.split(/\r?\n/).filter((line) => line.trim() !== "");
  if (lines.length < 2) throw new Error("Die Datei enthält keine Produktzeilen.");

  const separator = (lines[0].match(/;/g) || []).length >= (lines[0].match(/,/g) || []).length ? ";" : ",";
  const header = lines[0].split(separator).map((cell) => cell.trim().replace(/^"|"$/g, ""));
  const index = {};
  for (const [field, names] of Object.entries(COLUMNS)) {
    const position = header.findIndex((cell) => names.some((name) => name.toLowerCase() === cell.toLowerCase()));
    if (position >= 0) index[field] = position;
  }
  if (index.barcode === undefined || index.name === undefined) {
    throw new Error(`Spalten „Barcode“ und „Bezeichnung“ nicht gefunden. Gefundene Spalten: ${header.join(", ")}`);
  }

  const rows = [];
  for (const line of lines.slice(1)) {
    const cells = line.split(separator).map((cell) => cell.trim().replace(/^"|"$/g, ""));
    const pick = (field) => (index[field] === undefined ? "" : fixText(cells[index[field]] ?? ""));
    rows.push({
      kassen_id: pick("kassen_id"),
      barcode: pick("barcode"),
      name: pick("name"),
      pos_group_id: pick("pos_group_id"),
      pos_group: pick("pos_group"),
      amount: pick("amount"),
      unit: pick("unit"),
      price: pick("price"),
      favorit: pick("favorit") === "J"
    });
  }
  return { rows, header };
}

