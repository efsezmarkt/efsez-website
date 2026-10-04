function roundDown(total) {
  if (!total || total < 50) return null;
  const step = total >= 1000 ? 100 : 50;
  return `${Math.floor(total / step) * step}+`;
}

function StatsSection({ productTotal, settings }) {
  const productLabel = settings?.product_count_label || roundDown(productTotal);

  const stats = [
    productLabel ? { value: productLabel, label: "Produkte", note: "im Katalog" } : null,
    { value: "6", label: "Tage pro Woche", note: "für Sie da" },
    { value: "100%", label: "Frische", note: "in der Auswahl" },
    { value: "Direkt", label: "per WhatsApp", note: "anfragen" }
  ].filter(Boolean);

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
