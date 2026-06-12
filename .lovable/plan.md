## Correctifs onglet "Emails"

### Problème 1 — Les modifications ne sont pas prises en compte
**Cause** : `src/lib/emailTemplates.ts` met les templates en cache via `loadEmailTemplates()` au montage de `Admin.tsx`. Après une sauvegarde dans `AdminEmailTemplates`, seul le state local du composant est mis à jour ; le cache singleton utilisé par `renderTpl()` reste à la version chargée initialement. Donc les modales "Propositions" (qui appellent `renderTpl("proposal_unique", …)` etc.) continuent d'utiliser l'ancien contenu jusqu'au prochain rechargement complet de la page.

**Fix** : dans `AdminEmailTemplates.handleSave` et `toggleActive`, appeler `await loadEmailTemplates(true)` après l'`update` pour forcer la réhydratation du cache. Idem dans `handleReset` côté UX (mais le reset ne sauve pas — laissé tel quel).

### Problème 2 — Choix Plain text / HTML par template

**Migration BDD** : ajout d'une colonne `format` à `email_templates` (texte, valeurs `html` ou `plain`, défaut `html`). Initialiser `proposal_info` à `plain` (le seul template "demande d'infos" actuel : key `proposal_info`).

**UI éditeur** (`AdminEmailTemplates.tsx`) :
- Petit sélecteur "Format" (radio ou Select) au-dessus du corps du message : `HTML enrichi` / `Texte simple`.
- Bouton "Convertir en HTML / Convertir en texte" qui transforme le contenu courant :
  - HTML → plain : strip des balises (`<br>` et `</p>` → `\n`, `<p>` → ``, suppression du reste, decode entités, trim).
  - Plain → HTML : `escapeHtml(text).split('\n\n').map(p => '<p>'+p.replace(/\n/g,'<br>')+'</p>').join('')`.
- Persiste `format` à la sauvegarde via `update({ subject, body_html, format })`.
- L'aperçu (`EmailPreviewCard`) reçoit le body déjà converti en HTML pour affichage si format=plain (wrap en `<pre>` ou convert simple paragraphe).

**Rendu côté envoi** :
- `emailTemplates.ts` : `renderTpl` expose désormais aussi `format`. Type retour `{ subject, body, format }`.
- Sites consommateurs (modale Proposition dans `Admin.tsx`, `ContractInvoiceManager`, `EventDossier`) : si `format === 'plain'`, convertir vers HTML minimal avant injection dans l'éditeur rich-text de la modale (sinon le rendu casse). Le composer existant accepte du HTML — on injecte donc `escapeHtml + <br>/<p>` pour préserver le rendu "plain" visuel.
- L'objet renvoyé par fallback dans le code (textes hardcodés) garde la même forme HTML qu'aujourd'hui (pas d'impact).

### Fichiers modifiés
- `supabase/migrations/<new>.sql` : `ALTER TABLE email_templates ADD COLUMN format text NOT NULL DEFAULT 'html' CHECK (format IN ('html','plain'))` + `UPDATE email_templates SET format = 'plain' WHERE key = 'proposal_info'`.
- `src/lib/emailTemplates.ts` : ajouter `format` au type + au retour de `renderTpl`.
- `src/components/admin/AdminEmailTemplates.tsx` : 
  - Force reload du cache après save / toggleActive.
  - Sélecteur format + bouton convertir.
  - `format` dans le payload `update`.
- `src/pages/Admin.tsx` : aux call sites `renderTpl("proposal_*", …)`, si `tpl.format === 'plain'` convertir en HTML enrichi avant retour (helper local `plainToHtml`).
- `src/components/admin/EventDossier.tsx` et `ContractInvoiceManager.tsx` : même conversion défensive.

### Hors scope
- Pas de toggle "envoyer en text/plain MIME" côté Resend (les emails resteront envoyés au format HTML — le format `plain` est purement éditorial / visuel : ce que l'admin compose en texte sera converti en HTML simple à l'envoi).