import { useMemo, useState } from "react";
import { api } from "../api";
import "../styles/admin.css";

const emptyProduct = {
  name: "",
  category: "",
  brand: "",
  description: "",
  details: "",
  unit: "",
  origin: "",
  allergens: "",
  barcode: "",
  tags: "",
  image: "/src/assets/products/caykur-rize-tee.png",
  featured: false,
  available: true
};

const emptyOffer = {
  title: "",
  description: "",
  price: "",
  image: "/src/assets/hero.png",
  starts_at: "",
  ends_at: "",
  active: true
};

function Admin({ products, offers, onRefresh }) {
  const [token, setToken] = useState(localStorage.getItem("efsez-admin-token") || "");
  const [productForm, setProductForm] = useState(emptyProduct);
  const [offerForm, setOfferForm] = useState(emptyOffer);
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState("");

  const categories = useMemo(
    () => [...new Set(products.map((product) => product.category))].sort(),
    [products]
  );

  function saveToken(value) {
    setToken(value);
    localStorage.setItem("efsez-admin-token", value);
  }

  function updateProductField(field, value) {
    setProductForm((current) => ({ ...current, [field]: value }));
  }

  function updateOfferField(field, value) {
    setOfferForm((current) => ({ ...current, [field]: value }));
  }

  async function submitProduct(event) {
    event.preventDefault();
    setMessage("");
    try {
      if (editingId) {
        await api.updateProduct(editingId, productForm, token);
      } else {
        await api.createProduct(productForm, token);
      }
      setProductForm(emptyProduct);
      setEditingId(null);
      await onRefresh();
      setMessage("Produkt gespeichert.");
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function submitOffer(event) {
    event.preventDefault();
    setMessage("");
    try {
      await api.createOffer(offerForm, token);
      setOfferForm(emptyOffer);
      await onRefresh();
      setMessage("Angebot veroffentlicht.");
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function removeProduct(id) {
    setMessage("");
    try {
      await api.deleteProduct(id, token);
      await onRefresh();
      setMessage("Produkt geloscht.");
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function removeOffer(id) {
    setMessage("");
    try {
      await api.deleteOffer(id, token);
      await onRefresh();
      setMessage("Angebot geloscht.");
    } catch (error) {
      setMessage(error.message);
    }
  }

  function editProduct(product) {
    setEditingId(product.id);
    setProductForm({
      name: product.name || "",
      category: product.category || "",
      brand: product.brand || "",
      description: product.description || "",
      details: product.details || "",
      unit: product.unit || "",
      origin: product.origin || "",
      allergens: product.allergens || "",
      barcode: product.barcode || "",
      tags: product.tags || "",
      image: product.image || "",
      featured: product.featured,
      available: product.available
    });
  }

  return (
    <section id="admin" className="admin-section">
      <div className="admin-header">
        <div>
          <p className="admin-kicker">Admin</p>
          <h2>Produkte und Angebote verwalten</h2>
          <p>Diese Felder laufen uber die API und sind bewusst fur spatere Scanner-, Bestand- und Automationsdaten vorbereitet.</p>
        </div>
        <label className="token-field">
          Admin-Token
          <input
            type="password"
            value={token}
            onChange={(event) => saveToken(event.target.value)}
            placeholder="change-me"
          />
        </label>
      </div>

      {message && <div className="admin-message">{message}</div>}

      <div className="admin-grid">
        <form className="admin-panel" onSubmit={submitProduct}>
          <h3>{editingId ? "Produkt bearbeiten" : "Produkt anlegen"}</h3>

          <div className="admin-field-grid">
            <input required placeholder="Produktname" value={productForm.name} onChange={(event) => updateProductField("name", event.target.value)} />
            <input required placeholder="Marke" value={productForm.brand} onChange={(event) => updateProductField("brand", event.target.value)} />
          </div>

          <div className="admin-field-grid">
            <input required list="categories" placeholder="Kategorie" value={productForm.category} onChange={(event) => updateProductField("category", event.target.value)} />
            <input placeholder="Einheit, z. B. 500 g" value={productForm.unit} onChange={(event) => updateProductField("unit", event.target.value)} />
          </div>

          <datalist id="categories">
            {categories.map((category) => <option value={category} key={category} />)}
          </datalist>

          <input required placeholder="Bildpfad oder Bild-URL" value={productForm.image} onChange={(event) => updateProductField("image", event.target.value)} />
          <textarea required placeholder="Kurze Beschreibung fur Produktkarten" value={productForm.description} onChange={(event) => updateProductField("description", event.target.value)} />
          <textarea placeholder="Produktinformationen fur Detailseite" value={productForm.details} onChange={(event) => updateProductField("details", event.target.value)} />

          <div className="admin-field-grid">
            <input placeholder="Herkunft" value={productForm.origin} onChange={(event) => updateProductField("origin", event.target.value)} />
            <input placeholder="Allergene" value={productForm.allergens} onChange={(event) => updateProductField("allergens", event.target.value)} />
          </div>

          <div className="admin-field-grid">
            <input placeholder="Barcode / SKU" value={productForm.barcode} onChange={(event) => updateProductField("barcode", event.target.value)} />
            <input placeholder="Tags, kommagetrennt" value={productForm.tags} onChange={(event) => updateProductField("tags", event.target.value)} />
          </div>

          <div className="check-row">
            <label><input type="checkbox" checked={productForm.featured} onChange={(event) => updateProductField("featured", event.target.checked)} /> Beliebt</label>
            <label><input type="checkbox" checked={productForm.available} onChange={(event) => updateProductField("available", event.target.checked)} /> Verfugbar</label>
          </div>

          <button type="submit">{editingId ? "Produkt aktualisieren" : "Produkt speichern"}</button>
          {editingId && <button type="button" className="ghost-button" onClick={() => { setEditingId(null); setProductForm(emptyProduct); }}>Abbrechen</button>}
        </form>

        <form className="admin-panel" onSubmit={submitOffer}>
          <h3>Angebot hochladen</h3>
          <input required placeholder="Titel" value={offerForm.title} onChange={(event) => updateOfferField("title", event.target.value)} />
          <input placeholder="Preis, z. B. 1,99 EUR" value={offerForm.price} onChange={(event) => updateOfferField("price", event.target.value)} />
          <input placeholder="Bildpfad oder Bild-URL" value={offerForm.image} onChange={(event) => updateOfferField("image", event.target.value)} />
          <div className="date-row">
            <input type="date" value={offerForm.starts_at} onChange={(event) => updateOfferField("starts_at", event.target.value)} />
            <input type="date" value={offerForm.ends_at} onChange={(event) => updateOfferField("ends_at", event.target.value)} />
          </div>
          <textarea required placeholder="Beschreibung" value={offerForm.description} onChange={(event) => updateOfferField("description", event.target.value)} />
          <label className="single-check"><input type="checkbox" checked={offerForm.active} onChange={(event) => updateOfferField("active", event.target.checked)} /> Aktiv anzeigen</label>
          <button type="submit">Angebot veroffentlichen</button>
        </form>
      </div>

      <div className="admin-lists">
        <div className="admin-list">
          <h3>Produkte</h3>
          {products.map((product) => (
            <div className="admin-list-row" key={product.id}>
              <span>{product.name}</span>
              <div>
                <button type="button" onClick={() => editProduct(product)}>Bearbeiten</button>
                <button type="button" onClick={() => removeProduct(product.id)}>Loschen</button>
              </div>
            </div>
          ))}
        </div>

        <div className="admin-list">
          <h3>Angebote</h3>
          {offers.map((offer) => (
            <div className="admin-list-row" key={offer.id}>
              <span>{offer.title}</span>
              <div>
                <button type="button" onClick={() => removeOffer(offer.id)}>Loschen</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Admin;
