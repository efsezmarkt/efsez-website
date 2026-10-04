import { useState } from "react";
import { sendContactRequest } from "../lib/db";

const PURPOSES = ["Produktwunsch", "Frage zur Verfügbarkeit", "Bestellung für Feier / Großmenge", "Lieferant / Partnerschaft", "Allgemeine Anfrage"];

function ContactForm() {
  const [state, setState] = useState({ status: "idle", message: "" });

  async function submit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());
    if (data.website) return; // Spam-Falle
    setState({ status: "sending", message: "" });
    try {
      await sendContactRequest(data);
      form.reset();
      setState({ status: "sent", message: "Danke! Ihre Nachricht ist angekommen. Wir melden uns so schnell wie möglich." });
    } catch (error) {
      setState({ status: "error", message: error.message });
    }
  }

  return (
    <form className="contact-form" onSubmit={submit}>
      <div className="contact-form-row">
        <label>
          <span>Name</span>
          <input name="name" autoComplete="name" maxLength={120} />
        </label>
        <label>
          <span>Telefon oder E-Mail *</span>
          <input name="contact" required minLength={3} maxLength={160} autoComplete="email" />
        </label>
      </div>
      <label>
        <span>Worum geht es?</span>
        <select name="purpose" defaultValue={PURPOSES[0]}>
          {PURPOSES.map((purpose) => (
            <option key={purpose}>{purpose}</option>
          ))}
        </select>
      </label>
      <label>
        <span>Nachricht *</span>
        <textarea name="message" required minLength={2} maxLength={4000} rows={4} placeholder="Zum Beispiel: Habt ihr Kaşar-Käse von Pınar?" />
      </label>
      <input className="visually-hidden" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" />
      <p className="contact-form-note">
        Wir nutzen Ihre Angaben nur, um Ihre Anfrage zu beantworten. Mehr dazu im <a href="#/datenschutz">Datenschutz</a>.
      </p>
      <button className="btn btn-green" type="submit" disabled={state.status === "sending"}>
        {state.status === "sending" ? "Wird gesendet…" : "Nachricht senden"}
      </button>
      {state.message && (
        <p className={`form-feedback ${state.status === "error" ? "is-error" : ""}`} role="status">
          {state.message}
        </p>
      )}
    </form>
  );
}

export default ContactForm;
