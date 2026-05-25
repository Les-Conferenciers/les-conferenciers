## Plan

### 1. Aperçu masqué par défaut
- Ajouter un état `showContractPreview` (false par défaut).
- Remplacer la colonne droite permanente par un bouton œil (icône `Eye`) placé en haut de la dialog ; au clic, on bascule la dialog en deux colonnes et on affiche l'aperçu.
- Quand l'aperçu est caché, la dialog reste sur une seule colonne (largeur `max-w-2xl`). Quand il est affiché, elle passe en `max-w-6xl` deux colonnes.

### 2. Sauts de ligne dans le template
Dans `openContractEmail()`, insérer un `<p>&nbsp;</p>` (paragraphe vide = ligne vide) avant chacun des éléments suivants :
- avant le bloc « Voici un petit récapitulatif » (donc juste après « intervention de [Conférencier] »)
- avant « Vous pouvez consulter le contrat »
- avant « N'hésitez pas à me contacter »
- avant « Dans l'attente de votre retour »
- avant « Bien cordialement, Nelly Sabde »

### Fichier modifié
- `src/components/admin/EventDossier.tsx`