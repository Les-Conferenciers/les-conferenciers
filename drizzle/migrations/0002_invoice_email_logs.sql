ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS email_to text;
CREATE TABLE public.invoice_email_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  resend_id text,
  to_emails text[] NOT NULL DEFAULT '{}',
  cc_emails text[] NOT NULL DEFAULT '{}',
  subject text,
  sent_at timestamptz NOT NULL DEFAULT now(),
  last_status text NOT NULL DEFAULT 'sent',
  status_checked_at timestamptz
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.invoice_email_logs TO authenticated;
GRANT ALL ON public.invoice_email_logs TO service_role;
ALTER TABLE public.invoice_email_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated manage invoice email logs" ON public.invoice_email_logs FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE INDEX invoice_email_logs_invoice_idx ON public.invoice_email_logs(invoice_id);