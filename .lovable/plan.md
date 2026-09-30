# Invoices unreadable by clients

## Diagnosis (confirmed)
The invoice link in the email points to `/admin/facture/<id>`. Public access to an invoice is only allowed while the original **proposal** is still valid (90 days). Invoices are usually sent after the event, so the proposal has expired and the client sees an empty/broken page. Of the last 10 invoices sent, 7 have an expired proposal (e.g. 1025, 1022-S, 1037, 1043-S, 1040, 1035, 1042).

## Fix
1. **Secure token per invoice**: add a unique, unguessable `token` column to invoices (auto-filled, backfilled for existing ones).
2. **New public page `/facture/<token>`** (outside /admin), reusing the current invoice display, read-only, no admin buttons.
3. **Secure data read**: a backend function returns the invoice + needed data (client, contract lines, speaker, BDC) only for a valid token — no dependency on proposal expiry, and invoices no longer readable by ID alone.
4. **Email link**: the "Consulter la facture" button in the invoice email points to `https://www.lesconferenciers.com/facture/<token>`.
5. **Already-sent invoices**: old `/admin/facture/<id>` links keep working for clients by allowing the public read of that invoice regardless of proposal expiry (so no need to resend), while the admin view stays unchanged for you.
6. Add a "Copier le lien client" button next to each invoice in the back office, handy to resend by hand.

## Technical details
- Migration: `invoices.token text unique default encode(gen_random_bytes(24),'hex')`, backfill; SECURITY DEFINER `get_public_invoice(_token)` returning JSON; replace policy "Public read invoices via proposal" with token/id-based access for invoice view data (invoice, contract, event, proposal_speakers of that invoice's proposal).
- `InvoiceView.tsx`: support both `:id` (admin) and `:token` (public, hides actions).
- `App.tsx`: route `/facture/:token`; `_redirects` already SPA-friendly.
- `send-invoice-email`: build URL with token; redeploy.
