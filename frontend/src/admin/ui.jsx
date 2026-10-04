import { useState } from "react";
import ProductImage from "../components/ProductImage";
import { uploadImage } from "./client";

export function Field({ label, hint, children, wide = false }) {
  return (
    <label className={`a-field ${wide ? "is-wide" : ""}`}>
      <span className="a-field-label">{label}</span>
      {children}
      {hint && <small className="a-field-hint">{hint}</small>}
    </label>
  );
}

export function Toggle({ checked, onChange, label }) {
  return (
    <label className={`a-toggle ${checked ? "is-on" : ""}`}>
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      <span className="a-toggle-track" aria-hidden="true" />
      <span>{label}</span>
    </label>
  );
}

/** Handy/Tablet: zwei Knöpfe (Kamera oder Galerie). Am PC reicht die Dateiauswahl. */
const isTouch = typeof window !== "undefined" && window.matchMedia?.("(pointer: coarse)").matches;

export function ImageField({ value, folder, onChange, onMessage, name = "" }) {
  const [busy, setBusy] = useState(false);

  async function handle(file) {
    if (!file) return;
    setBusy(true);
    try {
      const path = await uploadImage(file, folder);
      onChange(path);
      onMessage?.("Bild hochgeladen. Zum Übernehmen speichern.");
    } catch (error) {
      onMessage?.(error.message);
    } finally {
      setBusy(false);
    }
  }

  const picker = (camera) => (
    <input
      type="file"
      accept="image/*"
      {...(camera ? { capture: "environment" } : {})}
      hidden
      disabled={busy}
      onChange={(event) => {
        handle(event.target.files?.[0]);
        event.target.value = "";
      }}
    />
  );

  return (
    <div className="a-image">
      <span className="a-image-preview">
        <ProductImage src={value} name={name || "Bild"} variant="letter" />
      </span>
      <div className="a-image-actions">
        {busy ? (
          <span className="a-button a-button-soft is-busy">Lädt hoch …</span>
        ) : (
          <div className="a-image-buttons">
            {isTouch && (
              <label className="a-button a-button-soft">
                {picker(true)}
                Foto machen
              </label>
            )}
            <label className="a-button a-button-soft">
              {picker(false)}
              {isTouch ? "Aus Galerie wählen" : value ? "Bild ersetzen" : "Bild auswählen"}
            </label>
          </div>
        )}
        {value && (
          <button type="button" className="a-link" onClick={() => onChange("")}>
            Bild entfernen
          </button>
        )}
      </div>
    </div>
  );
}
