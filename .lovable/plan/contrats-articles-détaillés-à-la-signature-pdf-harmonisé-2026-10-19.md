# Contrats : articles détaillés à la signature + PDF harmonisé

## Constat (vérifié)
- La page de signature en ligne n'utilise pas les articles du contrat. Elle affiche un résumé fixe des conditions générales (Articles 1 à 11 en une ligne chacun), avec « 50% à la signature » écrit en dur. Le bouton « Voir » de l'admin, lui, affiche les articles détaillés et vos modifications.
  - **BDC 1087** : l'article 5.1 a bien été modifié à 30% en base. Mais la page de signature montrait le texte fixe à 50% : la cliente n'a jamais vu votre version.
  - **BDC 1088** : le PDF signé archivé a été pris en photo depuis cette même page. Il contient donc le résumé, pas les articles détaillés.
- Le PDF signé est une capture de l'écran du client. Si le client signe sur téléphone (cas du **BDC 1093**), le PDF reprend la mise en page mobile : texte énorme, colonnes écrasées. C'est pour ça que les PDF n'ont pas tous le même rendu.

## Ce qui change
1. **Une seule présentation du contrat** : la page de signature affiche exactement le même contrat que le bouton « Voir ». Ce sont les mêmes articles détaillés, avec vos modifications et les articles retirés masqués. Le prix et l'acompte suivent ce qui est réglé dans le contrat (avec ou sans acompte, ou texte modifié).
2. **PDF signé toujours au même format** : le PDF est généré en format A4 de bureau, quel que soit l'appareil du client. On évite les coupures au milieu d'un paragraphe quand c'est possible, et la signature figure en dernière page. Le rendu est propre, lisible et identique pour tous les contrats.
3. **Page de signature lisible sur mobile** : l'affichage s'adapte au téléphone pour la lecture. Le PDF archivé, lui, reste au format A4.
4. **Contrats déjà signés (1088, 1093 et les autres)** : un bouton « Régénérer le PDF signé » dans la fiche contrat recrée le PDF au bon format, avec les articles détaillés, le nom du signataire et la date d'origine.
5. **BDC 1087** : le contrat n'est pas encore signé. Une fois le correctif publié, renvoyez-lui le même lien : elle verra le 30%.

## Détails techniques
- Créer un composant partagé `ContractDocument` (rendu bon de commande + CG via `DEFAULT_CLAUSES` / `getClauseHtml` / `isClauseRemoved` / `getCustomClausesText`, avec le texte d'acompte selon `deposit_required`), utilisé par `ContractView.tsx` et `ContractSign.tsx`. Supprimer le résumé codé en dur de `ContractSign`.
- Génération du PDF : cloner le document dans un conteneur hors écran à largeur fixe (794 px, A4 à 96 dpi). Lancer html2canvas avec `windowWidth: 794`, découper les pages sur les limites des blocs (`break-inside: avoid`), avec des marges. Le code est mis en commun dans `src/lib/contractPdf.ts`.
- Régénération admin : ouvrir `/contrat/:token` dans un iframe caché (même principe que `invoicePdf.ts`), générer le PDF puis appeler `upload-signed-contract` avec le signataire et la date existants. Vérifier que la fonction accepte un contrat déjà signé, et l'adapter côté admin si besoin.
- Vérification : rendu Playwright à 390 px et 1280 px pour les BDC 1087, 1088 et 1093. Contrôle du PDF généré en images (format A4, articles détaillés, 30% pour le 1087).
