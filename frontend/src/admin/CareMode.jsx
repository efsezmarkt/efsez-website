import { useCallback, useEffect, useRef, useState } from "react";
import { supabase, check } from "./client";
import { formatPrice } from "../lib/format";
import { Field, ImageField, Toggle } from "./ui";
import { parsePrice, priceText } from "./util";

/**
 * Pflegemodus: ein Produkt nach dem anderen durchgehen – immer zuerst die, die am
 * längsten nicht (oder noch nie) gepflegt wurden. „Speichern & weiter“ merkt sich das
 * Datum (reviewed_at), daher geht es beim nächsten Mal genau dort weiter.
 */

const FIELDS =
  "id,name,image,unit,price,description,category_id,visible,featured,available,barcode,kassen_id,reviewed_at,variant_count,variants,category:categories(name,image)";
const BATCH = 12;
const SKIP_KEY = "efsez-pflege-uebersprungen";

function readSkipped() {
  try {
    return new Set(JSON.parse(sessionStorage.getItem(SKIP_KEY) || "[]"));
  } catch {
    return new Set();
  }
}

function writeSkipped(set) {
  try {
    sessionStorage.setItem(SKIP_KEY, JSON.stringify([...set]));
  } catch {
    /* egal */
  }
}

function toForm(product) {
  return {
    name: product.name || "",
    image: product.image || "",
    unit: product.unit || "",
    price: priceText(product.price),
    description: product.description || "",
    category_id: product.category_id ? String(product.category_id) : "",
    visible: product.visible,
    featured: product.featured,
    available: product.available
  };
}

function lastReviewed(value) {
  if (!value) return "Noch nie gepflegt";
  const date = new Date(value);
  return `Zuletzt gepflegt am ${date.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" })}`;
}

