function CategoryGrid({ categories }) {
  const shown = categories.filter((category) => category.product_count > 0).slice(0, 12);
  if (!shown.length) return null;

  return (
    <section className="categories-section">
      <div className="section-header">
        <p className="section-kicker">Sortiment</p>
        <h2>Unsere Kategorien</h2>
        <p>Alles auf einen Blick, übersichtlich sortiert.</p>
      </div>

      <div className="categories-grid">
        {shown.map((category) => (
          <a
            className="category-card"
            key={category.id}
            href={`#/products?kategorie=${encodeURIComponent(category.name)}`}
          >
            <div className="category-image-stack">
              {category.image ? (
                <img src={category.image} alt={`${category.name}`} loading="lazy" />
              ) : (
                <span className="category-initial" aria-hidden="true">{category.name.charAt(0)}</span>
              )}
            </div>
            <span className="category-name">{category.name}</span>
            <small>{category.description || `${category.product_count} Produkte`}</small>
          </a>
        ))}
      </div>
    </section>
  );
}

export default CategoryGrid;
