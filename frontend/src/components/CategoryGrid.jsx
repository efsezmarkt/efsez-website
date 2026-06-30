const categories = [
  { name: "Getränke", icon: "🥤" },
  { name: "Süßwaren", icon: "🍬" },
  { name: "Milchprodukte", icon: "🥛" },
  { name: "Käse", icon: "🧀" },
  { name: "Fleischwaren", icon: "🥩" },
  { name: "Gewürze", icon: "🌶️" },
  { name: "Konserven", icon: "🥫" },
  { name: "Frühstück", icon: "🍯" },
  { name: "Nudeln & Reis", icon: "🍚" },
  { name: "Tiefkühlprodukte", icon: "❄️" },
];

function CategoryGrid() {
  return (
    <section className="categories-section">
      <div className="section-header">
        <h2>Unsere Kategorien</h2>
        <p>Alles auf einen Blick – übersichtlich sortiert.</p>
      </div>

      <div className="categories-grid">
        {categories.map((category) => (
          <div className="category-card" key={category.name}>
            <span className="category-icon">{category.icon}</span>
            <span>{category.name}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

export default CategoryGrid;