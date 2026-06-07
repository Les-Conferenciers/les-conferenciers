import React from "react";

/**
 * Aperçu RÉEL d'un email tel qu'il sera reçu par le destinataire.
 * Source unique de vérité pour :
 *  - l'aperçu d'un template dans l'onglet Admin > Emails
 *  - l'aperçu d'un email en cours de composition (proposition, contrat, facture…)
 * Le rendu reflète l'enrobage HTML appliqué côté Edge Functions
 * (send-proposal-email, send-contract-email, send-invoice-email, send-contact-email…).
 */

const hasHtmlContent = (value: string) => /<\w+[^>]*>/.test(value);
const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

export const toEmailBodyHtml = (value: string) => {
  if (!value?.trim()) return "";
  if (hasHtmlContent(value)) return value;
  return escapeHtml(value).replace(/\n/g, "<br>");
};

export type EmailPreviewVariant = "proposal" | "contract" | "invoice" | "plain";

export type EmailPreviewCardProps = {
  to: string;
  subject: string;
  body: string;
  /** Affiche le gros bouton CTA + bandeau bleu "valable 90 jours". */
  showProposalButton?: boolean;
  /** Variante détectée automatiquement si non fournie. */
  variant?: EmailPreviewVariant;
  /** Libellé du bouton CTA (par défaut : "Consulter la proposition complète"). */
  ctaLabel?: string;
  /** Texte du footer en bas (par défaut selon la variante). */
  footerLabel?: string;
  from?: string;
};

export function EmailPreviewCard({
  to,
  subject,
  body,
  showProposalButton = false,
  variant = "proposal",
  ctaLabel,
  footerLabel,
  from = "Les Conférenciers <nellysabde@lesconferenciers.com>",
}: EmailPreviewCardProps) {
  const bodyHtml = toEmailBodyHtml(body);

  const resolvedCta =
    ctaLabel ||
    (variant === "contract"
      ? "Signer le bon de commande"
      : variant === "invoice"
      ? "Consulter la facture"
      : "Consulter la proposition complète");

  const resolvedFooter =
    footerLabel ||
    (variant === "contract"
      ? "Bon de commande - Les Conférenciers"
      : variant === "invoice"
      ? "Facture - Les Conférenciers"
      : variant === "plain"
      ? "Les Conférenciers"
      : "Proposition confidentielle - Les Conférenciers");

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <div className="bg-muted px-4 py-2 text-xs text-muted-foreground space-y-1">
        <p>
          <strong>De :</strong> {from}
        </p>
        <p>
          <strong>À :</strong> {to || "-"}
        </p>
        <p>
          <strong>Objet :</strong> {subject || "-"}
        </p>
      </div>
      <div style={{ background: "#f5f5f5", padding: "20px 0" }}>
        <div style={{ maxWidth: 600, margin: "0 auto", background: "#ffffff" }}>
          {/* Header */}
          <div style={{ background: "#1a2332", padding: "20px 30px", textAlign: "center" }}>
            <img
              src="https://www.lesconferenciers.com/favicon.png"
              alt=""
              style={{
                width: 36,
                height: 36,
                display: "inline-block",
                verticalAlign: "middle",
                marginRight: 12,
              }}
            />
            <span
              style={{
                color: "#f5f0e8",
                fontSize: 20,
                fontWeight: "bold",
                verticalAlign: "middle",
                fontFamily: "Georgia, serif",
              }}
            >
              Agence Les Conférenciers
            </span>
          </div>

          {/* Body */}
          <div style={{ padding: "30px 30px 20px" }}>
            <div
              style={{ color: "#333", fontSize: 15, lineHeight: 1.6 }}
              className="[&_p]:mt-0 [&_p]:mb-4 [&_p:last-child]:mb-0"
              dangerouslySetInnerHTML={{ __html: bodyHtml }}
            />
            {showProposalButton && (
              <>
                <div style={{ textAlign: "center", margin: "30px 0" }}>
                  <span
                    style={{
                      display: "inline-block",
                      background: "#1a2332",
                      color: "#f5f0e8",
                      padding: "14px 32px",
                      borderRadius: 8,
                      fontSize: 15,
                      fontWeight: "bold",
                    }}
                  >
                    {resolvedCta}
                  </span>
                </div>
                {variant === "proposal" && (
                  <div
                    style={{
                      background: "#f0f7ff",
                      border: "1px solid #d0e3f7",
                      borderRadius: 8,
                      padding: 16,
                      margin: "20px 0",
                    }}
                  >
                    <p style={{ color: "#1a5276", fontSize: 13, margin: 0, textAlign: "center" }}>
                      📅 Cette proposition est <strong>valable 90 jours</strong>. Vous pouvez y revenir autant de fois
                      que vous le souhaitez et <strong>y répondre directement en ligne</strong>.
                    </p>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Signature */}
          <div style={{ padding: "0 30px 30px" }}>
            <img
              src="https://www.lesconferenciers.com/images/les-conferenciers-signature.png"
              alt="Nelly SABDE | Agence Les Conférenciers"
              style={{ width: "100%", maxWidth: 500, display: "block" }}
            />
          </div>

          {/* Footer */}
          <div style={{ background: "#1a2332", padding: 16, textAlign: "center" }}>
            <p style={{ color: "#f5f0e8", opacity: 0.5, fontSize: 11, margin: 0 }}>{resolvedFooter}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Détermine variante + bouton CTA à partir de la clé du template. */
export function previewSettingsForTemplateKey(key: string): {
  variant: EmailPreviewVariant;
  showProposalButton: boolean;
  ctaLabel?: string;
} {
  if (key === "contract_to_client") {
    return { variant: "contract", showProposalButton: true, ctaLabel: "Signer le bon de commande" };
  }
  if (key === "invoice_to_client") {
    return { variant: "invoice", showProposalButton: true, ctaLabel: "Consulter la facture" };
  }
  if (
    key === "proposal_classic" ||
    key === "proposal_update" ||
    key.startsWith("proposal_reminder_1_classic") ||
    key.startsWith("proposal_reminder_2_classic") ||
    key === "proposal_reminder_info"
  ) {
    return { variant: "proposal", showProposalButton: true };
  }
  // proposal_unique, proposal_info, lead_confirmation, reminders unique, etc.
  return { variant: "plain", showProposalButton: false };
}

export default EmailPreviewCard;
