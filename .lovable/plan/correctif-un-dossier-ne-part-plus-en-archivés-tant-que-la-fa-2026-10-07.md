# Correctif : un dossier ne part plus en « Archivés » tant que la facture n'est pas payée

## Constat (vérifié en base)
Un dossier passe automatiquement en « Archivés » quand **toutes ses factures existantes sont payées** et que le conférencier est payé. Le trou : si le dossier n'a qu'une facture d'**acompte** payée (la facture de solde pas encore créée), la règle considère que « tout est payé ». Marquer le conférencier payé fait alors basculer le dossier en Archivés alors que le solde reste dû.
Exemple actuel : « Les biologistes indépendants » (acompte payé, pas de solde, conférencier payé).

## Correction
Un dossier ne sera archivé automatiquement (« gagné ») que si :
- il existe une facture **de solde ou totale** payée,
- toutes les autres factures envoyées sont aussi payées (les brouillons ne bloquent pas),
- et le conférencier est payé.

Sinon, il reste dans « En cours » ou « En attente de paiement » selon son statut, même si le conférencier est payé.

Inchangé : les dossiers perdus et ceux que vous passez manuellement en « Archivé » restent dans Archivés.

## Détails techniques
- `src/components/admin/AdminEventDossiers.tsx` (~ligne 367) : `allInvoicesPaid` remplacé par `hasPaidFinal = pInvoices.some(i => (i.invoice_type === "solde" || i.invoice_type === "total") && i.status === "paid")` et `noUnpaidSent = pInvoices.every(i => i.status === "paid" || i.status === "draft")` ; `isWon = hasPaidFinal && noUnpaidSent && !!speakerPaid && !isLost`.
- Aucune modification de données ; les dossiers concernés réapparaissent d'eux-mêmes dans le bon onglet.
- Vérification : compter les dossiers archivés avant/après et contrôler que « Les biologistes indépendants » revient dans les dossiers actifs.
