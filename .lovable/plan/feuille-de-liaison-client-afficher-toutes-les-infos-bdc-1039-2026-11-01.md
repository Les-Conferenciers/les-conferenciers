# Feuille de liaison client : afficher toutes les infos (BDC 1039)

## Cause (vérifiée)
Le lien client lit la date, le lieu, l'horaire et les noms des contacts dans la proposition et le contrat. Pour des raisons de sécurité, ces informations ne sont visibles sans connexion que pendant la validité de la proposition (90 jours). La proposition du BDC 1039 a expiré le 16/09/2026 : la cliente ne voit donc que ce qui est stocké dans le dossier lui-même (auditoire, thème, téléphones). Dans l'admin, vous êtes connecté, donc tout s'affiche. Le même problème touche toutes les feuilles de liaison des dossiers dont la proposition a plus de 90 jours.

## Correctif
- Le lien de la feuille de liaison (`/liaison/<token>`) charge toutes ses données via une seule lecture sécurisée côté serveur, protégée par le jeton unique du dossier. C'est le même principe que celui déjà utilisé pour les liens de facture.
- Seules les informations utiles à la feuille sont renvoyées : date, lieu, horaire, détails, noms et téléphones du client et du conférencier. Les tarifs et le reste du contrat ne sont pas exposés.
- Le lien fonctionne sans limite de durée, quelle que soit la date d'expiration de la proposition.
- La vue admin reste inchangée.

## Vérification
Ouvrir le lien client du BDC 1039 en étant déconnecté : la date, le lieu, l'horaire et les deux contacts nommés doivent s'afficher comme dans l'admin.

## Détails techniques
- Migration : fonction `get_public_liaison(_token text)` en SECURITY DEFINER qui renvoie un jsonb {event, proposal (client_name, recipient_name, client_phone, speakers name/phone), contract actif (superseded_at null : event_date, event_location, event_time, event_description)}, avec GRANT EXECUTE à anon et authenticated.
- `src/pages/LiaisonSheetView.tsx` : en mode public, remplacer les deux requêtes (events + contracts) par `supabase.rpc("get_public_liaison", { _token: token })`.
