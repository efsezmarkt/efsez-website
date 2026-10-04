import { useCallback, useEffect, useRef, useState } from "react";
import { supabase, check } from "./client";
import ProductImage from "../components/ProductImage";
import { formatPrice } from "../lib/format";
import { Field, ImageField, Toggle } from "./ui";
import { confirmAction, parsePrice, priceText } from "./util";
import CareMode from "./CareMode";

const PAGE = 40;
const EMPTY = {
  name: "", category_id: "", price: "", unit: "", brand: "", image: "", description: "", details: "",
  origin: "", allergens: "", barcode: "", tags: "", visible: true, featured: false, available: true
};

function ProductsTab({ categories, notify, refresh }) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState({ term: "", categoryId: "", visibility: "alle" });
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(() => new Set());
  const [form, setForm] = useState(null);
  const [care, setCare] = useState(false);
  const request = useRef(0);

  useEffect(() => {
    const timer = window.setTimeout(() => setFilter((current) => ({ ...current, term: search.trim() })), 250);
    return () => window.clearTimeout(timer);
  }, [search]);

  const load = useCallback(
    async (nextPage) => {
      const id = ++request.current;
      setLoading(true);
      try {
        let query = supabase
          .from("products")
          .select(
            "id,name,image,unit,price,featured,visible,available,source,category_id,variant_count,category:categories(name,image)",
            { count: "exact" }
          )
          .is("merged_into", null);
        if (filter.categoryId) query = query.eq("category_id", Number(filter.categoryId));
        if (filter.visibility === "sichtbar") query = query.eq("visible", true);
        if (filter.visibility === "versteckt") query = query.eq("visible", false);
        if (filter.visibility === "beliebt") query = query.eq("featured", true);
        if (filter.visibility === "ohne-preis") query = query.is("price", null);
        if (filter.visibility === "ohne-bild") query = query.eq("image", "");
        const term = filter.term.replace(/[,()*%\\]/g, " ").trim();
        if (term) query = query.or(`search_text.ilike.*${term}*,barcode.ilike.${term}*`);
        const { data, count, error } = await query.order("name").range(nextPage * PAGE, nextPage * PAGE + PAGE - 1);
        if (error) throw error;
        if (id !== request.current) return;
        setItems((current) => (nextPage === 0 ? data : [...current, ...data]));
        setTotal(count ?? 0);
        setPage(nextPage);
      } catch (error) {
        notify(error.message);
      } finally {
        if (id === request.current) setLoading(false);
      }
    },
    [filter, notify]
  );

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelected(new Set());
    load(0);
  }, [load]);

  async function patch(product, changes) {
    try {
      check(await supabase.from("products").update(changes).eq("id", product.id));
      setItems((current) => current.map((item) => (item.id === product.id ? { ...item, ...changes } : item)));
      refresh();
    } catch (error) {
      notify(error.message);
    }
  }

  async function bulk(changes, label, scope = "auswahl") {
    try {
      let query = supabase.from("products").update(changes);
      query = scope === "kategorie" ? query.eq("category_id", Number(filter.categoryId)) : query.in("id", [...selected]);
      const data = check(await query.select("id"));
      notify(`${data.length} Produkte ${label}.`);
      setSelected(new Set());
      await load(0);
      refresh();
    } catch (error) {
      notify(error.message);
    }
  }

  async function mergeSelected() {
    const chosen = items.filter((item) => selected.has(item.id));
    if (chosen.length < 2) return;
    // Hauptprodukt: zuerst eins, das schon auf der Website ist, sonst das erste in der Liste
    const main = chosen.find((item) => item.visible) || chosen[0];
    const title = window.prompt(
      `${chosen.length} Artikel zu einem Produkt zusammenfassen. Die anderen erscheinen als „Sorten & Größen“.\n\nName auf der Website:`,
      main.name
    );
    if (title === null) return;
    try {
      const result = check(await supabase.rpc("merge_products", { p_main: main.id, p_ids: chosen.map((item) => item.id), p_title: title }));
      notify(`${result.merged} Artikel unter „${title || main.name}“ zusammengefasst.`);
      setSelected(new Set());
      await load(0);
      refresh();
    } catch (error) {
      notify(error.message);
    }
  }

  async function unmerge(variant) {
    try {
      check(await supabase.rpc("unmerge_product", { p_id: variant.id }));
      notify(`„${variant.name}“ ist wieder ein eigenes Produkt (versteckt).`);
      const full = check(await supabase.from("products").select("variants,variant_count").eq("id", form.id).single());
      setForm((current) => ({ ...current, variants: full.variants, variant_count: full.variant_count }));
      refresh();
    } catch (error) {
      notify(error.message);
    }
  }

  async function removeSelected() {
    if (!confirmAction(`${selected.size} Produkte endgültig löschen? Tipp: „Verstecken“ reicht meistens.`)) return;
    try {
      check(await supabase.from("products").delete().in("id", [...selected]));
      notify("Gelöscht.");
      setSelected(new Set());
      await load(0);
      refresh();
    } catch (error) {
      notify(error.message);
    }
  }

  async function openForm(product) {
    if (!product) {
      setForm({ ...EMPTY, category_id: filter.categoryId || "" });
      return;
    }
    try {
      const full = check(await supabase.from("products").select("*").eq("id", product.id).single());
      setForm({
        ...EMPTY,
        ...Object.fromEntries(Object.entries(full).map(([key, value]) => [key, value ?? ""])),
        price: priceText(full.price),
        category_id: full.category_id ? String(full.category_id) : ""
      });
    } catch (error) {
      notify(error.message);
    }
  }

  async function save(event) {
    event.preventDefault();
    const payload = {
      name: form.name.trim(),
      category_id: form.category_id ? Number(form.category_id) : null,
      price: parsePrice(form.price),
      unit: form.unit.trim(),
      brand: form.brand.trim(),
      image: form.image,
      description: form.description.trim(),
      details: form.details.trim(),
      origin: form.origin.trim(),
      allergens: form.allergens.trim(),
      barcode: form.barcode.trim() || null,
      tags: form.tags.trim(),
      visible: form.visible,
      featured: form.featured,
      available: form.available,
      reviewed_at: new Date().toISOString()
    };
    try {
      if (form.id) check(await supabase.from("products").update(payload).eq("id", form.id));
      else check(await supabase.from("products").insert(payload));
      notify(form.id ? "Gespeichert." : "Produkt angelegt.");
      setForm(null);
      await load(0);
      refresh();
    } catch (error) {
      notify(error.message);
    }
  }

  async function removeOne() {
    if (!confirmAction(`„${form.name}“ endgültig löschen?`)) return;
    try {
      check(await supabase.from("products").delete().eq("id", form.id));
      notify("Gelöscht.");
      setForm(null);
      await load(0);
      refresh();
    } catch (error) {
      notify(error.message);
    }
  }

  const set = (key) => (event) => setForm((current) => ({ ...current, [key]: event?.target ? event.target.value : event }));

  if (care) {
    return (
      <CareMode
        categories={categories}
        notify={notify}
        refresh={refresh}
        onExit={() => {
          setCare(false);
          load(0);
        }}
      />
    );
  }

  if (form) {
    return (
      <form className="a-panel" onSubmit={save}>
        <div className="a-panel-head">
          <h2>{form.id ? "Produkt bearbeiten" : "Neues Produkt"}</h2>
          <button type="button" className="a-link" onClick={() => setForm(null)}>Zurück zur Liste</button>
        </div>

        <ImageField value={form.image} folder="produkte" name={form.name} onChange={set("image")} onMessage={notify} />

        <div className="a-grid">
          <Field label="Name" wide>
            <input required value={form.name} onChange={set("name")} />
          </Field>
          <Field label="Kategorie">
            <select value={form.category_id} onChange={set("category_id")}>
              <option value="">Ohne Kategorie</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
          </Field>
          <Field label="Preis in €">
            <input inputMode="decimal" placeholder="2,59" value={form.price} onChange={set("price")} />
          </Field>
          <Field label="Inhalt" hint="z. B. 500 g, 1 l, Stück – daraus wird der Grundpreis berechnet">
            <input value={form.unit} onChange={set("unit")} />
          </Field>
          <Field label="Marke">
            <input value={form.brand} onChange={set("brand")} />
          </Field>
          <Field label="Kurzbeschreibung" wide>
            <textarea rows={2} value={form.description} onChange={set("description")} />
          </Field>
          <Field label="Weitere Infos" wide>
            <textarea rows={3} value={form.details} onChange={set("details")} />
          </Field>
          <Field label="Herkunft">
            <input value={form.origin} onChange={set("origin")} />
          </Field>
          <Field label="Allergene">
            <input value={form.allergens} onChange={set("allergens")} />
          </Field>
          <Field label="Barcode">
            <input inputMode="numeric" value={form.barcode} onChange={set("barcode")} />
          </Field>
          <Field label="Suchwörter" hint="Kommagetrennt, z. B. ayran, joghurt">
            <input value={form.tags} onChange={set("tags")} />
          </Field>
        </div>

        {form.variant_count > 1 && (
          <div className="a-variants">
            <h3>Sorten & Größen ({form.variant_count})</h3>
            <p className="a-hint">
              Diese Kassenartikel erscheinen auf der Website gesammelt unter diesem Produkt. Preise kommen weiter aus
              dem Kassen-Import.
            </p>
            <ul>
              {(form.variants || []).map((variant) => (
                <li key={variant.id}>
                  <span>
                    {variant.name}
                    {variant.unit ? <small> {variant.unit}</small> : null}
                  </span>
                  <span className="a-variant-price">{variant.price !== null ? formatPrice(variant.price) : "–"}</span>
                  {variant.id !== form.id ? (
                    <button type="button" className="a-link" onClick={() => unmerge(variant)}>
                      Herauslösen
                    </button>
                  ) : (
                    <small className="a-variant-main">Hauptartikel</small>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="a-toggles">
          <Toggle checked={form.visible} onChange={set("visible")} label="Auf der Website zeigen" />
          <Toggle checked={form.featured} onChange={set("featured")} label="Beliebt (Startseite)" />
          <Toggle checked={form.available} onChange={set("available")} label="Vorrätig" />
        </div>

        <div className="a-actions">
          <button type="submit" className="a-button">{form.id ? "Speichern" : "Produkt anlegen"}</button>
          {form.id && <button type="button" className="a-button a-button-danger" onClick={removeOne}>Löschen</button>}
        </div>
      </form>
    );
  }

  const allSelected = items.length > 0 && items.every((item) => selected.has(item.id));

  return (
    <div className="a-stack">
      <button type="button" className="a-care-start" onClick={() => setCare(true)}>
        <strong>Pflegemodus starten</strong>
        <span>Ein Produkt nach dem anderen: Foto, Preis, Name prüfen – es geht dort weiter, wo zuletzt aufgehört wurde.</span>
      </button>

      <div className="a-filters">
        <input type="search" placeholder="Name, Marke oder Barcode" value={search} onChange={(event) => setSearch(event.target.value)} />
        <select value={filter.categoryId} onChange={(event) => setFilter((current) => ({ ...current, categoryId: event.target.value }))}>
          <option value="">Alle Kategorien</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name} ({category.visible_count}/{category.total_count})
            </option>
          ))}
        </select>
        <select value={filter.visibility} onChange={(event) => setFilter((current) => ({ ...current, visibility: event.target.value }))}>
          <option value="alle">Alle</option>
          <option value="sichtbar">Auf der Website</option>
          <option value="versteckt">Versteckt</option>
          <option value="beliebt">Beliebt</option>
          <option value="ohne-preis">Ohne Preis</option>
          <option value="ohne-bild">Ohne Foto</option>
        </select>
        <button type="button" className="a-button" onClick={() => openForm(null)}>Neues Produkt</button>
      </div>

      <div className="a-bulk">
        <label className="a-check">
          <input
            type="checkbox"
            checked={allSelected}
            onChange={(event) =>
              setSelected((current) => {
                const next = new Set(current);
                items.forEach((item) => (event.target.checked ? next.add(item.id) : next.delete(item.id)));
                return next;
              })
            }
          />
          {selected.size ? `${selected.size} ausgewählt` : `${total.toLocaleString("de-DE")} Produkte`}
        </label>
        <div className="a-bulk-actions">
          {selected.size > 0 ? (
            <>
              <button type="button" onClick={() => bulk({ visible: true }, "auf der Website")}>Zeigen</button>
              <button type="button" onClick={() => bulk({ visible: false }, "versteckt")}>Verstecken</button>
              <button type="button" onClick={() => bulk({ featured: true }, "als beliebt markiert")}>Beliebt</button>
              <select
                value=""
                onChange={(event) => event.target.value && bulk({ category_id: Number(event.target.value) }, "verschoben")}
              >
                <option value="">Kategorie ändern …</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
              {selected.size > 1 && (
                <button type="button" onClick={mergeSelected}>Zusammenfassen</button>
              )}
              <button type="button" className="is-danger" onClick={removeSelected}>Löschen</button>
            </>
          ) : filter.categoryId ? (
            <>
              <button type="button" onClick={() => bulk({ visible: true }, "auf der Website", "kategorie")}>Ganze Kategorie zeigen</button>
              <button type="button" onClick={() => bulk({ visible: false }, "versteckt", "kategorie")}>Ganze Kategorie verstecken</button>
            </>
          ) : null}
        </div>
      </div>

      <ul className="a-list">
        {items.map((product) => (
          <li key={product.id} className={`a-row ${product.visible ? "" : "is-muted"}`}>
            <input
              type="checkbox"
              aria-label={`${product.name} auswählen`}
              checked={selected.has(product.id)}
              onChange={() =>
                setSelected((current) => {
                  const next = new Set(current);
                  if (next.has(product.id)) next.delete(product.id);
                  else next.add(product.id);
                  return next;
                })
              }
            />
            <button type="button" className="a-row-main" onClick={() => openForm(product)}>
              <span className="a-thumb">
                <ProductImage src={product.image || product.category?.image} name={product.name} variant="letter" />
              </span>
              <span className="a-row-text">
                <strong>{product.name}</strong>
                <small>
                  {product.category?.name || "Ohne Kategorie"}
                  {product.variant_count > 1 ? `, ${product.variant_count} Sorten & Größen` : product.unit ? `, ${product.unit}` : ""}
                </small>
              </span>
              <span className="a-row-price">{product.price !== null ? formatPrice(product.price) : "kein Preis"}</span>
            </button>
            <div className="a-row-toggles">
              <Toggle checked={product.visible} onChange={(value) => patch(product, { visible: value })} label="Website" />
              <Toggle checked={product.featured} onChange={(value) => patch(product, { featured: value })} label="Beliebt" />
            </div>
          </li>
        ))}
      </ul>

      {!loading && items.length === 0 && <p className="a-empty">Keine Produkte für diese Auswahl.</p>}
      {items.length < total && (
        <button type="button" className="a-button a-button-soft a-more" disabled={loading} onClick={() => load(page + 1)}>
          {loading ? "Lädt …" : `Weitere laden (${items.length} von ${total.toLocaleString("de-DE")})`}
        </button>
      )}
    </div>
  );
}

export default ProductsTab;
