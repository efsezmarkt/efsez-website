import { useState } from "react";
import ProductCard from "../components/ProductCard";
import CategoryFilter from "../components/CategoryFilter";
import "../styles/products.css";

function Products({ products }) {
  const [selectedCategory, setSelectedCategory] = useState("Alle");
  const [searchTerm, setSearchTerm] = useState("");

  const categories = [...new Set(products.map((product) => product.category))];

  const filteredProducts = products.filter((product) => {
    const matchesCategory =
      selectedCategory === "Alle" || product.category === selectedCategory;

    const search = searchTerm.toLowerCase();
    const matchesSearch =
      product.name.toLowerCase().includes(search) ||
      product.brand.toLowerCase().includes(search) ||
      product.category.toLowerCase().includes(search);

    return matchesCategory && matchesSearch;
  });

  return (
    <section id="products" className="products-section">
      <div className="products-page-intro">
        <h1>Sortiment entdecken</h1>
        <p>
          Entdecken Sie ausgewählte Produkte aus unserem Sortiment. Suchen Sie nach
          Marken, Kategorien oder Spezialitäten und fragen Sie Produkte direkt an.
        </p>
      </div>

      <div className="section-header">
        <h2>Produktkatalog</h2>
        <p>Suchen und filtern Sie unser Sortiment.</p>
      </div>

      <div className="search-wrapper">
        <input
          type="text"
          placeholder="Produkt, Marke oder Kategorie suchen..."
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
        />
      </div>

      <CategoryFilter
        categories={categories}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
      />

      <div className="product-count">
        {filteredProducts.length} Produkt
        {filteredProducts.length !== 1 ? "e" : ""} gefunden
      </div>

      {filteredProducts.length > 0 ? (
        <div className="products-grid">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="no-products">
          <h3>Keine Produkte gefunden</h3>
          <p>Versuchen Sie eine andere Suche oder Kategorie.</p>
        </div>
      )}

      <div className="catalog-cta">
        <h3>Nicht gefunden, was Sie suchen?</h3>
        <p>
          Unser Sortiment wird regelmäßig erweitert. Fragen Sie einfach direkt bei uns nach.
        </p>

        <a href="#contact">Kontakt aufnehmen</a>
      </div>
    </section>
  );
}

export default Products;
