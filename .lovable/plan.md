## Constat

- Baugeois v1 (envoyée le 01/06) a `status = 'sent'` en base, alors qu'elle est remplacée par la v2 (créée le 03/06, `previous_proposal_id` pointant sur v1).
- Davido Consulting fonctionne correctement parce que toutes les anciennes versions ont `status = 'archived'`.
- Dans `src/pages/Admin.tsx` (lignes 3026–3082), les boutons **Relances**, **Accepter**, **Mettre à jour** et **Archiver** sont gatés uniquement par `p.status === "sent"` / `p.status !== "archived"`. Ils ignorent le fait que la proposition soit déjà remplacée par une version plus récente.
- L'archivage automatique de l'ancienne version ne se déclenche que dans la branche "créer + envoyer" (ligne 1394 de `Admin.tsx`). Si la v2 a été créée comme brouillon puis envoyée séparément (ou si la mise à jour de la v1 a échoué silencieusement), la v1 reste `sent` → tous les boutons d'action restent actifs, comme sur la capture.

`supersededIds` est déjà calculé (ligne 1110) et utilisé pour regrouper l'affichage, mais pas pour verrouiller les actions.

## Modifications

**1. `src/pages/Admin.tsx` — verrouiller toute version remplacée (frontend, durable)**

Dans `renderProposalRow`, calculer `isSuperseded = supersededIds.has(p.id)` (passer le Set en paramètre ou y accéder via la closure existante) et :

- Remplacer les conditions `mode === "sent" && p.status === "sent"` aux lignes 3026 et 3067 par `mode === "sent" && p.status === "sent" && !isSuperseded` → masque **Relances**, **Accepter**, **Mettre à jour**.
- Remplacer `p.status !== "archived"` ligne 3078 par `p.status !== "archived" && !isSuperseded` → masque **Archiver**.
- Étendre le badge "Archivée vX" (ligne 2934) pour qu'il s'affiche aussi quand `isSuperseded` (et pas seulement `status === "archived"`), en utilisant un libellé "Remplacée vX" si la version n'est pas encore archivée — ainsi l'utilisateur comprend pourquoi les actions ont disparu.

**2. Correctif de données — archiver Baugeois v1**

Mettre à jour la ligne `32fb5cec-3d3a-422f-a01d-166e20c5f504` :
```sql
UPDATE proposals
SET status = 'archived',
    lost_at = now(),
    lost_reason = '[Mise à jour] Remplacée par une nouvelle proposition'
WHERE id = '32fb5cec-3d3a-422f-a01d-166e20c5f504';
```
Et supprimer ses éventuelles `proposal_tasks` `pending` pour ne plus la voir dans l'agenda :
```sql
DELETE FROM proposal_tasks WHERE proposal_id = '32fb5cec-3d3a-422f-a01d-166e20c5f504' AND status = 'pending';
```

## Hors scope

- Pas de modification de la branche "création + envoi" (elle archive déjà correctement la version précédente).
- Pas de refonte du flow "brouillon puis envoi" : le gating frontend par `isSuperseded` suffit à éviter tout futur cas similaire, même si l'archivage automatique a été contourné.
