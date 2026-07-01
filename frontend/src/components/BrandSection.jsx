const brands = [
  "Çaykur",
  "Ülker",
  "Torku",
  "Sera",
  "Yayla",
  "Bağdat",
  "Koska",
  "Duru",
];

function BrandSection() {
  return (
    <section className="brand-section">
      <div className="section-header">
        <h2>Beliebte Marken</h2>
        <p>Bekannte Marken aus unserem Sortiment.</p>
      </div>

      <div className="brand-strip">
        {brands.map((brand) => (
          <div className="brand-pill" key={brand}>
            {brand}
          </div>
        ))}
      </div>
    </section>
  );
}

export default BrandSection;
