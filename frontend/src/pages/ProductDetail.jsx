import { useCallback, useEffect, useState } from "react";
import { api } from "../api";
import ProductCard from "../components/ProductCard";
import ProductImage from "../components/ProductImage";
import { formatPrice, whatsappLink } from "../lib/site";
import "../styles/productDetail.css";

function ProductDetail({ id, settings }) {
  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [state, setState] = useState("loading");

  const load = useCallback(async (isCancelled) => {
    setState("loading");
    setProduct(null);
    setRelated([]);
    try {
      const loaded = await api.getProduct(id);
      if (isCancelled()) return;
      setProduct(loaded);
      setState("ready");
      try {
        const result = await api.getProducts({ category: loaded.category, limit: 4 });
        if (!isCancelled()) setRelated(result.items.filter((item) => item.id !== loaded.id).slice(0, 3));
      } catch {
        /* verwandte Produkte sind optional */
      }
    } catch {
      if (!isCancelled()) setState("missing");
    }
  }, [id]);

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load(() => cancelled);
    return () => {
      cancelled = true;
    };
  }, [load]);

  if (state === "loading") {
    return (
      <section className="detail-section">
        <div className="detail-empty"><p>Produkt wird geladen...</p></div>
      </section>
    );
  }

  if (state === "missing" || !product) {
    return (
      <section className="detail-section">
        <div className="detail-empty">
          <h1>Produkt nicht gefunden</h1>
          <p>Das Produkt ist aktuell nicht im Katalog vorhanden.</p>
          <a href="#/products">Zurück zum Sortiment</a>
        </div>
      </section>
    );
  }

  const infoItems = [
    ["Marke", product.brand],
    ["Kategorie", product.category],
    ["Einheit", product.unit],
    ["Herkunft", product.origin],
    ["Allergene", product.allergens],
    ["Barcode", product.barcode]
  ].filter(([, value]) => value);

  const price = formatPrice(product.price);
  const whatsappText = `Hallo EFSE'Z Markt, ich habe eine Frage zu ${product.name}.`;

  return (
    <section className="detail-section">
      <a className="back-link" href={`#/products?kategorie=${encodeURIComponent(product.category)}`}>
        Zurück zu {product.category}
      </a>

      <div className="detail-layout">
        <div className="detail-image">
          <ProductImage product={product} />
        </div>

        <div className="detail-content">
          <p className="detail-category">{product.category}</p>
          <h1>{product.name}</h1>
          {product.brand && <p className="detail-brand">{product.brand}</p>}

          {(price || product.unit) && (
            <div className="detail-price-row">
              {price && <strong>{price}</strong>}
              {product.unit && <span>{product.unit}</span>}
              {!product.available && <em>Aktuell nicht verfügbar</em>}
            </div>
          )}

          {product.description && <p className="detail-description">{product.description}</p>}

          {product.details && (
            <div className="detail-copy">
              <h2>Produktinformationen</h2>
              <p>{product.details}</p>
            </div>
          )}

          {infoItems.length > 0 && (
            <div className="detail-info-grid">
              {infoItems.map(([label, value]) => (
                <div className="detail-info-item" key={label}>
                  <span>{label}</span>
                  <strong>{value}</strong>
                </div>
              ))}
            </div>
          )}

          <div className="detail-actions">
            <a className="detail-whatsapp" href={whatsappLink(settings, whatsappText)}>
              Per WhatsApp anfragen
            </a>
          </div>
          <p className="detail-note">Preise gelten im Markt und können sich ändern. Keine Online-Bestellung.</p>
        </div>
      </div>

      {related.length > 0 && (
        <div className="related-section">
          <div className="section-header">
            <h2>Ähnliche Produkte</h2>
            <p>Weitere Artikel aus derselben Kategorie.</p>
          </div>
          <div className="products-grid">
            {related.map((item) => (
              <ProductCard product={item} key={item.id} settings={settings} />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

export default ProductDetail;
