
-- Add tracking columns for the event dossier chronological view + lot 3 features
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS speaker_signed_contract_at date,
  ADD COLUMN IF NOT EXISTS speaker_acknowledgment_at date,
  ADD COLUMN IF NOT EXISTS client_deposit_paid_at date,
  ADD COLUMN IF NOT EXISTS speaker_deposit_paid_at date,
  ADD COLUMN IF NOT EXISTS client_invoice_sent_at date,
  ADD COLUMN IF NOT EXISTS client_invoice_paid_at date,
  ADD COLUMN IF NOT EXISTS event_date date,
  ADD COLUMN IF NOT EXISTS logistics_info text;

-- Add manual contract signed date (separate from electronic signed_at)
ALTER TABLE public.contracts
  ADD COLUMN IF NOT EXISTS client_signed_received_at date;

-- Storage bucket for signed contracts (PDF/images/Word)
INSERT INTO storage.buckets (id, name, public)
VALUES ('signed-contracts', 'signed-contracts', false)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for the bucket
DROP POLICY IF EXISTS "Authenticated can read signed contracts" ON storage.objects;
CREATE POLICY "Authenticated can read signed contracts"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'signed-contracts');

DROP POLICY IF EXISTS "Authenticated can upload signed contracts" ON storage.objects;
CREATE POLICY "Authenticated can upload signed contracts"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'signed-contracts');

DROP POLICY IF EXISTS "Authenticated can update signed contracts" ON storage.objects;
CREATE POLICY "Authenticated can update signed contracts"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'signed-contracts');

DROP POLICY IF EXISTS "Authenticated can delete signed contracts" ON storage.objects;
CREATE POLICY "Authenticated can delete signed contracts"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'signed-contracts');
