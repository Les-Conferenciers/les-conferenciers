## Plan — Feuille de liaison : enregistrement + bug de saisie

### 1. Bouton "Enregistrer" dans la modale "Modifier" (EventDossier)

Dans `src/components/admin/EventDossier.tsx`, à côté du bouton "Aperçu de la feuille" (ligne ~2115), ajouter un bouton **"Enregistrer les modifications"** qui :
- appelle `persistLiaisonFields()` (fonction déjà existante qui sauvegarde date / lieu / horaires / auditoire / thématique / arrivée / besoins / commentaires en base) ;
- affiche un toast de confirmation ;
- ne ferme pas la modale et ne déclenche pas l'envoi de mail.

Layout : aligner les deux boutons (Enregistrer + Aperçu) à droite du bloc "Champs de la feuille de liaison".

### 2. Bug de saisie "lettre par lettre" sur la page "Voir" (LiaisonSheetView)

**Cause identifiée :** dans `src/pages/LiaisonSheetView.tsx` (lignes 112-138), les composants `Field` et `TextArea` sont déclarés **à l'intérieur** du composant `LiaisonSheetView`. À chaque frappe, React voit une nouvelle référence de composant, démonte et remonte l'`<input>`, ce qui fait perdre le focus → l'utilisateur doit cliquer entre chaque caractère.

**Correctif :** extraire `Field` et `TextArea` **hors** du composant `LiaisonSheetView` (au niveau module, ou les remplacer par du JSX inline). Passer `editing` en prop. Les states et `onChange` restent inchangés. La fonction `handleSave` (déjà présente, déclenchée par le bouton "Enregistrer" en mode édition) continuera de fonctionner — aucune modification de la logique de sauvegarde.

### Hors scope
- Pas de changement du schéma DB.
- Pas de modification du contenu envoyé par mail ni du PDF.
- Pas de modification du bouton "Modifier / Enregistrer / Annuler" déjà présent en haut de la page Voir (il fonctionnera correctement une fois le bug de focus corrigé).

### Fichiers touchés
- `src/components/admin/EventDossier.tsx` — ajout d'un bouton "Enregistrer" dans le bloc liaison.
- `src/pages/LiaisonSheetView.tsx` — extraction de `Field` / `TextArea` hors du composant.
