import { createClient } from "@supabase/supabase-js";
import { SUPABASE_KEY, SUPABASE_URL } from "../lib/config";

/** Voller Supabase-Client nur für den Personalbereich (Login, Schreiben, Bilder). */
export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: true, autoRefreshToken: true, storageKey: "efsez-personal" }
});

export function check({ data, error }) {
  if (error) throw new Error(translate(error.message));
  return data;
}

function translate(message = "") {
  if (/Invalid login credentials/i.test(message)) return "Der Zugangscode stimmt nicht.";
  if (/duplicate key.*barcode/i.test(message)) return "Dieser Barcode ist schon bei einem anderen Produkt hinterlegt.";
  if (/duplicate key.*categories_name/i.test(message)) return "Diese Kategorie gibt es schon.";
  if (/row-level security|permission denied/i.test(message)) return "Keine Berechtigung. Bitte neu anmelden.";
  if (/Failed to fetch|NetworkError/i.test(message)) return "Keine Verbindung. Bitte Internet prüfen.";
  return message || "Unbekannter Fehler.";
}

/** Bild verkleinern (max. 1200 px, WebP) und in den Speicher laden. Gibt den Pfad zurück. */
export async function uploadImage(file, folder) {
  const blob = await shrink(file);
  const safe = file.name.toLowerCase().replace(/\.[^.]+$/, "").replace(/[^a-z0-9-]+/g, "-").slice(0, 40) || "bild";
  const path = `${folder}/${Date.now()}-${safe}.webp`;
  const { error } = await supabase.storage.from("images").upload(path, blob, {
    contentType: "image/webp",
    cacheControl: "31536000",
    upsert: false
  });
  if (error) throw new Error(translate(error.message));
  return path;
}

async function shrink(file) {
  if (!/^image\//.test(file.type)) throw new Error("Bitte ein Bild auswählen (JPG, PNG oder WebP).");
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 1200 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d").drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/webp", 0.85));
  if (!blob) throw new Error("Das Bild konnte nicht verarbeitet werden.");
  return blob;
}
