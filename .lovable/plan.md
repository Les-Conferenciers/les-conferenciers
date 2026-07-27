## Réponse à la question « pourquoi le template speaker_event_info ne s'applique pas »

Le générateur de mail conférencier (`openSpeakerEmail` dans `EventDossier.tsx`, lignes 1173-1186) applique **le brouillon sauvegardé sur le dossier avant le template** :

```
if (savedSubject || savedBody) {  // events.speaker_info_email_body
   setSpeakerEmailBody(savedBody)  // ← court-circuite le template DB
   return
}
```

Donc, dès qu'un dossier a été édité/enregistré une fois via « Enregistrer le brouillon » (ou envoyé), le contenu figé dans `events.speaker_info_email_body` remplace toujours le template. Les modifs faites dans Admin > Emails ne s'appliquent qu'aux **nouveaux dossiers** sans brouillon.

## Correctifs

### 1. Supprimer la ligne « 🚗 Frais VHR : Pris en charge directement par le client »

Puisque le budget intègre désormais la mention « hors frais VHR », la ligne VHR n'a plus lieu d'être quand aucun frais explicite n'est facturé.

Dans `src/components/admin/EventDossier.tsx`, fonction `buildSpeakerEmailBody` :
- `vhrStr` : ne renvoyer une valeur **que** si `travel > 0`, sinon `""` — ainsi le helper `line()` masque la ligne (les deux templates hardcodés info + contract).
- Idem dans `openSpeakerEmail` (variable `vhrStr` ligne 1197-1199) pour la variable `{{frais_vhr}}` transmise au template DB.

Aucune modification du template DB : l'utilisateur gère lui-même son contenu depuis l'admin. Si `frais_vhr` est vide, le template affichera une ligne VHR vide → on ajoute donc côté template DB une mise à jour ciblée pour retirer la ligne `<li>🚗 Frais VHR ...</li>` de `speaker_event_info` et `contract_to_speaker` (uniquement sur `body_html` actuel + `default_body_html`), en conservant l'édition « hors frais VHR » dans la ligne Budget que l'utilisateur a déjà faite.

### 2. Bouton « Réinitialiser depuis le template »

Ajouter dans le dialog d'email conférencier un bouton « Réinitialiser depuis le template » qui :
- vide le brouillon sauvegardé (`speaker_info_email_body/subject/cc` ou variantes contract) ;
- recharge le corps depuis le template DB `speaker_event_info` / `contract_to_speaker` (fallback hardcodé si absent).

Ainsi, sur les dossiers déjà édités (comme Davido Consulting), un clic suffit pour appliquer les modifs faites dans Admin > Emails.

## Fichiers touchés

- `src/components/admin/EventDossier.tsx` : `buildSpeakerEmailBody` (2 lignes VHR conditionnelles), `openSpeakerEmail` (vhrStr conditionnel), bouton reset dans le dialog speaker email.
- Migration SQL ciblée sur `email_templates` (keys `speaker_event_info`, `contract_to_speaker`) : suppression de la ligne `<li>🚗 Frais VHR ...</li>` dans `body_html` et `default_body_html` uniquement.
