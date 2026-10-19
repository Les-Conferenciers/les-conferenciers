import { DEFAULT_CLAUSES, getClauseHtml, getCustomClausesText, isClauseRemoved } from "@/lib/contractClauses";

type Props = {
  customClauses: any;
  depositRequired: boolean | null | undefined;
  className?: string;
};

/** Conditions générales détaillées — rendu unique utilisé par l'aperçu admin et la page de signature. */
export function ContractClauses({ customClauses, depositRequired, className }: Props) {
  const visibleClauses = DEFAULT_CLAUSES.filter((c) => !isClauseRemoved(c.key, customClauses));
  const art5VisibleIndex = visibleClauses.findIndex((c) => c.key === "art5");
  const customText = getCustomClausesText(customClauses);
  return (
    <div className={className ?? "space-y-6 text-[12px] leading-relaxed"}>
      {visibleClauses.map((clause, idx) => {
        const displayNum = idx + 1;
        const priceClause = depositRequired === false
          ? `<p><strong>${displayNum}.1 Prix de la Prestation.</strong> Le montant de la Prestation est détaillé au Bon de commande. Le Client s'engage à régler 100% du montant total au plus tard sept jours avant la tenue de l'Événement.</p>`
          : `<p><strong>${displayNum}.1 Prix de la Prestation.</strong> Le montant de la Prestation est détaillé au Bon de commande. Le Client s'engage à verser 50% du montant total dans les 30 jours suivants la signature. 100% du montant devra être reçu au plus tard sept jours avant la tenue de l'Événement.</p>`;
        const html = getClauseHtml(clause.key, customClauses, { PRICE_CLAUSE: priceClause });
        const insertCustomHere = customText && (art5VisibleIndex >= 0 ? clause.key === "art5" : idx === visibleClauses.length - 1);
        const dynamicTitle = clause.title.replace(/^Article\s+\d+\./i, `Article ${displayNum}.`);
        return (
          <div key={clause.key} data-pdf-block>
            <h3 className="font-bold mb-2">{dynamicTitle}</h3>
            <div className="[&_p]:mt-0 [&_p]:mb-2 [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5 break-words" dangerouslySetInnerHTML={{ __html: html }} />
            {insertCustomHere && (
              <div className="mt-6" data-pdf-block>
                <h3 className="font-bold mb-2">CONDITIONS PARTICULIÈRES</h3>
                <div className="whitespace-pre-wrap text-[13px]">{customText}</div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
