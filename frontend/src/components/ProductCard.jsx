import ProductImage from "./ProductImage";
import { formatPrice, whatsappLink } from "../lib/site";

function ProductCard({ product, categoryImage = "", settings }) {
  const whatsappText = `Hallo EFSE'Z Markt, ich interessiere mich für ${product.name}.`;
  const price = formatPrice(product.price);

  return (
    <article className="product-card">
      <a className="product-image" href={`#/product/${product.id}`}>
        {product.featured && <span className="featured-badge">Beliebt</span>}
        <ProductImage product={product} categoryImage={categoryImage} />
      </a>

      <div className="product-info">
        <p className="product-category">{product.category}</p>
        <h3>
          <a href={`#/product/${product.id}`}>{product.name}</a>
        </h3>
        {product.brand && <p className="product-brand">{product.brand}</p>}

        <div className="product-meta">
          {price && <strong className="product-price">{price}</strong>}
          {product.unit && <span className="product-unit">{product.unit}</span>}
        </div>

        {!product.available && <p className="availability-warning">Aktuell nicht verfügbar</p>}

        {product.description && <p className="product-description">{product.description}</p>}

        <div className="product-actions">
          <a href={`#/product/${product.id}`} className="product-button">
            Details
          </a>
          <a href={whatsappLink(settings, whatsappText)} className="product-button product-button-secondary">
            Anfragen
          </a>
        </div>
      </div>
    </article>
  );
}

export default ProductCard;
