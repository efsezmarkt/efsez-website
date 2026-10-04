import { useState } from "react";
import { api } from "../api";
import { parseCsv } from "../lib/csv";

const BATCH = 400;

function AdminImport({ token, onMessage, onChanged }) {
  const [parsed, setParsed] = useState(null);
  const [fileName, setFileName] = useState("");
  const [visibility, setVisibility] = useState("favorites");
  const [progress, setProgress] = useState(null); // { done, total, inserted, updated, skipped }
  const [running, setRunning] = useState(false);

  async function handleFile(file) {
    if (!file) return;
    setParsed(null);
    setProgress(null);
    setFileName(file.name);
    try {
      const text = await file.text();
      const result = parseCsv(text);
      setParsed(result);
    } catch (error) {
      onMessage(error.message);
    }
  }

  async function run() {
    if (!parsed) return;
    setRunning(true);
    const totals = { done: 0, total: parsed.rows.length, inserted: 0, updated: 0, skipped: 0 };
    setProgress({ ...totals });
    try {
      for (let start = 0; start < parsed.rows.length; start += BATCH) {
        const result = await api.importProducts(parsed.rows.slice(start, start + BATCH), visibility, token);
        totals.done = Math.min(parsed.rows.length, start + BATCH);
        totals.inserted += result.inserted;
        totals.updated += result.updated;
        totals.skipped += result.skipped;
        setProgress({ ...totals });
      }
      onMessage(`Import fertig: ${totals.inserted} neu, ${totals.updated} aktualisiert, ${totals.skipped} übersprungen.`);
      onChanged?.();
    } catch (error) {
      onMessage(`Import abgebrochen: ${error.message}`);
    } finally {
      setRunning(false);
    }
  }

  const favorites = parsed ? parsed.rows.filter((row) => row.favorit).length : 0;

  return (
    <div className="admin-import">
      <div className="admin-panel">
        <h3>Produkte aus der Kasse übernehmen</h3>
        <ol className="admin-steps">
          <li>In der Kasse (DCO) die Artikelliste als <strong>CSV</strong> exportieren.</li>
          <li>Die Datei hier auswählen – sie wird im Browser gelesen, nichts wird verändert.</li>
          <li>Entscheiden, welche Produkte sofort sichtbar sein sollen, dann starten.</li>
        </ol>
        <p className="admin-hint">
          Bereits vorhandene Produkte (gleicher Barcode) bekommen nur den neuen Preis – Name, Bild, Kategorie und
          Sichtbarkeit, die du auf der Website gepflegt hast, bleiben erhalten. Der Import kann also jederzeit
          wiederholt werden, z. B. nach Preisänderungen.
        </p>

        <label className="upload-dropzone">
          <input type="file" accept=".csv,text/csv" onChange={(event) => { handleFile(event.target.files?.[0]); event.target.value = ""; }} />
          <span className="upload-icon" aria-hidden="true">↑</span>
          <span className="upload-copy">
            <strong>{fileName || "CSV-Datei auswählen"}</strong>
            <small>Export aus der Kasse (Semikolon-getrennt)</small>
          </span>
        </label>

        {parsed && (
          <div className="import-summary">
            <div className="import-stats">
              <div><strong>{parsed.rows.length}</strong><span>Zeilen</span></div>
              <div><strong>{favorites}</strong><span>Favoriten (Kasse)</span></div>
              <div><strong>{parsed.rows.filter((row) => !row.name).length}</strong><span>ohne Namen</span></div>
              <div><strong>{parsed.rows.filter((row) => !row.price || row.price === "0,00").length}</strong><span>ohne Preis</span></div>
            </div>

            <fieldset className="import-visibility">
              <legend>Neue Produkte sichtbar schalten?</legend>
              <label><input type="radio" name="visibility" value="favorites" checked={visibility === "favorites"} onChange={() => setVisibility("favorites")} /> Nur Favoriten aus der Kasse ({favorites}) – Rest unsichtbar, später freischalten</label>
              <label><input type="radio" name="visibility" value="none" checked={visibility === "none"} onChange={() => setVisibility("none")} /> Alle unsichtbar – ich schalte selbst frei</label>
              <label><input type="radio" name="visibility" value="all" checked={visibility === "all"} onChange={() => setVisibility("all")} /> Alle sofort sichtbar (bei über 2.000 Artikeln nicht empfohlen)</label>
            </fieldset>

            <div className="admin-actions">
              <button type="button" onClick={run} disabled={running}>
                {running ? "Import läuft…" : `${parsed.rows.length} Zeilen importieren`}
              </button>
            </div>
          </div>
        )}

        {progress && (
          <div className="import-progress">
            <div className="import-bar"><span style={{ width: `${Math.round((progress.done / progress.total) * 100)}%` }} /></div>
            <p>
              {progress.done} von {progress.total} · {progress.inserted} neu · {progress.updated} aktualisiert · {progress.skipped} übersprungen
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminImport;
