## Objectif

Faire évoluer la partie facturation du dossier événement pour couvrir 4 besoins :
1. Envoyer une facture (acompte ou solde) à plusieurs destinataires, en s'assurant que l'envoi part bien.
2. Pouvoir refaire une facture en cas d'erreur.
3. Ajouter une note libre sur la facture (numéro de bon de commande client, nom du destinataire interne, numéro d'engagement…).
4. Permettre que l'entité facturée soit différente du client (ex. client Safran, facture émise à Kactus qui centralise).

Aucun changement sur la logique de numérotation, la TVA, ou le pipeline de paiement.

---

## 1. Envoi facture à plusieurs destinataires (acompte & solde)

État actuel : le dialog « Envoyer la facture » a un champ `to` unique + un champ `cc`. L'edge function `send-invoice-email` accepte déjà `to` en tableau (split sur `,` et `;`), donc côté back rien à changer.

Changements dans `src/components/admin/ContractInvoiceManager.tsx` :
- Renommer le champ « Destinataire » en « Destinataires (séparés par une virgule) », `type="text"` pour autoriser plusieurs emails.
- Split côté UI (`,` ou `;`), trim, validation basique (`includes('@')`) avant envoi. Bloquer l'envoi si liste vide.
- Toast d'erreur explicite si l'edge function renvoie une erreur (aujourd'hui le retour est ignoré silencieusement dans certains cas — on log/affiche `error.message` + `data.error`).
- Après envoi réussi, afficher dans le toast le nombre de destinataires (« Facture envoyée à N destinataire(s) »).

Pré-remplissage : garder le comportement actuel (email client du contrat) + ajouter automatiquement l'entité de facturation si renseignée (voir §4).

---

## 2. Refaire une facture en cas d'erreur

Aujourd'hui il n'y a pas de bouton de suppression / régénération dans la liste des factures.

Ajout dans `ContractInvoiceManager.tsx`, dans la carte de chaque facture :
- Bouton **« Supprimer »** (icône Trash, style destructive) avec `AlertDialog` de confirmation. Supprime la ligne `invoices` ; la fonction `generate_invoice_number` réattribue automatiquement un numéro cohérent à la prochaine création (déjà géré par le suffixe / séquence).
- Bouton **« Dupliquer »** (icône Copy) : recrée immédiatement une facture du même `invoice_type` (`acompte` / `solde` / `total`) sur le même contrat, avec un `invoice_number` frais. Utile quand on a envoyé une version fausse et qu'il faut la refaire.
- Les deux actions sont bloquées avec un tooltip explicite si `status = 'paid'` (sécurité comptable) — on demande d'abord de « remettre en attente » via le bouton existant.

Rien à changer côté DB : les policies actuelles autorisent déjà `DELETE`/`INSERT` sur `invoices` pour l'admin authentifié.

---

## 3. Note libre / numéro de bon de commande client sur la facture

État actuel : la colonne `invoices.notes` existe déjà (utilisée nulle part côté UI publique). Il y a aussi `internal_notes` (usage interne uniquement, on n'y touche pas).

Changements :
- **UI édition** (`ContractInvoiceManager.tsx`, dialog « Modifier la facture ») : ajouter un `Textarea` **« Mentions sur la facture (BDC client, destinataire interne, n° d'engagement…) »** lié à `invoices.notes`. Label d'aide qui précise que ce texte apparaîtra sur la facture PDF.
- **Affichage** (`src/pages/InvoiceView.tsx`) : si `invoice.notes` est renseignée, l'afficher dans un encadré discret sous le bloc « Facturé à » (avant le tableau des prestations), avec un titre « Références client » et le contenu en `whitespace-pre-line` pour respecter les retours à la ligne. Version imprimable A4 conservée (déjà `print:` compatible).

Aucune migration nécessaire (colonne déjà présente).

---

## 4. Entité facturée ≠ client

Besoin : le contrat / la relation commerciale reste avec le client (ex. Safran), mais la facture doit être adressée à une autre entité juridique (ex. Kactus) avec ses propres coordonnées et parfois son propre email de réception.

### Modèle de données

Migration `invoices` : ajout de colonnes optionnelles (toutes nullable, la facture retombe sur le client si vides) :
- `billing_entity_name text`
- `billing_entity_address text`
- `billing_entity_siret text`
- `billing_entity_vat text` (n° TVA intra si applicable)
- `billing_entity_email text` (destinataire par défaut pour l'envoi)

Aucun impact sur les policies RLS existantes.

### UI édition (dialog « Modifier la facture »)

Nouvelle section repliable **« Facturer à une autre entité (optionnel) »** :
- Champs texte : Nom / Raison sociale, Adresse complète, SIRET, N° TVA, Email de facturation.
- Petit bouton « Copier depuis le client » qui pré-remplit avec les infos du client courant (utile comme point de départ).
- Bouton « Effacer » qui remet tous les champs à null (retour à la facturation client standard).

Même section dans le dialog de **création** de facture, pour éviter de créer puis rééditer.

### Affichage facture

`src/pages/InvoiceView.tsx`, bloc « Facturé à » :
- Si `billing_entity_name` est renseigné → afficher `billing_entity_name` + adresse/SIRET/TVA de l'entité de facturation ; ajouter en dessous une petite mention `Pour le compte de : <client_name>` (pour la traçabilité comptable).
- Sinon → comportement actuel (client_name + coordonnées du client).

### Envoi email

`ContractInvoiceManager.tsx`, ouverture du dialog d'envoi :
- Destinataire par défaut = `billing_entity_email` si présent, sinon email client (comportement actuel).
- Utilisateur peut toujours ajouter des adresses supplémentaires (§1).

Aucun changement dans `supabase/functions/send-invoice-email` : la fonction se contente d'envoyer aux adresses passées par le front.

---

## Détails techniques

Fichiers modifiés :
- `supabase/migrations/…` : nouvelle migration ajoutant les 5 colonnes `billing_entity_*` sur `public.invoices`.
- `src/components/admin/ContractInvoiceManager.tsx` : multi-destinataires, suppression/duplication, section entité de facturation dans les dialogs création + édition, champ notes.
- `src/pages/InvoiceView.tsx` : rendu conditionnel du bloc « Facturé à » et de l'encadré « Références client ».

Fichiers **non** modifiés :
- `supabase/functions/send-invoice-email/index.ts` (déjà multi-destinataires).
- `emailTemplates` (aucun template à toucher).
- Logique de numérotation, calculs TVA, pipeline Contrats.

Non-impact :
- Les factures existantes gardent leur affichage actuel (nouvelles colonnes NULL par défaut).
- Le brouillon d'email facture continue de fonctionner à l'identique quand aucune entité de facturation n'est renseignée.
