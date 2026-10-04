import { useEffect, useState } from "react";
import ProductImage from "../components/ProductImage";
import ProductCard from "../components/ProductCard";
import PriceTag from "../components/PriceTag";
import Icon from "../components/Icon";
import { loadProduct, loadProducts } from "../lib/db";
import { basePrice, formatPrice, whatsappLink } from "../lib/format";

function Product({ id, settings }) {
  const [state, setState] = useState({ status: "loading", product: null, related: [] });

  useEffect(() => {
    let alive = true;
    loadProduct(id)
      .then(async (product) => {
        if (!alive) return;
        if (!product) {
          setState({ status: "missing", product: null, related: [] });
          return;
        }
        setState({ status: "ready", product, related: [] });
        if (product.category_id) {
          const { items } = await loadProducts({ categoryId: product.category_id, limit: 9 });
          if (alive)
            setState((current) => ({
              ...current,
              related: items.filter((item) => item.id !== product.id).slice(0, 8)
            }));
        }
      })
      .catch(() => alive && setState({ status: "missing", product: null, related: [] }));
    return () => {
      alive = false;
    };
  }, [id]);

  if (state.status === "loading") {
    return (
      <>
        <div className="page-band" />
        <div className="wrap product-page" aria-busy="true">
          <div className="product-page-media skeleton" />
          <div className="product-page-info">
            <div className="skeleton" style={{ height: 48, marginBottom: 16 }} />
            <div className="skeleton" style={{ height: 24, width: "40%" }} />
          </div>
        </div>
      </>
    );
  }

  if (state.status === "missing") {
    return (
      <>
        <div className="page-band" />
        <div className="wrap empty-state empty-state-page">
          <h1>Dieses Produkt gibt es online nicht mehr</h1>
          <p>Vielleicht ist es trotzdem im Laden. Fragen Sie uns gern.</p>
          <a className="btn btn-green" href="#/sortiment">
            Zum Sortiment
          </a>
        </div>
      </>
    );
  }

  const { product, related } = state;
  const image = product.image || product.category?.image || "";
  const variants = product.variant_count > 1 ? product.variants || [] : [];
  const range = variants.length > 0 && product.price_from != null && Number(product.price_from) < Number(product.price_to);
  const shownPrice = range ? product.price_from : product.price ?? product.price_from ?? null;
  const base = variants.length ? "" : basePrice(product.price, product.unit);
  const wa = whatsappLink(settings, `Hallo EFSE'Z Markt, ist „${product.name}“ gerade da?`);
  const facts = [
    ["Marke", product.brand],
    ["Herkunft", product.origin],
    ["Allergene", product.allergens],
    ["Barcode", product.variant_count > 1 ? "" : product.barcode]
  ].filter(([, value]) => value);

  return (
    <>
      <div className="page-band">
        <nav className="wrap breadcrumb" aria-label="Pfad">
          <a href="#/sortiment">Sortiment</a>
          {product.category && (
            <>
              <span aria-hidden="true">/</span>
              <a href={`#/sortiment?kategorie=${product.category.id}`}>{product.category.name}</a>
            </>
          )}
        </nav>
      </div>

      <article className="wrap product-page">
        <div className="product-page-media">
          <ProductImage src={image} name={product.name} eager />
        </div>

        <div className="product-page-info">
          {product.category && <span className="chip-label">{product.category.name}</span>}
          <h1>{product.name}</h1>
          <p className="product-page-unit">
            {variants.length ? `${variants.length} Sorten & Größen` : product.unit}
            {base && <span> ({base})</span>}
          </p>

          <div className="product-page-price">
            {!product.available ? (
              <p className="product-card-soldout">Zurzeit nicht vorrätig</p>
            ) : shownPrice == null ? (
              <p className="product-card-soldout">Preis auf Anfrage im Markt</p>
            ) : (
              <PriceTag price={shownPrice} size="m" from={range} />
            )}
          </div>

          {product.description && <p className="product-page-text">{product.description}</p>}
          {product.details && <p className="product-page-text">{product.details}</p>}

          {variants.length > 0 && (
            <div className="variant-list">
              <h2>Sorten & Größen</h2>
              <ul>
                {variants.map((variant) => {
                  const variantBase = basePrice(variant.price, variant.unit);
                  return (
                    <li key={variant.id}>
                      <span className="variant-name">
                        {variant.name}
                        {(variant.unit || variantBase) && (
                          <small>
                            {variant.unit}
                            {variantBase && ` (${variantBase})`}
                          </small>
                        )}
                      </span>
                      <span className="variant-price">{variant.price != null ? formatPrice(variant.price) : "im Markt"}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {facts.length > 0 && (
            <dl className="product-facts">
              {facts.map(([label, value]) => (
                <div key={label}>
                  <dt>{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
          )}

          {wa && (
            <a className="btn btn-orange" href={wa} target="_blank" rel="noreferrer">
              <Icon name="whatsapp" /> Verfügbarkeit per WhatsApp fragen
            </a>
          )}
          <p className="product-page-note">Preise gelten im Markt und können sich ändern. Keine Online-Bestellung.</p>
        </div>
      </article>

      {related.length > 0 && (
        <section className="section section-warm">
          <div className="wrap">
            <div className="section-head">
              <h2>Mehr aus {product.category?.name}</h2>
              <a href={`#/sortiment?kategorie=${product.category_id}`}>Alle ansehen</a>
            </div>
            <div className="product-grid">
              {related.map((item) => (
                <ProductCard key={item.id} product={item} />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}

export default Product;
