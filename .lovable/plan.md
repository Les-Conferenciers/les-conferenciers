## Constats

### 1. Image hero
- Page d'accueil (`/`) : l'image de fond est **toujours présente** (`src/pages/Index.tsx` ligne 191, image `og/lesconferenciers.jpg` avec overlay `bg-primary/80`).
- Page annuaire (`/conferencier`) — celle où tu te trouves actuellement : **il n'y a pas d'image de fond**, juste un bandeau plat `bg-primary` (`src/pages/Speakers.tsx` lignes 158-165). C'est probablement ce qui te donne l'impression qu'elle a disparu — soit elle n'a jamais été ajoutée, soit elle a sauté lors d'un refacto.

### 2. Thèmes : 56 canoniques mais 57 affichés
Vérification base de données : il y a aujourd'hui **57 valeurs distinctes** de thèmes en circulation sur les conférenciers actifs. La liste canonique (`CANONICAL_THEMES` dans `src/lib/parseThemes.ts`) en contient **56** (et non 51 — la mémoire est obsolète).

**6 thèmes hors-liste détectés en base** (à fusionner ou supprimer) :
- `Excellence` → à mapper sur `Performance`
- `Innovation et transformation` → à splitter en `Innovation` + `Transformation`
- `Leadership et management` → à splitter en `Leadership` + `Management`
- `Performance et croissance` → à mapper sur `Performance`
- `Progrès` → à mapper sur `Innovation`
- `Stratégie d'entreprise` → à mapper sur `Stratégie`

**Pourquoi ils existent malgré la normalisation** :
- Le formulaire "Création manuelle" du CRM (`AdminSpeakersCRM.tsx` ligne 967) accepte un champ texte libre (séparé par virgules) sans aucun filtre.
- L'éditeur de fiche permet aussi d'ajouter un thème libre via input texte (lignes 1481-1497).
- L'edge function `import-speakers` (ligne 70-82) insère les thèmes tels quels sans passer par `filterToCanonicalThemes`.

## Plan

### A — Hero /conferencier
Ajouter l'image de fond `og/lesconferenciers.jpg` avec overlay `bg-primary/80`, dans le bloc lignes 158-165 de `src/pages/Speakers.tsx`, en reprenant exactement le pattern de la page d'accueil (positionnement absolu, `bg-cover bg-center`, contenu en `relative z-10`).

### B — Verrouiller les thèmes à la liste canonique

**B1. Formulaire "Création manuelle" (CRM)**
Remplacer l'`Input` texte libre (ligne 967) par un sélecteur multi-tags basé sur `CANONICAL_THEMES` (mêmes pastilles cliquables que celles déjà utilisées dans l'éditeur). Plus aucune saisie libre possible.

**B2. Éditeur de fiche conférencier**
Supprimer le champ `<input>` texte libre (lignes 1481-1497) qui permet d'ajouter un thème non-canonique. Conserver uniquement le `<select>` (ligne 1488) qui propose les thèmes existants. Filtrer les options pour n'afficher que ceux de `CANONICAL_THEMES`.

**B3. Edge function `import-speakers`**
Appliquer `filterToCanonicalThemes` sur le tableau `themes` avant insertion (ligne ~75). Les thèmes hors-liste seront silencieusement écartés.

**B4. Edge function `enrich-speakers`** (à vérifier rapidement à l'implémentation)
S'assurer que la sortie IA passe également par `filterToCanonicalThemes` avant écriture.

**B5. Nettoyage des données existantes**
Migration SQL (via outil migration) pour réécrire les 6 thèmes orphelins :
```sql
UPDATE speakers SET themes = array_replace(themes, 'Excellence', 'Performance');
UPDATE speakers SET themes = array_replace(themes, 'Performance et croissance', 'Performance');
UPDATE speakers SET themes = array_replace(themes, 'Stratégie d''entreprise', 'Stratégie');
UPDATE speakers SET themes = array_replace(themes, 'Progrès', 'Innovation');
-- Pour les composés, retirer + ajouter les 2 cibles
```
Après migration : déduplication des arrays.

### C — Mise à jour mémoire
Corriger la mémoire `theme-normalization` : le compte est désormais **56 catégories** (et non 51).

## Résultat attendu

- Page `/conferencier` : bandeau hero avec photo de fond, identique au look de la page d'accueil.
- Plus aucune création possible de thème hors-liste depuis l'admin (création manuelle, édition, import IA).
- Base nettoyée : 56 thèmes max affichés sur le site, alignés sur la liste canonique.
