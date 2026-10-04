import { useEffect, useState } from "react";
import ProductImage from "../components/ProductImage";
import ProductCard from "../components/ProductCard";
import PriceTag from "../components/PriceTag";
import Icon from "../components/Icon";
import { loadProduct, loadProducts } from "../lib/db";
import { basePrice, whatsappLink } from "../lib/format";

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
          if (alive) setState((current) => ({ ...current, related: items.filter((item) => item.id !== product.id).slice(0, 8) }));
        }
      })
      .catch(() => alive && setState({ status: "missing", product: null, related: [] }));
    return () => {
      alive = false;
    };
  }, [id]);

  if (state.status === "loading") {
    return (
      <div className="wrap product-page" aria-busy="true">
        <div className="product-page-media skeleton" />
        <div className="product-page-info">
          <div className="skeleton" style={{ height: 48, marginBottom: 16 }} />
          <div className="skeleton" style={{ height: 24, width: "40%" }} />
        </div>
      </div>
    );
  }

  if (state.status === "missing") {
    return (
      <div className="wrap empty-state">
        <h1>Dieses Produkt gibt es online nicht mehr</h1>
        <p>Vielleicht ist es trotzdem im Laden. Fragen Sie uns gern.</p>
        <a className="btn btn-green" href="#/sortiment">Zum Sortiment</a>
      </div>
    );
  }

  const { product, related } = state;
  const image = product.image || product.category?.image || "";
  const base = basePrice(product.price, product.unit);
  const wa = whatsappLink(settings, `Hallo EFSE'Z Markt, ist „${product.name}“ gerade da?`);
  const facts = [
    ["Marke", product.brand],
    ["Herkunft", product.origin],
    ["Allergene", product.allergens],
    ["Barcode", product.barcode]
  ].filter(([, value]) => value);

  return (
    <>
      <nav className="wrap breadcrumb" aria-label="Pfad">
        <a href="#/sortiment">Sortiment</a>
        {product.category && (
          <>
            <span aria-hidden="true">/</span>
            <a href={`#/sortiment?kategorie=${product.category.id}`}>{product.category.name}</a>
          </>
        )}
      </nav>

      <article className="wrap product-page">
        <div className="product-page-media">
          <ProductImage src={image} name={product.name} eager />
        </div>

        <div className="product-page-info">
          <h1>{product.name}</h1>
          <p className="product-page-unit">
            {product.unit}
            {base && <span> ({base})</span>}
          </p>

          <div className="product-page-price">
            {product.available ? (
              <PriceTag price={product.price} size="m" />
            ) : (
              <p className="product-card-soldout">Zurzeit nicht vorrätig</p>
            )}
          </div>

          {product.description && <p className="product-page-text">{product.description}</p>}
          {product.details && <p className="product-page-text">{product.details}</p>}

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
            <a className="btn btn-whatsapp" href={wa} target="_blank" rel="noreferrer">
              <Icon name="whatsapp" /> Verfügbarkeit per WhatsApp fragen
            </a>
          )}
          <p className="product-page-note">Preise gelten im Markt und können sich ändern. Keine Online-Bestellung.</p>
        </div>
      </article>

      {related.length > 0 && (
        <section className="section section-mist">
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
