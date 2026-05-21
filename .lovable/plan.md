## Problème

L'aperçu contrat (`/admin/contrat/:id`) ne reflète pas le changement de conférencier retenu effectué dans le dossier événement, car `contracts.selected_speaker_id` n'est mis à jour qu'à la sauvegarde du contrat, pas au moment du clic sur "Conférencier retenu".

## Correctif

`src/components/admin/EventDossier.tsx` — dans les deux endroits qui changent le conférencier retenu, propager la valeur à la table `contracts` :

1. **`handleSelectSpeaker` (ligne 396)** : après l'update de `events.selected_speaker_id`, si `contract` existe, faire `supabase.from("contracts").update({ selected_speaker_id: speakerId }).eq("id", contract.id)`.

2. **Bouton inline (ligne 1729)** : même ajout après l'update de l'événement, avant le `setContractLines`.

Aussi : ajouter le même update dans l'effet de bootstrap (ligne 376-377) qui auto-sélectionne le conférencier unique d'une proposition mono-speaker.

### Hors scope
- Pas de changement dans `ContractView.tsx` / `ContractSign.tsx` (le fallback sur `event.selected_speaker_id` est déjà en place).
- Pas de migration de données.

## Vérification
- Sur le dossier Atout Groupe, changer le conférencier retenu et recharger `/admin/contrat/9a9e3bc2-…` → l'en-tête affiche bien le nouveau conférencier.
