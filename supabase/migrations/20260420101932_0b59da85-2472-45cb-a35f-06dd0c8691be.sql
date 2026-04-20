-- Table to track signed contract file uploads
CREATE TABLE IF NOT EXISTS public.signed_contract_files (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contract_id uuid NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_path text NOT NULL UNIQUE,
  file_size bigint,
  mime_type text,
  uploaded_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_signed_contract_files_contract ON public.signed_contract_files(contract_id);

ALTER TABLE public.signed_contract_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage signed_contract_files"
  ON public.signed_contract_files FOR ALL
  TO authenticated USING (true) WITH CHECK (true);

-- Storage policies for the signed-contracts bucket (private)
CREATE POLICY "Authenticated users can read signed contracts"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'signed-contracts');

CREATE POLICY "Authenticated users can upload signed contracts"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'signed-contracts');

CREATE POLICY "Authenticated users can delete signed contracts"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'signed-contracts');