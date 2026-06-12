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
  <li><strong>Client :</strong> Client identifié au Bon de commande ;</li>
  <li><strong>Conditions générales ou CG :</strong> document contractuel qui rassemble les modalités générales de réalisation de la Prestation ;</li>
  <li><strong>Contrat :</strong> ensemble contractuel liant les Parties. Il est composé d'un Bon de commande, de Conditions générales et d'éventuelles annexes ;</li>
  <li><strong>Informations confidentielles :</strong> toute information, document, donnée identifiée comme confidentielle et communiquée par une partie aux autres en ce compris le prix, ce contrat en tout ou partie, les informations relatives aux produits, services ou savoirs-faires de l'une des Parties.</li>
  <li><strong>Intervenant :</strong> personnalité identifiée au Bon de commande chargée d'intervenir au cours de l'Événement ;</li>
  <li><strong>Événement :</strong> événement - identifié au Bon de commande - organisé par le Client (ex : séminaire d'entreprise, assemblées générales...) pour lequel le Client sollicite Les conférenciers afin qu'il lui propose des profils de conférencier ou d'animateurs ;</li>
  <li><strong>Image de l'Intervenant :</strong> ensemble des attributs de l'Intervenant permettant de l'identifier. Elle comprend – sans s'y limiter – son image fixe ou mobile, son portrait, sa silhouette, sa voix, son nom et prénom, sa signature ou tout élément permettant de l'identifier ;</li>
  <li><strong>Parties :</strong> l'Intervenant, le Client et Les conférenciers désignés ensemble ou séparément ;</li>
  <li><strong>Prestation :</strong> accompagnement Les conférenciers et participation de l'Intervenant à l'Événement.</li>
</ul>`,
  },
  {
    key: "art2",
    title: "Article 2. OBJET ET COMPOSITION DU CONTRAT",
    defaultHtml: `<p>Le Contrat a pour objet de définir les Prestations que l'Intervenant et Les Conférenciers s'engagent à réaliser au bénéfice du Client ainsi que les modalités d'utilisation de l'image de l'Intervenant par le Client.</p>
<p class="mt-2">Le Contrat est composé d'un Bon de commande, de Conditions générales et d'éventuelles annexes précisant les modalités techniques et/ou logistiques de réalisation de la prestation (exemple : prérequis techniques, plan de scène...). Les stipulations du Bon de commandes prévalent à celles des Conditions générales et permettent donc d'y déroger. Les CG en vigueur sont celles remises à la date d'émission du Bon de commande.</p>`,
  },
  {
    key: "art3",
    title: "Article 3. RÉALISATION DES PRESTATIONS",
    defaultHtml: `<p><strong>3.1 Accompagnement Les Conférenciers :</strong> A partir des besoins identifiés par le Client, Les Conférenciers proposera à ce dernier des profils d'intervenants pertinents. Une fois que le Client, Les Conférenciers et l'Intervenant se sont accordés sur les caractéristiques principales des Prestations (indiquées au Bon de commande) et que le Contrat est signé, Les Conférenciers continue à assurer l'interface entre le Client et l'Intervenant, notamment en organisant un rendez-vous tripartite, en assurant l'organisation de la logistique (ex : venue de l'Intervenant à l'Événement ou au studio d'enregistrement en cas d'événement digital).</p>
<p class="mt-2"><strong>3.2 Participation de l'Intervenant à l'Événement :</strong> L'Intervenant participera à l'Événement selon les conditions prévues au Bon de commande. Si besoin, l'Intervenant pourra fournir aux Conférenciers et au Client une fiche technique correspondant à ses besoins. L'Intervenant garantit à ses cocontractants la maîtrise des compétences professionnelles nécessaires à la réalisation des Prestations (ex : maîtrise d'une discipline et/ou d'une langue étrangère...). Pour permettre le succès de la Prestation, l'Intervenant s'engage à se montrer ponctuel, à respecter les consignes de sécurité du lieu où se tiendra l'Événement ou l'enregistrement de sa prestation. La tenue adoptée par l'Intervenant devra être conforme aux souhaits exprimés par le Client (ex : port d'un accessoire, couleur à prohiber...).</p>
<p class="mt-2"><strong>3.3 Engagements du Client :</strong> Le Client reconnaît avoir transmis aux Conférenciers les éléments fondamentaux de sa recherche dès leurs premiers échanges. Un (1) mois avant l'Événement, le Client s'engage à transmettre à ses cocontractants la liste exhaustive des éléments leur permettant de réaliser leur Prestation (ex : lieu de la captation, prérequis techniques...). Le Client est responsable de l'organisation de l'Événement se tenant en physique (location d'une salle, du matériel technique), ou en digital (le cas échéant souscription d'une solution de visioconférence, captation de l'image de la prestation de l'Intervenant en studio).</p>
<p class="mt-2"><strong>3.4 Relations entre les Parties</strong></p>
<p class="mt-1"><strong>Rendez-vous tripartite :</strong> Les modalités précises de la Prestation seront définies au moyen d'un rendez-vous téléphonique d'une durée minimale de trente (30) minutes auquel les Parties s'engagent à participer ou à se faire représenter.</p>
<p class="mt-1"><strong>Loyauté :</strong> Chaque Partie s'engage à tenir informés ses cocontractants de tout changement ou difficulté pouvant impacter l'exécution du Contrat. Le Client et l'Intervenant s'engagent à toujours conserver Les Conférenciers en copie de leurs échanges électroniques. En cas de désaccord, les Parties s'engagent à faire leurs meilleurs efforts pour trouver une solution acceptable pour chacune d'entre elles. Chaque Partie s'interdit de porter atteinte - de quelque façon que ce soit - à l'image d'un de ses cocontractants.</p>
<p class="mt-1"><strong>Confidentialité :</strong> Les Parties s'engagent à ne pas porter atteinte à l'image des autres et s'interdisent de divulguer toutes les Informations confidentielles - sauf celles tombées dans le domaine public - à toute personne n'ayant pas besoin d'en être informées pour la bonne exécution du Contrat.</p>
<p class="mt-1"><strong>Exclusivité :</strong> Le client s'interdit de contacter l'intervenant directement ou indirectement, de quelque manière que ce soit, afin que ce dernier anime toute conférence organisée par le client pendant 3 (trois) ans à compter de la signature des présentes, et ce sauf par l'intermédiaire de l'Agence Les Conférenciers ou avec son consentement préalable et écrit.</p>`,
  },
  {
    key: "art4",
    title: "Article 4. DROIT À L'IMAGE ET DROIT D'AUTEUR",
    defaultHtml: `<p><strong>4.1.</strong> En contrepartie de la rémunération visée à l'article 5 des présentes, l'Intervenant accepte de communiquer au public et exposer de manière orale sa conférence lors du jour de la manifestation. Le Client reconnaît que le Contrat ne lui confère aucun droit de propriété intellectuelle sur les documents réalisés par l'Intervenant à l'occasion de l'exécution du Contrat. Inversement, les éventuels documents confiés à l'Intervenant par le Client demeurent la propriété de ce dernier.</p>
