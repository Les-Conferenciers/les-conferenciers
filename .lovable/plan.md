# BDC 1088 : un seul contrat signé, toujours avec les articles détaillés

## Constat (vérifié en base)
- Le BDC 1088 a bien été signé par Catherine Querard le 15/10. Mais son état dans l'admin est « En cours » (brouillon), pas « Archivé/Signé ». Il a probablement été repassé à la main.
- L'aperçu « Voir » et la fiche décident si le contrat est signé selon cet état, et non selon la signature réelle. Résultat : l'aperçu montre les articles détaillés sans la signature, donc le contrat a l'air non signé.
- La fiche contient 4 PDF signés portant le même nom (15/10, puis 3 régénérations le 19/10). Celui du 15/10 est l'ancien, avec le résumé des articles. Les autres ont les articles détaillés. Comme ils ont le même nom, on ne peut pas savoir lequel est le bon.

## Ce qui change
1. **Signé = signature réelle** : dès qu'un client a signé, l'aperçu « Voir », la fiche et la page client affichent la signature (nom, date, « Bon pour accord »), quel que soit l'état choisi à la main. L'état manuel ne sert plus qu'au classement (En cours / En attente de paiement / Archivé).
2. **PDF signés lisibles** : chaque PDF a un nom clair, par exemple « Contrat signé BDC-1088 – original 15/10 » ou « Contrat signé BDC-1088 – régénéré 19/10 14h11 ». Le plus récent porte le badge « Version à jour ». Les anciens, générés avec le résumé, sont marqués « Ancien format (résumé) ».
3. **Nettoyage** : un bouton permet de supprimer un ancien PDF, avec une confirmation. Pour le 1088, vous pourrez garder seulement la dernière version détaillée.
4. **Vérification** : je contrôle sur le BDC 1088 que « Voir », la page client et le dernier PDF montrent le même contrat, signé et avec les articles détaillés.

## Détails techniques
- `ContractView.tsx` (signatures lignes 463/474) et les badges ou blocs de `EventDossier.tsx` (ligne 2292) : remplacer `status === "signed"` par `!!signed_at` pour l'affichage de la signature. `ContractParticulars` le fait déjà (`isSigned`).
- `ContractSign.tsx` : `setSigned` sur `signed_at`, et pas seulement sur le statut, pour que le client ne puisse pas re-signer.
- `upload-signed-contract` : nom de fichier `Contrat-signe-<BDC>-<original|regenere>-<date>.pdf`. `SignedContractUpload.tsx` : libellés, badge sur le plus récent, mention « ancien format » pour les fichiers d'avant le 19/10 09:00, suppression (storage + ligne `signed_contract_files`).
- Pas de changement du statut en base, sauf si vous le demandez.
