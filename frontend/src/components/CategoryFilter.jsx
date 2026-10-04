function CategoryFilter({ categories, selectedCategory, onSelectCategory, total }) {
  return (
    <div className="category-filter" role="tablist" aria-label="Kategorien">
      <button
        type="button"
        role="tab"
        aria-selected={selectedCategory === "Alle"}
        className={selectedCategory === "Alle" ? "active" : ""}
        onClick={() => onSelectCategory("Alle")}
      >
        Alle{typeof total === "number" ? <small>{total}</small> : null}
      </button>

      {categories.map((category) => (
        <button
          type="button"
          role="tab"
          key={category.id || category.name}
          aria-selected={selectedCategory === category.name}
          className={selectedCategory === category.name ? "active" : ""}
          onClick={() => onSelectCategory(category.name)}
        >
          {category.name}
          {typeof category.product_count === "number" ? <small>{category.product_count}</small> : null}
        </button>
      ))}
    </div>
  );
}

export default CategoryFilter;
