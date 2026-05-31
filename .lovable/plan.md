## Constat

Pendant la fenêtre où on n'archivait plus les anciennes versions, 2 propositions ancêtres sont restées en `status = 'sent'` :
- **Davido Consulting** (29 mai) → remplacée le 31 mai
- **PRO BTP** (21 mai) → remplacée le 22 mai

Sans correction elles continuent à apparaître comme « En attente » dans l'onglet Envoyées, avec toutes les actions actives (Accepter, Mettre à jour, etc.) — exactement ce qu'on veut éviter.

## Action

Back-fill SQL : passer ces 2 propositions en `status = 'archived'` avec `lost_reason = '[Mise à jour] Remplacée par une nouvelle proposition'` et `lost_at = now()`. La requête cible automatiquement toute proposition `status='sent'` référencée comme `previous_proposal_id` par une autre — pas de risque d'élargissement.

```sql
UPDATE proposals
SET status = 'archived',
    lost_reason = '[Mise à jour] Remplacée par une nouvelle proposition',
    lost_at = now()
WHERE status = 'sent'
  AND id IN (SELECT previous_proposal_id FROM proposals WHERE previous_proposal_id IS NOT NULL);
```

Après ça, les 2 chaînes affichent le bon badge « Archivée vN » et les actions sont verrouillées comme pour les nouvelles mises à jour.
