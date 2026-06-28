## Root cause

Le bug "Régis Rossi non propagé" vient d'une seule cause technique : la colonne `base_price` n'existe pas dans la table `proposal_speakers`. Les colonnes réelles sont : `speaker_fee`, `travel_costs`, `agency_commission`, `total_price`, `selected_conference_ids`, `display_order`.

Du coup, à chaque fois qu'on change le conférencier :
- `src/pages/ContractView.tsx` (ligne 213) essaie d'insérer une ligne `proposal_speakers` avec `base_price: …` → la requête est rejetée en 400 (`PGRST204 - Could not find the 'base_price' column`).
- Idem côté `src/components/admin/EventDossier.tsx` (ligne 2668).

Conséquence : la ligne `proposal_speakers` pour Régis Rossi n'est jamais créée. Les composants qui font `proposal_speakers.find(s => s.speaker_id === selected_speaker_id)` (feuille de liaison, communication conférencier, facture pour le nom à côté de la ligne) retombent silencieusement sur le premier conférencier = Laurent Alexandre.

À noter : la réécriture de `contract_lines` a bien marché (le contrat en base a déjà `label: "Régis Rossi"`), donc seule la partie facture qui s'appuie sur `proposal_speakers` est concernée.

## Correctif

### 1. Code — supprimer `base_price` des inserts `proposal_speakers`

**`src/pages/ContractView.tsx`** (autour de la ligne 213) : retirer `base_price` du payload `insert`. Garder uniquement les colonnes réelles : `speaker_fee`, `travel_costs`, `agency_commission`, `total_price`. Mettre des fallbacks à `0` quand les valeurs ne sont pas connues.

**`src/components/admin/EventDossier.tsx`** (autour de la ligne 2665) : même correction, supprimer `base_price` de l'insert.

Vérifier aussi le `update` conditionnel dans ContractView.tsx (~ligne 229) — s'il référence `base_price`, le retirer.

### 2. Données — réparer le dossier Davido Consulting

Pour la proposition `a8773313-c96b-4c75-90a3-503ad3515522`, insérer la ligne `proposal_speakers` manquante pour Régis Rossi (`45b5b64c-16d3-418e-97fa-0bd746458d88`) en clonant les montants de la ligne Laurent Alexandre (`ded5156d-ae99-4fbe-850a-9456363f4fe8`) : `speaker_fee`, `travel_costs`, `agency_commission`, `total_price`.

### 3. Garde-fou

Dans `ContractView.tsx`, en cas d'erreur d'insertion `proposal_speakers`, afficher un `toast.error` explicite (au lieu de continuer silencieusement). Évite que le même type de bug passe inaperçu.

## Vérification post-fix (par l'utilisateur)

- Recharger `/admin/contrat/f8fdc500-…` → la feuille de liaison du dossier affiche "Régis Rossi".
- Le bloc "Communication conférencier" du dossier événement cible Régis Rossi.
- La facture `20260701-1034` affiche Régis Rossi comme conférencier.

Aucun changement de schéma DB n'est requis.
