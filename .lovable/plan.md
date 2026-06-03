## Problème

Quand une proposition est remplacée par une nouvelle version (chaîne `previous_proposal_id`), l'ancienne reste avec `status='sent'`. Résultat : la v1 de Groupama affiche encore « En attente / 74j restants / R1: 08 juin / Remplacée » et conserve plusieurs actions (Copier, Éditer, lien externe, PDF, Archiver).

Comportement attendu (identique à Davido Consulting, archivée explicitement) :
- **Colonne Statut** : un seul badge gris « Archivée vX » (X = numéro de version de cette ligne).
- **Colonne Actions** : uniquement l'œil (détails archive).

## Modifications — `src/pages/Admin.tsx`

`renderProposalRow` (lignes ~2774–3092). `isSuperseded` est déjà calculé ligne 2779.

### 1. Cellule Statut (lignes 2895–2953)

- Condition du bloc « En attente / restants / relances / tâches » (ligne 2899) : ajouter `&& !isSuperseded` pour que les anciennes versions ne l'affichent plus.
- Condition du bloc « Archivée / Remplacée » (ligne 2935) : déjà déclenché si `isSuperseded`. Le simplifier pour afficher systématiquement `Archivée vX` (au lieu de `Remplacée vX`) — c'est le wording demandé.

### 2. Cellule Actions (lignes 2954–3091)

Pour une ligne `isSuperseded` (status reste `sent`), masquer tout sauf l'œil « Voir détails » :

- Bouton Eye (ligne 2966) : élargir la condition à `mode === "sent" && (p.status === "archived" || isSuperseded)`.
- Bouton Copier (2976), Lien externe (2980), PDF (2985), Éditer (3000) : ajouter `&& !isSuperseded` à leurs conditions d'affichage.
- Boutons Relances / Accepter / Mettre à jour / Archiver : déjà gardés par `!isSuperseded`, rien à faire.

### 3. Vérifier le panneau de détails archive

`setArchiveDetailsId` (utilisé ligne 2970) doit accepter une proposition « superseded mais non archivée ». Vérifier rapidement le rendu du dialog d'archive (`archiveDetailsId`) pour s'assurer qu'il ne se base pas sur `status === 'archived'` pour ouvrir le contenu ; sinon assouplir la condition.

## Hors scope

- Pas de changement de statut en base : on garde `status='sent'` pour ne pas casser l'historique ni la vue publique du lien.
- Pas de modification de la table archivée séparée (lignes 3415+) ni du flow d'envoi/acceptation.
- Pas de changement sur la vue client (`ProposalView`).
