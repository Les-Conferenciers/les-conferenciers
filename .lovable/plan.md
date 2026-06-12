## Plan d'implémentation (8 sujets)

### 1. Variable `{{conferencier}}` dans le template "Bon de commande envoyé au client"
- Mettre à jour le template `contract_client_send` dans `email_templates` : ajouter `{{conferencier}}` dans `available_variables` + l'insérer dans le `body_html` par défaut.
- Côté `ContractInvoiceManager.tsx` (fonction `openContractEmail`) : passer le nom du conférencier sélectionné dans les variables de `renderTpl`.

### 2. Photo selfies sur /contact
- Uploader `selfies-avec-nelly.png` via `lovable-assets` (CDN).
- Remplacer dans `src/pages/Contact.tsx` l'image actuelle de Nelly par le nouvel asset. Mise en page conservée (même conteneur), ajustement minimal de l'`object-fit` si besoin.

### 3. PDF Proposition / Profil conférencier
- **Pitch de conférence dans le PDF proposition** : dans `ProposalView.tsx`, ajouter le rendu du pitch (description courte de chaque conférence du conférencier) sous le bloc conférencier, visible aussi en mode impression.
- **Profil PDF individuel** : ajouter un bouton "Télécharger le profil (PDF)" dans l'admin (CRM conférencier / fiche admin) qui ouvre une route imprimable `/admin/conferencier/:slug/pdf` avec photo, bio, spécialités, conférences (titres + pitchs), références. Réservé à l'admin.
- **En-têtes/pieds navigateur** : conserver l'impression navigateur. J'ajoute simplement une note discrète "Astuce : décochez 'En-têtes et pieds de page' dans le dialogue d'impression" sur les pages d'impression admin. Aucune génération PDF serveur.

### 4. Pipeline Contrats : masquer "Acompte client" quand pas d'acompte
- Dans `ContractPipeline.tsx` : si `contract.deposit_amount` est nul/0 OU le flag "pas d'acompte" est coché, ne pas afficher la colonne/étape "Acompte client" pour ce dossier (passage direct facture finale).
- Vérifier que les jalons du dossier événementiel reflètent aussi cette logique.

### 5. Templates manquants dans l'onglet "Emails"
Ajouter 5 nouveaux templates dans `email_templates` :
- `contract_speaker_send` — Envoi contrat agence au conférencier
- `speaker_event_info` — Envoi infos événement au conférencier
- `liaison_sheet_send` — Feuille de liaison
- `preparatory_call` — Visio préparatoire (proposition de créneaux)
- `invoice_send` — Envoi de facture

Chaque template : variables disponibles (event_date, lieu, client, conférencier, lien...), wording par défaut basé sur les emails actuellement codés en dur. Brancher les call sites correspondants via `renderTpl(...)`.

### 6. Factures
- **Champ "Notes internes"** : ajouter colonne `internal_notes TEXT` dans `invoices`. Textarea dans le formulaire de création/édition de facture, affichée uniquement dans l'admin (jamais sur le PDF client).
- **Retirer la mention "Brouillon"** : supprimer le badge "BROUILLON" / filigrane sur `InvoiceView.tsx` quel que soit le statut.
- **En-têtes/pieds navigateur** : voir point 3 — note d'astuce affichée sur la page facture admin.

### 7. Aperçu mail feuille de liaison (HTML visible)
- Localiser le call site qui ouvre le mail liaison (probablement `LiaisonSheetView` ou `EventDossier`).
- Le corps doit être passé à `EmailPreviewCard` comme HTML rendu, pas comme texte échappé. Bug probablement dû à un double-échappement ou à un `pre`/`textContent` au lieu de `dangerouslySetInnerHTML`.

### 8. Police uniforme dans "envoi des infos au conférencier"
- L'éditeur Rich Text utilisé par ce mail produit des `<span style="font-size:...">` quand on tape, mais le wrapper email applique une autre taille → désaccord visuel.
- Corriger en : 
  1. Forçant le `RichTextEditor` à ne pas injecter de `font-size` inline par défaut (utiliser la taille héritée).
  2. Côté wrapper d'envoi : enrober dans un conteneur avec `font-size: 15px; font-family: Arial` et `* { font-size: inherit; font-family: inherit; }` ciblé sur le bloc corps pour neutraliser les tailles disparates.

---

## Détails techniques

**Migration SQL** : 1 migration unique pour
- ajout colonne `invoices.internal_notes`
- insertion des 5 templates email manquants
- mise à jour du template `contract_client_send` (variables + body)

**Fichiers principaux touchés**
- `src/pages/Contact.tsx`
- `src/pages/ProposalView.tsx` (pitch)
- `src/pages/InvoiceView.tsx` (suppression brouillon + champ notes admin)
- nouveau : `src/pages/SpeakerPdfView.tsx` + route admin
- `src/components/admin/ContractInvoiceManager.tsx` (variable conférencier, notes facture, branchement des nouveaux templates)
- `src/components/admin/ContractPipeline.tsx` (masquer acompte)
- `src/components/admin/EventDossier.tsx` (liaison email, infos conférencier)
- `src/components/admin/RichTextEditor.tsx` (normalisation font-size)
- `src/components/admin/EmailPreviewCard.tsx` (HTML rendering safe)
- `src/components/admin/AdminSpeakersCRM.tsx` (bouton PDF profil)
- nouvel asset : `src/assets/selfies-avec-nelly.png.asset.json`

**Pas dans le scope** : génération PDF serveur, modification du SEO/sitemap, refonte du pipeline d'événement.
