ALTER TABLE public.proposals ADD COLUMN lost_at timestamp with time zone DEFAULT NULL;
ALTER TABLE public.proposals ADD COLUMN lost_reason text DEFAULT NULL;