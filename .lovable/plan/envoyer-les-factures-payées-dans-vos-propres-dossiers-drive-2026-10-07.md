# Envoyer les factures payées dans vos propres dossiers Drive

## Problème

Votre connexion Google Drive actuelle n'autorise l'écriture que dans les dossiers créés par l'application (« Factures payées/2026-10 »). Le dossier « Octobre 2026 » que vous avez créé vous-même est lisible mais pas modifiable avec ces droits.

## Solution

### 1. Reconnexion Google Drive avec droits étendus
Reconnecter la connexion « David's Google Drive » avec le droit d'accès complet au Drive (`drive`), ce qui permettra d'écrire dans n'importe lequel de vos dossiers. Une carte de reconnexion s'affichera : il suffira de valider l'autorisation Google.

### 2. Table de correspondance mois → dossier
Nouvelle table `drive_folder_settings` :
- `month` (texte, clé primaire, format `2026-10`)
- `folder_id` (texte)
- `folder_name` (texte)
- RLS : lecture/écriture pour les utilisateurs connectés (admin)

### 3. Fonction d'envoi modifiée
`upload-invoice-drive` : au moment de l'envoi, chercher d'abord si un dossier est configuré pour le mois de paiement. Si oui, envoyer le PDF dans ce dossier. Sinon, comportement actuel inchangé (création automatique « Factures payées/YYYY-MM »).

### 4. Réglage dans l'admin
Dans le gestionnaire de factures (ContractInvoiceManager), une petite zone « Dossier Drive » : coller l'URL d'un dossier Drive pour le mois en cours, l'enregistrer. L'ID du dossier est extrait automatiquement de l'URL.

### 5. Configuration initiale
Enregistrer dès maintenant la correspondance : mois `2026-10` → dossier « Octobre 2026 » (1qn00UIg9KG94ktBU-TIUQ0YP0RuOXwUy).

## Détails techniques
- Table `public.drive_folder_settings` avec GRANT + RLS (authenticated).
- Extraction de l'ID dossier depuis l'URL via regex `/folders/([a-zA-Z0-9_-]+)`.
- La fonction edge vérifie l'override avant le fallback `findOrCreate`.
- Aucune modification des factures déjà envoyées.

## Vérification
- Marquer une facture de test comme payée et vérifier que le PDF arrive dans « Octobre 2026 ».
- Vérifier qu'un mois sans dossier configuré retombe sur le comportement automatique.
