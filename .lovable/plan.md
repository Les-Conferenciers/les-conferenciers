## Objectif

Quand une nouvelle proposition est créée pour un client qui a déjà une proposition `status='sent'` non expirée, proposer automatiquement de la rattacher comme nouvelle version (renseigner `previous_proposal_id`) — afin que le comportement « Archivée vX + œil uniquement » s'applique systématiquement.

## 1. Correctif ponctuel BDO

Via insert tool :
```sql
UPDATE proposals SET previous_proposal_id = '552274eb-...' WHERE id = 'a77cfa0e-...';
```
→ La v1 BDO bascule immédiatement en « Archivée v1 ».

## 2. Détection à la création — `src/pages/Admin.tsx`

Dans la fonction qui crée une nouvelle proposition (brouillon ou envoi direct depuis le formulaire de proposition) :

1. Avant `INSERT proposals`, requêter :
   ```ts
   supabase.from('proposals')
     .select('id, client_name, recipient_name, created_at, status')
     .eq('client_email', formClientEmail)
     .eq('status', 'sent')
     .is('previous_proposal_id', null) // ou pas, voir ci-dessous
     .order('created_at', { ascending: false })
   ```
   Filtrer côté JS pour exclure celles déjà remplacées (existence d'une autre proposition avec `previous_proposal_id = this.id`).

2. Si au moins 1 proposition « active » trouvée :
   - Afficher un **Dialog de confirmation** : « Une proposition envoyée existe déjà pour {email} (créée le {date}, destinataire {recipient_name}). Voulez-vous créer une nouvelle version qui la remplacera ? »
   - 3 boutons :
     - **Oui, nouvelle version** → set `previous_proposal_id = <id de la plus récente>` sur l'INSERT
     - **Non, proposition indépendante** → INSERT sans `previous_proposal_id`
     - **Annuler** → revenir au formulaire

3. S'il y a plusieurs candidates (rare), proposer la plus récente par défaut + lien « Voir les autres » → liste cliquable.

## 3. Audit rétroactif (optionnel mais recommandé)

Un script SQL one-shot pour détecter et corriger les chaînes manquantes :
```sql
-- Pour chaque client_email avec >1 proposition status='sent', relier 
-- les anciennes à la plus récente si previous_proposal_id IS NULL
```
À exécuter manuellement après revue. **Décision : on l'inclut ou pas ?** Je propose de l'inclure et de te montrer la liste des cas détectés avant application.

## Hors scope

- Aucun changement de schéma DB (colonne `previous_proposal_id` existe déjà).
- Aucun changement sur la cellule Statut / Actions (déjà fait au tour précédent).
- Pas de modification de la vue client `ProposalView`.

## Question avant implémentation

Pour le point 3 (audit rétroactif) : tu veux que je te liste d'abord les cas trouvés en base avant de rattacher quoi que ce soit, ou je ne fais que le détecteur sur les nouvelles créations (points 1+2) ?
