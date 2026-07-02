const categoryLabels = {
  Getranke: "Getränke",
  "Susswaren": "Süßwaren",
  Gewurze: "Gewürze",
  Fruhstuck: "Frühstück",
};

function ProductCard({ product }) {
  const whatsappText = `Hallo EFSE'Z Markt, ich interessiere mich für ${product.name}.`;
  const category = categoryLabels[product.category] || product.category;

  return (
    <article className="product-card">
      <a className="product-image" href={`#/product/${product.id}`}>
        {product.featured && (
          <span className="featured-badge">
            Beliebt
          </span>
        )}

        <img src={product.image} alt={product.name} />
      </a>

      <div className="product-info">
        <p className="product-category">{category}</p>
        <h3>
          <a href={`#/product/${product.id}`}>{product.name}</a>
        </h3>
        <p className="product-brand">{product.brand}</p>

        {!product.available && (
          <p className="availability-warning">Aktuell nicht verfügbar</p>
        )}

        <p className="product-description">{product.description}</p>

        <div className="product-actions">
          <a href={`#/product/${product.id}`} className="product-button">
            Details
          </a>
          <a
            href={`https://wa.me/490000000000?text=${encodeURIComponent(whatsappText)}`}
            className="product-button product-button-secondary"
          >
            Anfragen
          </a>
        </div>
      </div>
    </article>
  );
}

export default ProductCard;
