
# Plan — 14 améliorations CRM en 4 lots

Livraison **lot par lot** pour valider à chaque étape et éviter les régressions. Chaque lot = une livraison séparée, je m'arrête après pour ton feu vert avant d'enchaîner.

---

## Lot A — Emails (envoi, CC, brouillons, variables)

Couvre les points #1, #5, #6, #7, #8, #10, #12.

1. **#1 — CC sur l'envoi d'une proposition** : ajout d'un champ « Emails en copie » (multi-adresses, séparées par virgule ou Entrée, validation format) dans le dialog d'envoi de proposition. Côté edge function `send-proposal-email`, ajout du paramètre `cc` transmis à Resend. Vérification que chaque destinataire en copie reçoit bien le message (logs `email_send_log`).
2. **#12 — CC sur l'envoi de la facture d'acompte** : même mécanique sur le dialog d'envoi de facture + edge function correspondante.
3. **#5 — Variable « détails » du BDC dans le mail conférencier** : exposition du champ `proposals.fee_details` (ou équivalent BDC) comme variable `{{details_bdc}}` dans le template du mail d'infos conférencier, et insertion par défaut dans le corps.
4. **#6 — Format budget** : remplacement de `{montant} HT €` par `{montant} € HT` partout où le template d'infos conférencier rend le budget (helper de formatage commun pour ne pas oublier d'autres endroits).
5. **#7 — Frais VHR dans le template** : ajout d'une variable `{{frais_vhr}}` (lue depuis le contrat / event) et d'une ligne dédiée dans le template.
6. **#8 — Brouillon du mail d'infos conférencier** : alignement sur le workflow propositions/contrats. Bouton « Enregistrer en brouillon » + statut `draft` stocké en base, puis bouton « Envoyer » qui réutilise le brouillon. Liste des brouillons rééditable.
7. **#10 — Audit footer feuille de liaison** : ouverture du template mail (client + conférencier), vérification du bloc « 📋 FEUILLE DE LIAISON … » en pied de mail visible dans ta capture. Si présent → suppression du bloc redondant (les infos sont déjà dans la feuille jointe / lien). Confirmation écrite après inspection.

---

## Lot B — Contrats (édition, bugs, statuts, facture solde)

Couvre les points #3, #4, #13, #14.

1. **#3 — Édition du conférencier dans la vue contrat** : remplacement de l'affichage statique du nom par un combobox (search + dropdown) listant les conférenciers actifs, pré-sélectionné sur la valeur actuelle. Au changement :
   - update `contracts.speaker_id` + nom dénormalisé,
   - update `events.selected_speaker_id` lié,
   - update de la feuille de liaison liée,
   - les futurs mails (communication conférencier, feuille de liaison, infos) lisent automatiquement le nouveau conférencier.
   Pas de propagation vers la proposition source ni vers les mails déjà envoyés (conformément à ta réponse).
2. **#4 — Bug Dorine Bourneton absente du contrat Safran BDC 1040** : reproduction du cas (contrat créé sans proposition). Diagnostic ciblé du chemin « création contrat direct → rendu PDF / HTML » : le champ conférencier n'est probablement pas mappé sur ce chemin. Correctif sur le générateur de contrat pour utiliser le même fallback que le chemin « depuis proposition ».
3. **#13 — Facture de solde impossible après acompte réglé (BDC 1041 EDF)** : reproduction sur le BDC 1041, lecture des logs et du composant de génération facture solde. Probable cause : condition qui exige une proposition ou bloque si une facture d'acompte existe. Correctif + test sur le cas EDF.
4. **#14 — Statuts contrats manuels avec bouton « revenir au précédent »** : ajout d'un sélecteur de statut sur la fiche contrat avec les valeurs `en cours`, `attente de paiement`, `à archiver`. Historique du statut précédent stocké pour permettre un bouton « ↶ Statut précédent ». Filtres CRM mis à jour pour inclure le nouveau statut « attente de paiement ».

---

## Lot C — Feuille de liaison UI + Facture acompte 1 page

Couvre #9 et #11.

1. **#9 — UI édition feuille de liaison** :
   - agrandir le champ « Lieu de l'intervention » (textarea multilignes au lieu d'input court),
   - agrandir le champ « Horaires »,
   - supprimer la case « Configuration de la salle »,
   - ajouter une case « Besoins logistiques » (textarea large, ~6 lignes).
2. **#11 — Facture d'acompte sur 1 page** : compactage du template PDF facture d'acompte (padding, taille des blocs entête/pied, hauteur lignes tableau, font-size). Test d'impression sur un cas réel pour valider la tenue sur une page A4.

---

## Lot D — Leads : recherche par email

Couvre #2.

1. **#2 — Recherche par email dans Leads** : extension du champ de recherche existant pour matcher aussi `email` (en plus de nom / société). Si pas de champ recherche actuellement, ajout d'un input « Rechercher par nom, société ou email » avec filtrage côté client (les leads sont déjà chargés).

---

## Détails techniques

- **Lot A** : modifs principales dans `src/pages/Admin.tsx` (dialogs envoi proposition + facture), `supabase/functions/send-proposal-email`, `send-invoice-email`, `send-speaker-info-email`, et les templates dans `supabase/functions/_shared/transactional-email-templates/`. Une migration légère si #8 nécessite une colonne `draft_*` sur la table d'envoi infos conférencier.
- **Lot B** : modifs dans le composant de vue/édition contrat, le générateur PDF contrat, le générateur facture solde, et migration pour le champ `previous_status` sur `contracts`.
- **Lot C** : composant feuille de liaison + template PDF facture d'acompte (CSS print).
- **Lot D** : simple modif du filtre dans le composant Leads.
- Après chaque lot, je redéploie les edge functions concernées et tu valides avant que j'enchaîne le suivant.

---

## Ordre proposé

**Lot B en premier** (contient les 3 bugs bloquants #4, #13, et l'édition conférencier #3 qui est très demandée), puis **Lot A** (gros lot emails), puis **Lot C**, puis **Lot D**.

Confirme-moi l'ordre (ou dis si tu préfères commencer par A) et j'attaque le premier lot.
