import ProductCard from "./ProductCard";

function FeaturedProducts({ products }) {
  const featuredProducts = products.filter((product) => product.featured);

  return (
    <section className="featured-section">
      <div className="section-header">
        <h2>Beliebte Produkte</h2>
        <p>Eine kleine Auswahl aus unserem Sortiment.</p>
      </div>

      <div className="products-grid">
        {featuredProducts.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}

export default FeaturedProducts;
