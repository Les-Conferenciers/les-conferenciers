# Factures : envoi à plusieurs adresses + suivi de livraison

## Constat
L'envoi à plusieurs adresses existe déjà techniquement (champs « À » et « CC » acceptent des adresses séparées par virgules), mais :
- ce n'est pas visible (un seul champ texte, on ne voit pas que plusieurs adresses sont possibles) ;
- les destinataires « À » ne sont pas mémorisés : au renvoi ou pour la facture de solde, il faut tout ressaisir ;
- aucune trace de qui a reçu quoi, ni de confirmation que le mail est bien arrivé (on sait seulement que l'envoi est parti).

## Ce qui change (factures d'acompte, de solde et totales)
1. **Saisie claire des destinataires** : dans la fenêtre d'envoi, chaque adresse s'affiche en pastille (ajout par Entrée/virgule, croix pour retirer), pour « À » et « CC ». Adresse mal formée = signalée en rouge, envoi bloqué.
2. **Mémorisation** : les adresses utilisées sont enregistrées sur la facture. La facture de solde reprend automatiquement les adresses de la facture d'acompte du même dossier.
3. **Historique d'envoi** : sous chaque facture, « Envoyée le JJ/MM à a@x.fr, b@y.fr (CC c@z.fr) ».
4. **Vérification de livraison** : pour chaque envoi, statut par mail récupéré auprès du service d'envoi : Envoyé / Délivré / Rejeté (bounce) / Ouvert si dispo. Bouton « Actualiser le statut ». En cas de rejet, alerte rouge sur la facture.
5. Message de confirmation précis après envoi (nombre de destinataires) et message d'erreur explicite si le service refuse une adresse.

## Détails techniques
- Migration : `invoices.email_to text` + table `invoice_email_logs` (id, invoice_id FK cascade, resend_id, to_emails text[], cc_emails text[], subject, sent_at, last_status, status_checked_at) avec GRANT authenticated/service_role + RLS authenticated.
- `send-invoice-email` : validation regex des adresses, lit l'`id` renvoyé par Resend, insère le log, met à jour `email_to`/`email_cc`. Nouvelle action `check_status` : GET `https://api.resend.com/emails/{id}` → `last_event` stocké dans `last_status`.
- `ContractInvoiceManager.tsx` : composant pastilles pour À/CC, préremplissage (email_to de la facture → sinon celui de l'acompte du même dossier → sinon entité de facturation/client), affichage historique + badges statut + bouton actualiser.
- Redéployer la fonction ; test réel d'envoi sur une facture de test vers 2 adresses + CC, puis vérification du statut « delivered ».
