## Mise à jour du plan — point 2 (Feuille de liaison email conférencier)

Remplacement du sous-point « Forcer le tutoiement » par :

**Choix tutoiement / vouvoiement dans la pop-up d'envoi**

Dans le dialogue d'envoi de la feuille de liaison (`EventDossier.openLiaisonDialog` → `Dialog` du brouillon email conférencier) :

- Ajouter un sélecteur `RadioGroup` (ou `Select`) en haut du dialogue, juste au-dessus du champ « Objet » :
  - Options : **Vouvoiement** / **Tutoiement**
  - Valeur par défaut chargée depuis `speaker.formal_address` (`true` → Vouvoiement, `false` → Tutoiement).
- Stocker la valeur dans un nouvel état local `liaisonAddressing: "formal" | "informal"`.
- Le template du corps de l'email (`liaisonSpeakerBody`) et la phrase d'accusé de réception sont régénérés à chaque changement du sélecteur :
  - **Vouvoiement** : « Bonjour [Prénom], … **Pourriez-vous m'accuser réception de ce mail ?** … Je vous souhaite … »
  - **Tutoiement** : « Bonjour [Prénom], … **Peux-tu m'accuser réception de ce mail ?** … Je te souhaite … »
- Lorsque l'utilisatrice modifie le sélecteur après avoir édité manuellement le corps, afficher une confirmation `window.confirm("Régénérer le brouillon avec le nouveau choix ? Vos modifications seront perdues.")` avant d'écraser.
- Aucune modification du champ `formal_address` en base : le choix est ponctuel et ne modifie pas la fiche conférencier.

**Le reste du point 2 reste identique** : objet `Conférence du [date] - [Client]`, phrase d'accusé en gras (`<strong>…</strong>`), remplacement du `Textarea` par `SimpleRichTextEditor`.

---

## Le reste du plan (points 1, 3–10) reste inchangé

Voir version précédente — tous les autres éléments (pré-remplissage contrat avec remontée `previous_proposal_id`, suppression « Format », nouveau template email contrat client, case Détails conditionnelle, masquage acompte client, suppression préfixe BDC + J-n, visio basée sur `visio_date/visio_time`, refonte facturation avec IBAN/BIC réels + numérotation JJMM-BDC + notes + nom de fichier, pré-remplissage tech feuille de liaison + contacts client/conférencier, nouveau corps relance info, formulation budget, upload 50 Mo) restent à implémenter tels que décrits.