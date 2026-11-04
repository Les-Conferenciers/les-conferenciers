# Filtre Profils + placeholder recherche (/conferencier)

## Ce qui change
1. **Filtre « Profils »** : propose tous les types de profils créés dans l'admin (sous-onglet Profils), dans le même ordre, et plus seulement ceux qui ont une page dédiée activée. « Sans profil » n'apparaît jamais. Libellé affiché : le nom du profil tel que saisi dans l'admin. Un nouveau profil créé dans l'admin apparaît automatiquement dans le filtre.
2. **Barre de recherche** : ajout du texte grisé « Recherche par mot-clé ».

## Détails techniques
- `src/pages/Speakers.tsx` : retirer `.eq("landing_enabled", true)` de la requête `speaker_profiles` (lecture publique déjà autorisée), exclure tout profil dont le nom est « Sans profil » (insensible à la casse), afficher `p.name`.
- Ajouter `placeholder="Recherche par mot-clé"` à l'input de recherche.
