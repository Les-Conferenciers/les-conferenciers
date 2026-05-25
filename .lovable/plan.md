## Logique demandée

- Si **facture totale** existe déjà → bouton « Créer une facture » désactivé (plus rien à facturer).
- Si **facture d'acompte** existe déjà → dialogue ouvert mais seul le type **« Solde 50% »** est disponible et présélectionné. Plus d'acompte ni de total possibles.
- Si **facture de solde** existe déjà (mais pas d'acompte, cas rare) → bouton désactivé.
- Sinon (aucune facture) → comportement actuel inchangé (Acompte / Solde / Total).

## Modifications dans `src/components/admin/EventDossier.tsx`

1. Calculer en haut du rendu factures :
   ```ts
   const hasTotal = invoices.some(i => i.invoice_type === "total");
   const hasAcompte = invoices.some(i => i.invoice_type === "acompte");
   const hasSolde = invoices.some(i => i.invoice_type === "solde");
   const canCreateInvoice = !hasTotal && !hasSolde;
   const onlySoldeAllowed = hasAcompte && !hasSolde && !hasTotal;
   ```

2. **Bouton « Créer une facture »** (ligne 1793) : ajouter `disabled={!canCreateInvoice}` + tooltip via `title` expliquant pourquoi (« Facture totale déjà créée » / « Solde déjà créé »).

3. **Ouverture du dialogue** : dans le `onClick`, si `onlySoldeAllowed`, forcer `setInvoiceType("solde")` avant d'ouvrir.

4. **Dialogue de création** (ligne 3423-3433) : filtrer la liste des types selon `onlySoldeAllowed` — n'afficher que `["solde"]` dans ce cas, sinon les trois. Ajout d'un petit texte d'aide au-dessus quand le type est contraint : « Une facture d'acompte a déjà été émise, seul le solde reste à facturer. »

Aucun changement de schéma ni de logique d'insertion côté base.
