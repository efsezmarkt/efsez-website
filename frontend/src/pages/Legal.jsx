import PageHero from "../components/PageHero";

/**
 * Impressum und Datenschutz. Der Text wird im Personalbereich gepflegt.
 * Solange nichts hinterlegt ist, steht hier ein klar markierter Hinweis.
 */
function Legal({ kind, settings }) {
  const isImprint = kind === "impressum";
  const text = isImprint ? settings.imprint_text : settings.privacy_text;

  return (
    <>
      <PageHero title={isImprint ? "Impressum" : "Datenschutzerklärung"} />
      <div className="wrap legal-page">
        {text ? (
          <div className="legal-text">
            {text.split(/\n{2,}/).map((block, index) =>
              /^\d{1,2}\.\s+\S[^\n]{0,70}$/.test(block.trim()) ? (
                <h2 key={index}>{block.trim()}</h2>
              ) : (
                <p key={index}>
                  {block.split("\n").map((line, i, lines) => (
                    <span key={i}>
                      {line}
                      {i < lines.length - 1 && <br />}
                    </span>
                  ))}
                </p>
              ),
            )}
          </div>
        ) : (
          <div className="legal-text">
            <p>
              EFSE'Z Markt
              <br />
              {settings.address}
              {settings.phone && (
                <>
                  <br />
                  Telefon: {settings.phone}
                </>
              )}
            </p>
            <p className="notice">Die vollständigen Angaben werden gerade ergänzt.</p>
          </div>
        )}
      </div>
    </>
  );
}

export default Legal;
