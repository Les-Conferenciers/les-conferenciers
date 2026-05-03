## Objectif

Dans l'onglet **Propositions → sous-onglet "Envoyées"**, regrouper les propositions partageant le même `client_id` CRM, et permettre de créer une nouvelle proposition pré-remplie pour un client existant après son retour (changement de speaker, prix, lieu, etc.).

## Comportement attendu

### 1. Regroupement par client (sous-onglet "Envoyées" uniquement)

- Les propositions ayant le **même `client_id`** sont regroupées en une **ligne accordéon** (style cohérent avec l'accordéon déjà utilisé pour les détails post-acceptation).
- Les propositions **sans `client_id`** restent affichées en lignes individuelles (pas de regroupement par email — décision validée).
- L'en-tête de groupe affiche :
  - Nom du client CRM (`company_name` + `contact_name` si dispo)
  - Compteur : "N propositions"
  - Date de la dernière proposition
  - Statut le plus avancé (ex : si une est `accepted`, badge "Accepté" prioritaire ; sinon le statut de la dernière)
  - Bouton **"Nouvelle proposition"** (icône Plus)
- Au déploiement de l'accordéon : on voit toutes les propositions du client, **triées par date décroissante**, avec les mêmes lignes/actions qu'aujourd'hui (envoyer, dupliquer, relance, accepter, voir, etc.).
- Tri global du sous-onglet : par **date de la proposition la plus récente** de chaque groupe (respecte le toggle `dateSortAsc` existant).
- La recherche (`proposalSearch`) et le filtre type continuent de fonctionner : un groupe est visible si **au moins une** de ses propositions matche.
- Pagination (`pageSize`) : compte les **groupes** (et les propositions orphelines sans client_id) plutôt que les lignes individuelles.

Les sous-onglets **Brouillons** et **Archivées** restent en liste plate inchangée.

### 2. Bouton "Nouvelle proposition" sur un groupe client

Au clic sur le bouton dans l'en-tête d'un groupe :

- Ouverture de la **modale de création** existante (`setDialogOpen(true)`).
- Pré-remplissage automatique à partir de la proposition la plus récente du client :
  - Mode client = `"search"` avec `selectedClientId` = client_id du groupe → infos client (nom, email, téléphone, interlocuteur) chargées depuis la fiche CRM
  - **Lieu** (`event_location`), **date texte** (`event_date_text`), **taille auditoire** (`audience_size`) repris de la dernière proposition (modifiables)
  - **Type de proposition** (`proposal_type`) repris de la dernière (modifiable)
  - **Speakers** : non recopiés par défaut (le client veut souvent changer) — l'utilisateur sélectionne fraîchement. Sinon il peut s'appuyer sur les modèles ou refaire sa sélection.
  - **Message interne** et **email** : valeurs par défaut (regénérées comme pour une nouvelle proposition)
- L'utilisateur ajuste librement (speakers, prix, lieu…) puis envoie comme une proposition normale.

### 3. Effets de bord à préserver

- L'avertissement "Email déjà connu" reste actif (utile pour visualiser l'historique côté UI).
- Le pipeline post-acceptation et les tâches de relance fonctionnent toujours par proposition individuelle.
- Aucun changement de schéma DB.

## Détails techniques

**Fichier modifié :** `src/pages/Admin.tsx` (composant `AdminProposalsContent`).

### Construction des groupes

Dans le rendu du sous-onglet `sent` uniquement :

```ts
type SentGroup =
  | { kind: "group"; clientId: string; clientLabel: string; items: Proposal[] }
  | { kind: "single"; proposal: Proposal };

// 1. Séparer ceux avec client_id et sans
// 2. Regrouper par client_id, label = allClients.find(...).company_name (+ contact_name)
// 3. Trier les items du groupe par created_at desc
// 4. Construire un tableau ordonné selon date la plus récente de chaque entrée
// 5. Appliquer recherche/filtre type AVANT regroupement, ou filtrer les groupes après
```

### Rendu

- Réutilise `renderProposalRow(p, "sent")` à l'intérieur de l'accordéon (zéro régression sur les actions par ligne).
- En-tête d'accordéon : composant local inline avec `Collapsible` (déjà importé via shadcn) ou un simple `useState` `expandedGroupId`.
- Bouton "Nouvelle proposition" appelle un nouveau handler `handleNewProposalForClient(clientId, latestProposal)` qui :
  - `resetForm()`
  - `setClientMode("search")` + `setSelectedClientId(clientId)`
  - charge le client depuis `allClients`, set `setClientName/Email/Phone/RecipientName`
  - copie `event_location/event_date_text/audience_size/proposal_type` depuis `latestProposal`
  - `setDialogOpen(true)`

### Pagination

Remplacer `items.slice(0, pageSize)` par un slice sur le tableau d'entrées groupées pour le sous-onglet `sent`. Drafts et archived inchangés.

## Hors périmètre

- Pas de regroupement dans Brouillons ni Archivées.
- Pas de fusion de propositions ni de lien "version de" persistant en DB.
- Pas de duplication automatique de la sélection de speakers (l'objectif est justement d'en changer).
- Pas de regroupement pour les propositions sans client_id (orphelines en lignes plates).
