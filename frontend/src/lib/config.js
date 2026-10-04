export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "";
export const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

/** Personalzugang: feste Adresse, im Login wird nur der Zugangscode abgefragt. */
export const STAFF_EMAIL = import.meta.env.VITE_STAFF_EMAIL || "personal@efsez-markt.de";

export const PAGE_SIZE = 24;

export function supabaseHeaders() {
  // Neue Supabase-Schlüssel (sb_publishable_…) sind keine JWTs → nur als apikey senden.
  const headers = { apikey: SUPABASE_KEY };
  if (SUPABASE_KEY.startsWith("eyJ")) headers.Authorization = `Bearer ${SUPABASE_KEY}`;
  return headers;
}

export function imageUrl(path) {
  if (!path) return "";
  if (/^(https?:)?\/\//.test(path) || path.startsWith("/")) return path;
  return `${SUPABASE_URL}/storage/v1/object/public/images/${path}`;
}
