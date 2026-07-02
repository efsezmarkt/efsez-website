const categories = [
  {
    name: "Getränke",
    description: "Ayran, Tee, Säfte",
    images: ["/assets/products/yayla-ayran.png", "/assets/products/caykur-rize-tee.png"],
  },
  {
    name: "Süßwaren",
    description: "Baklava, Kekse, Schokolade",
    images: ["/assets/products/baklava-pistazie.png"],
  },
  {
    name: "Milchprodukte",
    description: "Ayran, Joghurt, Frische",
    images: ["/assets/products/yayla-ayran.png"],
  },
  {
    name: "Käse",
    description: "Weichkäse, Schnittkäse",
    images: ["/assets/categories/kaese.jpg"],
  },
  {
    name: "Fleischwaren",
    description: "Sucuk und Kühltheke",
    images: ["/assets/products/efepasa-sucuk.png"],
  },
  {
    name: "Gewürze",
    description: "Paprika, Chili, Kräuter",
    images: ["/assets/products/bagdat-pul-biber.png"],
  },
  {
    name: "Konserven",
    description: "Oliven, Gläser, Vorrat",
    images: ["/assets/products/sera-gruene-oliven.png"],
  },
  {
    name: "Frühstück",
    description: "Tahin, Pekmez, Aufstriche",
    images: ["/assets/products/koska-tahin.png", "/assets/products/koska-pekmez.png"],
  },
  {
    name: "Nudeln & Reis",
    description: "Bulgur, Reis, Beilagen",
    images: ["/assets/products/duru-bulgur.png"],
  },
  {
    name: "Tiefkühlprodukte",
    description: "Gemüse, Teigwaren, Vorrat",
    images: ["/assets/categories/tiefkuehl.jpg"],
  },
];

function CategoryGrid() {
  return (
    <section className="categories-section">
      <div className="section-header">
        <p className="section-kicker">Sortiment</p>
        <h2>Unsere Kategorien</h2>
        <p>Alles auf einen Blick, übersichtlich sortiert.</p>
      </div>

      <div className="categories-grid">
        {categories.map((category) => (
          <div className="category-card" key={category.name}>
            <div className={`category-image-stack ${category.images.length > 1 ? "has-pair" : ""}`}>
              {category.images.map((image) => (
                <img src={image} alt={`${category.name} Produkt`} key={image} />
              ))}
            </div>
            <span className="category-name">{category.name}</span>
            <small>{category.description}</small>
          </div>
        ))}
      </div>
    </section>
  );
}

export default CategoryGrid;
