import ProductImage from "./ProductImage";
import PriceTag from "./PriceTag";
import { basePrice } from "../lib/format";

function ProductCard({ product, showFlag = false }) {
  const image = product.image || product.category?.image || "";
  const base = basePrice(product.price, product.unit);

  return (
    <a className="product-card" href={`#/produkt/${product.id}`}>
      <span className="product-card-media">
        <ProductImage src={image} name={product.name} caption={product.category?.name} />
        {showFlag && product.featured && <span className="product-card-flag">Beliebt</span>}
      </span>
      <span className="product-card-body">
        <span className="product-card-name">{product.name}</span>
        <span className="product-card-unit">
          {product.unit}
          {base && <span className="product-card-base"> ({base})</span>}
        </span>
        <span className="product-card-price">
          {!product.available ? (
            <span className="product-card-soldout">Zurzeit nicht da</span>
          ) : product.price == null ? (
            <span className="product-card-soldout">Preis im Markt</span>
          ) : (
            <PriceTag price={product.price} size="s" />
          )}
        </span>
      </span>
    </a>
  );
}

export default ProductCard;
