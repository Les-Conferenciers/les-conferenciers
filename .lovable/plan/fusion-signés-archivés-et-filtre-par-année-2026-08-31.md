# Fusion Signés + Archivés, et filtre par année

## Objectif

Dans l'onglet Contrats de l'admin :
1. Supprimer le sous-onglet « Signés » et le fusionner dans « Archivés » — les contrats signés et les dossiers gagnés/perdus cohabitent dans la même vue.
2. Ajouter un filtre par année, basé sur la date de l'événement.

## Résultat attendu

- 3 sous-onglets : **En cours**, **En attente de paiement**, **Archivés** (signés + gagnés + perdus).
- Dans « Archivés », le filtre existant Gagnés/Perdus gagne une option **Signés** (contrats au statut « signé » mais dossier pas encore soldé/perdu).
- Un nouveau filtre **Année** (déroulant des années présentes dans les dates d'événement, ex. 2025, 2026, 2027 + « Toutes »), disponible sur tous les onglets, qui filtre sur la date d'événement. Les dossiers sans date restent visibles quand « Toutes » est sélectionné ; avec une année choisie, seuls les événements de cette année apparaissent.

## Détail technique

**`src/components/admin/AdminEventDossiers.tsx`**
- État `tab` : retrait de `"signes"` → `"en_cours" | "attente_paiement" | "archives"`.
- État `yearFilter` : `"all" | string` (année), calcul de la liste des années distinctes depuis `eventDateRaw` (tri décroissant).
- `archiveFilter` étendu : `"all" | "gagne" | "perdu" | "signe"`.
- Filtrage onglet Archivés : `isArchived || contractStatus === "signed"` ; sous-filtre gagné/perdu/signé appliqué ensuite.
- Filtrage année : si `yearFilter !== "all"`, garder les lignes dont l'année de `eventDateRaw` correspond (les lignes sans date sont exclues quand une année est sélectionnée).
- Compteurs : `signes` supprimé, `archives` inclut signés + gagnés + perdus ; compteur `signes` réutilisé dans le sous-filtre.
- UI : suppression du `TabsTrigger` Signés ; le déroulant de filtre archivé affiché aussi pour « signé » ; ajout d'un `Select` année à côté de la recherche, visible sur tous les onglets.
- Pagination : le filtre année s'applique avant la pagination (150 lignes par défaut inchangées).

Aucune migration base de données : le statut `signed` reste en base, seul le regroupement d'affichage change.
