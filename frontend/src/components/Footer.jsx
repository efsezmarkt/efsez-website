import { branch } from "../data/branches";

function Footer({ settings }) {
  const address = settings?.address || branch.address;

  return (
    <footer className="footer">
      <div className="footer-content">
        <div>
          <h3>EFSE&apos;Z Markt</h3>
          <p>Internationaler Einzelhandel für jeden Geschmack.</p>
        </div>

        <div>
          <h4>Navigation</h4>
          <a href="#/">Startseite</a>
          <a href="#/products">Produkte</a>
          <a href="#/contact">Kontakt</a>
        </div>

        <div>
          <h4>Kontakt</h4>
          <p>{address}</p>
          {settings?.phone && <p>Tel.: {settings.phone}</p>}
          {settings?.contact_email && <p>{settings.contact_email}</p>}
        </div>
      </div>

      <div className="footer-bottom">
        <p>© {new Date().getFullYear()} EFSE&apos;Z Markt. Alle Rechte vorbehalten.</p>
        <a href="#/admin" className="footer-staff-access">Personalzugang</a>
      </div>
    </footer>
  );
}

export default Footer;
