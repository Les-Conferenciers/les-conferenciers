# Garder la demande initiale du client, même pour un dossier archivé

## Ce que j'ai vérifié
- L'archivage n'efface pas la demande : le bloc « 📩 Demande initiale du client » s'affiche aussi pour un dossier archivé, et le texte reste dans sa langue d'origine (anglais compris).
- Sur 88 dossiers : 8 sont rattachés directement à leur demande, 35 la retrouvent via l'e-mail du client, et 45 n'affichent rien.
- La demande peut disparaître dans deux cas :
  1. Le lead est supprimé dans l'onglet Leads : le lien avec le dossier est perdu.
  2. Le client a écrit avec une autre adresse que celle de la proposition, ou l'adresse a été corrigée ensuite.

## Ce qui change
1. **Copie figée de la demande dans le dossier** : à la création de la proposition depuis un lead, ou dès qu'un dossier retrouve sa demande, le message d'origine est copié tel quel (texte, date, nom, e-mail, entreprise). Le dossier le garde même si le lead est supprimé ensuite.
2. **Rattrapage** : la copie est faite tout de suite pour les dossiers existants qui retrouvent déjà leur demande.
3. **Rattacher une demande à la main** : dans un dossier sans demande, un bouton « Rattacher une demande » ouvre la liste des leads avec une recherche par nom, entreprise ou e-mail.
4. **Suppression protégée** : supprimer un lead lié à un dossier affiche un avertissement. La demande reste visible dans le dossier.
5. Le texte du client est affiché sans traduction ni retouche, retours à la ligne compris.

## Détails techniques
- Migration : colonne `proposals.initial_request jsonb` (nullable) + rattrapage depuis `lead_id`, puis par e-mail (lead le plus récent).
- `EventDossier.tsx` : `loadInitialRequest` lit d'abord `initial_request`, sinon le lead, puis enregistre la copie. Sélecteur de lead pour le rattachement manuel (met à jour `lead_id` + `initial_request`).
- `Admin.tsx` (création depuis un lead) : remplit `initial_request`.
- `AdminLeads.tsx` : confirmation renforcée si le lead est référencé par une proposition.
- Affichage `whitespace-pre-wrap`.
