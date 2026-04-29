## Objectif

Dans l'onglet **Leads** (Admin), remplacer le bouton "Répondre par email" par **"Créer la proposition"** qui ouvre directement le formulaire de création de proposition pré-rempli avec les infos du lead, et qui rattache automatiquement le client existant ou prépare la création d'un nouveau client.

## Comportement attendu

1. Dans la modale "Détail du lead", le bouton bas devient **"Créer la proposition"** (icône FileText).
2. Au clic :
   - On cherche un client existant dans la base (`clients`) dont l'email correspond à celui du lead (recherche insensible à la casse).
   - **Si trouvé** : la proposition s'ouvre en mode "client existant" avec ce client pré-sélectionné.
   - **Sinon** : la proposition s'ouvre en mode "nouveau client", avec les champs pré-remplis (nom société, email, téléphone, contact). À la soumission, le client sera créé automatiquement (logique déjà existante).
3. Les champs de l'événement sont aussi pré-remplis : lieu, date, taille de l'auditoire, message du client (collé dans le champ message interne de la proposition pour contexte).
4. La modale de détail du lead se ferme et l'utilisateur bascule sur l'onglet **Propositions** avec le dialogue de création ouvert.

## Mapping lead → proposition

| Lead (simulator_leads) | Proposition |
|---|---|
| `company` (ou "first_name last_name" si vide) | `client_name` (nom société) |
| `first_name + last_name` | `recipient_name` (interlocuteur) |
| `email` | `client_email` |
| `phone` | `client_phone` |
| `location` | `event_location` |
| `event_date` | `event_date_text` |
| `audience_size` | `audience_size` |
| `additional_info` + `objective` + `themes` | `message` (récap concaténé) |

Le `proposal_type` reste **"classique"** par défaut (l'utilisateur peut basculer ensuite).

## Implémentation technique

### 1. Mécanisme de transmission Leads → Propositions

Comme les deux onglets sont des composants frères dans `Admin.tsx`, on utilise **`sessionStorage`** comme tampon (clé `pendingProposalDraft`) + navigation via `setSearchParams({ tab: "propositions" })`.

- `AdminLeads.tsx` : au clic sur "Créer la proposition", recherche du client puis :
  ```ts
  sessionStorage.setItem("pendingProposalDraft", JSON.stringify({
    clientId, clientName, clientEmail, recipientName, clientPhone,
    eventLocation, eventDateText, audienceSize, message,
  }));
  // navigate vers ?tab=propositions
  ```

- `AdminProposalsContent` (dans `Admin.tsx`) : un `useEffect` au montage lit `sessionStorage`, applique les setters, ouvre `setDialogOpen(true)`, puis efface l'entrée.

### 2. Détection du client existant

Requête simple côté client :
```ts
const { data } = await supabase
  .from("clients")
  .select("id, company_name, contact_name, email, phone")
  .ilike("email", lead.email)
  .limit(1)
  .maybeSingle();
```
Si résultat → mode `"search"` + `selectedClientId` rempli. Sinon → mode `"new"`.

### 3. UI du bouton (AdminLeads.tsx)

Remplace le `<a href="mailto:...">` par un `<Button onClick={handleCreateProposal}>` avec icône `FileText` (lucide-react). On garde aussi un petit lien secondaire "Envoyer un email" optionnel ? **Non** — la demande est claire : on remplace.

## Fichiers modifiés

- `src/components/admin/AdminLeads.tsx` — remplace le bouton, ajoute la fonction `handleCreateProposal` (lookup client + sessionStorage + navigation).
- `src/pages/Admin.tsx` (`AdminProposalsContent`) — ajoute un `useEffect` qui détecte un brouillon en sessionStorage au montage et ouvre le dialogue pré-rempli.

## Hors périmètre

- Pas de changement de schéma de DB.
- Pas de suppression du lead après création de la proposition (l'utilisateur peut continuer à le voir dans l'onglet Leads).
- Pas de lien "logique" persistant entre `simulator_leads` et `proposals` (juste un pré-remplissage one-shot).
