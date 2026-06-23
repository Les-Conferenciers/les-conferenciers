## Plan

Corriger la popup **Éditer la proposition** qui reste coupée sur desktop en mode édition.

### Problème identifié
La capture montre un **débordement horizontal** : la colonne de droite du formulaire sort de la popup. Le précédent correctif a surtout traité la hauteur et le scroll vertical, mais le formulaire interne garde encore des éléments en `grid-cols-2` et des contenus sans `min-w-0`, ce qui pousse la largeur réelle au-delà du conteneur.

### Changements prévus
1. **Rendre le contenu réellement contraint en largeur**
   - Ajouter `w-full max-w-full min-w-0` sur le corps scrollable, le wrapper principal et le `fieldset`.
   - Empêcher tout enfant de forcer une largeur supérieure à celle de la popup.

2. **Corriger les grilles de champs**
   - Remplacer les grilles fixes `grid-cols-2` par `grid-cols-1 md:grid-cols-2` ou `grid-cols-1 sm:grid-cols-2` selon l'espace disponible.
   - Ajouter `min-w-0` sur chaque cellule de grille et sur les champs sensibles.

3. **Neutraliser le composant qui déborde dans la section conférencier/tarifs**
   - Ajuster la sortie de `renderSpeakerSelectionEditor` pour que les lignes conférencier + frais restent dans la popup.
   - Passer les zones tarif/frais en grille responsive et empêcher les labels longs de pousser horizontalement.

4. **Garder le comportement desktop propre**
   - La popup restera centrée et large comme avant sur PC.
   - Le scroll restera vertical interne.
   - Aucun scroll horizontal ne doit apparaître dans la popup.

5. **Vérification**
   - Tester au viewport actuel `1139x779`.
   - Confirmer que le champ email, la colonne frais et les boutons ne sont plus coupés en mode édition.