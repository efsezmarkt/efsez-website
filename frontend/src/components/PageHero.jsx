/** Grüner Kopfbereich der Unterseiten – derselbe Hintergrund wie auf der Startseite, nur flacher. */
function PageHero({ kicker, title, text, children, wave = true }) {
  return (
    <section className={`page-hero ${wave ? "" : "page-hero-flat"}`}>
      <div className="hero-leaf leaf-1" aria-hidden="true" />
      <div className="hero-leaf leaf-3" aria-hidden="true" />
      <div className="hero-leaf leaf-6" aria-hidden="true" />
      <div className="wrap page-hero-inner">
        {kicker && <p className="kicker">{kicker}</p>}
        <h1>{title}</h1>
        {text && <p className="page-hero-text">{text}</p>}
        {children}
      </div>
      {wave && <div className="hero-wave hero-wave-small" aria-hidden="true" />}
    </section>
  );
}

export default PageHero;
