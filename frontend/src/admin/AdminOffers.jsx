import { useEffect, useRef, useState } from "react";
import { api } from "../api";
import DealCard from "../components/DealCard";
import ProductImage from "../components/ProductImage";
import { formatDate, formatPrice } from "../lib/site";
import { Field, ImageUploadField, Toggle } from "./shared";
import { confirmAction, priceInput } from "./utils";

function nextSunday() {
  const date = new Date();
  const diff = (7 - date.getDay()) % 7 || 7;
  date.setDate(date.getDate() + diff);
  return date.toISOString().slice(0, 10);
}

const emptyOffer = () => ({
  title: "Wochenangebot",
  description: "",
  starts_at: new Date().toISOString().slice(0, 10),
  ends_at: nextSunday(),
  active: true,
  image: "",
  price: "",
  items: []
});

function toNumber(value) {
  const text = String(value ?? "").trim().replace(",", ".");
  if (!text) return null;
  const number = Number(text);
  return Number.isFinite(number) ? number : null;
}

function AdminOffers({ token, categories, onMessage, onChanged }) {
  const [offers, setOffers] = useState([]);
  const [form, setForm] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");
  const [results, setResults] = useState([]);
  const [discount, setDiscount] = useState("20");
  const searchTimer = useRef(null);

  async function load() {
    try {
      setOffers(await api.getOffers({ all: 1 }, token));
    } catch (error) {
      onMessage(error.message);
    }
  }

  useEffect(() => {
    // Datenabruf beim Öffnen des Reiters.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    window.clearTimeout(searchTimer.current);
    searchTimer.current = window.setTimeout(async () => {
      if (!search.trim()) {
        setResults([]);
        return;
      }
      try {
        const result = await api.getProducts({ q: search.trim(), limit: 8, all: "1" }, token);
        setResults(result.items);
      } catch {
        setResults([]);
      }
    }, search.trim() ? 250 : 0);
    return () => window.clearTimeout(searchTimer.current);
  }, [search, token]);

  function openForm(offer) {
    setEditingId(offer?.id || null);
    setForm(
      offer
        ? {
            title: offer.title,
            description: offer.description || "",
            starts_at: offer.starts_at || "",
            ends_at: offer.ends_at || "",
            active: offer.active,
            image: offer.image || "",
            price: offer.price || "",
            items: offer.items.map((item) => ({
              product_id: item.product_id,
              name: item.name,
              image: item.image,
              category: item.category,
              unit: item.unit,
              brand: item.brand,
              old_price: priceInput(item.old_price),
              offer_price: priceInput(item.offer_price),
              note: item.note || ""
            }))
          }
        : emptyOffer()
    );
    setSearch("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function addProduct(product) {
    setForm((current) => {
      if (current.items.some((item) => item.product_id === product.id)) return current;
      const old = product.price;
      const pct = toNumber(discount);
      const offerPrice = old !== null && pct !== null ? Math.round(old * (1 - pct / 100) * 100) / 100 : null;
      return {
        ...current,
        items: [
          ...current.items,
          {
            product_id: product.id,
            name: product.name,
            image: product.image,
            category: product.category,
            unit: product.unit,
            brand: product.brand,
            old_price: priceInput(old),
            offer_price: priceInput(offerPrice),
            note: ""
          }
        ]
      };
    });
    setSearch("");
    setResults([]);
  }

  function updateItem(index, field, value) {
    setForm((current) => {
      const items = current.items.map((item, i) => (i === index ? { ...item, [field]: value } : item));
      return { ...current, items };
    });
  }

  function applyDiscountToAll() {
    const pct = toNumber(discount);
    if (pct === null) return;
    setForm((current) => ({
      ...current,
      items: current.items.map((item) => {
        const old = toNumber(item.old_price);
        if (old === null) return item;
        return { ...item, offer_price: priceInput(Math.round(old * (1 - pct / 100) * 100) / 100) };
      })
    }));
  }

  function moveItem(index, direction) {
    setForm((current) => {
      const items = [...current.items];
      const target = index + direction;
      if (target < 0 || target >= items.length) return current;
      [items[index], items[target]] = [items[target], items[index]];
      return { ...current, items };
    });
  }

  async function submit(event) {
    event.preventDefault();
    try {
      if (editingId) await api.updateOffer(editingId, form, token);
      else await api.createOffer(form, token);
      onMessage(editingId ? "Angebot gespeichert." : "Angebot veröffentlicht.");
      setForm(null);
      setEditingId(null);
      await load();
      onChanged?.();
    } catch (error) {
      onMessage(error.message);
    }
  }

  async function toggleActive(offer, active) {
    try {
      await api.patchOffer(offer.id, { active }, token);
      await load();
      onChanged?.();
    } catch (error) {
      onMessage(error.message);
    }
  }

  async function remove(offer) {
    if (!confirmAction(`Angebot „${offer.title}“ wirklich löschen?`)) return;
    try {
      await api.deleteOffer(offer.id, token);
      onMessage("Angebot gelöscht.");
      setForm(null);
      await load();
      onChanged?.();
    } catch (error) {
      onMessage(error.message);
    }
  }

  const categoryImages = Object.fromEntries(categories.map((category) => [category.name, category.image]));

  if (form) {
    const previewItems = form.items.map((item, index) => {
      const offerPrice = toNumber(item.offer_price);
      const oldPrice = toNumber(item.old_price);
      return {
        id: `preview-${index}`,
        product_id: item.product_id,
        name: item.name,
        image: item.image,
        category: item.category,
        unit: item.unit,
        brand: item.brand,
        note: item.note,
        offer_price: offerPrice,
        old_price: oldPrice,
        discount_percent:
          offerPrice !== null && oldPrice !== null && oldPrice > offerPrice
            ? Math.round((1 - offerPrice / oldPrice) * 100)
            : null
      };
    });

    return (
      <form className="admin-panel" onSubmit={submit}>
        <div className="admin-panel-head">
          <h3>{editingId ? "Angebot bearbeiten" : "Neues Angebot"}</h3>
          <button type="button" className="ghost-button" onClick={() => setForm(null)}>Zurück zur Liste</button>
        </div>

        <div className="admin-field-grid">
          <Field label="Titel *">
            <input required value={form.title} onChange={(event) => updateField("title", event.target.value)} />
          </Field>
          <div className="date-row">
            <Field label="Von">
              <input type="date" value={form.starts_at} onChange={(event) => updateField("starts_at", event.target.value)} />
            </Field>
            <Field label="Bis">
              <input type="date" value={form.ends_at} onChange={(event) => updateField("ends_at", event.target.value)} />
            </Field>
          </div>
        </div>
        <Field label="Hinweis (optional)" hint="z. B. „Nur solange der Vorrat reicht“">
          <input value={form.description} onChange={(event) => updateField("description", event.target.value)} />
        </Field>
        <Toggle checked={form.active} onChange={(value) => updateField("active", value)} label="Aktiv – wird auf der Website angezeigt" />

        <div className="offer-builder">
          <h4>Produkte im Angebot</h4>
          <div className="offer-search">
            <input
              type="search"
              placeholder="Produkt suchen und hinzufügen…"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <label className="offer-discount">
              Rabatt
              <input inputMode="numeric" value={discount} onChange={(event) => setDiscount(event.target.value)} />
              %
            </label>
            {form.items.length > 0 && (
              <button type="button" className="ghost-button" onClick={applyDiscountToAll}>Auf alle anwenden</button>
            )}
          </div>

          {results.length > 0 && (
            <ul className="offer-results">
              {results.map((product) => (
                <li key={product.id}>
                  <button type="button" onClick={() => addProduct(product)}>
                    <ProductImage product={product} categoryImage={categoryImages[product.category] || ""} />
                    <span>
                      <strong>{product.name}</strong>
                      <small>{product.category}{product.unit ? ` · ${product.unit}` : ""}{product.price !== null ? ` · ${formatPrice(product.price)}` : ""}{product.visible ? "" : " · unsichtbar"}</small>
                    </span>
                    <em>+ hinzufügen</em>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {form.items.length === 0 ? (
            <p className="admin-empty">Noch keine Produkte. Oben suchen und hinzufügen – der Angebotspreis wird aus dem Rabatt vorgeschlagen.</p>
          ) : (
            <div className="offer-items">
              {form.items.map((item, index) => (
                <div className="offer-item" key={item.product_id}>
                  <div className="offer-item-thumb">
                    <ProductImage product={item} categoryImage={categoryImages[item.category] || ""} />
                  </div>
                  <div className="offer-item-main">
                    <strong>{item.name}</strong>
                    <small>
                      {item.unit || item.category}
                      {toNumber(item.offer_price) === null && <em className="offer-item-warn"> · Angebotspreis fehlt</em>}
                    </small>
                    <div className="offer-item-prices">
                      <label>
                        Alt
                        <input inputMode="decimal" value={item.old_price} onChange={(event) => updateItem(index, "old_price", event.target.value)} />
                      </label>
                      <label>
                        Angebot
                        <input inputMode="decimal" value={item.offer_price} onChange={(event) => updateItem(index, "offer_price", event.target.value)} />
                      </label>
                      <label className="wide">
                        Hinweis
                        <input placeholder="z. B. je Packung" value={item.note} onChange={(event) => updateItem(index, "note", event.target.value)} />
                      </label>
                    </div>
                  </div>
                  <div className="offer-item-actions">
                    <button type="button" onClick={() => moveItem(index, -1)} aria-label="Nach oben">↑</button>
                    <button type="button" onClick={() => moveItem(index, 1)} aria-label="Nach unten">↓</button>
                    <button
                      type="button"
                      className="danger-button"
                      onClick={() => setForm((current) => ({ ...current, items: current.items.filter((_, i) => i !== index) }))}
                      aria-label="Entfernen"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {form.items.length === 0 && (
          <details className="admin-details">
            <summary>Stattdessen nur ein Bild hochladen (z. B. ein fertiges Prospekt-Bild)</summary>
            <ImageUploadField label="Angebotsbild" value={form.image} folder="angebote" token={token} onChange={(url) => updateField("image", url)} onMessage={onMessage} />
            <Field label="Preistext (optional)">
              <input value={form.price} onChange={(event) => updateField("price", event.target.value)} placeholder="z. B. ab 1,99 €" />
            </Field>
          </details>
        )}

        {previewItems.length > 0 && (
          <div className="offer-preview">
            <h4>So sieht es auf der Website aus</h4>
            <div className="deal-grid">
              {previewItems.map((item) => <DealCard key={item.id} item={item} categoryImage={categoryImages[item.category] || ""} />)}
            </div>
          </div>
        )}

        <div className="admin-actions">
          <button type="submit">{editingId ? "Speichern" : "Angebot veröffentlichen"}</button>
          {editingId && <button type="button" className="danger-button" onClick={() => remove({ id: editingId, title: form.title })}>Löschen</button>}
        </div>
      </form>
    );
  }

  return (
    <div className="admin-offers">
      <div className="admin-toolbar">
        <p className="admin-hint">Angebote erscheinen automatisch im Zeitraum auf der Startseite – ganz oben als Blickfang und im Angebotsblock.</p>
        <button type="button" onClick={() => openForm(null)}>+ Neues Angebot</button>
      </div>

      {offers.length === 0 && <p className="admin-empty">Noch keine Angebote.</p>}

      <div className="admin-offer-list">
        {offers.map((offer) => (
          <div className={`admin-offer-row ${offer.active ? "" : "is-hidden"}`} key={offer.id}>
            <button type="button" className="admin-offer-main" onClick={() => openForm(offer)}>
              <strong>{offer.title}</strong>
              <small>
                {offer.items.length} Produkte
                {offer.starts_at || offer.ends_at ? ` · ${formatDate(offer.starts_at) || "ab sofort"} – ${formatDate(offer.ends_at) || "offen"}` : ""}
              </small>
              {offer.items.length > 0 && (
                <span className="admin-offer-thumbs">
                  {offer.items.slice(0, 6).map((item) => (
                    <span key={item.id}><ProductImage product={item} categoryImage={categoryImages[item.category] || ""} /></span>
                  ))}
                </span>
              )}
            </button>
            <Toggle checked={offer.active} onChange={(value) => toggleActive(offer, value)} label="Aktiv" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default AdminOffers;
