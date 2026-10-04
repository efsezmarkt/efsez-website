import ProductCard from "./ProductCard";

function FeaturedProducts({ products, categories = [], settings }) {
  if (!products.length) return null;
  const categoryImages = Object.fromEntries(categories.map((category) => [category.name, category.image]));

  return (
    <section className="featured-section">
      <div className="section-header">
        <p className="section-kicker">Auswahl aus dem Regal</p>
        <h2>Beliebte Produkte</h2>
        <p>Eine kleine Auswahl aus unserem Sortiment.</p>
      </div>

      <div className="products-grid">
        {products.slice(0, 6).map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            categoryImage={categoryImages[product.category] || ""}
            settings={settings}
          />
        ))}
      </div>

      <div className="load-more">
        <a className="product-button" href="#/products">Ganzes Sortiment ansehen</a>
      </div>
    </section>
  );
}

export default FeaturedProducts;
