## Problème

Sur le contrat Atout Groupe, les lignes du contrat affichent bien **Benoît Vermersch** (le conférencier sélectionné dans le dossier événement), mais l'en-tête "ENTRE / Monsieur ..." affiche **Alex Si** (premier conférencier de la proposition à 4 personnes).

Cause : `contracts.selected_speaker_id` est `NULL` pour ce contrat. Le code de `ContractView.tsx` et `ContractSign.tsx` retombe alors sur `proposal_speakers[0]`, donc le premier de la liste (Alex Si), au lieu d'utiliser le conférencier sélectionné dans `events.selected_speaker_id` (Benoît Vermersch).

## Correctif

### 1. `src/pages/ContractView.tsx`
- Dans `fetchAll`, après avoir récupéré l'event (déjà fait ligne 111), si `c.selected_speaker_id` est null mais `ev.selected_speaker_id` existe, charger ce speaker depuis la table `speakers` et l'affecter à `c.selected_speaker`.
- Résultat : `firstSpeaker = contract.selected_speaker || speakers[0]?.speakers` (ligne 169) retournera Benoît Vermersch.

### 2. `src/pages/ContractSign.tsx`
- Récupérer également l'event lié (`events.selected_speaker_id`) lors du fetch du contrat.
- Remplacer `const firstSpeaker = speakers[0]?.speakers;` (ligne 178) par une lookup qui privilégie `contract.selected_speaker_id` puis `event.selected_speaker_id`, et seulement en dernier recours `speakers[0]`.

### 3. `src/components/admin/EventDossier.tsx` (consolidation, hors-bug mais évite récidive)
- Lors de la création / mise à jour du contrat (handlers existants qui font `supabase.from("contracts").insert(...)` ou `.update(...)`), inclure `selected_speaker_id: event.selected_speaker_id`. Ainsi les futurs contrats stockent l'info à la source et `ContractView` n'a plus à retomber sur l'event.

### Hors scope
- Pas de migration de données : on laisse `contracts.selected_speaker_id` NULL pour les contrats existants, la résolution dynamique via l'event suffit.
- Pas de changement de logique de calcul des lignes ni de l'email.
- `SpeakerContractView.tsx` utilise déjà `ev.selected_speaker_id` correctement, rien à faire.

## Vérification
- Recharger `/admin/contrat/9a9e3bc2-...` (Atout Groupe) → l'en-tête doit afficher Monsieur Benoît Vermersch.
- Recharger un autre contrat mono-conférencier → comportement inchangé.
