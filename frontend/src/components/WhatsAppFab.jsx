import Icon from "./Icon";
import { whatsappLink } from "../lib/format";

/** Schwebender WhatsApp-Knopf – nur auf dem Handy und nur, wenn eine Nummer gepflegt ist. */
function WhatsAppFab({ settings }) {
  const href = whatsappLink(settings, "Hallo EFSE'Z Markt, ");
  if (!href) return null;

  return (
    <a className="wa-fab" href={href} target="_blank" rel="noreferrer" aria-label="Per WhatsApp schreiben">
      <Icon name="whatsapp" size={28} />
    </a>
  );
}

export default WhatsAppFab;
