import ProductImage from "./ProductImage";
import PriceTag from "./PriceTag";
import { basePrice } from "../lib/format";

function ProductCard({ product, showFlag = false }) {
  const image = product.image || product.category?.image || "";
  const variants = product.variant_count > 1;
  const range = variants && product.price_from != null && Number(product.price_from) < Number(product.price_to);
  const price = range ? product.price_from : product.price ?? product.price_from ?? null;
  const base = variants ? "" : basePrice(product.price, product.unit);

  return (
    <a className="product-card" href={`#/produkt/${product.id}`}>
      <span className="product-card-media">
        <ProductImage src={image} name={product.name} variant="monogram" />
        {showFlag && product.featured && <span className="product-card-flag">Beliebt</span>}
      </span>
      <span className="product-card-body">
        {product.category?.name && <span className="chip-label">{product.category.name}</span>}
        <span className="product-card-name">{product.name}</span>
        <span className="product-card-unit">
          {variants ? `${product.variant_count} Sorten & Größen` : product.unit}
          {base && <span className="product-card-base"> ({base})</span>}
        </span>
        <span className="product-card-price">
          {!product.available ? (
            <span className="product-card-soldout">Zurzeit nicht da</span>
          ) : price == null ? (
            <span className="product-card-soldout">Preis im Markt</span>
          ) : (
            <PriceTag price={price} size="s" from={range} />
          )}
        </span>
      </span>
    </a>
  );
}

export default ProductCard;
