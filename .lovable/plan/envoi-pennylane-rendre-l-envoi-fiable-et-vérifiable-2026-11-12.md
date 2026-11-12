# Envoi Pennylane : rendre l'envoi fiable et vérifiable

## Constat
- Facture de test 20261104-1098 envoyée ce matin à 9h23 (heure de Paris) au client : le mail client est bien parti.
- Pennylane ne reçoit son mail (avec PDF joint) que si l'écran admin fabrique le PDF avant l'envoi. Cette partie de l'écran n'existe que dans l'aperçu : le site en ligne n'a pas encore été publié. Envoyée depuis le site en ligne, la facture part donc sans PDF, et rien n'est envoyé à Pennylane (l'ancienne copie cachée a été retirée).
- Aucune trace côté serveur ne permet aujourd'hui de savoir si Pennylane a été tenté ou refusé.

## Ce qui sera fait
1. **Fabrication du PDF côté serveur en secours** : si l'écran n'a pas fourni de PDF, le serveur le génère lui-même à partir de la page facture, puis l'envoie à Pennylane. L'envoi ne dépend donc plus de la version de l'écran ni du navigateur.
2. **Suivi visible dans l'admin** : on enregistre sur chaque facture la date d'envoi à Pennylane ou l'erreur. Une pastille « Pennylane ✓ » ou « Pennylane ✗ » s'affiche dans la liste des factures.
3. **Bouton « Renvoyer à Pennylane »** sur les factures envoyées : il transmet le PDF seul, sans renvoyer le mail au client. Il sert à rattraper la 1098, la 1077 et les échecs futurs.
4. **Journal serveur** à chaque étape (PDF reçu ou généré, réponse de l'envoi Pennylane) pour pouvoir diagnostiquer.
5. Publier le site après la modification : sans publication, le site en ligne garde l'ancien comportement.

## Détails techniques
- Migration : `invoices.pennylane_sent_at timestamptz`, `invoices.pennylane_error text`.
- `send-invoice-email` : nouvelle action `pennylane_only` ; secours PDF côté serveur (rendu HTML de la facture à partir des données de la facture, puis conversion en PDF avec une bibliothèque compatible Deno). Si la conversion échoue, l'erreur est enregistrée.
- Interface : pastille et bouton dans `ContractInvoiceManager.tsx` et `EventDossier.tsx`.
