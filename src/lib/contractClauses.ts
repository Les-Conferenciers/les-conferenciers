// Clauses par défaut du contrat (Conditions générales).
// Chaque article est éditable depuis l'admin et peut être remplacé via custom_clauses.articles[key].
// Le HTML rendu côté contrat utilise les classes existantes (text-[12px], etc.).

export type ClauseKey =
  | "art1"
  | "art2"
  | "art3"
  | "art4"
  | "art5"
  | "art6"
  | "art7"
  | "art8"
  | "art9"
  | "art10"
  | "art11";

export type ClauseDef = {
  key: ClauseKey;
  title: string;
  /** HTML par défaut (sans le titre <h3>) */
  defaultHtml: string;
};

export const DEFAULT_CLAUSES: ClauseDef[] = [
  {
    key: "art1",
    title: "Article 1. DÉFINITIONS",
    defaultHtml: `<p>Les Parties conviennent de donner aux termes ci-dessous les définitions suivantes :</p>
<ul class="list-disc pl-5 space-y-1 mt-2">
  <li><strong>Bon de commande :</strong> document contractuel décrivant les spécificités de la Prestation.</li>
  <li><strong>Client :</strong> Client identifié au Bon de commande.</li>
  <li><strong>Conditions générales ou CG :</strong> document contractuel qui rassemble les modalités générales de réalisation de la Prestation.</li>
  <li><strong>Contrat :</strong> ensemble contractuel liant les Parties. Il est composé d'un Bon de commande, de Conditions générales et d'éventuelles annexes.</li>
  <li><strong>Informations confidentielles :</strong> toute information, document, donnée identifiée comme confidentielle et communiquée par une partie aux autres en ce compris le prix, ce contrat en tout ou partie.</li>
  <li><strong>Intervenant :</strong> personnalité identifiée au Bon de commande chargée d'intervenir au cours de l'Événement.</li>
  <li><strong>Événement :</strong> événement identifié au Bon de commande organisé par le Client pour lequel le Client sollicite Les conférenciers afin qu'il lui propose des profils de conférencier ou d'animateurs.</li>
  <li><strong>Image de l'Intervenant :</strong> ensemble des attributs de l'Intervenant permettant de l'identifier.</li>
  <li><strong>Parties :</strong> l'Intervenant, le Client et Les conférenciers désignés ensemble ou séparément.</li>
  <li><strong>Prestation :</strong> accompagnement Les conférenciers et participation de l'Intervenant à l'Événement.</li>
</ul>`,
  },
  {
    key: "art2",
    title: "Article 2. OBJET ET COMPOSITION DU CONTRAT",
    defaultHtml: `<p>Le Contrat a pour objet de définir les Prestations que l'Intervenant et Les Conférenciers s'engagent à réaliser au bénéfice du Client ainsi que les modalités d'utilisation de l'image de l'Intervenant par le Client.</p>
<p class="mt-2">Le Contrat est composé d'un Bon de commande, de Conditions générales et d'éventuelles annexes. Les stipulations du Bon de commandes prévalent à celles des Conditions générales.</p>`,
  },
  {
    key: "art3",
    title: "Article 3. RÉALISATION DES PRESTATIONS",
    defaultHtml: `<p class="font-semibold mt-2">3.1 Accompagnement Les Conférenciers</p>
<p>A partir des besoins identifiés par le Client, Les Conférenciers proposera à ce dernier des profils d'intervenants pertinents. Une fois que le Client, Les Conférenciers et l'Intervenant se sont accordés sur les caractéristiques principales des Prestations et que le Contrat est signé, Les Conférenciers continue à assurer l'interface entre le Client et l'Intervenant.</p>
<p class="font-semibold mt-2">3.2 Participation de l'Intervenant à l'Événement</p>
<p>L'Intervenant participera à l'Événement selon les conditions prévues au Bon de commande. L'Intervenant garantit à ses cocontractants la maîtrise des compétences professionnelles nécessaires à la réalisation des Prestations.</p>
<p class="font-semibold mt-2">3.3 Engagements du Client</p>
<p>Le Client reconnaît avoir transmis aux Conférenciers les éléments fondamentaux de sa recherche dès leurs premiers échanges. Un mois avant l'Événement, le Client s'engage à transmettre à ses cocontractants la liste exhaustive des éléments leur permettant de réaliser leur Prestation.</p>
<p class="font-semibold mt-2">3.4 Relations entre les Parties</p>
<p><strong>Rendez-vous tripartite :</strong> Les modalités précises de la Prestation seront définies au moyen d'un rendez-vous téléphonique d'une durée minimale de trente (30) minutes.</p>
<p><strong>Loyauté :</strong> Chaque Partie s'engage à tenir informés ses cocontractants de tout changement ou difficulté pouvant impacter l'exécution du Contrat.</p>
<p><strong>Confidentialité :</strong> Les Parties s'engagent à ne pas porter atteinte à l'image des autres et s'interdisent de divulguer toutes les Informations confidentielles.</p>
<p><strong>Exclusivité :</strong> Le client s'interdit de contacter l'intervenant directement ou indirectement pendant 3 (trois) ans à compter de la signature des présentes, sauf par l'intermédiaire de l'Agence Les Conférenciers.</p>`,
  },
  {
    key: "art4",
    title: "Article 4. DROIT À L'IMAGE ET DROIT D'AUTEUR",
    defaultHtml: `<p><strong>4.1.</strong> En contrepartie de la rémunération visée à l'article 5, l'Intervenant accepte de communiquer au public et exposer de manière orale sa conférence lors du jour de la manifestation. Le Client reconnaît que le Contrat ne lui confère aucun droit de propriété intellectuelle sur les documents réalisés par l'Intervenant.</p>
<p class="mt-1"><strong>4.2.</strong> Avant l'Évènement : L'Intervenant s'engage à communiquer une photographie le représentant afin de permettre la communication pendant les deux mois qui précèdent l'Événement.</p>
<p class="mt-1"><strong>4.3.</strong> Pendant l'Évènement : L'autorisation de captation devra être mentionnée dans les conditions particulières du Bon de commande. A défaut d'accord, aucune captation ne pourra être réalisée.</p>
<p class="mt-1"><strong>4.4.</strong> Après l'Événement : Le Client pourra conserver des extraits (maximum 4, durée max 1min30 chacun) pour usage interne pendant 3 mois maximum.</p>`,
  },
  {
    key: "art5",
    title: "Article 5. MODALITÉS FINANCIÈRES",
    // 5.1 est dynamique selon deposit_required → on garde un placeholder {{PRICE_CLAUSE}}
    defaultHtml: `{{PRICE_CLAUSE}}
<p class="mt-1"><strong>5.2 Frais de déplacement et hébergement.</strong> Les Conférenciers prendra en charge la réservation des transports nécessaires. Les Conférenciers facturera les frais avancés au Client sur présentation de justificatif.</p>`,
  },
  {
    key: "art6",
    title: "Article 6. DURÉE DU CONTRAT",
    defaultHtml: `<p>Le Contrat entre en vigueur à la date de sa signature et jusqu'au mois qui suit l'extinction des obligations des articles 3, 4 et 5.</p>`,
  },
  {
    key: "art7",
    title: "Article 7. MODIFICATION DES PRESTATIONS",
    defaultHtml: `<p><strong>7.1 Modification.</strong> Les Parties pourront modifier d'un commun accord écrit les Prestations jusqu'à sept jours ouvrables avant l'Événement.</p>
<p class="mt-1"><strong>7.2 Suspension.</strong> En cas de Force majeure, l'exécution serait suspendue. Si l'événement perdurait plus de 30 jours, le Contrat serait résilié.</p>
<p class="mt-1"><strong>7.3 Annulation.</strong> Annulation par le Client :</p>
<ul class="list-disc pl-5 mt-1">
  <li>À plus de 30 jours de l'Évènement : 50% du montant de la prestation</li>
  <li>Entre 30 et le jour de l'Évènement : 100% du montant de la prestation</li>
</ul>
<p class="mt-1">En cas d'annulation par l'Intervenant, Les Conférenciers s'engage à proposer au Client des profils susceptibles de se substituer.</p>
<p class="mt-1"><strong>7.4 Résiliation.</strong> En cas de manquement, la Partie défaillante aura 30 jours après mise en demeure pour y remédier.</p>`,
  },
  {
    key: "art8",
    title: "Article 8. FORCE MAJEURE",
    defaultHtml: `<p>Chacune des Parties sera exonérée de toute responsabilité en cas de manquement causé par un cas de Force majeure : événement imprévisible et irrésistible, résultant d'un fait extérieur (nature climatique, pandémique, militaire, politique ou diplomatique).</p>`,
  },
  {
    key: "art9",
    title: "Article 9. IMPRÉVISION",
    defaultHtml: `<p>Lorsqu'une Partie prouve que l'exécution de ses obligations est devenue excessivement onéreuse (variation de plus de 30% du prix), elle peut demander une renégociation du Contrat. Les Parties s'engagent à organiser une tentative de conciliation de 10 jours.</p>`,
  },
  {
    key: "art10",
    title: "Article 10. OBLIGATIONS LÉGALES - RESPONSABILITÉS",
    defaultHtml: `<p><strong>Déclarations administratives :</strong> Chaque Partie demeure responsable de ses obligations légales, sociales et fiscales.</p>
<p><strong>Données personnelles :</strong> Les Parties s'engagent à assurer la protection des données à caractère personnel conformément à la législation en vigueur.</p>
<p><strong>Recours à un tiers :</strong> Si une Partie fait appel à un prestataire, ce tiers demeure sous son autorité exclusive.</p>`,
  },
  {
    key: "art11",
    title: "Article 11. DIVERS",
    defaultHtml: `<p><strong>Capacité :</strong> Chaque Partie certifie avoir la capacité d'agir au Contrat. Les Parties reconnaissent la force probante de la signature électronique.</p>
<p><strong>Indépendance des Parties :</strong> Aucune stipulation ne pourra être interprétée comme un lien de subordination.</p>
<p><strong>Cession :</strong> Le Contrat est conclu intuitu personae.</p>
<p><strong>Nullité :</strong> La nullité d'une clause n'entraîne pas la nullité de l'ensemble.</p>
<p><strong>Droit applicable :</strong> Le Contrat est soumis à la loi française. Tribunal de Grande Instance de Paris compétent.</p>`,
  },
];

