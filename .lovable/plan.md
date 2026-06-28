## Problème
La facture d'acompte (BDC 1022) a été refusée par la comptabilité du client car elle n'affiche que 50% du montant. Une facture d'acompte conforme doit montrer le montant total de la prestation, puis indiquer l'acompte demandé en bas.

## Modification — `src/pages/InvoiceView.tsx`

Pour les factures de type **acompte** et **solde** :

### Tableau des lignes
Afficher les montants **HT à 100%** (au lieu de × 0.5) pour chaque ligne :
- Prestation de conférence — [Nom] : montant total HT
- Frais de déplacement / Autre : montant total HT
- Estimation frais VHR : inchangé

Retirer les mentions "Acompte 50%" / "Solde 50%" sous chaque ligne.

### Bloc Totaux (à droite)
- Total HT (100%)
- TVA 20% (sur 100%)
- **Total TTC** (100%)

Puis ajouter en dessous, dans un encadré distinct :
- Pour acompte : `Acompte demandé (50%) : XXX € TTC` + mention "Le solde sera facturé après l'intervention"
- Pour solde : `Acompte déjà versé (50%) : XXX € TTC` puis `Solde à régler (50%) : XXX € TTC`

### Type total
Inchangé (déjà à 100%).

### Référence/mention BDC
Inchangée.

## Détails techniques
- Recalculer `totalPrestationHT` et `detailedExtraLines` sans le multiplicateur `invoiceShare` pour l'affichage du tableau.
- Conserver `invoice.amount_ht` (qui reste à 50% en base) pour calculer le montant de l'acompte/solde affiché en bas.
- Mettre à jour le bloc "Modalités de règlement" pour rappeler le montant exact à payer (acompte ou solde TTC).
- Conserver le print CSS 1 page A4.

## Hors scope
- Aucun changement en base de données (les `invoices.amount_ht` restent stockés à 50%).
- Pas de changement aux emails ni à la génération du numéro de facture.
