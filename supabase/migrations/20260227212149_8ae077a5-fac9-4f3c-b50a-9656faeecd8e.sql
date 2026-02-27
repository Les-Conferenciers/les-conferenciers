ALTER TABLE speakers ADD COLUMN IF NOT EXISTS base_fee numeric DEFAULT NULL;
ALTER TABLE speakers ADD COLUMN IF NOT EXISTS city text DEFAULT NULL;

-- Update proposal expiration default to 30 days
ALTER TABLE proposals ALTER COLUMN expires_at SET DEFAULT (now() + interval '30 days');