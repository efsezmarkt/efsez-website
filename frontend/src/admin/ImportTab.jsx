import { useState } from "react";
import { supabase, check } from "./client";
import { parseCsv } from "./csv";

const BATCH = 1000;

function ImportTab({ notify, refresh }) {
  const [file, setFile] = useState(null);
  const [parsed, setParsed] = useState(null);
  const [visibility, setVisibility] = useState("favorites");
  const [progress, setProgress] = useState(null);
  const [running, setRunning] = useState(false);

  async function read(selected) {
    if (!selected) return;
    setFile(selected.name);
    setParsed(null);
    setProgress(null);
    try {
      setParsed(parseCsv(await selected.text()));
    } catch (error) {
      notify(error.message);
    }
  }

  async function run() {
    setRunning(true);
    const totals = { done: 0, inserted: 0, updated: 0 };
    setProgress({ ...totals });
    try {
      for (let start = 0; start < parsed.rows.length; start += BATCH) {
        const result = check(
          await supabase.rpc("import_products", { p_rows: parsed.rows.slice(start, start + BATCH), p_visibility: visibility })
        );
        totals.done = Math.min(parsed.rows.length, start + BATCH);
        totals.inserted += result.inserted;
        totals.updated += result.updated;
        setProgress({ ...totals });
      }
      notify(`Fertig: ${totals.inserted} neu, ${totals.updated} aktualisiert.`);
      refresh();
    } catch (error) {
      notify(`Abgebrochen: ${error.message}`);
    } finally {
      setRunning(false);
    }
  }

  const favorites = parsed ? parsed.rows.filter((row) => row.favorit).length : 0;
  const skipped = parsed ? Object.values(parsed.skipped).reduce((a, b) => a + b, 0) : 0;

  return (
    <div className="a-panel">
      <h2>Produkte aus der Kasse übernehmen</h2>
      <ol className="a-steps">
        <li>In der Kasse (Delta Cloud Office) die Artikelliste als CSV exportieren.</li>
        <li>Datei hier auswählen. Sie wird nur gelesen, an der Kasse ändert sich nichts.</li>
        <li>Festlegen, was sofort auf der Website erscheint, und starten.</li>
      </ol>
      <p className="a-hint">
        Den Import können Sie jederzeit wiederholen, zum Beispiel nach Preisänderungen. Bei vorhandenen Produkten wird
        nur der Preis aktualisiert. Name, Foto, Kategorie und Sichtbarkeit, die Sie hier gepflegt haben, bleiben erhalten.
      </p>

      <label className="a-drop">
        <input type="file" accept=".csv,text/csv" hidden onChange={(event) => { read(event.target.files?.[0]); event.target.value = ""; }} />
        <strong>{file || "CSV-Datei auswählen"}</strong>
        <span>Export aus der Kasse, Semikolon-getrennt</span>
      </label>

      {parsed && (
        <>
          <div className="a-stats">
            <div><strong>{parsed.rows.length.toLocaleString("de-DE")}</strong><span>Artikel</span></div>
            <div><strong>{favorites}</strong><span>Kassen-Favoriten</span></div>
            <div><strong>{parsed.rows.filter((row) => !row.price).length}</strong><span>ohne Preis</span></div>
            <div><strong>{skipped}</strong><span>übersprungen (Pfand, ohne Name …)</span></div>
          </div>

          <fieldset className="a-radios">
            <legend>Neue Produkte auf der Website zeigen?</legend>
            <label>
              <input type="radio" checked={visibility === "favorites"} onChange={() => setVisibility("favorites")} />
              Nur die {favorites} Favoriten aus der Kasse, den Rest später freischalten
            </label>
            <label>
              <input type="radio" checked={visibility === "none"} onChange={() => setVisibility("none")} />
              Keine, ich schalte selbst frei
            </label>
            <label>
              <input type="radio" checked={visibility === "all"} onChange={() => setVisibility("all")} />
              Alle sofort zeigen
            </label>
          </fieldset>

          <div className="a-actions">
            <button type="button" className="a-button" onClick={run} disabled={running}>
              {running ? "Import läuft …" : `${parsed.rows.length.toLocaleString("de-DE")} Artikel importieren`}
            </button>
          </div>
        </>
      )}

      {progress && parsed && (
        <div className="a-progress">
          <span style={{ width: `${Math.round((progress.done / parsed.rows.length) * 100)}%` }} />
          <p>
            {progress.done.toLocaleString("de-DE")} von {parsed.rows.length.toLocaleString("de-DE")}: {progress.inserted} neu, {progress.updated} aktualisiert
          </p>
        </div>
      )}
    </div>
  );
}

export default ImportTab;
