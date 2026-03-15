
ALTER TABLE public.speakers ADD COLUMN fee_details text;

ALTER TABLE public.clients ADD COLUMN status text NOT NULL DEFAULT 'prospect';
