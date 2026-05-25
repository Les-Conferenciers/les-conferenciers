## 1. Pop-up "Communication conférencier"

Fichier : `src/components/admin/EventDossier.tsx` (fonction `openSpeakerEmail` ~ligne 943, dialog ~ligne 2738).

### a. Sélecteur tutoiement / vouvoiement
- Nouvel état `speakerEmailAddressing: "formal" | "informal"`, initialisé d'après `speaker.formal_address`.
- Radio « Tu / Vous » dans la pop-up (même composant que la pop-up Feuille de liaison).
- Extraire `buildSpeakerEmailBody(type, addressing, ...)` pour régénérer le corps au changement de radio.

### b. Date dans l'objet
Réutiliser `liaisonEventDateFmt` (date longue FR) :
- Infos : `Conférence du {date longue} - {client}`
- Bon de commande : `Bon de commande - Conférence du {date longue} - {client}`

### c. Accusé de réception en gras
Passer les corps en HTML et insérer avant la formule de politesse :
`<p><strong>{Peux-tu | Pouvez-vous} m'accuser réception de ce mail ?</strong></p>`
Supprimer la mention texte plat déjà présente dans le template BDC (ligne 1000).

### d. Éditeur de texte enrichi
Remplacer le `Textarea` du corps (lignes 2771-2776) par `<RichTextEditor>` (déjà utilisé pour le mail contrat client).

### e. Envoi HTML côté edge function
`supabase/functions/send-contact-email/index.ts` échappe le HTML (ligne 59). Ajouter la détection HTML déjà utilisée par `send-contract-email` :
- Si `/<\w+/.test(body)` → injecter le HTML tel quel, sans `white-space:pre-wrap`.
- Sinon → comportement actuel (formulaire contact public inchangé).

## 2. Feuille de liaison — page publique accessible via token

### Migration BDD
- Ajouter colonne `token TEXT UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex')` sur `events`.
- Back-fill des lignes existantes puis `NOT NULL`.
- Nouvelle policy publique sur `events` :
  `CREATE POLICY "Public read events via token" ON events FOR SELECT TO public USING (token IS NOT NULL);`
  (accès indirect : il faut connaître le token pour requêter la ligne via `.eq("token", :token)`.)
- `contracts`, `proposals`, `proposal_speakers`, `speakers` ont déjà la lecture publique compatible.

### Route publique
Dans `src/App.tsx` ajouter : `/feuille-liaison/:token` → `LiaisonSheetView` en mode public.

Côté `src/pages/LiaisonSheetView.tsx` :
- Si route `/feuille-liaison/:token` → charger l'event par `token` puis déduire le `proposal_id` pour récupérer le contrat.
- Si route `/admin/feuille-liaison/:id` → comportement actuel (édition admin conservée).
- En mode public, forcer `editing = false`, masquer les boutons « Modifier / Enregistrer / Annuler » (garder uniquement « Imprimer / PDF »).

### Bouton dans les mails de liaison
Dans `openLiaisonDialog` (~ligne 1062 de `EventDossier.tsx`), construire l'URL publique à partir du token de l'event :
```ts
const liaisonUrl = `${window.location.origin}/feuille-liaison/${event.token}`;
```
Ajouter à la fin des corps client ET conférencier :
```html
<p style="text-align:center;margin:24px 0;">
  <a href="${liaisonUrl}" style="display:inline-block;background:#1a2332;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600;">Consulter la feuille de liaison</a>
</p>
```

L'edge function d'envoi des mails de liaison bénéficiera de la détection HTML mise en place au § 1e.

## Fichiers modifiés
- Migration Supabase : ajout `events.token` + RLS publique
- `src/App.tsx` : route publique
- `src/pages/LiaisonSheetView.tsx` : support mode public via token
- `src/components/admin/EventDossier.tsx` : pop-up conférencier + bouton liaison dans mails
- `supabase/functions/send-contact-email/index.ts` : détection HTML
