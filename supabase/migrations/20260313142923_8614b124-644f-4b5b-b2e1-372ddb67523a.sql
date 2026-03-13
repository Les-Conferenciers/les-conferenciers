ALTER TABLE public.contracts 
  ADD COLUMN signer_name text,
  ADD COLUMN signer_ip text,
  ADD COLUMN token text DEFAULT encode(extensions.gen_random_bytes(32), 'hex');

-- Allow public to update contract status for signing
CREATE POLICY "Public can sign contracts via token"
ON public.contracts
FOR UPDATE
TO public
USING (token IS NOT NULL)
WITH CHECK (token IS NOT NULL);