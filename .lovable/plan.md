## Constat

Sur les propositions récentes, le champ `proposals.next_reminder_date` (affiché en UI sous « Date de relance prévue ») est vide. Cependant, la table `proposal_tasks` contient bien une ligne `relance_1` avec une `due_date` correctement calculée (J+7 après l'envoi).

Exemple : **Forvis Mazars** (22/06) → `next_reminder_date` vide, mais `proposal_tasks.relance_1.due_date = 29/06`.

Sur les 30 dernières propositions `sent`, **27 sont dans ce cas** (seules FFDM, ABRISUD et SOCOTEC du 19/06 ont une date renseignée sur la proposition).

La cause est le refactor du système de relance vers `proposal_tasks` : la nouvelle logique a continué à écrire la `due_date` dans la tâche mais n'a plus alimenté `next_reminder_date` sur la proposition, et certains chemins ont même remis ce champ à `null`.

## Correction proposée (data only)

Backfill ponctuel via une requête SQL : remettre dans `proposals.next_reminder_date` la `due_date` de la tâche `relance_1` correspondante, **uniquement quand** :

- `proposals.next_reminder_date IS NULL`
- la proposition est encore active (`status IN ('sent','reminded_1','reminded_2')`)
- la tâche `relance_1` existe avec une `due_date` non nulle et `status = 'pending'` (on ne ressuscite pas une relance déjà traitée ou annulée)

```sql
UPDATE public.proposals p
SET next_reminder_date = t.due_date
FROM public.proposal_tasks t
WHERE t.proposal_id = p.id
  AND t.task_type = 'relance_1'
  AND t.status = 'pending'
  AND t.due_date IS NOT NULL
  AND p.next_reminder_date IS NULL
  AND p.status IN ('sent','reminded_1','reminded_2');
```

Impact attendu : ~27 propositions mises à jour (dont Forvis Mazars → 29/06).

## Hors périmètre

Je ne touche pas au code des relances (la source de vérité reste `proposal_tasks`). Si tu veux qu'on corrige aussi le code pour que `next_reminder_date` reste synchronisé à l'avenir, on le fera dans un second temps — dis-le moi si tu le souhaites.