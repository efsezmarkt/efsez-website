const highlights = [
  {
    title: "Großes Sortiment",
    text: "Internationale Lebensmittel, Gewürze, Süßwaren und Produkte für den täglichen Bedarf.",
  },
  {
    title: "Produktübersicht",
    text: "Der digitale Katalog zeigt ausgewählte Produkte und bereitet spätere Bestandsdaten vor.",
  },
  {
    title: "Direkter Kontakt",
    text: "Produktwünsche, Verfügbarkeit oder Partneranfragen können schnell angefragt werden.",
  },
];

function InfoSection() {
  return (
    <section className="info-section">
      <div className="info-content">
        <p className="section-kicker">EFSE&apos;Z Markt</p>
        <h2>Ihr internationaler Einzelhandel mit großer Auswahl.</h2>

        <p>
          Bei EFSE&apos;Z finden Sie internationale Lebensmittel, frische
          Thekenprodukte, Getränke, Süßwaren und Produkte des täglichen Bedarfs
          in einem Markt, der nahbar, gut sortiert und modern erreichbar ist.
        </p>

        <div className="info-boxes">
          {highlights.map((highlight) => (
            <div key={highlight.title}>
              <span className="info-mark" aria-hidden="true" />
              <h3>{highlight.title}</h3>
              <p>{highlight.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default InfoSection;
