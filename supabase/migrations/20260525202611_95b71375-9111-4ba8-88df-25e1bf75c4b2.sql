ALTER TABLE public.contracts
  ADD COLUMN IF NOT EXISTS version integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS replaces_contract_id uuid,
  ADD COLUMN IF NOT EXISTS superseded_at timestamptz,
  ADD COLUMN IF NOT EXISTS superseded_by_contract_id uuid;

CREATE INDEX IF NOT EXISTS idx_contracts_replaces ON public.contracts(replaces_contract_id);
CREATE INDEX IF NOT EXISTS idx_contracts_proposal_active ON public.contracts(proposal_id) WHERE superseded_at IS NULL;