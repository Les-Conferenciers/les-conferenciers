## Plan : Template email contrat client + aperçu live

### Objectif
Remplacer le wording brut du mail d'envoi du bon de commande par le template HTML demandé, permettre son édition en HTML, et afficher un aperçu live du rendu final dans la pop-up d'envoi.

### Étape 1 — Nouveau template HTML dans `EventDossier.tsx`
- Modifier `openContractEmail()` pour générer le corps HTML exact fourni :
  - Salutation avec prénom du destinataire
  - « Suite à nos précédents échanges, je suis ravie de vous adresser le **bon de commande** relatif à l'intervention de **[Conférencier]** »
  - Bloc récapitulatif (date, lieu, montant TTC) en `<strong>`
  - Phrases de signature électronique, disponibilité, formule de politesse
  - Signature Nelly Sabde avec téléphone
- Variables interpolées dynamiquement : `recipient_name`, speaker name, `event_date`, `event_location`, `totalTTC`.

### Étape 2 — Éditeur riche pour le corps du mail
- Remplacer le `<Textarea>` du corps du mail de contrat par le composant `<RichTextEditor>` déjà utilisé ailleurs dans l'admin.
- Adapter la taille (`minHeight`) pour qu'elle tienne dans la dialog.

### Étape 3 — Panneau d'aperçu live dans la dialog
- Étendre la dialog d'envoi de contrat (`max-w-3xl` ou plus) pour accueillir deux colonnes :
  - **Gauche** : champs d'édition (objet, éditeur riche)
  - **Droite** : aperçu HTML rendu en temps réel
- L'aperçu reproduit fidèlement l'enveloppe de marque de l'email envoyé :
  - Header `#1a2332` avec logo pépite + titre « Agence Les Conférenciers »
  - Corps du mail (rendu HTML du `RichTextEditor`)
  - Bouton « Consulter et signer le contrat »
  - Image de signature Nelly Sabde
  - Footer « Document confidentiel »
- L'aperçu se met à jour en temps réel à chaque modification de l'éditeur.

### Étape 4 — Correction de l'edge function `send-contract-email`
- Ligne 78 : le `replace(/\n/g, "<br>")` actuellement appliqué systématiquement crée des `<br>` parasites si le body contient déjà du HTML.
- Conditionner le remplacement : ne l'appliquer que si le `email_body` ne contient pas déjà de balises HTML (`!/<\w+/.test(body)`).

### Fichiers concernés
- `src/components/admin/EventDossier.tsx` (template + dialog + aperçu)
- `supabase/functions/send-contract-email/index.ts` (fix double balisage)

### Aucun changement de schéma requis.