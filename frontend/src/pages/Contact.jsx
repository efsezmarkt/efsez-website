import ContactFormSection from "../components/ContactFormSection";
import ContactSection from "../components/ContactSection";
import "../styles/contact.css";

function Contact({ settings }) {
  return (
    <>
      <ContactFormSection page />
      <ContactSection settings={settings} />
    </>
  );
}

export default Contact;
