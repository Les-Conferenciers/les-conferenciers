## Objectif

Centraliser tous les templates email du site dans une interface d'admin éditable, avec documentation des déclencheurs et système de variables `{{prenom}}`, `{{conferencier}}`, `{{agent}}`, etc.

## 1. Inventaire des templates existants

Aujourd'hui chaque texte est **codé en dur dans une edge function**. À migrer vers une table éditable :

| Clé technique | Déclencheur | Edge function actuelle |
|---|---|---|
| `lead_confirmation` | Lead soumis via simulateur / formulaire contact | `send-contact-email` (partie client) |
| `lead_notification_admin` | Lead soumis → mail à Nelly | `send-contact-email` (partie interne) |
| `proposal_classic` | Envoi proposition multi-conférenciers | `send-proposal-email` (`defaultClassicBody`) |
| `proposal_unique` | Envoi proposition mono-conférencier | `send-proposal-email` (`defaultUniqueBody`) |
| `proposal_info` | Envoi demande d'infos complémentaires | `send-proposal-email` (`defaultInfoBody`) |
| `proposal_reminder_1_multi` | Relance J+7, proposition à plusieurs profils | `send-proposal-reminder` |
| `proposal_reminder_1_unique` | Relance J+7, proposition mono | idem |
| `proposal_reminder_2` | Relance J+15 | idem |
| `proposal_updated` | Mise à jour de proposition (nouvelle version envoyée) | `send-proposal-email` (à dériver) |
| `proposal_accepted_admin` | Notification interne à Nelly après acceptation client | `send-proposal-response` |
| `contract_to_client` | Envoi BDC au client | `send-contract-email` |
| `contract_signed_notification` | Notif interne après signature | (existant) |
| `invoice_to_client` | Envoi facture | `send-invoice-email` |
| `final_invoice` | Facture finale post-événement | idem |

## 2. Schéma de données

Nouvelle table `email_templates` :
- `key` (text, unique) — clé technique ex : `proposal_classic`
- `name` (text) — nom lisible ex : « Proposition classique »
- `category` (text) — `lead` / `proposal` / `reminder` / `contract` / `invoice` / `admin`
- `trigger_description` (text) — explication française du déclencheur (lecture seule UI)
- `subject` (text) — sujet éditable avec variables
- `body_html` (text) — corps éditable (rich text) avec variables
- `available_variables` (jsonb) — liste des variables disponibles pour ce template + description
- `is_active` (bool, default true) — si false → fallback sur le code en dur
- timestamps

Une migration de seed insère **tous les templates ci-dessus avec leur contenu actuel**, pour ne rien casser au déploiement.

## 3. Système de variables

Syntaxe `{{variable}}` (Mustache simple, résolue côté edge function avant envoi).

Variables disponibles par catégorie :
- **Toutes** : `{{prenom_destinataire}}`, `{{nom_destinataire}}`, `{{email_destinataire}}`, `{{nom_client}}` (société), `{{date_evenement}}`, `{{lieu_evenement}}`, `{{auditoire}}`
- **Proposition** : `{{conferencier}}` (mono), `{{tarif_conferencier}}`, `{{url_proposition}}`, `{{nb_jours_restants}}`
- **Relance** : `{{conferencier}}`, `{{numero_relance}}`
- **Contrat/Facture** : `{{numero_bdc}}`, `{{numero_facture}}`, `{{montant_ttc}}`
- **Agent** : `{{agent_nom}}`, `{{agent_telephone}}`, `{{agent_email}}` (Nelly Sabde par défaut, géré dans `companyConfig`)

Helper unique `renderTemplate(html, vars)` côté Deno + miroir TS côté admin pour la **preview en direct**.

## 4. Interface admin — `/admin` nouvel onglet "Emails"

Composant `AdminEmailTemplates.tsx` :
- Liste à gauche groupée par catégorie, badge "actif/inactif"
- Volet droit : 
  - Champ **Nom** (lecture seule)
  - Bloc **Déclencheur** (encart bleu, lecture seule) — explique quand le mail part
  - Input **Sujet** (avec autocomplete des variables)
  - **RichTextEditor** existant pour le corps (toolbar variables : clic = insert `{{var}}` au curseur)
  - Panneau **Variables disponibles** (chips cliquables avec description au hover)
  - Bouton **Aperçu** → modal avec rendu HTML + valeurs d'exemple (depuis `available_variables.example`)
  - Bouton **Réinitialiser** → restaure le contenu d'origine depuis `default_subject`/`default_body_html` (colonnes en lecture seule sur la table)
  - Boutons **Enregistrer** / **Activer/Désactiver**

## 5. Refacto des edge functions

Pour chaque fonction listée § 1, helper partagé `supabase/functions/_shared/email-template.ts` :
```ts
export async function loadTemplate(key, vars): Promise<{subject, html}>
```
Charge depuis `email_templates` → si `is_active && body_html` → rend avec variables. Sinon → bascule sur le contenu hardcodé existant (sécurité).

Modifications minimales dans chaque function : remplacer `defaultXxxBody`/`emailSubject` par `await loadTemplate('proposal_classic', { ... })`.

## 6. Sécurité

- RLS : `SELECT/UPDATE` réservé `authenticated`, pas d'`anon`.
- `service_role` plein accès (lecture par edge functions).
- Pas de `DELETE` exposé (seuils techniques figés).

## Hors scope

- Pas de versionnage / historique des modifs (peut être ajouté plus tard).
- Pas de A/B testing.
- Pas de modification du HTML wrapper (header sombre + signature image) — reste dans les edge functions, seul le **corps** est éditable.
- Mails déjà partis non affectés.

## Questions avant implémentation

1. **Préview** : tu veux pouvoir choisir une proposition / un lead réel comme source de variables pour la preview, ou des valeurs d'exemple statiques suffisent ?
2. **Réinitialisation** : OK de garder le contenu d'origine figé en base (colonne `default_body_html`) pour pouvoir revenir en arrière à tout moment ?
3. **Variable agent** : aujourd'hui Nelly est seule signataire — je code `{{agent_*}}` comme constante issue de `companyConfig`, ou tu prévois plusieurs agents à terme (auquel cas il faut une table `agents`) ?
