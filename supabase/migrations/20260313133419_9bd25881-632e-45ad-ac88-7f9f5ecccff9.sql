
-- Contracts table
CREATE TABLE public.contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id uuid REFERENCES public.proposals(id) ON DELETE CASCADE NOT NULL UNIQUE,
  event_date date,
  event_location text,
  event_time text,
  event_format text,
  event_description text,
  status text NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now(),
  signed_at timestamptz
);

ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage contracts" ON public.contracts FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Public read contracts via proposal" ON public.contracts FOR SELECT TO public USING (
  EXISTS (SELECT 1 FROM proposals p WHERE p.id = contracts.proposal_id AND p.expires_at > now())
);

-- Invoice number generator function
CREATE OR REPLACE FUNCTION public.generate_invoice_number()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  current_year text;
  next_num integer;
BEGIN
  current_year := to_char(now(), 'YYYY');
  SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM '\d+$') AS integer)), 0) + 1
  INTO next_num
  FROM public.invoices
  WHERE invoice_number LIKE 'FAC-' || current_year || '-%';
  RETURN 'FAC-' || current_year || '-' || lpad(next_num::text, 3, '0');
END;
$$;

-- Invoices table
CREATE TABLE public.invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id uuid REFERENCES public.contracts(id) ON DELETE SET NULL,
  proposal_id uuid REFERENCES public.proposals(id) ON DELETE CASCADE NOT NULL,
  invoice_number text NOT NULL,
  invoice_type text NOT NULL DEFAULT 'total',
  amount_ht numeric NOT NULL,
  tva_rate numeric NOT NULL DEFAULT 20,
  amount_ttc numeric NOT NULL,
  status text NOT NULL DEFAULT 'draft',
  due_date date,
  sent_at timestamptz,
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(invoice_number)
);

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage invoices" ON public.invoices FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Public read invoices via proposal" ON public.invoices FOR SELECT TO public USING (
  EXISTS (SELECT 1 FROM proposals p WHERE p.id = invoices.proposal_id AND p.expires_at > now())
);

-- Trigger to auto-set invoice_number
CREATE OR REPLACE FUNCTION public.set_invoice_number()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.invoice_number IS NULL OR NEW.invoice_number = '' THEN
    NEW.invoice_number := public.generate_invoice_number();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_set_invoice_number
  BEFORE INSERT ON public.invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.set_invoice_number();
