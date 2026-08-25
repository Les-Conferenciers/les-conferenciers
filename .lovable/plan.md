# Catégories internes du CRM conférenciers

Objectif : remplacer le champ libre « Catégorie interne » par une liste de catégories gérée par toi, avec « Expert » disponible dès le départ, et la possibilité d'ajouter/renommer/supprimer tes propres catégories.

## Ce qui change

1. **Liste déroulante au lieu du champ libre**
   Dans la fiche conférencier (CRM), la catégorie interne devient un menu déroulant listant tes catégories, avec une option « + Nouvelle catégorie… » qui permet d'en créer une à la volée sans quitter la fiche.

2. **Catégories de départ**
   « Expert » est créée d'office. Les valeurs déjà saisies et cohérentes (ex. « Sportif ») sont reprises comme catégories existantes. Deux fiches contiennent par erreur des URL dans ce champ (liens YouTube / Google Slides) : elles seront vidées et ne deviendront pas des catégories.

3. **Gestion des catégories**
   Un petit gestionnaire (accessible depuis le champ catégorie) permet d'ajouter, renommer et supprimer une catégorie. Renommer met à jour les conférenciers concernés ; supprimer laisse les conférenciers sans catégorie.

4. **Filtre dans la liste CRM**
   Un filtre « Catégorie » s'ajoute à la barre de filtres existante pour afficher uniquement les conférenciers d'une catégorie donnée.

La catégorie reste strictement interne : rien n'est affiché côté site public.

## Détails techniques

- Nouvelle table `speaker_categories` (`name` unique, `display_order`), avec GRANT + RLS : lecture publique, écriture réservée aux utilisateurs authentifiés (même schéma d'accès que les autres tables d'admin du projet).
- Seed : `Expert` + valeurs distinctes valides de `speakers.internal_category`.
- Nettoyage des 2 valeurs URL dans `speakers.internal_category` (mise à `null`).
- `speakers.internal_category` reste une colonne texte (pas de contrainte FK), pour éviter toute rupture des données existantes.
- `src/components/admin/AdminSpeakersCRM.tsx` : chargement des catégories, `Select` dans le dialog d'édition, dialog de création/gestion, filtre catégorie dans la barre de filtres et dans `filteredSpeakers`.
