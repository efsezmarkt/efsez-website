const stats = [
  { value: "2", label: "Filialen", note: "in Nürnberg" },
  { value: "850+", label: "Produkte", note: "im Sortiment" },
  { value: "6", label: "Tage pro Woche", note: "für Sie da" },
  { value: "100%", label: "Frische", note: "in der Auswahl" },
];

function StatsSection() {
  return (
    <section className="stats-section" aria-label="EFSE'Z Markt in Zahlen">
      {stats.map((stat) => (
        <div className="stat-card" key={stat.label}>
          <span className="stat-dot" aria-hidden="true" />
          <h2>{stat.value}</h2>
          <p>{stat.label}</p>
          <small>{stat.note}</small>
        </div>
      ))}
    </section>
  );
}

export default StatsSection;
