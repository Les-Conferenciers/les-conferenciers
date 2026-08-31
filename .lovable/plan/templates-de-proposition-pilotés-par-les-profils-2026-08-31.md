# Templates de proposition pilotés par les profils

Objectif : supprimer les templates figés et utiliser les profils du sous-onglet « Profils » comme unique source de regroupement des conférenciers lors de la création d'une proposition.

## Ce qui change

1. Le sélecteur « 📁 Appliquer un template » devient « 🗂️ Filtrer par profil ».
   - Liste des profils existants (Anciens du GIGN et du RAID, Artistes, Astronautes, Aventuriers / Explorateurs, Chefs cuisiniers, Chefs d'entreprise, Économistes, Expert, Experts IA, Journalistes, Médecins, Militaires, Navigateurs, Philosophes, Rugbymen, Scientifiques, Sportifs de haut niveau), avec le nombre de conférenciers actifs.
   - Sélectionner un profil filtre la liste de recherche des conférenciers ; aucune sélection automatique. Le choix des 3 conférenciers reste manuel.
   - Option « — Tous les profils — » pour revenir à la sélection libre.
2. Suppression des 5 templates actuels (Chefs d'orchestre, Environnement, GIGN / RAID, Jeunes Générations, Patrouille de France) et de toute l'UI associée : sélecteur de template, bouton « Enregistrer comme template », suppression de template.
3. Les conférenciers déjà ajoutés à la proposition en cours ne sont pas affectés par le changement de filtre.

## Points à confirmer côté données

Les profils « Chefs d'orchestre », « Environnement », « Jeunes Générations » et « Patrouille de France » n'existent pas aujourd'hui dans la liste des profils. Ils pourront être créés à tout moment depuis le sous-onglet « Profils », puis les conférenciers y seront rattachés — aucune action de ma part n'est prévue dans ce lot.

## Détails techniques

- `src/pages/Admin.tsx` :
  - retirer l'état `templates`, `selectedTemplateId`, `applyTemplate`, le chargement de `proposal_templates` et le bloc UI du sélecteur de template ;
  - charger `speaker_profiles` (id, name, display_order) et ajouter `profile_id` au `select` des `speakers` ;
  - ajouter un état `profileFilter` appliqué au filtrage de la liste de conférenciers de la proposition (en plus de la recherche texte existante).
- `src/pages/AdminProposals.tsx` : retirer la lecture, la création et la suppression de `proposal_templates` ainsi que l'UI correspondante.
- Base de données : suppression des 5 lignes de `proposal_templates` (la table est conservée, vide, pour éviter toute rupture de typage).
- La phrase d'accroche de l'email qui dépendait du nom du template repasse sur le texte par défaut (le nom du profil n'est plus injecté).
