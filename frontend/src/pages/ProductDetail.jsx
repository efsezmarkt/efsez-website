import ProductCard from "../components/ProductCard";
import "../styles/productDetail.css";

function ProductDetail({ product, products }) {
  if (!product) {
    return (
      <section className="detail-section">
        <div className="detail-empty">
          <h1>Produkt nicht gefunden</h1>
          <p>Das Produkt ist aktuell nicht im Katalog vorhanden.</p>
          <a href="#/products">Zuruck zum Sortiment</a>
        </div>
      </section>
    );
  }

  const relatedProducts = products
    .filter((item) => item.id !== product.id && item.category === product.category)
    .slice(0, 3);

  const infoItems = [
    ["Marke", product.brand],
    ["Kategorie", product.category],
    ["Einheit", product.unit],
    ["Herkunft", product.origin],
    ["Allergene", product.allergens],
    ["Barcode / SKU", product.barcode]
  ].filter(([, value]) => value);

  const whatsappText = `Hallo EFSE'Z Markt, ich habe eine Frage zu ${product.name}.`;

  return (
    <section className="detail-section">
      <a className="back-link" href="#/products">Zuruck zum Sortiment</a>

      <div className="detail-layout">
        <div className="detail-image">
          <img src={product.image} alt={product.name} />
        </div>

        <div className="detail-content">
          <p className="detail-category">{product.category}</p>
          <h1>{product.name}</h1>
          <p className="detail-brand">{product.brand}</p>
          <p className="detail-description">{product.description}</p>

          {product.details && (
            <div className="detail-copy">
              <h2>Produktinformationen</h2>
              <p>{product.details}</p>
            </div>
          )}

          <div className="detail-info-grid">
            {infoItems.map(([label, value]) => (
              <div className="detail-info-item" key={label}>
                <span>{label}</span>
                <strong>{value}</strong>
              </div>
            ))}
          </div>

          <div className="detail-actions">
            <a
              className="detail-whatsapp"
              href={`https://wa.me/490000000000?text=${encodeURIComponent(whatsappText)}`}
            >
              Per WhatsApp anfragen
            </a>
          </div>
        </div>
      </div>

      {relatedProducts.length > 0 && (
        <div className="related-section">
          <div className="section-header">
            <h2>Ahnliche Produkte</h2>
            <p>Weitere Artikel aus derselben Kategorie.</p>
          </div>
          <div className="products-grid">
            {relatedProducts.map((item) => (
              <ProductCard product={item} key={item.id} />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

export default ProductDetail;
