import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "../api";
import ProductImage from "../components/ProductImage";
import { formatPrice } from "../lib/site";
import { Field, ImageUploadField, Toggle } from "./shared";
import { confirmAction, priceInput } from "./utils";

const PAGE = 40;

const emptyProduct = {
  name: "",
  category: "",
  brand: "",
  price: "",
  unit: "",
  description: "",
  details: "",
  origin: "",
  allergens: "",
  barcode: "",
  tags: "",
  image: "",
  featured: false,
  available: true,
  visible: true
};

function AdminProducts({ token, categories, onMessage, onChanged }) {
  const [filter, setFilter] = useState({ q: "", category: "", visibility: "all" });
  const [search, setSearch] = useState("");
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(() => new Set());
  const [form, setForm] = useState(null); // null = Liste, Objekt = Formular
  const [editingId, setEditingId] = useState(null);
  const requestId = useRef(0);

  useEffect(() => {
    const timer = window.setTimeout(() => setFilter((current) => ({ ...current, q: search.trim() })), 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  const load = useCallback(
    async (nextPage = 1, append = false) => {
      const current = ++requestId.current;
      setLoading(true);
      try {
        const result = await api.getProducts(
          {
            page: nextPage,
            limit: PAGE,
            q: filter.q,
            category: filter.category,
            all: filter.visibility === "all" ? "1" : "",
            visible: filter.visibility === "hidden" ? "0" : "",
            sort: "name"
          },
          token
        );
        if (current !== requestId.current) return;
        setItems((existing) => (append ? [...existing, ...result.items] : result.items));
        setTotal(result.total);
        setPage(nextPage);
        setHasMore(result.hasMore);
      } catch (error) {
        onMessage(error.message);
      } finally {
        if (current === requestId.current) setLoading(false);
      }
    },
    [filter, token, onMessage]
  );

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelected(new Set());
    load(1, false);
  }, [load]);

  async function quickToggle(product, changes) {
    try {
      const updated = await api.patchProduct(product.id, changes, token);
      setItems((existing) => existing.map((item) => (item.id === product.id ? updated : item)));
      onChanged?.();
    } catch (error) {
      onMessage(error.message);
    }
  }

  async function bulk(selection, set, label) {
    try {
      const result = await api.bulkProducts({ ...selection, set }, token);
      onMessage(`${result.affected} Produkte: ${label}`);
      await load(1, false);
      onChanged?.();
    } catch (error) {
      onMessage(error.message);
    }
  }

  async function removeSelected() {
    const ids = [...selected];
    if (!ids.length) return;
    if (!confirmAction(`${ids.length} Produkte wirklich löschen? Das kann nicht rückgängig gemacht werden.`)) return;
    try {
      const result = await api.bulkProducts({ ids, delete: true }, token);
      onMessage(`${result.affected} Produkte gelöscht.`);
      await load(1, false);
      onChanged?.();
    } catch (error) {
      onMessage(error.message);
    }
  }

  function toggleSelect(id) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function openForm(product) {
    setEditingId(product?.id || null);
    setForm(
      product
        ? {
            ...emptyProduct,
            ...product,
            price: priceInput(product.price),
            brand: product.brand || "",
            description: product.description || "",
            details: product.details || "",
            origin: product.origin || "",
            allergens: product.allergens || "",
            tags: product.tags || "",
            unit: product.unit || "",
            barcode: product.barcode || "",
            image: product.image || ""
          }
        : { ...emptyProduct, category: filter.category || categories[0]?.name || "" }
    );
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function submit(event) {
    event.preventDefault();
    try {
      if (editingId) await api.updateProduct(editingId, form, token);
      else await api.createProduct(form, token);
      onMessage(editingId ? "Produkt gespeichert." : "Produkt angelegt.");
      setForm(null);
      setEditingId(null);
      await load(1, false);
      onChanged?.();
    } catch (error) {
      onMessage(error.message);
    }
  }

  async function removeOne(product) {
    if (!confirmAction(`„${product.name}“ wirklich löschen? Tipp: Unsichtbar schalten reicht meistens.`)) return;
    try {
      await api.deleteProduct(product.id, token);
      onMessage("Produkt gelöscht.");
      setForm(null);
      await load(1, false);
      onChanged?.();
    } catch (error) {
      onMessage(error.message);
    }
  }

  if (form) {
    return (
      <form className="admin-panel" onSubmit={submit}>
        <div className="admin-panel-head">
          <h3>{editingId ? "Produkt bearbeiten" : "Neues Produkt"}</h3>
          <button type="button" className="ghost-button" onClick={() => setForm(null)}>Zurück zur Liste</button>
        </div>

        <div className="admin-field-grid">
          <Field label="Produktname *">
            <input required value={form.name} onChange={(event) => updateField("name", event.target.value)} />
          </Field>
          <Field label="Kategorie *">
            <select required value={form.category} onChange={(event) => updateField("category", event.target.value)}>
              <option value="">Bitte wählen</option>
              {categories.map((category) => (
                <option key={category.id} value={category.name}>{category.name}</option>
              ))}
              {form.category && !categories.some((category) => category.name === form.category) && (
                <option value={form.category}>{form.category}</option>
              )}
            </select>
          </Field>
        </div>

        <div className="admin-field-grid three">
          <Field label="Preis (€)">
            <input inputMode="decimal" placeholder="z. B. 2,59" value={form.price} onChange={(event) => updateField("price", event.target.value)} />
          </Field>
          <Field label="Einheit">
            <input placeholder="z. B. 500 g" value={form.unit} onChange={(event) => updateField("unit", event.target.value)} />
          </Field>
          <Field label="Marke">
            <input value={form.brand} onChange={(event) => updateField("brand", event.target.value)} />
          </Field>
        </div>

        <ImageUploadField
          label="Produktbild"
          value={form.image}
          folder="produkte"
          token={token}
          onChange={(url) => updateField("image", url)}
          onMessage={onMessage}
        />

        <Field label="Kurzbeschreibung" hint="Erscheint auf der Produktkarte. Kann leer bleiben.">
          <textarea rows={2} value={form.description} onChange={(event) => updateField("description", event.target.value)} />
        </Field>
        <Field label="Produktinformationen" hint="Erscheint auf der Detailseite.">
          <textarea rows={3} value={form.details} onChange={(event) => updateField("details", event.target.value)} />
        </Field>

        <div className="admin-field-grid three">
          <Field label="Herkunft">
            <input value={form.origin} onChange={(event) => updateField("origin", event.target.value)} />
          </Field>
          <Field label="Allergene">
            <input value={form.allergens} onChange={(event) => updateField("allergens", event.target.value)} />
          </Field>
          <Field label="Barcode">
            <input inputMode="numeric" value={form.barcode} onChange={(event) => updateField("barcode", event.target.value)} />
          </Field>
        </div>
        <Field label="Suchbegriffe" hint="Kommagetrennt, helfen bei der Suche auf der Website.">
          <input value={form.tags} onChange={(event) => updateField("tags", event.target.value)} />
        </Field>

        <div className="check-row">
          <Toggle checked={form.visible} onChange={(value) => updateField("visible", value)} label="Auf der Website sichtbar" />
          <Toggle checked={form.featured} onChange={(value) => updateField("featured", value)} label="Beliebt (Startseite)" />
          <Toggle checked={form.available} onChange={(value) => updateField("available", value)} label="Verfügbar" />
        </div>

        <div className="admin-actions">
          <button type="submit">{editingId ? "Speichern" : "Produkt anlegen"}</button>
          {editingId && (
            <button type="button" className="danger-button" onClick={() => removeOne(form)}>Löschen</button>
          )}
        </div>
      </form>
    );
  }

  const allOnPageSelected = items.length > 0 && items.every((item) => selected.has(item.id));

  return (
    <div className="admin-products">
      <div className="admin-toolbar">
        <input
          type="search"
          placeholder="Name, Marke oder Barcode suchen"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          aria-label="Produkte suchen"
        />
        <select value={filter.category} onChange={(event) => setFilter((current) => ({ ...current, category: event.target.value }))}>
          <option value="">Alle Kategorien</option>
          {categories.map((category) => (
            <option key={category.id} value={category.name}>
              {category.name} ({category.visible_count ?? category.product_count}/{category.product_count})
            </option>
          ))}
        </select>
        <select value={filter.visibility} onChange={(event) => setFilter((current) => ({ ...current, visibility: event.target.value }))}>
          <option value="all">Sichtbar + unsichtbar</option>
          <option value="visible">Nur sichtbare</option>
          <option value="hidden">Nur unsichtbare</option>
        </select>
        <button type="button" onClick={() => openForm(null)}>+ Neues Produkt</button>
      </div>

      <div className="admin-bulkbar">
        <span>{total.toLocaleString("de-DE")} Produkte{selected.size ? ` · ${selected.size} ausgewählt` : ""}</span>
        <div className="admin-bulk-actions">
          {selected.size > 0 ? (
            <>
              <button type="button" onClick={() => bulk({ ids: [...selected] }, { visible: true }, "sichtbar")}>Sichtbar</button>
              <button type="button" onClick={() => bulk({ ids: [...selected] }, { visible: false }, "unsichtbar")}>Unsichtbar</button>
              <button type="button" onClick={() => bulk({ ids: [...selected] }, { featured: true }, "als beliebt markiert")}>Beliebt</button>
              <select
                defaultValue=""
                onChange={(event) => {
                  if (event.target.value) bulk({ ids: [...selected] }, { category: event.target.value }, `nach „${event.target.value}“ verschoben`);
                  event.target.value = "";
                }}
              >
                <option value="">Kategorie ändern…</option>
                {categories.map((category) => <option key={category.id} value={category.name}>{category.name}</option>)}
              </select>
              <button type="button" className="danger-button" onClick={removeSelected}>Löschen</button>
              <button type="button" className="ghost-button" onClick={() => setSelected(new Set())}>Auswahl aufheben</button>
            </>
          ) : filter.category ? (
            <>
              <button type="button" onClick={() => bulk({ category: filter.category }, { visible: true }, `in „${filter.category}“ sichtbar`)}>
                Ganze Kategorie sichtbar
              </button>
              <button type="button" onClick={() => bulk({ category: filter.category }, { visible: false }, `in „${filter.category}“ unsichtbar`)}>
                Ganze Kategorie unsichtbar
              </button>
            </>
          ) : null}
        </div>
      </div>

      {items.length > 0 && (
        <label className="admin-select-all">
          <input
            type="checkbox"
            checked={allOnPageSelected}
            onChange={(event) => {
              setSelected((current) => {
                const next = new Set(current);
                items.forEach((item) => (event.target.checked ? next.add(item.id) : next.delete(item.id)));
                return next;
              });
            }}
          />
          Alle angezeigten auswählen
        </label>
      )}

      <div className="admin-product-list">
        {items.map((product) => (
          <div className={`admin-product-row ${product.visible ? "" : "is-hidden"}`} key={product.id}>
            <input
              type="checkbox"
              checked={selected.has(product.id)}
              onChange={() => toggleSelect(product.id)}
              aria-label={`${product.name} auswählen`}
            />
            <button type="button" className="admin-product-thumb" onClick={() => openForm(product)}>
              <ProductImage product={product} />
            </button>
            <button type="button" className="admin-product-main" onClick={() => openForm(product)}>
              <strong>{product.name}</strong>
              <small>
                {product.category}
                {product.unit ? ` · ${product.unit}` : ""}
                {product.price !== null ? ` · ${formatPrice(product.price)}` : " · kein Preis"}
                {product.source === "kasse" ? " · Kasse" : ""}
              </small>
            </button>
            <div className="admin-product-toggles">
              <Toggle checked={product.visible} onChange={(value) => quickToggle(product, { visible: value })} label="Sichtbar" />
              <Toggle checked={product.featured} onChange={(value) => quickToggle(product, { featured: value })} label="Beliebt" />
            </div>
          </div>
        ))}
        {!loading && items.length === 0 && <p className="admin-empty">Keine Produkte für diese Auswahl.</p>}
      </div>

      {hasMore && (
        <div className="load-more">
          <button type="button" disabled={loading} onClick={() => load(page + 1, true)}>
            {loading ? "Lädt..." : `Mehr laden (${items.length} von ${total})`}
          </button>
        </div>
      )}
    </div>
  );
}

export default AdminProducts;
