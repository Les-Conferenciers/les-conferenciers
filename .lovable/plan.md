## Modifications dans la feuille de liaison

Fichier : `src/pages/LiaisonSheetView.tsx`

### 1. Harmonisation du titre
Renommer la section « Besoins techniques : » en **« Besoins logistiques : »** (ligne 236). Mettre à jour aussi le label admin du champ texte (ligne 240) pour rester cohérent. Le titre de la section dans `EventDossier.tsx` est déjà « Besoins logistiques », rien à changer côté admin.

### 2. Affichage en liste : un élément par ligne
Le champ `eventTechNeeds` (saisi en texte libre type « Vidéoprojecteur, micro ») est aujourd'hui rendu sur une seule ligne. Le scinder en plusieurs `<li>` :
- Split sur virgules **et** retours à la ligne (`/[,\n]+/`), trim, filtrer les vides.
- Générer un `<li>` par entrée.
- Idem pour `eventRoomSetup` si plusieurs items.
- Le fallback (quand rien n'est saisi) reste : « Vidéoprojecteur » + « Salle installée en largeur… ».

Aucune modification BDD, aucune autre section touchée.
