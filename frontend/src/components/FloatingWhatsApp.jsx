import { whatsappLink } from "../lib/site";

function FloatingWhatsApp({ settings }) {
  const href = whatsappLink(settings);
  const external = href.startsWith("http");

  return (
    <a
      href={href}
      className="floating-whatsapp"
      target={external ? "_blank" : undefined}
      rel={external ? "noreferrer" : undefined}
      aria-label="WhatsApp schreiben"
    >
      WhatsApp
    </a>
  );
}

export default FloatingWhatsApp;
