import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { api } from "../api";
import ProductCard from "../components/ProductCard";
import CategoryFilter from "../components/CategoryFilter";
import { PAGE_SIZE } from "../lib/site";
import "../styles/products.css";

/**
 * Produktkatalog: lädt seitenweise vom Server (24 Stück), Suche und Kategorie
 * laufen ebenfalls serverseitig – so bleibt die Seite auch mit tausenden Artikeln
 * auf dem Handy schnell.
 */
function Products({ categories, settings, initialCategory = "Alle" }) {
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const requestId = useRef(0);

  const categoryImages = useMemo(
    () => Object.fromEntries(categories.map((category) => [category.name, category.image])),
    [categories]
  );
  const visibleCategories = useMemo(
    () => categories.filter((category) => category.product_count > 0),
    [categories]
  );

  // Suche entprellen, damit nicht bei jedem Buchstaben eine Anfrage rausgeht.
  useEffect(() => {
    const timer = window.setTimeout(() => setSearchTerm(searchInput.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const loadFirstPage = useCallback(async () => {
    const current = ++requestId.current;
    setLoading(true);
    setError("");
    try {
      const result = await api.getProducts({
        page: 1,
        limit: PAGE_SIZE,
        category: selectedCategory === "Alle" ? "" : selectedCategory,
        q: searchTerm
      });
      if (current !== requestId.current) return;
      setItems(result.items);
      setTotal(result.total);
      setPage(1);
      setHasMore(result.hasMore);
    } catch (requestError) {
      if (current !== requestId.current) return;
      setError(requestError.message || "Produkte konnten nicht geladen werden.");
    } finally {
      if (current === requestId.current) setLoading(false);
    }
  }, [selectedCategory, searchTerm]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadFirstPage();
  }, [loadFirstPage]);

  async function loadMore() {
    const nextPage = page + 1;
    const current = ++requestId.current;
    setLoading(true);
    try {
      const result = await api.getProducts({
        page: nextPage,
        limit: PAGE_SIZE,
        category: selectedCategory === "Alle" ? "" : selectedCategory,
        q: searchTerm
      });
      if (current !== requestId.current) return;
      setItems((existing) => [...existing, ...result.items]);
      setPage(nextPage);
      setHasMore(result.hasMore);
    } catch (requestError) {
      setError(requestError.message || "Weitere Produkte konnten nicht geladen werden.");
    } finally {
      if (current === requestId.current) setLoading(false);
    }
  }

  return (
    <section id="products" className="products-section">
      <div className="products-page-intro">
        <h1>Sortiment entdecken</h1>
        <p>
          Stöbern Sie durch unser Sortiment, suchen Sie nach Produkten oder Marken und
          fragen Sie direkt per WhatsApp an.
        </p>
      </div>

      <div className="search-wrapper">
        <input
          type="search"
          inputMode="search"
          placeholder="Produkt, Marke oder Barcode suchen..."
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          aria-label="Produkte durchsuchen"
        />
      </div>

      <CategoryFilter
        categories={visibleCategories}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
      />

      <div className="product-count" aria-live="polite">
        {loading && items.length === 0
          ? "Produkte werden geladen..."
          : `${total.toLocaleString("de-DE")} Produkt${total !== 1 ? "e" : ""}${searchTerm ? ` für „${searchTerm}“` : ""}`}
      </div>

      {error && <div className="no-products"><h3>Da ist etwas schiefgelaufen</h3><p>{error}</p></div>}

      {items.length > 0 ? (
        <>
          <div className="products-grid">
            {items.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                categoryImage={categoryImages[product.category] || ""}
                settings={settings}
              />
            ))}
          </div>

          {hasMore && (
            <div className="load-more">
              <button type="button" onClick={loadMore} disabled={loading}>
                {loading ? "Lädt..." : `Mehr laden (${items.length} von ${total})`}
              </button>
            </div>
          )}
        </>
      ) : (
        !loading && !error && (
          <div className="no-products">
            <h3>Keine Produkte gefunden</h3>
            <p>Versuchen Sie eine andere Suche oder Kategorie.</p>
          </div>
        )
      )}

      <div className="catalog-cta">
        <h3>Nicht gefunden, was Sie suchen?</h3>
        <p>Unser Sortiment ist größer als der Katalog. Fragen Sie einfach direkt bei uns nach.</p>
        <a href="#/contact">Kontakt aufnehmen</a>
      </div>
    </section>
  );
}

export default Products;
