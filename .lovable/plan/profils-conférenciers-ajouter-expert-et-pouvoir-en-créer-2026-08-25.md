# Profils conférenciers : ajouter « Expert » et pouvoir en créer

Aujourd'hui les 16 profils (Astronautes, Experts IA, Rugbymen…) existent uniquement en base : l'admin permet de les éditer et d'y affecter des conférenciers, mais pas d'en créer ni d'en supprimer. Il n'y a pas de profil « Expert ».

## Ce qui change

1. **Profil « Expert »**
   Création du profil « Expert » (libellé landing « Conférenciers experts », page landing désactivée par défaut), immédiatement sélectionnable dans le CRM.

2. **Créer un profil depuis l'admin**
   Bouton « + Nouveau profil » dans l'onglet Profils : tu saisis le nom (ex. « Coachs »), le reste est pré-rempli automatiquement — URL (slug) dérivée du nom, libellé landing « Conférenciers … », page landing désactivée tant que tu ne l'actives pas. Le profil apparaît aussitôt dans toutes les listes déroulantes.

3. **Renommer / supprimer**
   - Renommer un profil (nom + libellé landing) depuis la liste des profils.
   - Supprimer un profil : possible seulement s'il n'est rattaché à aucun conférencier, sinon un message indique combien de conférenciers doivent d'abord être réaffectés.
   - L'URL (slug) d'un profil existant n'est pas modifiable, pour ne pas casser le référencement des pages déjà en ligne.

4. **Profil modifiable sur une fiche conférencier**
   Actuellement le profil ne peut être choisi qu'à la création manuelle d'un conférencier. On ajoute le sélecteur « Profil » dans le dialog d'édition de la fiche, pour pouvoir le changer sans passer par l'onglet Profils.

## Détails techniques

- `speaker_profiles` : insertion de la ligne « Expert » (`slug: experts`, `landing_enabled: false`, `display_order` en fin de liste). Vérification préalable qu'aucun slug `experts` n'existe (les slugs actuels contiennent `experts-ia`).
- Vérification/ajout des règles d'accès en écriture (insert/delete) sur `speaker_profiles` pour les utilisateurs authentifiés, si absentes.
- `src/components/admin/AdminSpeakerProfiles.tsx` : dialog de création, actions renommer/supprimer avec garde-fou sur le nombre de conférenciers rattachés, rechargement de la liste après action.
- `src/components/admin/AdminSpeakersCRM.tsx` : ajout du champ `profile_id` dans le formulaire d'édition (chargement dans `editForm`, sélecteur, sauvegarde) — la liste `profiles` est déjà chargée dans ce composant.