function CareMode({ categories, notify, refresh, onExit }) {
  const [categoryId, setCategoryId] = useState("");
  const [onlyVisible, setOnlyVisible] = useState(false);
  const [queue, setQueue] = useState([]);
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [stats, setStats] = useState({ total: 0, done: 0, session: 0 });
  const skipped = useRef(readSkipped());
  const [skipCount, setSkipCount] = useState(() => readSkipped().size);
  const request = useRef(0);
  const current = queue[0] || null;

  const filtered = useCallback(
    (query) => {
      let next = query.is("merged_into", null);
      if (categoryId) next = next.eq("category_id", Number(categoryId));
      if (onlyVisible) next = next.eq("visible", true);
      return next;
    },
    [categoryId, onlyVisible]
  );

  const loadStats = useCallback(async () => {
    try {
      const all = await filtered(supabase.from("products").select("id", { count: "exact", head: true }));
      const done = await filtered(supabase.from("products").select("id", { count: "exact", head: true })).not("reviewed_at", "is", null);
      setStats((value) => ({ ...value, total: all.count ?? 0, done: done.count ?? 0 }));
    } catch {
      /* Zähler sind nur Info */
    }
  }, [filtered]);

  const fetchMore = useCallback(
    async (keep) => {
      const id = ++request.current;
      const exclude = [...skipped.current, ...keep.map((item) => item.id)];
      let query = filtered(supabase.from("products").select(FIELDS))
        .order("reviewed_at", { ascending: true, nullsFirst: true })
        .order("visible", { ascending: false })
        .order("featured", { ascending: false })
        .order("id")
        .limit(BATCH);
      if (exclude.length) query = query.not("id", "in", `(${exclude.join(",")})`);
      const data = check(await query);
      if (id !== request.current) return null;
      return [...keep, ...data];
    },
    [filtered]
  );

  const restart = useCallback(async () => {
    setLoading(true);
    try {
      const items = await fetchMore([]);
      if (!items) return;
      setQueue(items);
      setForm(items[0] ? toForm(items[0]) : null);
    } catch (error) {
      notify(error.message);
    } finally {
      setLoading(false);
    }
  }, [fetchMore, notify]);

  // Start und Filterwechsel: Warteschlange neu aufbauen
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    restart();
    loadStats();
  }, [restart, loadStats]);

  async function advance() {
    const rest = queue.slice(1);
    let next = rest;
    if (rest.length < 4) {
      try {
        next = (await fetchMore(rest)) || rest;
      } catch (error) {
        notify(error.message);
      }
    }
    setQueue(next);
    setForm(next[0] ? toForm(next[0]) : null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function save(changes = {}, message = "Gespeichert") {
    if (!current || saving) return;
    setSaving(true);
    const payload = {
      name: form.name.trim() || current.name,
      image: form.image,
      unit: form.unit.trim(),
      price: parsePrice(form.price),
      description: form.description.trim(),
      category_id: form.category_id ? Number(form.category_id) : null,
      visible: form.visible,
      featured: form.featured,
      available: form.available,
      reviewed_at: new Date().toISOString(),
      ...changes
    };
    try {
      check(await supabase.from("products").update(payload).eq("id", current.id));
      notify(`${message}: „${payload.name}“`);
      setStats((value) => ({ ...value, done: current.reviewed_at ? value.done : value.done + 1, session: value.session + 1 }));
      refresh();
      await advance();
    } catch (error) {
      notify(error.message);
    } finally {
      setSaving(false);
    }
  }

  async function skip() {
    if (!current) return;
    skipped.current.add(current.id);
    writeSkipped(skipped.current);
    setSkipCount(skipped.current.size);
    await advance();
  }

  const set = (key) => (event) => setForm((value) => ({ ...value, [key]: event?.target ? event.target.value : event }));
  const percent = stats.total ? Math.round((stats.done / stats.total) * 100) : 0;
  const variants = current?.variant_count > 1 ? current.variants || [] : [];

  return (
    <div className="a-stack a-care">
      <div className="a-care-head">
        <div>
          <h2>Pflegemodus</h2>
          <p className="a-hint">
            Immer zuerst die Produkte, die am längsten nicht gepflegt wurden. Nach jedem Speichern kommt das nächste –
            und beim nächsten Mal geht es genau hier weiter.
          </p>
        </div>
        <button type="button" className="a-button a-button-soft" onClick={onExit}>
          Pflegemodus beenden
        </button>
      </div>

      <div className="a-care-filters">
        <select value={categoryId} onChange={(event) => setCategoryId(event.target.value)}>
          <option value="">Alle Kategorien</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
        <Toggle checked={onlyVisible} onChange={setOnlyVisible} label="Nur Produkte auf der Website" />
      </div>

      <div className="a-progress" aria-label="Fortschritt">
        <div className="a-progress-bar">
          <span style={{ width: `${percent}%` }} />
        </div>
        <p>
          {stats.done.toLocaleString("de-DE")} von {stats.total.toLocaleString("de-DE")} gepflegt ({percent} %)
          {stats.session > 0 && `, heute schon ${stats.session} geschafft`}
        </p>
      </div>

      {loading && <div className="a-empty">Lädt …</div>}

      {!loading && !current && (
        <div className="a-empty">
          Alles durch! Für diese Auswahl gibt es gerade nichts mehr zu pflegen.
          {skipCount > 0 && (
            <>
              {" "}
              <button
                type="button"
                className="a-link"
                onClick={() => {
                  skipped.current = new Set();
                  writeSkipped(skipped.current);
                  setSkipCount(0);
                  restart();
                }}
              >
                Übersprungene noch mal zeigen
              </button>
            </>
          )}
        </div>
      )}

      {!loading && current && form && (
        <form
          className="a-panel a-care-card"
          key={current.id}
          onSubmit={(event) => {
            event.preventDefault();
            save();
          }}
        >
          <div className="a-care-meta">
            <span>{lastReviewed(current.reviewed_at)}</span>
            {current.kassen_id && <span>Kassen-Nr. {current.kassen_id}</span>}
            {current.barcode && variants.length === 0 && <span>Barcode {current.barcode}</span>}
          </div>

          <ImageField value={form.image} folder="produkte" name={form.name} onChange={set("image")} onMessage={notify} />
          {!form.image && current.category?.image && (
            <p className="a-hint">Ohne eigenes Foto zeigt die Website das Kategoriebild.</p>
          )}

          <div className="a-grid">
            <Field label="Name" wide>
              <input required value={form.name} onChange={set("name")} />
            </Field>
            <Field label="Preis in €" hint={variants.length ? "Preis des Hauptartikels – die Sorten haben eigene Preise aus der Kasse" : ""}>
              <input inputMode="decimal" placeholder="2,59" value={form.price} onChange={set("price")} />
            </Field>
            <Field label="Inhalt" hint="z. B. 500 g, 1 l, Stück">
              <input value={form.unit} onChange={set("unit")} />
            </Field>
            <Field label="Kategorie">
              <select value={form.category_id} onChange={set("category_id")}>
                <option value="">Ohne Kategorie</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Kurzbeschreibung" wide>
              <textarea rows={2} value={form.description} onChange={set("description")} />
            </Field>
          </div>

          {variants.length > 0 && (
            <details className="a-details">
              <summary>{variants.length} Sorten & Größen</summary>
              <ul className="a-care-variants">
                {variants.map((variant) => (
                  <li key={variant.id}>
                    <span>
                      {variant.name}
                      {variant.unit ? <small> {variant.unit}</small> : null}
                    </span>
                    <span>{variant.price !== null ? formatPrice(variant.price) : "–"}</span>
                  </li>
                ))}
              </ul>
            </details>
          )}

          <div className="a-toggles">
            <Toggle checked={form.visible} onChange={set("visible")} label="Auf der Website zeigen" />
            <Toggle checked={form.featured} onChange={set("featured")} label="Beliebt (Startseite)" />
            <Toggle checked={form.available} onChange={set("available")} label="Vorrätig" />
          </div>

          <div className="a-actions a-actions-sticky a-care-actions">
            <button type="submit" className="a-button" disabled={saving}>
              {saving ? "Speichert …" : "Speichern & weiter"}
            </button>
            <button
              type="button"
              className="a-button a-button-soft"
              disabled={saving}
              onClick={() => save({ visible: false, featured: false }, "Ausgeblendet")}
            >
              Nicht auf die Website & weiter
            </button>
            <button type="button" className="a-link" disabled={saving} onClick={skip}>
              Überspringen
            </button>
          </div>
        </form>
      )}

      {!loading && queue.length > 1 && (
        <p className="a-hint a-care-next">
          Als Nächstes: {queue.slice(1, 4).map((item) => item.name).join(", ")}
          {queue.length > 4 ? " …" : ""}
        </p>
      )}
    </div>
  );
}

export default CareMode;
