Objectif : corriger la dialog “Éditer la proposition” pour qu’elle soit entièrement utilisable sur MacBook Air et PC, sans couper le contenu ni masquer la colonne de droite.

Plan :
1. Remplacer la structure actuelle de la dialog d’édition dans `src/pages/Admin.tsx` :
   - garder la popup centrée avec une largeur bornée ;
   - passer le conteneur en `flex flex-col overflow-hidden p-0` ;
   - rendre seulement le contenu interne scrollable avec `overflow-y-auto`.
2. Mettre le header de la popup en zone fixe :
   - titre visible en haut ;
   - padding/bordure cohérents avec les dialogs déjà corrigées.
3. Encapsuler tout le formulaire d’édition dans une zone scrollable interne :
   - `min-w-0`, `overflow-x-hidden`, `flex-1`, `min-h-0` ;
   - éviter que le scroll appartienne à toute la dialog, ce qui provoque aujourd’hui l’effet “écran coupé”.
4. Corriger les grilles internes qui forcent la largeur sur petit écran :
   - champs client/email et champs tarifs en `grid-cols-1 sm:grid-cols-2` ;
   - ajouter `min-w-0` aux blocs sensibles pour empêcher le débordement horizontal caché qui coupe la colonne “Email / Frais / Prix”.
5. Appliquer le même pattern à la popup “Créer une proposition” de cette même page si elle partage le même formulaire et peut produire le même bug.
6. Vérifier visuellement en viewport MacBook Air proche de la capture (`1139×779`) que :
   - la dialog tient dans l’écran ;
   - le titre reste visible ;
   - la colonne droite n’est plus tronquée ;
   - le contenu se parcourt par scroll vertical interne.