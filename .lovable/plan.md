## Diagnostic

Oui c'est normal : la fonction backend `send-contract-email` accepte bien un champ `attachments` (filename + content base64) et le transmet à Resend, **mais l'UI ne permet pas encore d'attacher de fichier**. Le bouton « Envoyer » dans le dialog Contrat envoie uniquement `contract_id`, `email_subject`, `email_body` — aucun fichier n'est joint à la requête, donc Resend reçoit un email sans pièce jointe.

## Plan : ajouter les pièces jointes au mail contrat

### 1. UI — `src/components/admin/ContractInvoiceManager.tsx` (dialog contrat email)
- Ajouter un input `<input type="file" multiple />` dans le dialog d'envoi du contrat, sous la zone CC/destinataires.
- État local : `const [contractAttachments, setContractAttachments] = useState<{ filename: string; content: string; size: number }[]>([])`.
- À la sélection : lire chaque fichier via `FileReader.readAsDataURL`, extraire la partie base64 (après la virgule), stocker `{ filename, content, size }`.
- Afficher la liste des fichiers ajoutés avec taille (Ko) + bouton « ✕ » pour retirer.
- **Limite de taille** : refuser tout fichier > 8 Mo (Resend limite à ~40 Mo total, on garde une marge confortable) avec un toast d'erreur.
- Limite cumulée 15 Mo (somme des `size`), bloquer l'ajout au-delà.

### 2. Envoi — même fichier, fonction `handleSendContractEmail`
- Passer `attachments: contractAttachments.map(a => ({ filename: a.filename, content: a.content }))` dans le body de `supabase.functions.invoke("send-contract-email", …)`.
- Vider l'état `contractAttachments` après envoi réussi.

### 3. Idem pour `src/components/admin/EventDossier.tsx` (ligne 1056)
- Même UI + même payload, pour rester cohérent quand le contrat est envoyé depuis le dossier événement.

### 4. Backend — `supabase/functions/send-contract-email/index.ts`
- Aucun changement nécessaire (le champ `attachments` est déjà géré, lignes 109-122).
- Optionnel : ajouter un contrôle de taille côté serveur (refuser si payload > 20 Mo) pour éviter les timeouts.

## Hors scope
- Pas de stockage persistant des pièces jointes (elles ne sont attachées qu'à l'envoi, pas conservées dans `contracts`).
- Pas de modification de la facture / proposition (à faire séparément si besoin).