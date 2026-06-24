ALTER TABLE public.proposals ADD COLUMN IF NOT EXISTS email_cc text;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS email_cc text;