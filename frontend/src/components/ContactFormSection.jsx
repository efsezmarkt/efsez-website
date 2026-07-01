import { useState } from "react";
import { api } from "../api";

const inquiryTypes = [
  "Produktwunsch",
  "Produktverfuegbarkeit",
  "Partneranfrage",
  "Lieferant / Zusammenarbeit",
  "Allgemeine Anfrage"
];

function ContactFormSection({ page = false }) {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSending, setIsSending] = useState(false);

  async function submitForm(event) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const payload = {
      name: String(formData.get("name") || "").trim(),
      contact: String(formData.get("contact") || "").trim(),
      purpose: String(formData.get("purpose") || "").trim(),
      message: String(formData.get("message") || "").trim()
    };

    setMessage("");
    setError("");
    setIsSending(true);

    try {
      await api.submitContactRequest(payload);
      setMessage(`Danke${payload.name ? `, ${payload.name}` : ""}. Ihre Anfrage ist angekommen.`);
      event.currentTarget.reset();
    } catch (requestError) {
      setError(requestError.message || "Die Anfrage konnte nicht gesendet werden.");
    } finally {
      setIsSending(false);
    }
  }

  return (
    <section id="contact-form" className={page ? "contact-form-section contact-form-page" : "contact-form-section"}>
      <div className="contact-form-layout">
        <div className="contact-form-copy">
          <p className="section-label">Kontakt</p>
          <h2>Produktwunsch, Partnerschaft oder kurze Frage?</h2>
          <p>
            Fuer Produktanfragen, Lieferanten, Kooperationen oder allgemeine Anliegen
            koennen Sie EFSE'Z Markt direkt ueber dieses Formular erreichen.
          </p>
        </div>

        <form className="contact-form-card" onSubmit={submitForm}>
          <div className="contact-form-grid">
            <label>
              Name
              <input name="name" type="text" placeholder="Ihr Name" />
            </label>
            <label>
              Kontakt
              <input name="contact" type="text" placeholder="Telefon oder E-Mail" required />
            </label>
          </div>

          <label>
            Zweck der Anfrage
            <select name="purpose" defaultValue="Produktwunsch">
              {inquiryTypes.map((type) => (
                <option value={type} key={type}>{type}</option>
              ))}
            </select>
          </label>

          <label>
            Nachricht
            <textarea name="message" placeholder="Worum geht es?" required />
          </label>

          <button type="submit" disabled={isSending}>
            {isSending ? "Wird gesendet..." : "Anfrage senden"}
          </button>
          {message && <p className="contact-form-message">{message}</p>}
          {error && <p className="contact-form-message contact-form-error">{error}</p>}
        </form>
      </div>
    </section>
  );
}

export default ContactFormSection;
