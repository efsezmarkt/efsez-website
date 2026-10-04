import { useCallback, useEffect, useState } from "react";
import { supabase, check } from "./client";
import ProductImage from "../components/ProductImage";
import PriceTag from "../components/PriceTag";
import { formatDate, formatPrice } from "../lib/format";
import { Field, ImageField, Toggle } from "./ui";
import { confirmAction, nextSundayIso, parsePrice, priceText, todayIso } from "./util";

const OFFER_FIELDS =
  "id,title,note,image,starts_on,ends_on,active,created_at,items:offer_items(id,product_id,offer_price,old_price,note,sort_order,product:products(id,name,image,unit,price,visible,category:categories(image)))";

function liveState(offer) {
  const today = todayIso();
  if (!offer.active) return { label: "Pausiert", tone: "muted" };
  if (offer.starts_on && offer.starts_on > today) return { label: `Startet ${formatDate(offer.starts_on)}`, tone: "wait" };
  if (offer.ends_on && offer.ends_on < today) return { label: "Abgelaufen", tone: "muted" };
  return { label: "Läuft", tone: "live" };
}

function OffersTab({ notify, refresh }) {
  const [offers, setOffers] = useState([]);
  const [form, setForm] = useState(null);
  const [search, setSearch] = useState("");
  const [results, setResults] = useState([]);
  const [discount, setDiscount] = useState("20");

  const load = useCallback(async () => {
    try {
      setOffers(check(await supabase.from("offers").select(OFFER_FIELDS).order("created_at", { ascending: false })));
    } catch (error) {
      notify(error.message);
    }
  }, [notify]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  useEffect(() => {
    const term = search.replace(/[,()*%\\]/g, " ").trim();
    const timer = window.setTimeout(async () => {
      if (term.length < 2) {
        setResults([]);
        return;
      }
      const { data } = await supabase
        .from("products")
        .select("id,name,image,unit,price,visible,category:categories(image)")
        .or(`name.ilike.*${term}*,barcode.ilike.${term}*`)
        .order("featured", { ascending: false })
        .order("name")
        .limit(8);
      setResults(data || []);
    }, 250);
    return () => window.clearTimeout(timer);
  }, [search]);

  function open(offer) {
    setSearch("");
    setResults([]);
    if (!offer) {
      setForm({ title: "Wochenangebot", note: "", image: "", starts_on: todayIso(), ends_on: nextSundayIso(), active: true, items: [] });
      return;
    }
    setForm({
      id: offer.id,
      title: offer.title,
      note: offer.note,
      image: offer.image,
      starts_on: offer.starts_on || "",
      ends_on: offer.ends_on || "",
      active: offer.active,
      items: [...offer.items]
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((item) => ({
          product: item.product,
          offer_price: priceText(item.offer_price),
          old_price: priceText(item.old_price ?? item.product?.price),
          note: item.note
        }))
        .filter((item) => item.product)
    });
  }

  function computeOffer(oldPrice) {
    const pct = Number(String(discount).replace(",", "."));
    if (oldPrice === null || oldPrice === undefined || !Number.isFinite(pct)) return "";
    return priceText(Math.round(oldPrice * (1 - pct / 100) * 100) / 100);
  }

  function add(product) {
    setForm((current) => {
      if (current.items.some((item) => item.product.id === product.id)) return current;
      return {
        ...current,
        items: [...current.items, { product, old_price: priceText(product.price), offer_price: computeOffer(product.price), note: "" }]
      };
    });
    setSearch("");
    setResults([]);
  }

  function updateItem(index, key, value) {
    setForm((current) => ({ ...current, items: current.items.map((item, i) => (i === index ? { ...item, [key]: value } : item)) }));
  }

  function move(index, step) {
    setForm((current) => {
      const items = [...current.items];
      const target = index + step;
      if (target < 0 || target >= items.length) return current;
      [items[index], items[target]] = [items[target], items[index]];
      return { ...current, items };
    });
  }

  function applyDiscount() {
    setForm((current) => ({
      ...current,
      items: current.items.map((item) => ({ ...item, offer_price: computeOffer(parsePrice(item.old_price)) || item.offer_price }))
    }));
  }

  async function save(event) {
    event.preventDefault();
    const missing = form.items.filter((item) => parsePrice(item.offer_price) === null);
    if (missing.length && !confirmAction(`${missing.length} Produkt(e) ohne Angebotspreis. Trotzdem speichern?`)) return;

    const payload = {
      title: form.title.trim(),
      note: form.note.trim(),
      image: form.image,
      starts_on: form.starts_on || null,
      ends_on: form.ends_on || null,
      active: form.active
    };
    try {
      const saved = form.id
        ? check(await supabase.from("offers").update(payload).eq("id", form.id).select("id").single())
        : check(await supabase.from("offers").insert(payload).select("id").single());

      check(await supabase.from("offer_items").delete().eq("offer_id", saved.id));
      if (form.items.length) {
        check(
          await supabase.from("offer_items").insert(
            form.items.map((item, index) => ({
              offer_id: saved.id,
              product_id: item.product.id,
              offer_price: parsePrice(item.offer_price),
              old_price: parsePrice(item.old_price),
              note: item.note.trim().slice(0, 120),
              sort_order: index
            }))
          )
        );
        // Angebotsprodukte müssen auf der Website sichtbar sein.
        const hidden = form.items.filter((item) => !item.product.visible).map((item) => item.product.id);
        if (hidden.length) check(await supabase.from("products").update({ visible: true }).in("id", hidden));
      }
      notify(form.id ? "Angebot gespeichert." : "Angebot veröffentlicht.");
      setForm(null);
      await load();
      refresh();
    } catch (error) {
      notify(error.message);
    }
  }

  async function toggle(offer, active) {
    try {
      check(await supabase.from("offers").update({ active }).eq("id", offer.id));
      await load();
      refresh();
    } catch (error) {
      notify(error.message);
    }
  }

  async function remove() {
    if (!confirmAction(`Angebot „${form.title}“ löschen?`)) return;
    try {
      check(await supabase.from("offers").delete().eq("id", form.id));
      notify("Angebot gelöscht.");
      setForm(null);
      await load();
      refresh();
    } catch (error) {
      notify(error.message);
    }
  }

  if (form) {
    return (
      <form className="a-panel" onSubmit={save}>
        <div className="a-panel-head">
          <h2>{form.id ? "Angebot bearbeiten" : "Neues Angebot"}</h2>
          <button type="button" className="a-link" onClick={() => setForm(null)}>Zurück zur Liste</button>
        </div>

        <div className="a-grid">
          <Field label="Titel" wide>
            <input required value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} />
          </Field>
          <Field label="Gültig ab">
            <input type="date" value={form.starts_on} onChange={(event) => setForm({ ...form, starts_on: event.target.value })} />
          </Field>
          <Field label="Gültig bis">
            <input type="date" value={form.ends_on} onChange={(event) => setForm({ ...form, ends_on: event.target.value })} />
          </Field>
          <Field label="Hinweis (optional)" wide hint="Erscheint auf der Angebotsseite, z. B. „Nur solange der Vorrat reicht“">
            <input value={form.note} onChange={(event) => setForm({ ...form, note: event.target.value })} />
          </Field>
        </div>
        <Toggle checked={form.active} onChange={(value) => setForm({ ...form, active: value })} label="Aktiv – erscheint im Zeitraum auf der Startseite" />

        <section className="a-builder">
          <h3>Produkte im Angebot</h3>
          <div className="a-builder-search">
            <input type="search" placeholder="Produkt suchen (Name oder Barcode)" value={search} onChange={(event) => setSearch(event.target.value)} />
            <label className="a-discount">
              Rabatt
              <input inputMode="numeric" value={discount} onChange={(event) => setDiscount(event.target.value)} />%
            </label>
            {form.items.length > 0 && (
              <button type="button" className="a-button a-button-soft" onClick={applyDiscount}>Auf alle anwenden</button>
            )}
          </div>

          {results.length > 0 && (
            <ul className="a-results">
              {results.map((product) => (
                <li key={product.id}>
                  <button type="button" onClick={() => add(product)}>
                    <span className="a-thumb">
                      <ProductImage src={product.image || product.category?.image} name={product.name} variant="letter" />
                    </span>
                    <span className="a-row-text">
                      <strong>{product.name}</strong>
                      <small>
                        {product.unit}
                        {product.price !== null ? `, ${formatPrice(product.price)}` : ""}
                        {!product.visible ? ", noch versteckt" : ""}
                      </small>
                    </span>
                    <span className="a-add">Hinzufügen</span>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {form.items.length === 0 ? (
            <p className="a-empty">Suchen Sie oben ein Produkt. Der Angebotspreis wird aus dem Rabatt vorgeschlagen.</p>
          ) : (
            <ul className="a-offer-items">
              {form.items.map((item, index) => {
                const price = parsePrice(item.offer_price);
                const old = parsePrice(item.old_price);
                const pct = price !== null && old !== null && old > price ? Math.round((1 - price / old) * 100) : null;
                return (
                  <li key={item.product.id} className="a-offer-item">
                    <span className="a-thumb a-thumb-l">
                      <ProductImage src={item.product.image || item.product.category?.image} name={item.product.name} variant="letter" />
                    </span>
                    <div className="a-offer-item-main">
                      <strong>{item.product.name}</strong>
                      <div className="a-offer-prices">
                        <Field label="Normalpreis">
                          <input inputMode="decimal" value={item.old_price} onChange={(event) => updateItem(index, "old_price", event.target.value)} />
                        </Field>
                        <Field label="Angebot">
                          <input inputMode="decimal" value={item.offer_price} onChange={(event) => updateItem(index, "offer_price", event.target.value)} />
                        </Field>
                        <Field label="Zusatz">
                          <input placeholder="z. B. 2 Stück" value={item.note} onChange={(event) => updateItem(index, "note", event.target.value)} />
                        </Field>
                      </div>
                    </div>
                    <div className="a-offer-preview">
                      <PriceTag price={price} oldPrice={old !== null && price !== null && old > price ? old : null} discount={pct} size="m" label="Preis fehlt" />
                    </div>
                    <div className="a-offer-tools">
                      <button type="button" onClick={() => move(index, -1)} aria-label="Nach oben">↑</button>
                      <button type="button" onClick={() => move(index, 1)} aria-label="Nach unten">↓</button>
                      <button
                        type="button"
                        className="is-danger"
                        aria-label="Entfernen"
                        onClick={() => setForm((current) => ({ ...current, items: current.items.filter((_, i) => i !== index) }))}
                      >
                        ✕
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {form.items.length === 0 && (
          <details className="a-details">
            <summary>Stattdessen ein fertiges Prospekt-Bild verwenden</summary>
            <ImageField value={form.image} folder="angebote" name={form.title} onChange={(path) => setForm({ ...form, image: path })} onMessage={notify} />
          </details>
        )}

        <div className="a-actions">
          <button type="submit" className="a-button">{form.id ? "Speichern" : "Angebot veröffentlichen"}</button>
          {form.id && <button type="button" className="a-button a-button-danger" onClick={remove}>Löschen</button>}
        </div>
      </form>
    );
  }

  return (
    <div className="a-stack">
      <div className="a-intro">
        <p>Laufende Angebote stehen ganz oben auf der Startseite. Ein Angebot läuft automatisch im eingestellten Zeitraum.</p>
        <button type="button" className="a-button" onClick={() => open(null)}>Neues Angebot</button>
      </div>

      {offers.length === 0 && <p className="a-empty">Noch keine Angebote. Legen Sie das erste an – es erscheint sofort auf der Startseite.</p>}

      <ul className="a-list">
        {offers.map((offer) => {
          const state = liveState(offer);
          return (
            <li key={offer.id} className="a-row a-row-offer">
              <button type="button" className="a-row-main" onClick={() => open(offer)}>
                <span className="a-row-text">
                  <strong>{offer.title}</strong>
                  <small>
                    {offer.items.length} Produkte
                    {offer.starts_on || offer.ends_on
                      ? `, ${formatDate(offer.starts_on) || "ab sofort"} bis ${formatDate(offer.ends_on) || "offen"}`
                      : ""}
                  </small>
                  <span className="a-thumbs">
                    {offer.items.slice(0, 8).map((item) => (
                      <span className="a-thumb a-thumb-s" key={item.id}>
                        <ProductImage src={item.product?.image || item.product?.category?.image} name={item.product?.name} variant="letter" />
                      </span>
                    ))}
                  </span>
                </span>
                <span className={`a-state a-state-${state.tone}`}>{state.label}</span>
              </button>
              <div className="a-row-toggles">
                <Toggle checked={offer.active} onChange={(value) => toggle(offer, value)} label="Aktiv" />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default OffersTab;
