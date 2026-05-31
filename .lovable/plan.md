Pour les propositions `proposal_type === "info"`, envoyer le 1er email en texte brut (champ `text` Resend) au lieu du HTML stylisé. Plus conversationnel, pas de header/signature visuelle.

## Modifs dans `supabase/functions/send-proposal-email/index.ts`

1. Ajouter une petite fonction `htmlToPlainText(html)` : remplace `<br>`, `</p>`, `</div>` par `\n`, supprime les autres balises, décode les entités courantes (`&nbsp; &amp; &lt; &gt; &#39; &quot;`), normalise les sauts de ligne.

2. Si `proposal.proposal_type === "info"` :
   - construire `emailText` à partir de `proposal.email_body` (HTML édité) → plain text, sinon utiliser directement `defaultInfoBody` qui est déjà en texte.
   - Ajouter une ligne finale avec le lien vers la proposition uniquement si pertinent (les "info" n'ont pas de bouton proposition de toute façon).
   - Envoyer `{ ..., text: emailText }` sans `html`.
3. Pour les autres types (`classique`, `unique`), aucun changement — toujours HTML.

Aucun impact sur les relances (autre fonction).