/** Récupère le texte HTML effectif pour un article (override si défini, sinon défaut). */
export function getClauseHtml(
  key: ClauseKey,
  customClauses: any,
  replacements: Record<string, string> = {}
): string {
  const def = DEFAULT_CLAUSES.find((c) => c.key === key);
  const fallback = def?.defaultHtml || "";
  const overrides =
    customClauses && typeof customClauses === "object" && customClauses.articles
      ? customClauses.articles
      : {};
  let html = (overrides[key] && String(overrides[key]).trim()) || fallback;
  for (const [k, v] of Object.entries(replacements)) {
    html = html.split(`{{${k}}}`).join(v);
  }
  return html;
}

/** Récupère le bloc « conditions particulières » texte libre. */
export function getCustomClausesText(customClauses: any): string {
  if (!customClauses) return "";
  if (typeof customClauses === "string") return customClauses;
  if (typeof customClauses === "object" && customClauses.text) return String(customClauses.text);
  return "";
}

export const REMOVED_CLAUSE_MARKER = "__REMOVED__";

/** Indique si un article a été marqué comme supprimé via les overrides. */
export function isClauseRemoved(key: ClauseKey, customClauses: any): boolean {
  const overrides =
    customClauses && typeof customClauses === "object" && customClauses.articles
      ? customClauses.articles
      : {};
  return overrides[key] === REMOVED_CLAUSE_MARKER;
}

