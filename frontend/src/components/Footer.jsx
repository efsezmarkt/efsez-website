function Footer() {
  return (
    <footer className="footer">
      <div className="footer-content">
        <div>
          <h3>EFSE’Z Markt</h3>
          <p>Ihr Markt für jeden Geschmack.</p>
        </div>

        <div>
          <h4>Navigation</h4>
          <a href="#home">Startseite</a>
          <a href="#products">Produkte</a>
          <a href="#contact">Kontakt</a>
        </div>

        <div>
          <h4>Kontakt</h4>
          <p>Burgsalacher Str. 1, 90449 Nürnberg</p>
          <p>Äußere Bayreuther Str. 131A, 90411 Nürnberg</p>
        </div>
      </div>

      <div className="footer-bottom">
        <p>© 2026 EFSE’Z Markt. Alle Rechte vorbehalten.</p>
        <a href="#/admin" className="footer-staff-access">Personalzugang</a>
      </div>
    </footer>
  );
}

export default Footer;
