## Action

Lier a posteriori les paires Groupe Tangram et SOCOTEC, puis archiver les anciennes versions comme une vraie mise à jour.

```sql
-- Groupe Tangram : 28 mai remplace 10 avril
UPDATE proposals SET previous_proposal_id = 'ff22a95c-c168-486b-a1de-73701edea0f9'
WHERE id = 'f36cd58d-4fa3-4b21-a9e2-19f591c70189';

-- SOCOTEC : 29 mai remplace 27 mai
UPDATE proposals SET previous_proposal_id = 'a6ea69d9-4d4b-48eb-929a-3ace14ea663f'
WHERE id = 'a4bcafec-de4d-460c-acd8-1437adf6eb53';

-- Archiver les ancêtres
UPDATE proposals
SET status = 'archived',
    lost_reason = '[Mise à jour] Remplacée par une nouvelle proposition',
    lost_at = now()
WHERE id IN ('ff22a95c-c168-486b-a1de-73701edea0f9', 'a6ea69d9-4d4b-48eb-929a-3ace14ea663f');

-- Couper les relances en attente sur les ancêtres
DELETE FROM proposal_tasks
WHERE proposal_id IN ('ff22a95c-c168-486b-a1de-73701edea0f9', 'a6ea69d9-4d4b-48eb-929a-3ace14ea663f')
  AND status = 'pending';
```

Résultat : chaînes propres, badge « Archivée v1 » sur les anciennes, actions verrouillées, relances coupées.
