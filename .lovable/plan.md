## Plan d'implémentation - Améliorations CRM (Contrats & Leads)

11 demandes regroupées en 4 zones : Leads, Contrats (création/édition/envoi/signature), Dossier événement, Feuille de liaison.

---

### 1. Leads — Suppression de lignes
**Fichier :** `src/components/admin/AdminLeads.tsx`
- Ajouter bouton corbeille par ligne avec `AlertDialog` de confirmation
- DELETE sur `simulator_leads` (RLS actuelle ne le permet pas → migration pour autoriser DELETE aux authenticated)

---

### 2. Contrat — Reprendre la date d'événement de la proposition
**Fichier :** `src/components/admin/ContractInvoiceManager.tsx` (création contrat)
- Lors de la création d'un contrat depuis une proposition acceptée, pré-remplir `event_date` depuis `proposals.event_date_text` (parser si possible) sinon laisser vide
- Pré-remplir aussi `event_location` depuis `proposals.event_location`

---

### 3. UX édition contrat — Supprimer le scroll horizontal
**Fichier :** `src/components/admin/ContractInvoiceManager.tsx`
- Refonte du formulaire d'édition : passage en layout vertical/grille responsive
- Remplacer les tableaux larges (lignes de contrat) par cartes empilées sur écrans étroits
- `max-w` adapté au dialog, `overflow-x-hidden`

---

### 4. Envoi contrat — Lier automatiquement le destinataire + changer l'intervenant
**Fichiers :** `src/components/admin/ContractInvoiceManager.tsx`, `supabase/functions/send-contract-email/index.ts`
- **Envoi :** supprimer le menu déroulant destinataire → utiliser directement `proposals.client_email` / `recipient_name`
- **Édition :** ajouter un sélecteur d'intervenant dans le formulaire d'édition contrat (parmi `proposal_speakers` initiaux), stocker dans `contracts.selected_speaker_id` (nouvelle colonne) ou réutiliser `events.selected_speaker_id`

---

### 5. Mise à jour automatique "Contrat env." (jalon dossier)
**Fichiers :** `supabase/functions/send-contract-email/index.ts` ou côté client après envoi
- Après envoi réussi du contrat, UPDATE `events.contract_sent_speaker_at = now()` pour le `proposal_id` correspondant
- Le jalon "Contrat env." dans `EventDossier` se mettra à jour automatiquement

---

### 6. Badge rouge "Non signé" dans la vue contrat
**Fichier :** `src/pages/ContractView.tsx` (et `SpeakerContractView.tsx` si applicable)
- Si `contracts.status !== 'signed'` (ou `signed_at IS NULL`), afficher bandeau rouge en haut : "⚠ Contrat non signé"
- Masquer en mode impression (`print:hidden`)

---

### 7. Signature visuelle après signature
**Fichier :** `src/pages/ContractView.tsx`
- Dans case "Le client" : afficher "Bon pour accord" + `signer_name` en police manuscrite (Google Font : `Caveat` ou `Dancing Script`)
- Dans case "Les Conférenciers Société Eve" : placeholder pour signature de Nelly (image à fournir plus tard, on prépare le slot avec un fallback texte)
- Badge vert en haut : "✓ Contrat signé le [date]"
- Charger la police dans `index.html` ou via `index.css`

---

### 8. PDF du contrat signé → stocké dans "Contrats signés reçus"
**Approche :** génération côté client via `html2canvas` + `jsPDF` (ou `react-to-print` → upload)
- Au moment de la signature (`ContractSign.tsx`) : après UPDATE du contrat, générer un PDF de la vue signée, uploader dans bucket `signed-contracts`, créer une ligne `signed_contract_files`
- Ajouter dépendances `html2canvas` + `jspdf`

---

### 9. Fusion jalons 4, 5, 6 en "AR speaker"
**Fichiers :** `src/components/admin/EventDossier.tsx`, schema events
- Identifier les 3 colonnes actuelles (probablement `info_sent_speaker_at`, `contract_sent_speaker_at`, `speaker_acknowledgment_at` ou `speaker_signed_contract_at`)
- Garder `speaker_acknowledgment_at` comme jalon unique "AR speaker"
- Masquer les autres dans l'UI (sans supprimer les colonnes pour préserver l'historique)

⚠ À confirmer avec l'utilisateur : quelles sont précisément les étapes 4, 5, 6 affichées chez lui ?

---

### 10. Étape "Visio" → choisir date + heure
**Fichier :** `src/components/admin/EventDossier.tsx`
- Au clic sur le jalon Visio, ouvrir Dialog avec inputs `date` (visio_date) + `time` (visio_time)
- Save sur `events.visio_date` et `events.visio_time` (colonnes déjà existantes)

---

### 11. Feuille de liaison — renommage + reprise détails + aperçu
**Fichiers :** `src/components/admin/EventDossier.tsx` (édition), `src/pages/LiaisonSheetView.tsx`
- Renommer label UI "Configuration de la salle" → "Détails techniques" (`room_setup` reste comme champ DB)
- Pré-remplir `events.notes` (Commentaires) avec `contracts.event_description` (champ "Détails" du contrat) si vide
- Bouton "Aperçu" qui ouvre `/feuille-liaison/:id` dans nouvel onglet avant envoi (déjà la route existante)

---

## Migrations DB nécessaires

```sql
-- 1. Permettre DELETE sur simulator_leads
CREATE POLICY "Authenticated can delete leads" ON simulator_leads FOR DELETE TO authenticated USING (true);

-- 4. Stocker l'intervenant choisi sur le contrat
ALTER TABLE contracts ADD COLUMN selected_speaker_id uuid;
```

---

## Dépendances à ajouter
- `html2canvas`, `jspdf` (génération PDF signé)
- Police Caveat (signature manuscrite) via Google Fonts

---

## Questions avant implémentation
1. **Point 9** : Peux-tu me confirmer les libellés actuels des étapes 4, 5, 6 dans le suivi du dossier ? (pour être sûr de fusionner les bonnes)
2. **Point 7** : OK pour utiliser la police Google "Caveat" en attendant la vraie signature image de Nelly ?
3. **Point 8** : OK pour génération PDF côté navigateur au moment de la signature (rapide, pas de coût serveur) ?

Je peux démarrer immédiatement sur 1, 2, 3, 5, 6, 10, 11 qui sont sans ambiguïté, et attendre tes réponses pour 4, 7, 8, 9 si tu préfères. Dis-moi si je fonce sur tout.