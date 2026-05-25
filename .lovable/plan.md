## Contrat — Auditoire et Thématique

### Problème
1. L'auditoire est bien stocké en base (123) mais l'affichage est brut ("123") sans la formulation "personnes attendues".
2. La thématique n'est pas saisissable dans la pop-up de création de contrat (`EventDossier` → "Créer le contrat"), donc elle reste vide.

### Modifications

**1. `src/components/admin/EventDossier.tsx` — pop-up création contrat**
- Ajouter un nouvel état `contractTheme` initialisé depuis `event?.theme || proposal.theme || ""` (comme pour `contractAudienceSize`).
- Ajouter un champ texte `Label "Thématique" / Input` juste sous la ligne "Taille de l'auditoire / N° Bon de commande".
- Persister `theme: contractTheme || null` dans l'`update`/`upsert` de la table `events` (à côté de `audience_size` ligne 676).

**2. `src/pages/ContractView.tsx` — affichage**
- Ligne 290-294 (Auditoire) : afficher `{event.audience_size} personnes attendues` quand la valeur est présente, sinon `—`. Le mode édition garde l'`input` actuel (saisie d'un nombre uniquement).
- Ligne 295-300 (Thématique) : déjà OK, l'édition existe. Masquer entièrement la ligne quand `!editing && !event?.theme` (pour ne rien afficher si vide, conformément à la demande "s'affichera dans le contrat s'il existe"). Idem côté Auditoire si vide.

**3. `src/pages/SpeakerContractView.tsx` — contrat conférencier**
- Ligne 109 : remplacer `environ {ev.audience_size}` par `{ev.audience_size} personnes attendues` pour cohérence.

### Hors scope
- Pas de migration : `events.theme` et `events.audience_size` existent déjà.
- Pas de modification du contrat conférencier au-delà de l'harmonisation du wording auditoire.
