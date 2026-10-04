import { useCallback, useEffect, useRef, useState } from "react";
import ProductCard from "../components/ProductCard";
import Icon from "../components/Icon";
import PageHero from "../components/PageHero";
import { loadProducts } from "../lib/db";

/**
 * Sortiment: Suche und Kategorie laufen in der Datenbank, es werden immer nur
 * 24 Artikel geladen. Beim Runterscrollen kommen die nächsten automatisch.
 */
function Catalog({ categories, categoryId, initialSearch = "" }) {
  const [search, setSearch] = useState(initialSearch);
  const [term, setTerm] = useState(initialSearch.trim());
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(null);
  const [page, setPage] = useState(0);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const request = useRef(0);
  const sentinel = useRef(null);
  const searchInput = useRef(null);

  const activeCategory = categories.find((category) => category.id === categoryId) || null;

  useEffect(() => {
    if (window.location.hash.includes("suche=")) searchInput.current?.focus();
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => setTerm(search.trim()), 250);
    return () => window.clearTimeout(timer);
  }, [search]);

  const load = useCallback(
    async (nextPage) => {
      const id = ++request.current;
      setLoading(true);
      setError("");
      try {
        const result = await loadProducts({ page: nextPage, categoryId, search: term });
        if (id !== request.current) return;
        setItems((current) => (nextPage === 0 ? result.items : [...current, ...result.items]));
        if (nextPage === 0) setTotal(result.total);
        setPage(nextPage);
        setDone(result.items.length < 24);
      } catch (loadError) {
        if (id === request.current) setError(loadError.message);
      } finally {
        if (id === request.current) setLoading(false);
      }
    },
    [categoryId, term]
  );

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load(0);
  }, [load]);

  // Automatisch nachladen, wenn das Ende der Liste sichtbar wird.
  useEffect(() => {
    const el = sentinel.current;
    if (!el || done) return undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loading) load(page + 1);
      },
      { rootMargin: "600px 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [done, loading, load, page]);

  function chooseCategory(id) {
    window.location.hash = id ? `#/sortiment?kategorie=${id}` : "#/sortiment";
  }

  return (
    <div className="catalog">
      <PageHero
        kicker="Sortiment"
        title={activeCategory ? activeCategory.name : "Sortiment entdecken"}
        text="Stöbern Sie durch unser Sortiment, suchen Sie nach Produkten oder Marken und fragen Sie direkt per WhatsApp an."
      >
        <label className="search-field">
          <Icon name="search" />
          <span className="visually-hidden">Produkte suchen</span>
          <input
            ref={searchInput}
            type="search"
            inputMode="search"
            placeholder="Produkt oder Marke suchen …"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>
      </PageHero>

      <div className="catalog-bar">
        <div className="wrap">
          <div className="chip-row" role="list">
            <button type="button" className={!categoryId ? "chip is-active" : "chip"} onClick={() => chooseCategory(null)}>
              Alle
            </button>
            {categories.map((category) => (
              <button
                type="button"
                key={category.id}
                className={categoryId === category.id ? "chip is-active" : "chip"}
                onClick={() => chooseCategory(category.id)}
              >
                {category.name}
                <span className="chip-count">{category.visible_count}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="wrap catalog-body">
        <p className="catalog-count" aria-live="polite">
          {total === null
            ? "Wird geladen …"
            : `${total.toLocaleString("de-DE")} Produkte${term ? ` für „${term}“` : ""}`}
        </p>

        {error && <p className="notice is-error">{error}</p>}

        <div className="product-grid">
          {items.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
          {loading && items.length === 0 &&
            Array.from({ length: 8 }, (_, i) => <div key={i} className="product-card-skeleton skeleton" aria-hidden="true" />)}
        </div>

        {!loading && !error && items.length === 0 && (
          <div className="empty-state">
            <h2>Nichts gefunden</h2>
            <p>Nicht alles aus dem Laden steht online. Fragen Sie uns einfach – oft ist es doch im Regal.</p>
            <a className="btn btn-green" href="#/kontakt">Produkt anfragen</a>
          </div>
        )}

        <div ref={sentinel} className="catalog-sentinel" aria-hidden="true" />
        {!done && items.length > 0 && (
          <div className="catalog-more">
            <button type="button" className="btn btn-ghost" disabled={loading} onClick={() => load(page + 1)}>
              {loading ? "Lädt …" : "Weitere Artikel laden"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default Catalog;
