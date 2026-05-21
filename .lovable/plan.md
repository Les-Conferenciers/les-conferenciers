## Ordre d'affichage des conférenciers — édition fluide

### Objectif
Dans le CRM Speakers, chaque conférencier reçoit un numéro d'ordre (1, 2, 3…) qui pilote la page publique `/conferenciers`. Quand on change un numéro (ex. Régis Rossi passe de 10 à 15), tous les autres se décalent automatiquement, sans doublon ni trou.

### Base existante
- La colonne `display_order` existe déjà sur `speakers` et trie déjà la page publique.
- Le champ est déjà éditable dans la fiche "Modifier", mais en mode "affectation libre" → doublons possibles, et changer 10→15 n'impacte personne d'autre.

### Changements

**1. Renumérotation initiale (one-shot SQL)**
Réattribuer 1, 2, 3, … à tous les conférenciers actifs selon l'ordre actuel (`display_order` asc, puis nom). Les archivés gardent `display_order = 999`. Base saine pour démarrer.

**2. Colonne "N°" dans la liste CRM**
Petit badge numéroté à gauche de chaque ligne (avant la photo) affichant le numéro courant.

**3. Édition "intelligente" du numéro (fiche Modifier)**
Le champ "Ordre d'affichage" existant garde son input numérique. À la sauvegarde, si l'ancien numéro = X et le nouveau = Y :
- Y < X → +1 sur tous les conférenciers actifs dont l'ordre est dans [Y, X-1].
- Y > X → −1 sur tous les conférenciers actifs dont l'ordre est dans [X+1, Y].
- Puis on assigne Y au conférencier modifié.

Résultat : pas de doublons, pas de trous, comportement type "drag & drop" via simple saisie.

**4. Flèches ↑ / ↓ en hover sur chaque ligne**
Deux petites flèches visibles au survol (à côté des boutons Archiver/Modifier) qui font ±1 via swap avec le voisin actif. Réutilise la même logique côté serveur.

### Hors scope
- Pas de drag & drop graphique.
- Pas de changement de schéma DB.
- `featured_order` (top 6) reste indépendant et inchangé.
- Les archivés ne sont jamais inclus dans la renumérotation.

### Fichiers touchés
- `src/components/admin/AdminSpeakersCRM.tsx` — colonne N°, flèches ↑/↓, logique de réordonnancement à la sauvegarde.
- Un UPDATE SQL one-shot pour renuméroter proprement la base.
