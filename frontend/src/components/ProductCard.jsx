function ProductCard({ product }) {
  const whatsappText = `Hallo EFSE'Z Markt, ich interessiere mich für ${product.name}.`;

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
        <p className="product-category">{product.category}</p>
        <h3>{product.name}</h3>
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
