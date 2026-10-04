/**
 * Entwürfe für Impressum und Datenschutz. Bewusst als Vorlage markiert:
 * Inhaberangaben ergänzen und vor Veröffentlichung prüfen (lassen).
 */
export function imprintTemplate(settings) {
  return [
    "Angaben gemäß § 5 DDG",
    "",
    "EFSE'Z Markt",
    "[Vor- und Nachname des Inhabers bzw. Firma und Rechtsform]",
    settings.address || "[Straße Hausnummer, PLZ Ort]",
    "",
    "Kontakt",
    `Telefon: ${settings.phone || "[Telefon]"}`,
    `E-Mail: ${settings.contact_email || "[E-Mail]"}`,
    "",
    "Umsatzsteuer-ID gemäß § 27a UStG: [falls vorhanden]",
    "Registereintrag: [falls vorhanden, z. B. Amtsgericht Nürnberg, HRA …]",
    "",
    "Verantwortlich für den Inhalt: [Name, Anschrift wie oben]",
    "",
    "Verbraucherstreitbeilegung: Wir sind nicht verpflichtet und nicht bereit, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen."
  ].join("\n");
}

export function privacyTemplate(settings) {
  return [
    "1. Verantwortlicher",
    `EFSE'Z Markt, [Name des Inhabers], ${settings.address || "[Anschrift]"}, Telefon ${settings.phone || "[Telefon]"}, E-Mail ${settings.contact_email || "[E-Mail]"}.`,
    "",
    "2. Aufruf der Website",
    "Beim Besuch dieser Website verarbeitet unser Hosting-Anbieter Vercel Inc. (440 N Barranca Ave #4133, Covina, CA 91723, USA) technisch notwendige Daten wie IP-Adresse, Datum und Uhrzeit, aufgerufene Seite und Browser-Informationen, um die Seite auszuliefern und vor Missbrauch zu schützen (Art. 6 Abs. 1 lit. f DSGVO). Vercel ist nach dem EU-US Data Privacy Framework zertifiziert; zusätzlich bestehen EU-Standardvertragsklauseln. Diese Daten werden nur kurzzeitig gespeichert.",
    "",
    "3. Produktdaten und Kontaktformular",
    "Unsere Produktdaten und Nachrichten aus dem Kontaktformular liegen in einer Datenbank der Supabase Inc. auf Servern in Irland (EU). Wenn Sie uns über das Formular schreiben, speichern wir Ihren Namen (freiwillig), Ihre Telefonnummer oder E-Mail-Adresse und Ihre Nachricht, um Ihre Anfrage zu beantworten (Art. 6 Abs. 1 lit. b und f DSGVO). Wir löschen die Angaben, sobald Ihre Anfrage erledigt ist und keine Aufbewahrungspflichten bestehen.",
    "",
    "4. WhatsApp und Google Maps",
    "Auf unserer Website gibt es Links zu WhatsApp (Meta Platforms Ireland Ltd.) und Google Maps (Google Ireland Ltd.). Erst wenn Sie einen solchen Link anklicken, werden Sie zum jeweiligen Dienst weitergeleitet; dort gelten dessen Datenschutzbestimmungen. Die Karte mit unserem Standort ist eine eingebettete Google-Maps-Karte. Sie wird erst geladen, wenn Sie auf „Karte laden“ klicken (Art. 6 Abs. 1 lit. a DSGVO). Dann überträgt Ihr Browser unter anderem Ihre IP-Adresse an Google, und Google kann Cookies setzen. Ohne diesen Klick werden beim Besuch unserer Website keine Daten an diese Dienste übertragen.",
    "",
    "5. Cookies, Schriften und Analyse",
    "Wir setzen keine Cookies zu Werbe- oder Analysezwecken und verwenden keine Tracking-Dienste. Schriftarten werden von unserem eigenen Server geladen, nicht von Google. Im Browser wird lediglich kurzzeitig zwischengespeichert, welche Inhalte Sie bereits geladen haben, damit die Seite schneller lädt.",
    "",
    "6. Ihre Rechte",
    "Sie haben das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung, Datenübertragbarkeit und Widerspruch (Art. 15–21 DSGVO). Wenden Sie sich dafür an die oben genannten Kontaktdaten. Sie können sich außerdem bei einer Datenschutz-Aufsichtsbehörde beschweren, zum Beispiel beim Bayerischen Landesamt für Datenschutzaufsicht (BayLDA), Promenade 18, 91522 Ansbach.",
    "",
    "Stand: " + new Date().toLocaleDateString("de-DE", { month: "long", year: "numeric" })
  ].join("\n");
}
