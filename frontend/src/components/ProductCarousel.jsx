function ProductCarousel({ products }) {
  const carouselProducts = products.filter((product) => product.featured).slice(0, 8);

  if (carouselProducts.length === 0) return null;

  return (
    <div className="hero-product-strip" aria-label="Beliebte Produkte">
      <div className="hero-product-track">
        {[...carouselProducts, ...carouselProducts].map((product, index) => (
          <a
            className="hero-product-tile"
            href={`#/product/${product.id}`}
            key={`${product.id}-${index}`}
          >
            <img src={product.image} alt={product.name} />
            <span>{product.name}</span>
          </a>
        ))}
      </div>
    </div>
  );
}

export default ProductCarousel;
