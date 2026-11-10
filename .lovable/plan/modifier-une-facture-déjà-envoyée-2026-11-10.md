# Modifier une facture déjà envoyée

## Ce qui change
- Le bouton crayon « Éditer » s'affiche aussi sur les factures **envoyées**. Pour l'instant, il n'apparaît que sur les brouillons.
- On garde le même numéro de facture et le même lien client. Le client voit la version corrigée dès qu'il rouvre son lien.
- À l'ouverture de l'édition d'une facture envoyée, un bandeau prévient : « Cette facture a déjà été envoyée. Pensez à la renvoyer au client après modification. »
- Après l'enregistrement, une fenêtre propose « Renvoyer la facture corrigée maintenant ». Elle ouvre l'envoi par e-mail habituel, avec Pennylane toujours en copie cachée.
- Une trace est ajoutée dans les notes internes de la facture, par exemple « Modifiée le 10/11/2026 après envoi (ancien montant : 3 500 € HT) ». L'historique reste ainsi visible côté admin uniquement.
- Les factures payées restent non modifiables. Pour en corriger une, il faut d'abord cliquer sur « Annuler » le paiement, comme aujourd'hui.

## À savoir
Modifier une facture déjà envoyée sans changer son numéro n'est pas conforme aux règles comptables. Pennylane garde la première version reçue et recevra la version corrigée en plus.

## Détails techniques
- `ContractInvoiceManager.tsx` : bouton crayon affiché pour `draft` et `sent`. Bandeau dans la fenêtre d'édition si `status === "sent"`. Dans `handleSaveInvoice`, si la facture était envoyée : les anciennes valeurs sont ajoutées à la fin de `notes` (préfixe « [Modif après envoi] »), puis `openInvoiceEmail` est proposé après l'enregistrement.
- Aucune modification de la base de données.
