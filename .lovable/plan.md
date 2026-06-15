## Objectif

Remplacer les 8 Q/R de la FAQ `/conferencier` par les contenus longs fournis, et permettre à Nelly de les éditer depuis l'admin avec un éditeur simple (textareas).

## 1. Base de données

Créer une table `page_faqs` (Lovable Cloud) pour stocker la FAQ par page :

- `page_key` (text, unique) — ex. `"conferencier"`
- `items` (jsonb) — tableau `[{ question, answer }]`, l'`answer` contient les paragraphes séparés par `\n\n`

Lecture publique autorisée (RLS `SELECT` pour `anon`/`authenticated`), écriture réservée aux admins authentifiés (même approche que les autres tables d'admin).

Seed initial avec les 8 Q/R fournies par l'utilisateur, telles quelles (typographie déjà ok — on normalisera juste les apostrophes courbes en droites conformément à la règle projet).

## 2. Page `/conferencier` (`src/pages/Speakers.tsx`)

- Charger la FAQ via `useQuery` sur `page_faqs` où `page_key = 'conferencier'`.
- Fallback : si la requête échoue ou renvoie vide, garder les 8 Q/R en dur actuellement présentes (sécurité SEO).
- Affichage : conserver l'`Accordion` shadcn existant. Rendre la réponse avec `whitespace-pre-line` pour respecter les sauts de paragraphes (`\n\n`).
- JSON-LD `FAQPage` : régénéré dynamiquement à partir des items chargés (toujours présent dans le `<head>`).
- Aucune modification des balises title/H1/canonical/description (déjà optimisées dans l'itération précédente).

## 3. Admin — éditeur simple

Nouvel onglet **« FAQ »** dans `src/pages/Admin.tsx` (icône `HelpCircle`), composant `AdminFaq.tsx` :

- Sélecteur de page (pour l'instant une seule option : `Page Conférenciers — /conferencier`, extensible plus tard).
- Liste ordonnée des Q/R avec, pour chaque item :
  - `Input` pour la question
  - `Textarea` multi-lignes (h ~ 240px) pour la réponse — saisie en texte brut, paragraphes séparés par une ligne vide
  - Boutons monter / descendre / supprimer
- Bouton « Ajouter une question » en bas de liste
- Bouton « Enregistrer » qui `upsert` la ligne `page_faqs` correspondante
- Respect des règles CRM : pas de placeholders dans les champs, apostrophes droites au save.

Pas de rich text, pas de WYSIWYG — textarea simple comme demandé.

## Détails techniques

- Migration Supabase : `CREATE TABLE public.page_faqs` + GRANTs (`anon SELECT`, `authenticated ALL`, `service_role ALL`) + RLS (`SELECT` public, `INSERT/UPDATE/DELETE` réservé aux admins via `has_role(auth.uid(), 'admin')` si la fonction existe, sinon `authenticated` — à confirmer par lecture rapide des autres policies au moment de l'implémentation).
- Seed : `INSERT ... ON CONFLICT (page_key) DO UPDATE` avec les 8 items fournis.
- Côté front : un seul `useQuery(['page-faq', 'conferencier'])` ; `FAQ_ITEMS` actuel devient le fallback hardcodé.
- `whitespace-pre-line` sur l'`AccordionContent` pour préserver les paragraphes sans introduire de HTML.