<p class="mt-1"><strong>4.2 Avant l'Évènement :</strong> L'Intervenant s'engage à communiquer à ses cocontractants une photographie le représentant afin qu'ils puissent communiquer à propos de leur collaboration sur tout support validé par écrit par l'Intervenant pendant les deux (2) mois qui précèdent l'Événement. L'Intervenant garantit à ses cocontractants que la photographie, comme les documents transmis par lui, ne sont protégés par aucun droit de propriété intellectuelle détenus par des tiers sauf à justifier, à première demande, qu'il a obtenu l'accord desdits tiers.</p>
<p class="mt-1"><strong>4.3 Pendant l'Évènement :</strong> L'autorisation de l'intervenant à capter son Image par tout moyen, notamment par l'intermédiaire d'un tiers mandaté, de façon à diffuser les images en direct le jour de l'Événement (soit dans la salle où se déroule l'Événement physique soit sur la plateforme où est diffusée l'Événement digital) et l'accord pour diffusion en direct ou en différé des images captées sur les réseaux sociaux du Client devront être mentionnés dans les conditions particulières du Bon de commande. A défaut d'accord, aucune captation ne pourra être réalisée.</p>
<p class="mt-1"><strong>4.4 Après l'Événement</strong></p>
<p class="mt-1"><strong>Usage interne :</strong> Le Client pourra conserver des extraits de la captation qu'il a réalisé lors de l'Événement. Ces extraits, au nombre maximum de quatre (4) ne pourront excéder une durée de 1 minute 30 chacun. Le Client pourra faire usage de ces extraits pour une durée maximale de trois mois uniquement sur le réseau interne de son entreprise, lequel est accessible strictement à ses employés ou adhérents. La diffusion de ces extraits devra au préalable être soumise à l'approbation de l'intervenant. L'Intervenant et le Client autorisent Les Conférenciers à faire usage de l'un de ces extraits pour présenter le travail de l'Intervenant auprès de ses prospects.</p>`,
  },
  {
    key: "art5",
    title: "Article 5. MODALITÉS FINANCIÈRES",
    defaultHtml: `{{PRICE_CLAUSE}}
<p class="mt-1"><strong>5.2 Frais de déplacement et hébergement.</strong> Les Conférenciers prendra en charge la réservation des moyens de transport nécessaires à l'intervention de l'Intervenant. Les Conférenciers facturera les frais avancés au Client - sur présentation de justificatif à l'ordre des Conférenciers ou de l'Intervenant.</p>`,
  },
  {
    key: "art6",
    title: "Article 6. DURÉE DU CONTRAT",
    defaultHtml: `<p>Le Contrat entre en vigueur à la date de sa signature et jusqu'au mois qui suit l'extinction des obligations des articles 3, 4 et 5. Les obligations de confidentialité, de loyauté et celles identifiées aux articles 10 et 11 survivront au Contrat.</p>`,
  },
  {
    key: "art7",
    title: "Article 7. MODIFICATION DES PRESTATIONS",
    defaultHtml: `<p><strong>7.1 Modification :</strong> Les Parties pourront modifier - d'un commun accord écrit (ex : email validé par tous les cocontractants) - les Prestations initialement convenues et ce jusqu'à sept (7) jours ouvrables avant l'Événement.</p>
<p class="mt-1"><strong>7.2 Suspension :</strong> Dans le cas où l'exécution du Contrat par l'une des Parties deviendrait impossible en raison d'un événement de Force majeure (article 8), l'exécution du Contrat serait suspendue jusqu'à cessation de l'impossibilité. Si l'événement de Force majeure perdurait plus de trente (30) jours, le Contrat serait résilié conformément à l'article 7.4.</p>
<p class="mt-1"><strong>7.3 Annulation</strong></p>
<p class="mt-1">En cas d'annulation des prestations les pénalités suivantes s'appliqueront :</p>
<p class="mt-1"><strong>Annulation par le Client :</strong></p>
<ul class="list-disc pl-5 mt-1">
  <li>À plus de 30 jours de l'Évènement : 50% du montant de la prestation</li>
  <li>Entre 30 et le jour de l'Évènement : 100% du montant de la prestation</li>
</ul>
<p class="mt-1">En cas d'annulation de la Prestation par l'Intervenant, Les Conférenciers s'engage à proposer au Client des profils susceptibles de se substituer à l'Intervenant dans des conditions identiques.</p>
<p class="mt-1"><strong>7.4 Résiliation :</strong> En cas de manquement de l'une des Parties à ses obligations, la Partie défaillante aura trente (30) jours après une mise en demeure restée sans effet pour y remédier. Dans l'hypothèse où la Partie défaillante ne pourrait trouver de solution positive dans le délai indiqué, le Contrat pourra être résilié de plein droit et la Partie défaillante ne pourrait prétendre à aucune indemnité. Les autres Parties pourront toutefois prétendre à des dommages-intérêts.</p>`,
  },
  {
    key: "art8",
    title: "Article 8. FORCE MAJEURE",
    defaultHtml: `<p>Chacune des Parties sera exonérée de toute responsabilité en cas de manquement total ou partiel même temporaire à l'une ou l'autre de ses obligations découlant du Contrat, qui serait causé par un cas de Force majeure. Cette dernière est définie comme un événement à caractère imprévisible et irrésistible, résultant d'un fait extérieur à la maîtrise des Parties, lequel consiste en un événement ou une série d'événements de nature climatique, pandémique, bactériologique, militaire, politique ou diplomatique.</p>
<p class="mt-1">Constituent notamment des événements de Force majeure, sans que cette liste soit exhaustive : les tornades et ouragans, l'utilisation par un Etat ou un groupe terroriste d'armes de toute nature perturbant la continuité des relations commerciales, la propagation d'un virus obligeant l'Autorité administrative interdisant les rassemblements ; le maintien partiel ou total du confinement ou de l'état d'urgence sanitaire pour une période cumulée totale décrétée postérieurement à la signature du Contrat et pour une durée de plus de trois mois. Les événements ci-dessus pouvant avoir lieu sur tout territoire national sur lequel l'Événement ou la captation de l'image de l'Intervenant doit avoir lieu.</p>
<p class="mt-1">En cas de survenance d'une situation qu'elle considère comme un cas de Force majeure, la Partie concernée notifie promptement les autres de la situation par mail - doublé d'une lettre recommandée avec avis de réception - en précisant la nature du ou des événements visés, leur impact sur sa capacité à remplir ses obligations telles que prévues au Contrat ainsi que tout document justificatif attestant de la réalité du cas de Force majeure (ex : déclaration, attestation, législation, décret, arrêté ou autres mesures prises par une personne morale de droit public au niveau local ou national ou international concernant les événements invoqués comme situations de Force majeure).</p>
<p class="mt-1">Dans l'hypothèse où la Partie invoquant une situation de Force majeure parviendrait à la caractériser, ses obligations seront suspendues pour un délai de quatre semaines. Toute suspension d'exécution du Contrat par application du présent article sera strictement limitée aux engagements dont les circonstances de Force majeure auront empêché l'exécution et à la période durant laquelle les circonstances de force majeure auront agi. En tout état de cause, les Parties s'efforceront de bonne foi de prendre toutes mesures raisonnablement possibles en vue de poursuivre l'exécution des prestations. Passé le délai de suspension des obligations, si la situation de Force majeure se poursuit, le contrat sera résolu de plein droit.</p>`,
  },
  {
    key: "art9",
    title: "Article 9. IMPRÉVISION",
    defaultHtml: `<p>Chacune des Parties est tenue d'exécuter ses obligations contractuelles même si un ou plusieurs événements rendent leur exécution plus onéreuse que ce qui pouvait raisonnablement être prévu au moment de la conclusion du Contrat. Cependant, lorsqu'une Partie prouve, en application des dispositions de l'article 1195 du code civil, que l'exécution de ses obligations contractuelles est devenue excessivement onéreuse en raison d'un événement indépendant de sa volonté et dont elle ne pouvait raisonnablement attendre qu'il soit pris en compte au moment de la conclusion du Contrat, étant précisé que la survenance dudit événement doit représenter une variation de plus de trente pourcent (30%) du prix, et qu'elle ne pouvait raisonnablement éviter ou surmonter ledit événement ou ses conséquences, ladite Partie peut demander une renégociation du Contrat.</p>
<p class="mt-1">En l'espèce, les parties reconnaissent que le prix a été établi en tenant compte de la situation économique actuelle et de toutes les contraintes, financières comme logistiques connues à ce jour. Ainsi, tout événement nouveau venant affecter le prix remplira les conditions prévues au sein du présent article. Dans cette hypothèse, les Parties s'engagent à organiser une tentative préalable et obligatoire de conciliation d'une durée de dix (10) jours, s'interdisant tout refus de renégociation, dès le lendemain de la notification par la Partie concernée de la survenance de l'événement rendant l'exécution de ses obligations contractuelles excessivement onéreuse au sens du paragraphe précédent.</p>
<p class="mt-1">En cas de succès de la renégociation, les Parties établiront sans délai un avenant au présent Contrat formalisant le résultat de cette renégociation. En cas d'échec de la renégociation, les Parties pourront, conformément aux dispositions de l'article 1195 du code civil, mettre fin au Contrat aux conditions du Contrat (article 7) ou demander d'un commun accord au juge de procéder à son adaptation.</p>
<p class="mt-1"><strong>COVID 19 :</strong> Chacune des Parties se réserve par ailleurs le droit de résilier le Contrat en envoyant aux autres un email doublé d'un courrier recommandé avec accusé de réception en cas :</p>
<ul class="list-disc pl-5 mt-1">
  <li>de Covid-19 avéré par certificat médical chez l'Intervenant, cela rendant l'exécution de la Prestation impossible</li>
  <li>en cas d'interdiction administrative empêchant la tenue de l'Événement pour raisons sanitaires</li>
</ul>
<p class="mt-1">Dans cette hypothèse le Contrat serait suspendu conformément aux stipulations de l'article 7.2.</p>`,
  },
  {
    key: "art10",
    title: "Article 10. OBLIGATIONS LÉGALES - RESPONSABILITÉS",
    defaultHtml: `<p><strong>Déclarations administratives :</strong> Chaque Partie demeure responsable des obligations légales, sociales et fiscales (ex : collecte de la TVA) qui lui incombent après conclusion du Contrat.</p>
<p class="mt-1"><strong>Données personnelles :</strong> Les Parties s'engagent, dans le cadre de leurs activités et conformément à la législation en vigueur en France et en Europe, à assurer la protection, la confidentialité et la sécurité des données à caractère personnel collectées auprès des cocontractants (ex : nom, prénom, profession, mail, téléphone, éléments biographiques...).</p>
<p class="mt-1"><strong>Recours à un tiers :</strong> Si une Partie fait appel à un de ses subordonnés ou à un prestataire pour exécuter une part des obligations qui lui incombent, ce tiers demeure sous l'autorité, la direction et la surveillance exclusive de la Partie qui l'a recruté. Ce tiers ne pourrait être considéré comme le salarié d'une autre Partie au Contrat.</p>
<p class="mt-1"><strong>Ordre public :</strong> Dans l'hypothèse où l'image de l'une des Parties serait associée à un comportement allant à l'encontre de l'ordre public (ex : implication dans affaires judiciaires médiatiques), le Contrat serait réputé annulé par la Partie associée à ce type de comportement et les stipulations de l'article 7 trouveraient à s'appliquer.</p>`,
  },
  {
    key: "art11",
    title: "Article 11. DIVERS",
    defaultHtml: `<p><strong>Capacité :</strong> Chaque Partie certifie avoir la capacité d'agir au Contrat et connaître la portée des engagements souscrits. Les Parties reconnaissent la force probante de la signature électronique, laquelle permet d'identifier les signataires via les adresses mails communiquées par chaque Partie. Chaque Partie recevra un exemplaire du Contrat signé et s'engage à conserver ce dernier.</p>
<p class="mt-1"><strong>Indépendance des Parties :</strong> Aucune stipulation du Contrat ne pourra être interprétée comme un lien de subordination, une relation d'agent ou de salariat. Sans cette indépendance des Parties, ces dernières n'auraient pas contracté.</p>
<p class="mt-1"><strong>Cession - Transfert :</strong> Le Contrat est conclu intuitu personae. Le Client et l'Intervenant s'interdisent de transférer une de leurs obligations ou le Contrat dans sa totalité sans l'accord écrit des Parties. Dans l'hypothèse d'un changement de contrôle des Conférenciers - tel que défini à l'article L233-3 du Code de commerce - ce dernier serait notifié à ses cocontractants, lesquels autorisent Les Conférenciers à céder le Contrat.</p>
<p class="mt-1"><strong>Nullité d'une clause du Contrat :</strong> Dans l'hypothèse où une des stipulations du Contrat serait nulle, cela n'entraînerait pas la nullité de l'ensemble des stipulations du Contrat qui continueraient à s'appliquer.</p>
<p class="mt-1"><strong>Droit applicable :</strong> Le Contrat est soumis à la loi française. Toutes difficultés relatives à la validité, l'application ou à l'interprétation du Contrat seront soumises, à défaut d'accord amiable, au Tribunal de Grande Instance de la ville de Paris, auxquels les parties attribuent compétence territoriale, quel que soit le lieu d'exécution ou le domicile du défendeur. Cette attribution de compétence s'applique également en cas de procédure en référé ou de pluralité de défendeurs.</p>`,
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
