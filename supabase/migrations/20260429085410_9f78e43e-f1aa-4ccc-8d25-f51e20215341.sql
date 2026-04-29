ALTER TABLE public.contracts
ADD COLUMN IF NOT EXISTS contract_sent_at TIMESTAMP WITH TIME ZONE;

UPDATE public.contracts
SET contract_sent_at = COALESCE(signed_at, created_at)
WHERE status IN ('sent', 'signed')
  AND contract_sent_at IS NULL;