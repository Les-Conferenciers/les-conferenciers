## Objectif

Les anciennes versions d'une proposition mise à jour passent en `status: "archived"` mais restent visibles dans l'onglet **Envoyées** (groupées avec la dernière). Seule la dernière version permet les actions (Accepter, Mettre à jour, Relances, Éditer, Archiver).

## Changements

### 1. `src/pages/Admin.tsx` — flux de mise à jour (lignes 1383-1406)

Restaurer le passage de l'ancienne proposition en `status: "archived"` + `lost_reason: "[Mise à jour] Remplacée par une nouvelle proposition"` + `lost_at: now`. On garde la copie des notes et la suppression des tâches pending.

### 2. `src/pages/Admin.tsx` — filtres des onglets (ligne 1105)

- `sent` : `status === "sent"` **OU** (`status === "archived"` ET référencé par un `previous_proposal_id` d'une autre proposition). Ainsi les ancêtres remontent dans Envoyées.
- `archived` : `status === "archived"` **ET** non référencé comme ancêtre. Les vraies pertes restent là.

### 3. `src/pages/Admin.tsx` — `renderProposalRow` (lignes 2876-3044)

Quand `mode === "sent"` et `p.status === "archived"` :
- Badge statut : `Archivée vN` (gris, calculé via la chaîne `previous_proposal_id` déjà en place ligne 2769).
- Masquer : Éditer, Relances, Accepter, Convertir, Mettre à jour, Archiver.
- Garder : Copier le lien, Voir en ligne, Télécharger PDF.

### 4. `src/pages/Admin.tsx` — bouton « Mettre à jour » groupé (ligne 3024)

Retirer la branche `p.status === "archived"` du bouton individuel (devenu inaccessible). Le bouton « Mettre à jour » au niveau de la ligne d'en-tête du groupe (3222-3233) cible déjà `entry.latest` — correct.

### 5. Onglet Archivées

Aucun changement de rendu. Les chaînes de mises à jour n'y apparaîtront plus (filtre §2). La logique de regroupement par chaîne devient sans objet mais reste en place (no-op).

### 6. `supabase/functions/auto-archive-proposals/index.ts`

Retirer le filtre `supersededIds` ajouté juste avant : les ancêtres sont désormais en `status: "archived"`, donc déjà ignorés par la requête (`.eq("status", "sent")`). On revient à la version d'avant.
