
## Objectif

Rendre les templates `speaker_event_info` (Infos) et `contract_to_speaker` (Bon de commande), éditables dans Admin > Emails, **exhaustifs** — ils contiendront toutes les lignes possibles (format, conférence, durée, auditoire, contact sur place, arrivée, parking, hôtel, technique, config salle, remarques, dress code, détails, frais VHR, etc.) — et faire en sorte qu'une ligne ne s'affiche dans l'email envoyé **que si la variable est réellement renseignée** sur le dossier.

Aujourd'hui, `renderTpl` remplace une variable manquante par une chaîne vide et laisse la balise `<li>` en place, ce qui produit des puces vides. Les templates DB sont aussi bien moins complets que le fallback hardcodé dans `buildSpeakerEmailBody`, ce qui pousse à ne jamais utiliser le template DB.

## 1. Syntaxe conditionnelle dans le moteur de template

Fichier : `src/lib/emailTemplates.ts`

Ajouter une syntaxe type mustache `{{#var}}…{{/var}}` évaluée **avant** la substitution des variables :
- Si `vars[var]` est vide (`""`, `null`, `undefined`) → tout le bloc (y compris son `<li>…</li>` englobant) est supprimé.
- Sinon → le bloc est conservé et les `{{var}}` à l'intérieur sont substitués normalement.

Filet de sécurité : après substitution, supprimer aussi les `<li>` et `<p>` qui ne contiendraient plus que du blanc ou uniquement l'étiquette avec un `<strong></strong>` vide (utile pour les templates existants non encore migrés).

Aucun impact sur les templates n'utilisant pas cette syntaxe.

## 2. Enrichir les variables passées aux templates conférencier

Fichier : `src/components/admin/EventDossier.tsx`, fonction `loadSpeakerEmailFromTemplate`.

Ajouter au dictionnaire de variables passé à `renderTpl` (avec pré-formatage identique au builder hardcodé) :
- `contact_sur_place` : concaténation `nom - téléphone - email` (vide si aucun nom)
- `arrivee`, `parking`, `hotel`, `technique`, `config_salle`, `remarques`
- `conference` (déjà présent, garder), `duree` (idem), `dress_code` (idem)

Les valeurs vides restent `""` — c'est ce qui déclenche le masquage côté template.

## 3. Réécrire les deux templates DB (exhaustifs + conditionnels)

Migration SQL sur `email_templates` (mise à jour `body_html`, `default_body_html`, `available_variables` pour les clés `speaker_event_info` et `contract_to_speaker`). Structure type (extrait) :

```html
<p>Bonjour {{prenom_conferencier}},</p>
<p>Voici comme convenu les informations concernant votre intervention :</p>
<ul>
  {{#date_evenement}}<li>📅 Date : <strong>{{date_evenement}}</strong></li>{{/date_evenement}}
  {{#lieu_evenement}}<li>📍 Lieu : <strong>{{lieu_evenement}}</strong></li>{{/lieu_evenement}}
  {{#horaires}}<li>🕐 Horaires : <strong>{{horaires}}</strong></li>{{/horaires}}
  {{#format}}<li>🎯 Format : <strong>{{format}}</strong></li>{{/format}}
  {{#conference}}<li>🎤 Conférence : <strong>{{conference}}</strong></li>{{/conference}}
  {{#duree}}<li>⏱ Durée : <strong>{{duree}}</strong></li>{{/duree}}
  {{#auditoire}}<li>👥 Auditoire : <strong>{{auditoire}}</strong></li>{{/auditoire}}
  {{#thematique}}<li>📋 Thématique : <strong>{{thematique}}</strong></li>{{/thematique}}
  {{#client}}<li>🏢 Client : <strong>{{client}}</strong></li>{{/client}}
  {{#budget}}<li>💰 Budget : <strong>{{budget}}, hors frais VHR</strong></li>{{/budget}}
  {{#details}}<li>📝 Détails : <strong>{{details}}</strong></li>{{/details}}
  {{#frais_vhr}}<li>🚗 Frais VHR : <strong>{{frais_vhr}}</strong></li>{{/frais_vhr}}
  {{#contact_sur_place}}<li>👤 Contact sur place : <strong>{{contact_sur_place}}</strong></li>{{/contact_sur_place}}
  {{#arrivee}}<li>🚗 Arrivée : <strong>{{arrivee}}</strong></li>{{/arrivee}}
  {{#parking}}<li>🅿️ Parking : <strong>{{parking}}</strong></li>{{/parking}}
  {{#hotel}}<li>🏨 Hôtel : <strong>{{hotel}}</strong></li>{{/hotel}}
  {{#technique}}<li>🔧 Technique : <strong>{{technique}}</strong></li>{{/technique}}
  {{#config_salle}}<li>🪑 Configuration salle : <strong>{{config_salle}}</strong></li>{{/config_salle}}
  {{#dress_code}}<li>👔 Dress code : <strong>{{dress_code}}</strong></li>{{/dress_code}}
  {{#remarques}}<li>💬 Remarques : <strong>{{remarques}}</strong></li>{{/remarques}}
</ul>
<p><strong>Pourriez-vous m'accuser réception de ce mail ?</strong></p>
<p>À très bientôt et bonne journée !</p>
<p>Nelly Sabde - Les Conférenciers<br>📞 06 95 93 97 91</p>
```

Le template `contract_to_speaker` reprend la même logique, réduite aux lignes Date / Lieu / Client / Budget / Détails / Frais VHR + les phrases spécifiques bon de commande.

`available_variables` mis à jour pour lister toutes les variables (utilisées pour les puces cliquables dans Admin > Emails).

## 4. Effet côté utilisateur

- Les modifs faites dans Admin > Emails s'appliquent enfin sur les dossiers (déjà réglé pour les nouveaux ; le bouton « Réinitialiser depuis le template » couvre les anciens).
- Une ligne présente dans le template mais dont la donnée n'est pas remplie sur le dossier **n'apparaît plus du tout** dans l'email envoyé (pas de puce vide).
- Un utilisateur peut ajouter/retirer une ligne dans Admin > Emails ; il suffit de respecter l'enveloppe `{{#var}}…{{/var}}`.

## Fichiers touchés

- `src/lib/emailTemplates.ts` — moteur de sections `{{#var}}…{{/var}}` + nettoyage `<li>`/`<p>` vides résiduels.
- `src/components/admin/EventDossier.tsx` — enrichissement des variables passées à `renderTpl` dans `loadSpeakerEmailFromTemplate`.
- Migration `email_templates` (clés `speaker_event_info`, `contract_to_speaker`) : nouveau `body_html`, `default_body_html`, `available_variables`.
