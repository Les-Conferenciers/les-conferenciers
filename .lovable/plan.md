## Promesse à tenir

Pour chaque mail (proposition, lead, contrat, facture) :
1. Tu édites le template dans l'onglet Emails → il devient la **source de vérité**.
2. Quand tu ouvres la fenêtre de composition, le champ sujet + corps est **pré-rempli** avec le template (variables résolues avec les vraies données : prénom, conférencier, date, etc.).
3. Tu peux **toujours personnaliser** ce texte avant l'envoi — la modif ne touche pas le template global, c'est juste pour cet envoi.
4. Si tu rouvres une proposition déjà créée, c'est ton texte personnalisé qui s'affiche (déjà sauvegardé sur la proposition).

Comportement = **template = valeur par défaut intelligente**, jamais une cage.

## Architecture

Nouveau hook front `useEmailTemplates()` :
- Charge tous les templates une fois (`select * from email_templates`)
- Expose `renderTemplate(key, vars)` qui retourne `{ subject, body }` avec variables résolues
- Cache en mémoire, refetch quand on revient sur l'onglet

Helper Deno partagé `supabase/functions/_shared/load-template.ts` (même logique côté serveur, déjà fait pour les relances).

## Branchements à faire

### A. Compose proposition (`src/pages/Admin.tsx`)
Remplacer les 4 fonctions hardcodées par des appels au hook :
- `getDefaultEmailSubject` → `renderTemplate('proposal_classic', vars).subject`
- `getDefaultEmailBody` → `renderTemplate('proposal_classic', vars).body`
- `getUniqueEmailBody` → `renderTemplate('proposal_unique', vars).body`
- `getInfoEmailBody` → `renderTemplate('proposal_info', vars).body`

Variables passées : `prenom_destinataire`, `nom_client`, `date_evenement`, `lieu_evenement`, `auditoire`, `conferencier`, `tarif_conferencier`, `url_proposition`, `agent_nom`, `agent_telephone`.

**Garanties** :
- L'éditeur de sujet/corps existant reste tel quel → tu modifies librement avant envoi
- Le bouton « Réinitialiser au template » (à ajouter) recharge depuis le template courant
- Les propositions déjà créées avec `email_body` rempli → on continue à afficher leur version (pas de régression)

### B. Lead confirmation (`send-contact-email`)
Lecture serveur du template `lead_confirmation` avant envoi. Fallback texte hardcodé si template désactivé. Pas d'édition manuelle (envoi automatique).

### C. Compose contrat client (`ContractInvoiceManager.tsx` / `ContractPipeline.tsx`)
- Trouver où le champ `email_subject`/`email_body` est pré-rempli avant envoi du BDC
- Pré-remplir depuis template `contract_to_client` avec variables `numero_bdc`, `prenom_destinataire`, `nom_client`, etc.
- Édition manuelle conservée

### D. Compose facture (`ContractInvoiceManager.tsx`)
- Pré-remplir depuis template `invoice_to_client` avec `numero_facture`, `montant_ttc`, etc.
- Édition manuelle conservée

### E. Communication conférencier
À identifier avec toi : il existe l'envoi du **contrat agence** au conférencier (`send-contract-email` ou variante ?). Je vérifie pendant l'implémentation et j'ajoute un template `contract_to_speaker` si pertinent.

## Ajouts UX dans la fenêtre de composition

Petit bouton **« 🔄 Recharger le template »** à côté du sujet → si tu as personnalisé puis tu veux repartir du template à jour, un clic suffit. Sinon tes modifs persistent.

## Vérifications de non-régression

- Propositions existantes : `email_body` déjà sauvegardé → continue d'être utilisé tel quel ✅
- Si template désactivé (`is_active=false`) : fallback sur le texte hardcodé actuel (sécurité) ✅
- Variables manquantes : on garde `{{var}}` visible pour que tu remarques (pas de chaîne vide silencieuse)

## Hors scope

- Pas de versionnage / historique des modifs de template
- Pas de modification du HTML d'enrobage (header sombre, signature image)
- Pas de duplication de templates (1 template par type)

## Questions

1. **Bouton "Recharger le template"** dans la fenêtre de composition : OK / pas utile ?
2. **Communication conférencier** : tu vises quels mails précisément ? (envoi contrat, demande de bio, relance signature, autre ?)
