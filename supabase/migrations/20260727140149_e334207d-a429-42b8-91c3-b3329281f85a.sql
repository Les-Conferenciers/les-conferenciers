
ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS billing_entity_name text,
  ADD COLUMN IF NOT EXISTS billing_entity_address text,
  ADD COLUMN IF NOT EXISTS billing_entity_siret text,
  ADD COLUMN IF NOT EXISTS billing_entity_vat text,
  ADD COLUMN IF NOT EXISTS billing_entity_email text;
